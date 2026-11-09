/**
 * A maker changing their own plan, on BohdiAI's Stripe (Alex, Session 121,
 * 2026-11-09: "of course makers should be able to change plans themselves").
 *
 * The rules (Alex, 2026-10-17 and 2026-10-19):
 * - Up, or monthly to yearly: now. Stripe charges the difference for the rest of the
 *   period on the card it has; a declined card changes nothing.
 * - Down, or yearly to monthly: at the next renewal, nothing refunded. A Stripe
 *   subscription schedule holds the change; Stripe's notice at renewal steps the
 *   site down (lib/billing/record.ts).
 * - Keep my plan: the schedule is let go, so renewal stays as it was.
 * A running discount carries over in every case.
 *
 * Every price is found by its lookup key (lib/billing/stripe.ts), and the plan a
 * price stands for is read back from that key, so Stripe and BohdiAI can't disagree.
 */
import type Stripe from 'stripe';
import { isAccountPlan } from '@/lib/signup/request';
import { FREE_PLAN, type AccountPlan, type SitePlan } from '@/lib/backend/plan/plan';
import { daysLeft, nextRenewal, type Billing, type UpgradeQuote } from '@/lib/backend/plan/billing';
import { billingFor, lookupKey } from './stripe';

export type PlanPrice = { plan: AccountPlan; billing: Billing };

/** The plan and billing a price's lookup key names (bohdiai_full_yearly); null for anything else. */
export function planOfKey(key: string | null | undefined): PlanPrice | null {
  const m = /^bohdiai_([a-z]+)_(monthly|yearly)$/.exec(key ?? '');
  if (m === null) return null;
  const plan = m[1];
  const billing = m[2] === 'yearly' ? 'yearly' : 'monthly';
  return isAccountPlan(plan) ? { plan, billing } : null;
}

/** The live price for a plan. */
export async function findPrice(s: Stripe, plan: AccountPlan, billing: Billing): Promise<Stripe.Price> {
  const key = lookupKey(plan, billing);
  const prices = await s.prices.list({ lookup_keys: [key], active: true, limit: 1 });
  const price = prices.data[0];
  if (price === undefined) throw new Error(`Stripe has no price ${key}: run scripts/stripe-plans.ts`);
  return price;
}

type Live = { sub: Stripe.Subscription; item: Stripe.SubscriptionItem };

async function live(s: Stripe, stripeId: string): Promise<Live> {
  const sub = await s.subscriptions.retrieve(stripeId);
  const item = sub.items.data[0];
  if (item === undefined) throw new Error(`subscription ${stripeId} has no price`);
  return { sub, item };
}

const idOf = (x: string | { id: string } | null): string | null => (x === null ? null : typeof x === 'string' ? x : x.id);

/** The discounts running on the subscription, to carry into any change. */
function discountsOf(sub: Stripe.Subscription): { discount: string }[] {
  return sub.discounts.flatMap((d) => {
    const id = idOf(d);
    return id === null ? [] : [{ discount: id }];
  });
}

/** Free is $0: moving off it starts a whole new period from today, not the rest of Free's month. */
function freshPeriod(item: Stripe.SubscriptionItem): boolean {
  return (item.price.unit_amount ?? 0) === 0;
}

/** Leaving Free starts a new period today; any other change keeps the renewal day. */
function anchorOf(item: Stripe.SubscriptionItem): { type: 'now' | 'unchanged' } {
  return { type: freshPeriod(item) ? 'now' : 'unchanged' };
}

function changeItems(item: Stripe.SubscriptionItem, price: Stripe.Price): Stripe.SubscriptionUpdateParams.Item[] {
  return [{ id: item.id, price: price.id }];
}

/** What changing to `price` now would charge today, from Stripe itself. */
export async function previewNow(s: Stripe, stripeId: string, price: Stripe.Price): Promise<Stripe.Invoice> {
  const { sub, item } = await live(s, stripeId);
  const customer = idOf(sub.customer);
  if (customer === null) throw new Error(`subscription ${stripeId} has no customer`);
  return s.invoices.createPreview({
    customer,
    subscription: sub.id,
    subscription_details: {
      items: changeItems(item, price),
      proration_behavior: 'always_invoice',
      billing_cycle_anchor: anchorOf(item),
    },
  });
}

export type ChangeNow = { ok: true; sub: Stripe.Subscription } | { ok: false; declined: string };

/** Change now and charge for it now. A declined card changes nothing and says why. */
export async function changeNow(s: Stripe, stripeId: string, price: Stripe.Price, to: PlanPrice): Promise<ChangeNow> {
  const { sub, item } = await live(s, stripeId);
  // A change waiting for renewal is replaced by this one.
  const waiting = idOf(sub.schedule);
  if (waiting !== null) await s.subscriptionSchedules.release(waiting);
  try {
    const changed = await s.subscriptions.update(sub.id, {
      items: changeItems(item, price),
      proration_behavior: 'always_invoice',
      payment_behavior: 'error_if_incomplete',
      billing_cycle_anchor: anchorOf(item),
      metadata: { ...sub.metadata, plan: to.plan, billing: billingFor(to.plan, to.billing) },
    });
    return { ok: true, sub: changed };
  } catch (err) {
    if (isCardError(err)) return { ok: false, declined: err.message };
    throw err;
  }
}

function isCardError(err: unknown): err is { message: string } {
  return typeof err === 'object' && err !== null && (err as { type?: unknown }).type === 'StripeCardError' && typeof (err as { message?: unknown }).message === 'string';
}

/** Change at the next renewal: the rest of this period stays as it is, then `price`. */
export async function changeAtRenewal(s: Stripe, stripeId: string, price: Stripe.Price, to: PlanPrice): Promise<void> {
  const { sub, item } = await live(s, stripeId);
  const scheduleId = idOf(sub.schedule) ?? (await s.subscriptionSchedules.create({ from_subscription: sub.id })).id;
  const schedule = await s.subscriptionSchedules.retrieve(scheduleId);
  const now = schedule.current_phase;
  const start = now?.start_date ?? item.current_period_start;
  const end = now?.end_date ?? item.current_period_end;
  const discounts = discountsOf(sub);
  const interval = price.recurring?.interval === 'year' ? 'year' : 'month';
  await s.subscriptionSchedules.update(scheduleId, {
    end_behavior: 'release',
    phases: [
      { items: [{ price: item.price.id, quantity: 1 }], start_date: start, end_date: end, discounts, metadata: sub.metadata },
      {
        items: [{ price: price.id, quantity: 1 }],
        duration: { interval, interval_count: 1 },
        proration_behavior: 'none',
        discounts,
        metadata: { ...sub.metadata, plan: to.plan, billing: billingFor(to.plan, to.billing) },
      },
    ],
  });
}

/** Keep the plan after all: the change waiting for renewal is let go. */
export async function dropAtRenewal(s: Stripe, stripeId: string): Promise<void> {
  const { sub } = await live(s, stripeId);
  const waiting = idOf(sub.schedule);
  if (waiting !== null) await s.subscriptionSchedules.release(waiting);
}

/** Stripe's preview, in the shape the checkout screen shows. `renewsOn` is the current
 *  renewal day; a change of billing (or leaving Free) starts a new period today. */
export function quoteFromPreview(
  preview: Pick<Stripe.Invoice, 'amount_due' | 'starting_balance' | 'ending_balance' | 'total' | 'lines'>,
  input: { from: AccountPlan; fromBilling: Billing; billing: Billing; priceCents: number; renewsOn: string; today: string },
): UpgradeQuote {
  const sameBilling = input.from !== FREE_PLAN && input.billing === input.fromBilling;
  let partCents = 0;
  let creditCents = 0;
  for (const line of preview.lines.data) {
    if (line.amount >= 0) partCents += line.amount;
    else creditCents -= line.amount;
  }
  const covered = Math.min(creditCents, partCents);
  const owed = Math.max(0, preview.total);
  const accountCreditUsedCents = Math.max(0, owed - preview.amount_due);
  const endingCredit = preview.ending_balance === null ? 0 : Math.max(0, -preview.ending_balance);
  const renewsOn = sameBilling ? input.renewsOn : nextRenewal(input.today, input.billing);
  return {
    billing: input.billing,
    priceCents: input.priceCents,
    partCents,
    prorated: sameBilling,
    creditCents,
    creditUsedCents: covered,
    daysLeft: sameBilling ? daysLeft(input.today, input.renewsOn, input.fromBilling) : 0,
    accountCreditUsedCents,
    todayCents: preview.amount_due,
    creditLeftCents: endingCredit,
    renewsOn,
    renewalCents: input.priceCents,
  };
}

/** Whether moving from one plan and billing to another happens now (up, or monthly to
 *  yearly) or at renewal (down, or yearly to monthly). */
export function whenChange(from: { plan: AccountPlan; billing: Billing }, to: { plan: SitePlan; billing: Billing }, rank: (p: AccountPlan) => number): 'now' | 'renewal' | 'same' {
  const d = rank(to.plan) - rank(from.plan);
  if (d > 0) return 'now';
  if (d < 0) return 'renewal';
  if (from.billing === to.billing) return 'same';
  return to.billing === 'yearly' ? 'now' : 'renewal';
}
