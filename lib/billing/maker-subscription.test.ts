import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { currentSubscription, setEndsWithTerm, type MakerSubscription } from './maker-subscription';

function fakeDb(result: { data: unknown; error: { message: string } | null }): SupabaseClient<Database> {
  const step: unknown = new Proxy({}, { get: (_t, key) => (key === 'maybeSingle' ? async () => result : () => step) });
  return { from: () => step } as unknown as SupabaseClient<Database>;
}

const row = { stripe_subscription_id: 'sub_1', stripe_customer_id: 'cus_1', unit_amount_cents: 500, billing_interval: 'year', current_period_end: '2027-01-01', discount_label: null, discount_ends_at: null };

describe('currentSubscription', () => {
  it('reads the billing record', async () => {
    expect(await currentSubscription(fakeDb({ data: row, error: null }), 't1')).toEqual({ stripeId: 'sub_1', customerId: 'cus_1', unitCents: 500, interval: 'year', periodEnd: '2027-01-01', discountLabel: null, discountEndsAt: null });
  });
  it('reads a missing price and interval as nothing, monthly', async () => {
    expect(await currentSubscription(fakeDb({ data: { ...row, unit_amount_cents: null, billing_interval: null }, error: null }), 't1')).toMatchObject({ unitCents: 0, interval: 'month' });
  });
  it('finds none on a site Stripe doesn’t bill', async () => {
    expect(await currentSubscription(fakeDb({ data: null, error: null }), 't1')).toBeNull();
    expect(await currentSubscription(fakeDb({ data: { ...row, stripe_subscription_id: null }, error: null }), 't1')).toBeNull();
    expect(await currentSubscription(fakeDb({ data: { ...row, stripe_customer_id: null }, error: null }), 't1')).toBeNull();
  });
  it('says so when it can’t be read', async () => {
    await expect(currentSubscription(fakeDb({ data: null, error: { message: 'down' } }), 't1')).rejects.toThrow('down');
  });
});

describe('setEndsWithTerm', () => {
  it('tells Stripe', async () => {
    const update = vi.fn(async () => ({}));
    await setEndsWithTerm({ subscriptions: { update } } as unknown as Stripe, { stripeId: 'sub_1' } as MakerSubscription, true);
    expect(update).toHaveBeenCalledWith('sub_1', { cancel_at_period_end: true });
  });
});
