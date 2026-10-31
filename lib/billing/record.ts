/**
 * What Stripe says about a site's plan, saved (Alex, Session 119): the billing
 * record (subscriptions) and the site's billing and renewal day.
 *
 * A paid checkout is recorded once, whoever gets there first: the page Stripe
 * sends the maker back to, or Stripe's own notice. Both claim the checkout in
 * stripe_events ("checkout:<session id>") before writing; the second finds it
 * claimed and only reads. If writing fails the claim is let go, so Stripe's
 * retry (or a reload) records it.
 */
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isAccountPlan } from '@/lib/signup/request';

type Db = SupabaseClient<Database>;

/** `first` is true only for whoever recorded it, so the confirmation email goes once. */
export type Recorded = { paid: false } | { paid: true; tenantId: string; email: string | null; first: boolean };

const UNIQUE_VIOLATION = '23505';

const iso = (seconds: number | null | undefined): string | null => (seconds === null || seconds === undefined ? null : new Date(seconds * 1000).toISOString());
const day = (seconds: number): string => new Date(seconds * 1000).toISOString().slice(0, 10);

/** Claims a Stripe happening by id; false when it was already claimed. */
export async function claim(db: Db, id: string, type: string): Promise<boolean> {
  const { error } = await db.from('stripe_events').insert({ id, type });
  if (error === null) return true;
  if (error.code === UNIQUE_VIOLATION) return false;
  throw new Error(`Could not note the Stripe notice: ${error.message}`);
}

export async function letGo(db: Db, id: string): Promise<void> {
  await db.from('stripe_events').delete().eq('id', id);
}

/** The period the subscription is in now, from its one item. */
function period(sub: Stripe.Subscription): { start: number; end: number } | null {
  const item = sub.items.data[0];
  return item === undefined ? null : { start: item.current_period_start, end: item.current_period_end };
}

/** Records a checkout once it's complete; says whether it is. */
export async function recordCheckout(s: Stripe, db: Db, sessionId: string): Promise<Recorded> {
  const session = await s.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
  const tenantId = session.client_reference_id;
  if (session.status !== 'complete' || tenantId === null) return { paid: false };
  const email = session.customer_details?.email ?? session.customer_email ?? null;

  const lock = `checkout:${session.id}`;
  if (!(await claim(db, lock, 'checkout.session.completed'))) return { paid: true, tenantId, email, first: false };
  try {
    const sub = session.subscription;
    if (sub === null || typeof sub === 'string') throw new Error(`checkout ${session.id} came back without its subscription`);
    const plan = sub.metadata['plan'];
    if (!isAccountPlan(plan)) throw new Error(`subscription ${sub.id} names no plan`);
    const item = sub.items.data[0];
    const now = period(sub);
    if (item === undefined || now === null) throw new Error(`subscription ${sub.id} has no price`);
    const interval = item.price.recurring?.interval === 'year' ? 'year' : 'month';

    const { error: subErr } = await db.from('subscriptions').insert({
      tenant_id: tenantId,
      tier: plan,
      status: sub.status,
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      stripe_price_id: item.price.id,
      billing_interval: interval,
      unit_amount_cents: item.price.unit_amount,
      currency: item.price.currency.toUpperCase(),
      current_period_start: iso(now.start),
      current_period_end: iso(now.end),
      cancel_at_period_end: sub.cancel_at_period_end,
    });
    if (subErr !== null) throw new Error(`Could not save the billing record: ${subErr.message}`);
    const { error: tErr } = await db
      .from('tenants')
      .update({ plan_billing: interval === 'year' ? 'yearly' : 'monthly', plan_renews_on: day(now.end) })
      .eq('id', tenantId);
    if (tErr !== null) throw new Error(`Could not save the renewal day: ${tErr.message}`);
    return { paid: true, tenantId, email, first: true };
  } catch (err) {
    await letGo(db, lock);
    throw err;
  }
}

/** Stripe changed a subscription (renewed, card failed, cancelled): the billing record follows. */
export async function recordSubscription(db: Db, sub: Stripe.Subscription): Promise<void> {
  const now = period(sub);
  const { error } = await db
    .from('subscriptions')
    .update({
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: iso(sub.canceled_at),
      ended_at: iso(sub.ended_at),
      ...(now === null ? {} : { current_period_start: iso(now.start), current_period_end: iso(now.end) }),
    })
    .eq('stripe_subscription_id', sub.id);
  if (error !== null) throw new Error(`Could not update the billing record: ${error.message}`);
  const tenantId = sub.metadata['tenant_id'];
  if (now === null || tenantId === undefined) return;
  const { error: tErr } = await db.from('tenants').update({ plan_renews_on: day(now.end) }).eq('id', tenantId);
  if (tErr !== null) throw new Error(`Could not save the renewal day: ${tErr.message}`);
}
