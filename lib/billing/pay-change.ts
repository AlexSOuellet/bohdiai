/**
 * Paying for a plan change on Stripe's own page (Alex, 2026-11-16: "it should NOT do
 * that. what if a maker wants to use a different card?"). Anything that charges today
 * (an upgrade, monthly to yearly, Free to a paid plan) no longer charges the card on
 * file by itself:
 *
 * 1. Stripe works out what the change costs today, at a fixed moment.
 * 2. The maker pays exactly that on Stripe's payment page, with the card on file or a
 *    new one. BohdiAI never sees the card.
 * 3. Back from the page, the payment is checked (paid, this site, this subscription,
 *    this amount). The card paid with becomes the one Stripe uses from now on, the
 *    payment is credited to the maker's Stripe balance, and only then is the plan
 *    changed, at that same moment, so Stripe's own charge for it is covered by the
 *    credit and nothing is paid twice.
 *
 * If anything stops after the payment, the money stays as credit and comes off the
 * next bill. Coming back to the page twice changes nothing the second time.
 */
import type Stripe from 'stripe';
import type { Billing } from '@/lib/backend/plan/billing';
import { isSitePlan, type SitePlan } from '@/lib/backend/plan/plan';
import { changeNow, findPrice, previewNow } from './plan-change';

/** Stripe won't take a card payment under 50 cents. */
export const PAY_MIN_CENTS = 50;

/** What's being paid for: an upgrade, a switch to yearly, or a move up from Free. */
export type PayKind = 'upgrade' | 'billing' | 'free';
export type PayFor = { plan: SitePlan; billing: Billing; kind: PayKind };

const PURPOSE = 'plan-pay';
const KINDS: readonly PayKind[] = ['upgrade', 'billing', 'free'];
const idOf = (x: string | { id: string } | null | undefined): string | null =>
  x === null || x === undefined ? null : typeof x === 'string' ? x : x.id;

export type PayPage = { kind: 'page'; url: string } | { kind: 'small'; cents: number };

/** Stripe's payment page for the change. Stripe fills {CHECKOUT_SESSION_ID} into `doneUrl`.
 *  An amount too small for a card payment gets no page: the caller makes the change with
 *  that bit added to the next bill. */
export async function startPayPage(
  s: Stripe,
  input: {
    stripeId: string;
    customerId: string;
    tenantId: string;
    pay: PayFor;
    label: string;
    doneUrl: string;
    backUrl: string;
  },
): Promise<PayPage> {
  const price = await findPrice(s, input.pay.plan, input.pay.billing);
  const at = Math.floor(Date.now() / 1000);
  const cents = (await previewNow(s, input.stripeId, price, at)).amount_due;
  if (cents < PAY_MIN_CENTS) return { kind: 'small', cents };
  const metadata = {
    tenant_id: input.tenantId,
    purpose: PURPOSE,
    plan: input.pay.plan,
    billing: input.pay.billing,
    kind: input.pay.kind,
    sub: input.stripeId,
    at: String(at),
    cents: String(cents),
  };
  const session = await s.checkout.sessions.create({
    mode: 'payment',
    customer: input.customerId,
    client_reference_id: input.tenantId,
    line_items: [
      {
        quantity: 1,
        price_data: { currency: 'usd', unit_amount: cents, product_data: { name: input.label } },
      },
    ],
    // The card paid with is kept, to become the one renewals use.
    payment_intent_data: { setup_future_usage: 'off_session', metadata },
    // The card on file is offered; a new one can be used instead.
    saved_payment_method_options: { allow_redisplay_filters: ['always', 'limited', 'unspecified'] },
    metadata,
    success_url: input.doneUrl,
    cancel_url: input.backUrl,
  });
  if (session.url === null) throw new Error('Stripe gave no payment page');
  return { kind: 'page', url: session.url };
}

export type Paid =
  | { ok: true; pay: PayFor; sub: Stripe.Subscription; already: boolean }
  | { ok: false; why: 'unpaid' | 'mismatch' | 'declined' };

/** Back from Stripe's payment page: makes the change only for a paid page for this
 *  same site, subscription and amount. */
export async function finishPayPage(
  s: Stripe,
  sessionId: string,
  tenantId: string,
  stripeId: string,
): Promise<Paid> {
  const session = await s.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
  const m = session.metadata ?? {};
  const plan = m['plan'];
  const billing = m['billing'];
  const kind = m['kind'];
  const cents = Number(m['cents']);
  const at = Number(m['at']);
  if (
    session.mode !== 'payment' ||
    session.client_reference_id !== tenantId ||
    m['purpose'] !== PURPOSE ||
    m['sub'] !== stripeId ||
    !isSitePlan(plan) ||
    (billing !== 'monthly' && billing !== 'yearly') ||
    !KINDS.includes(kind as PayKind) ||
    !Number.isInteger(cents) ||
    !Number.isInteger(at) ||
    session.amount_total !== cents
  )
    return { ok: false, why: 'mismatch' };
  if (session.status !== 'complete' || session.payment_status !== 'paid')
    return { ok: false, why: 'unpaid' };
  const pay: PayFor = { plan, billing, kind: kind as PayKind };

  const sub = await s.subscriptions.retrieve(stripeId);
  if (sub.metadata['paid_change'] === session.id) return { ok: true, pay, sub, already: true };

  const customer = idOf(session.customer);
  if (customer === null) return { ok: false, why: 'mismatch' };
  const intent = session.payment_intent;
  const card =
    typeof intent === 'string' || intent === null
      ? null
      : idOf(intent.payment_method as string | { id: string } | null);
  if (card !== null)
    await s.customers.update(customer, { invoice_settings: { default_payment_method: card } });
  await s.customers.createBalanceTransaction(
    customer,
    {
      amount: -cents,
      currency: 'usd',
      description: 'Paid on Stripe’s page for a plan change',
      metadata: { session: session.id },
    },
    { idempotencyKey: `plan-pay-credit-${session.id}` },
  );
  const changed = await changeNow(
    s,
    stripeId,
    await findPrice(s, plan, billing),
    { plan, billing },
    { session: session.id, at, card },
  );
  if (!changed.ok) return { ok: false, why: 'declined' };
  return { ok: true, pay, sub: changed.sub, already: false };
}
