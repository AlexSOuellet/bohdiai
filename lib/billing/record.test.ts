import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { claim, recordCheckout, recordSubscription } from './record';

type Err = { code?: string; message: string } | null;

/** A database that notes every write and answers with the error queued for its table. */
function fakeDb(errors: Partial<Record<string, Err[]>> = {}) {
  const calls: { table: string; op: string; value?: unknown; eq?: [string, unknown] }[] = [];
  const next = (table: string): Err => errors[table]?.shift() ?? null;
  const db = {
    from(table: string) {
      return {
        insert: (value: unknown) => {
          calls.push({ table, op: 'insert', value });
          return Promise.resolve({ error: next(table) });
        },
        update: (value: unknown) => ({
          eq: (col: string, v: unknown) => {
            calls.push({ table, op: 'update', value, eq: [col, v] });
            return Promise.resolve({ error: next(table) });
          },
        }),
        delete: () => ({
          eq: (col: string, v: unknown) => {
            calls.push({ table, op: 'delete', eq: [col, v] });
            return Promise.resolve({ error: null });
          },
        }),
      };
    },
  };
  return { db: db as unknown as SupabaseClient<Database>, calls };
}

const START = Date.UTC(2026, 9, 31) / 1000;
const END = Date.UTC(2026, 10, 30) / 1000;

function subscription(over: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: 'sub_1',
    status: 'active',
    customer: 'cus_1',
    cancel_at_period_end: false,
    canceled_at: null,
    ended_at: null,
    metadata: { tenant_id: 't1', plan: 'lite', billing: 'monthly' },
    items: { data: [{ current_period_start: START, current_period_end: END, price: { id: 'price_1', unit_amount: 1500, currency: 'usd', recurring: { interval: 'month' } } }] },
    ...over,
  } as unknown as Stripe.Subscription;
}

function fakeStripe(session: Partial<Stripe.Checkout.Session>) {
  const retrieve = vi.fn(async () => ({ id: 'cs_1', status: 'complete', client_reference_id: 't1', customer_details: { email: 'lena@example.com' }, customer_email: null, subscription: subscription(), ...session }));
  return { s: { checkout: { sessions: { retrieve } } } as unknown as Stripe, retrieve };
}

describe('recordCheckout', () => {
  it('saves the billing record and the renewal day, once', async () => {
    const { s, retrieve } = fakeStripe({});
    const { db, calls } = fakeDb();
    expect(await recordCheckout(s, db, 'cs_1')).toEqual({ paid: true, tenantId: 't1', email: 'lena@example.com', first: true });
    expect(retrieve).toHaveBeenCalledWith('cs_1', { expand: ['subscription'] });
    expect(calls[0]).toMatchObject({ table: 'stripe_events', op: 'insert', value: { id: 'checkout:cs_1' } });
    expect(calls[1]).toMatchObject({
      table: 'subscriptions',
      op: 'insert',
      value: {
        tenant_id: 't1',
        tier: 'lite',
        status: 'active',
        stripe_customer_id: 'cus_1',
        stripe_subscription_id: 'sub_1',
        stripe_price_id: 'price_1',
        billing_interval: 'month',
        unit_amount_cents: 1500,
        currency: 'USD',
        current_period_end: '2026-11-30T00:00:00.000Z',
      },
    });
    expect(calls[2]).toMatchObject({ table: 'tenants', op: 'update', value: { plan_billing: 'monthly', plan_renews_on: '2026-11-30' }, eq: ['id', 't1'] });
  });

  it('only reads when the checkout was already recorded (Stripe’s notice and the page both arrive)', async () => {
    const { s } = fakeStripe({});
    const { db, calls } = fakeDb({ stripe_events: [{ code: '23505', message: 'duplicate' }] });
    expect(await recordCheckout(s, db, 'cs_1')).toMatchObject({ paid: true, tenantId: 't1', first: false });
    expect(calls.filter((c) => c.table === 'subscriptions')).toHaveLength(0);
  });

  it('says not paid for a checkout that isn’t complete, and writes nothing', async () => {
    const { s } = fakeStripe({ status: 'open' });
    const { db, calls } = fakeDb();
    expect(await recordCheckout(s, db, 'cs_1')).toEqual({ paid: false });
    expect(calls).toHaveLength(0);
  });

  it('lets the claim go when saving fails, so a retry records it', async () => {
    const { s } = fakeStripe({});
    const { db, calls } = fakeDb({ subscriptions: [{ message: 'db down' }] });
    await expect(recordCheckout(s, db, 'cs_1')).rejects.toThrow(/db down/);
    expect(calls.at(-1)).toMatchObject({ table: 'stripe_events', op: 'delete', eq: ['id', 'checkout:cs_1'] });
  });

  it('refuses a subscription that names no plan', async () => {
    const { s } = fakeStripe({ subscription: subscription({ metadata: { tenant_id: 't1' } }) });
    const { db } = fakeDb();
    await expect(recordCheckout(s, db, 'cs_1')).rejects.toThrow(/names no plan/);
  });

  it('records a yearly plan as yearly', async () => {
    const yearly = subscription();
    (yearly.items.data[0] as unknown as { price: { recurring: { interval: string } } }).price.recurring.interval = 'year';
    const { s } = fakeStripe({ subscription: yearly });
    const { db, calls } = fakeDb();
    await recordCheckout(s, db, 'cs_1');
    expect(calls.find((c) => c.table === 'subscriptions')).toMatchObject({ value: { billing_interval: 'year' } });
    expect(calls.find((c) => c.table === 'tenants')).toMatchObject({ value: { plan_billing: 'yearly' } });
  });
});

describe('recordSubscription', () => {
  it('follows what Stripe says: status, cancelling, the new period and renewal day', async () => {
    const { db, calls } = fakeDb();
    await recordSubscription(db, subscription({ status: 'past_due', cancel_at_period_end: true }));
    expect(calls[0]).toMatchObject({ table: 'subscriptions', op: 'update', value: { status: 'past_due', cancel_at_period_end: true }, eq: ['stripe_subscription_id', 'sub_1'] });
    expect(calls[1]).toMatchObject({ table: 'tenants', value: { plan_renews_on: '2026-11-30' }, eq: ['id', 't1'] });
  });
});

describe('claim', () => {
  it('says whether this is the first time', async () => {
    expect(await claim(fakeDb().db, 'evt_1', 'x')).toBe(true);
    expect(await claim(fakeDb({ stripe_events: [{ code: '23505', message: 'dup' }] }).db, 'evt_1', 'x')).toBe(false);
    await expect(claim(fakeDb({ stripe_events: [{ code: '500', message: 'down' }] }).db, 'evt_1', 'x')).rejects.toThrow(/down/);
  });
});
