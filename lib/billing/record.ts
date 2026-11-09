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
import { recordSignupPromo } from './promos';
import { planOfKey } from './plan-change';
import { applyPlan } from '@/lib/backend/plan/apply';
import { galleryFromProducts } from '@/lib/backend/plan/convert';
import { GALLERY_LIMIT } from '@/lib/backend/gallery/gallery-form';

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
    const code = sub.metadata['promo_code'];
    if (code !== undefined && email !== null) {
      const months = sub.metadata['promo_months'];
      await recordSignupPromo(db, {
        stripeId: sub.id,
        code,
        tenantId,
        email: email.toLowerCase(),
        discount: { percent: Number(sub.metadata['promo_percent']), months: months === undefined ? null : Number(months) },
        interval,
        now: new Date(),
      });
    }
    return { paid: true, tenantId, email, first: true };
  } catch (err) {
    await letGo(db, lock);
    throw err;
  }
}

/** Stripe changed a subscription (renewed, plan changed, card failed, cancelled): the billing record follows. */
export async function recordSubscription(db: Db, sub: Stripe.Subscription): Promise<void> {
  const now = period(sub);
  const item = sub.items.data[0];
  const priced = planOfKey(item?.price.lookup_key);
  const { error } = await db
    .from('subscriptions')
    .update({
      status: sub.status,
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: iso(sub.canceled_at),
      ended_at: iso(sub.ended_at),
      ...(now === null ? {} : { current_period_start: iso(now.start), current_period_end: iso(now.end) }),
      ...(item === undefined || priced === null
        ? {}
        : {
            tier: priced.plan,
            stripe_price_id: item.price.id,
            unit_amount_cents: item.price.unit_amount,
            billing_interval: item.price.recurring?.interval === 'year' ? 'year' : 'month',
          }),
    })
    .eq('stripe_subscription_id', sub.id);
  if (error !== null) throw new Error(`Could not update the billing record: ${error.message}`);
  const tenantId = sub.metadata['tenant_id'];
  // The term is over: the site comes down, kept and hidden, never deleted.
  if (sub.status === 'canceled' && tenantId !== undefined) {
    const { error: downErr } = await db.from('tenants').update({ status: 'offline', plan_cancels: false }).eq('id', tenantId).eq('status', 'active');
    if (downErr !== null) throw new Error(`Could not close the site: ${downErr.message}`);
    return;
  }
  if (now === null || tenantId === undefined) return;
  if (priced !== null) await followPlan(db, tenantId, priced);
  const { error: tErr } = await db.from('tenants').update({ plan_renews_on: day(now.end) }).eq('id', tenantId);
  if (tErr !== null) throw new Error(`Could not save the renewal day: ${tErr.message}`);
}

/**
 * The site's plan follows what Stripe is charging for. A change made from Your plan
 * has usually done this already, and then nothing happens here. A downgrade waiting
 * for renewal happens here: Stripe moves the price on renewal day and says so. On
 * Showcase, the pieces the maker picked become the gallery.
 */
async function followPlan(db: Db, tenantId: string, priced: NonNullable<ReturnType<typeof planOfKey>>): Promise<void> {
  const { data, error } = await db.from('tenants').select('plan, plan_billing, plan_next, plan_next_gallery').eq('id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the site's plan: ${error.message}`);
  if (data === null) return;
  const billing = priced.plan === 'free' ? null : priced.billing;
  const samePlan = data.plan === priced.plan;
  if (samePlan && data.plan_billing === billing) return;
  if (!samePlan) {
    const picks = data.plan_next === priced.plan ? (data.plan_next_gallery ?? []) : [];
    if (priced.plan === 'showcase' && picks.length > 0) {
      const g = await galleryFromProducts(db, tenantId, picks, GALLERY_LIMIT);
      if (!g.ok) throw new Error(`Could not make the Showcase gallery: ${g.error}`);
    }
    const applied = await applyPlan(db, tenantId, priced.plan);
    if (!applied.ok) throw new Error(`Could not put the site on its plan: ${applied.error}`);
  }
  const { error: tErr } = await db.from('tenants').update({ plan_billing: billing, plan_next: null, plan_next_billing: null, plan_next_gallery: null }).eq('id', tenantId);
  if (tErr !== null) throw new Error(`Could not save the plan's billing: ${tErr.message}`);
}
