/**
 * The maker's card for paying BohdiAI (Alex, Session 121): which card is on file,
 * their past charges, and Stripe's own page to put a new card on. The card is typed
 * on Stripe's page only, never ours; BohdiAI only ever sees its brand and last four.
 *
 * The same page (a Stripe checkout in setup mode) serves a card that expired or was
 * declined, and a maker on Free putting a card on before moving up.
 */
import type Stripe from 'stripe';

export type CardOnFile = { brand: string; last4: string; expMonth: number; expYear: number } | null;

export type PastCharge = { id: string; on: number; cents: number; currency: string; receiptUrl: string | null };

const idOf = (x: string | { id: string } | null | undefined): string | null => (x === null || x === undefined ? null : typeof x === 'string' ? x : x.id);

function cardOf(pm: string | Stripe.PaymentMethod | null | undefined): CardOnFile {
  if (pm === null || pm === undefined || typeof pm === 'string' || pm.card === undefined) return null;
  return { brand: pm.card.brand, last4: pm.card.last4, expMonth: pm.card.exp_month, expYear: pm.card.exp_year };
}

/** The card Stripe charges for this subscription: the subscription's own, else the customer's default. */
export async function cardOnFile(s: Stripe, stripeId: string): Promise<CardOnFile> {
  const sub = await s.subscriptions.retrieve(stripeId, { expand: ['default_payment_method', 'customer.invoice_settings.default_payment_method'] });
  const own = cardOf(sub.default_payment_method);
  if (own !== null) return own;
  const customer = sub.customer;
  if (typeof customer === 'string' || customer.deleted === true) return null;
  return cardOf(customer.invoice_settings.default_payment_method);
}

/** What the maker has paid BohdiAI, newest first, each with Stripe's receipt. */
export async function pastCharges(s: Stripe, customerId: string): Promise<PastCharge[]> {
  const invoices = await s.invoices.list({ customer: customerId, status: 'paid', limit: 24 });
  return invoices.data
    .filter((i) => i.amount_paid > 0 && i.id !== undefined)
    .map((i) => ({ id: i.id as string, on: i.status_transitions.paid_at ?? i.created, cents: i.amount_paid, currency: i.currency, receiptUrl: i.hosted_invoice_url ?? null }));
}

/** A plan to move to once the new card is on: Free moving up. */
export type ThenMove = { plan: string; billing: string };

/** Stripe's page to put a card on. Stripe fills {CHECKOUT_SESSION_ID} into `doneUrl`. */
export async function startCardPage(
  s: Stripe,
  input: { customerId: string; tenantId: string; doneUrl: string; backUrl: string; then?: ThenMove | undefined },
): Promise<string> {
  const session = await s.checkout.sessions.create({
    mode: 'setup',
    currency: 'usd',
    customer: input.customerId,
    client_reference_id: input.tenantId,
    metadata: { tenant_id: input.tenantId, purpose: 'card', ...(input.then === undefined ? {} : { then_plan: input.then.plan, then_billing: input.then.billing }) },
    success_url: input.doneUrl,
    cancel_url: input.backUrl,
  });
  if (session.url === null) throw new Error('Stripe gave no card page');
  return session.url;
}

export type CardPut = { ok: true; then: ThenMove | null } | { ok: false };

/**
 * Back from Stripe's card page: the new card becomes the one Stripe charges, for the
 * customer and for the subscription. Only a finished page for this same site counts.
 */
export async function finishCardPage(s: Stripe, sessionId: string, tenantId: string, stripeId: string): Promise<CardPut> {
  const session = await s.checkout.sessions.retrieve(sessionId, { expand: ['setup_intent'] });
  if (session.mode !== 'setup' || session.status !== 'complete' || session.client_reference_id !== tenantId) return { ok: false };
  const intent = session.setup_intent;
  const pm = typeof intent === 'string' || intent === null ? null : idOf(intent.payment_method);
  const customer = idOf(session.customer);
  if (pm === null || customer === null) return { ok: false };
  await s.customers.update(customer, { invoice_settings: { default_payment_method: pm } });
  await s.subscriptions.update(stripeId, { default_payment_method: pm });
  const plan = session.metadata?.['then_plan'];
  const billing = session.metadata?.['then_billing'];
  return { ok: true, then: plan === undefined || billing === undefined ? null : { plan, billing } };
}

export type NextCharge = { cents: number; on: number } | null;

/** Stripe's own next bill for the subscription, discount and credit worked in; null when none is coming. */
export async function nextCharge(s: Stripe, stripeId: string): Promise<NextCharge> {
  const sub = await s.subscriptions.retrieve(stripeId);
  if (sub.cancel_at_period_end || sub.status === 'canceled') return null;
  const customer = idOf(sub.customer);
  if (customer === null) return null;
  const preview = await s.invoices.createPreview({ customer, subscription: stripeId });
  return { cents: preview.amount_due, on: preview.next_payment_attempt ?? preview.period_end };
}
