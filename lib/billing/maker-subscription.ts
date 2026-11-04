/**
 * A maker's Stripe subscription, as our billing record has it, and the one thing
 * every plan needs to be able to tell Stripe: whether it ends with this term.
 * Hand-built and free sites may have none; they have nothing to tell Stripe.
 */
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type Db = SupabaseClient<Database>;

export type MakerSubscription = {
  stripeId: string;
  customerId: string;
  /** The plan's full price for one period. */
  unitCents: number;
  interval: 'month' | 'year';
  periodEnd: string | null;
  discountLabel: string | null;
  discountEndsAt: string | null;
};

const LIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'];

export async function currentSubscription(db: Db, tenantId: string): Promise<MakerSubscription | null> {
  const { data, error } = await db
    .from('subscriptions')
    .select('stripe_subscription_id, stripe_customer_id, unit_amount_cents, billing_interval, current_period_end, discount_label, discount_ends_at')
    .eq('tenant_id', tenantId)
    .in('status', LIVE_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not read the subscription: ${error.message}`);
  if (data === null || data.stripe_subscription_id === null || data.stripe_customer_id === null) return null;
  return {
    stripeId: data.stripe_subscription_id,
    customerId: data.stripe_customer_id,
    unitCents: data.unit_amount_cents ?? 0,
    interval: data.billing_interval === 'year' ? 'year' : 'month',
    periodEnd: data.current_period_end,
    discountLabel: data.discount_label,
    discountEndsAt: data.discount_ends_at,
  };
}

/** Tells Stripe whether the plan ends with this term. Stripe's notice updates our record. */
export async function setEndsWithTerm(s: Stripe, sub: MakerSubscription, ends: boolean): Promise<void> {
  await s.subscriptions.update(sub.stripeId, { cancel_at_period_end: ends });
}
