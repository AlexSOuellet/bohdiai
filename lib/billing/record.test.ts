import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const recordSignupPromo = vi.fn();
vi.mock('./promos', () => ({ recordSignupPromo: (...a: unknown[]) => recordSignupPromo(...a) }));
const plans = vi.hoisted(() => ({
  applyPlan: vi.fn(async (): Promise<{ ok: true } | { ok: false; error: string }> => ({ ok: true })),
  galleryFromProducts: vi.fn(async (): Promise<{ ok: true; count: number } | { ok: false; error: string }> => ({ ok: true, count: 1 })),
}));
vi.mock('@/lib/backend/plan/apply', () => ({ applyPlan: plans.applyPlan }));
vi.mock('@/lib/backend/plan/convert', () => ({ galleryFromProducts: plans.galleryFromProducts }));

import { claim, letGo, recordCheckout, recordSubscription } from './record';

beforeEach(() => {
  recordSignupPromo.mockReset().mockResolvedValue(undefined);
});

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
            const answer = Promise.resolve({ error: next(table) });
            return Object.assign(answer, { eq: () => answer });
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

describe('recordSubscription at the end of a term', () => {
  it('brings the site down, kept and hidden, only if it’s live', async () => {
    const { db, calls } = fakeDb();
    await recordSubscription(db, subscription({ status: 'canceled' }));
    expect(calls[1]).toMatchObject({ table: 'tenants', op: 'update', value: { status: 'offline', plan_cancels: false } });
    expect(calls).toHaveLength(2);
  });
  it('says so when the site can’t be closed', async () => {
    const { db } = fakeDb({ tenants: [{ message: 'down' }] });
    await expect(recordSubscription(db, subscription({ status: 'canceled' }))).rejects.toThrow(/close/);
  });
});

describe('claim', () => {
  it('says whether this is the first time', async () => {
    expect(await claim(fakeDb().db, 'evt_1', 'x')).toBe(true);
    expect(await claim(fakeDb({ stripe_events: [{ code: '23505', message: 'dup' }] }).db, 'evt_1', 'x')).toBe(false);
    await expect(claim(fakeDb({ stripe_events: [{ code: '500', message: 'down' }] }).db, 'evt_1', 'x')).rejects.toThrow(/down/);
  });
});

describe('recordCheckout, the rest of what Stripe can send back', () => {
  it('says not paid for a checkout with no site on it, and writes nothing', async () => {
    const { s } = fakeStripe({ client_reference_id: null });
    const { db, calls } = fakeDb();
    expect(await recordCheckout(s, db, 'cs_1')).toEqual({ paid: false });
    expect(calls).toHaveLength(0);
  });

  it('uses the checkout’s own email when Stripe has no customer details, and none at all when neither is there', async () => {
    const fallback = fakeStripe({ customer_details: null, customer_email: 'typed@example.com' });
    expect(await recordCheckout(fallback.s, fakeDb().db, 'cs_1')).toMatchObject({ email: 'typed@example.com' });
    const none = fakeStripe({ customer_details: { email: null } as Stripe.Checkout.Session.CustomerDetails, customer_email: null });
    expect(await recordCheckout(none.s, fakeDb().db, 'cs_1')).toEqual({ paid: true, tenantId: 't1', email: null, first: true });
  });

  it('reads the customer id from an expanded customer', async () => {
    const { s } = fakeStripe({ subscription: subscription({ customer: { id: 'cus_9' } as Stripe.Customer }) });
    const { db, calls } = fakeDb();
    await recordCheckout(s, db, 'cs_1');
    expect(calls.find((c) => c.table === 'subscriptions')).toMatchObject({ value: { stripe_customer_id: 'cus_9' } });
  });

  it('refuses a checkout that came back without its subscription, and lets the claim go', async () => {
    for (const sub of [null, 'sub_1']) {
      const { s } = fakeStripe({ subscription: sub as unknown as Stripe.Subscription });
      const { db, calls } = fakeDb();
      await expect(recordCheckout(s, db, 'cs_1')).rejects.toThrow('checkout cs_1 came back without its subscription');
      expect(calls.at(-1)).toMatchObject({ table: 'stripe_events', op: 'delete', eq: ['id', 'checkout:cs_1'] });
      expect(calls.some((c) => c.table === 'subscriptions')).toBe(false);
    }
  });

  it('refuses a subscription with no price', async () => {
    const { s } = fakeStripe({ subscription: subscription({ items: { data: [] } as unknown as Stripe.ApiList<Stripe.SubscriptionItem> }) });
    const { db, calls } = fakeDb();
    await expect(recordCheckout(s, db, 'cs_1')).rejects.toThrow('subscription sub_1 has no price');
    expect(calls.at(-1)).toMatchObject({ table: 'stripe_events', op: 'delete' });
  });

  it('records a price with no repeat as monthly', async () => {
    const once = subscription();
    (once.items.data[0] as unknown as { price: { recurring: null } }).price.recurring = null;
    const { db, calls } = fakeDb();
    await recordCheckout(fakeStripe({ subscription: once }).s, db, 'cs_1');
    expect(calls.find((c) => c.table === 'subscriptions')).toMatchObject({ value: { billing_interval: 'month' } });
  });

  it('lets the claim go when the renewal day can’t be saved', async () => {
    const { db, calls } = fakeDb({ tenants: [{ message: 'locked' }] });
    await expect(recordCheckout(fakeStripe({}).s, db, 'cs_1')).rejects.toThrow('Could not save the renewal day: locked');
    expect(calls.at(-1)).toMatchObject({ table: 'stripe_events', op: 'delete', eq: ['id', 'checkout:cs_1'] });
  });

  it('notes the code a maker signed up with, against the lower-cased email', async () => {
    const sub = subscription({ metadata: { tenant_id: 't1', plan: 'lite', promo_code: 'SPRING10', promo_percent: '10', promo_months: '3' } });
    const { s } = fakeStripe({ subscription: sub, customer_details: { email: 'Lena@Example.com' } as Stripe.Checkout.Session.CustomerDetails });
    const { db } = fakeDb();
    await recordCheckout(s, db, 'cs_1');
    expect(recordSignupPromo).toHaveBeenCalledWith(db, {
      stripeId: 'sub_1',
      code: 'SPRING10',
      tenantId: 't1',
      email: 'lena@example.com',
      discount: { percent: 10, months: 3 },
      interval: 'month',
      now: expect.any(Date),
    });
  });

  it('notes a code with no month count as lasting for good', async () => {
    const sub = subscription({ metadata: { tenant_id: 't1', plan: 'lite', promo_code: 'FOREVER', promo_percent: '25' } });
    await recordCheckout(fakeStripe({ subscription: sub }).s, fakeDb().db, 'cs_1');
    expect(recordSignupPromo).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ code: 'FOREVER', discount: { percent: 25, months: null } }));
  });

  it('notes no code without one, or without an email to hold it to', async () => {
    await recordCheckout(fakeStripe({}).s, fakeDb().db, 'cs_1');
    const sub = subscription({ metadata: { tenant_id: 't1', plan: 'lite', promo_code: 'SPRING10', promo_percent: '10' } });
    await recordCheckout(fakeStripe({ subscription: sub, customer_details: null, customer_email: null }).s, fakeDb().db, 'cs_1');
    expect(recordSignupPromo).not.toHaveBeenCalled();
  });

  it('lets the claim go when noting the code fails', async () => {
    recordSignupPromo.mockRejectedValue(new Error('promo down'));
    const sub = subscription({ metadata: { tenant_id: 't1', plan: 'lite', promo_code: 'SPRING10', promo_percent: '10' } });
    const { db, calls } = fakeDb();
    await expect(recordCheckout(fakeStripe({ subscription: sub }).s, db, 'cs_1')).rejects.toThrow('promo down');
    expect(calls.at(-1)).toMatchObject({ table: 'stripe_events', op: 'delete' });
  });
});

describe('recordSubscription, the edges', () => {
  it('records when it was cancelled and ended', async () => {
    const { db, calls } = fakeDb();
    await recordSubscription(db, subscription({ status: 'canceled', canceled_at: START, ended_at: END }));
    expect(calls[0]).toMatchObject({ value: { canceled_at: '2026-10-31T00:00:00.000Z', ended_at: '2026-11-30T00:00:00.000Z' } });
  });

  it('says so when the billing record can’t be updated, and goes no further', async () => {
    const { db, calls } = fakeDb({ subscriptions: [{ message: 'down' }] });
    await expect(recordSubscription(db, subscription())).rejects.toThrow('Could not update the billing record: down');
    expect(calls).toHaveLength(1);
  });

  it('says so when the renewal day can’t be saved', async () => {
    const { db } = fakeDb({ tenants: [{ message: 'locked' }] });
    await expect(recordSubscription(db, subscription())).rejects.toThrow('Could not save the renewal day: locked');
  });

  it('keeps the old period when Stripe sends none, and leaves the site alone', async () => {
    const { db, calls } = fakeDb();
    await recordSubscription(db, subscription({ items: { data: [] } as unknown as Stripe.ApiList<Stripe.SubscriptionItem> }));
    expect(calls).toHaveLength(1);
    expect(calls[0]?.value).not.toHaveProperty('current_period_end');
  });

  it('touches only the billing record when the subscription names no site, even at the end of a term', async () => {
    for (const status of ['active', 'canceled'] as const) {
      const { db, calls } = fakeDb();
      await recordSubscription(db, subscription({ status, metadata: {} }));
      expect(calls.map((c) => c.table)).toEqual(['subscriptions']);
    }
  });
});

describe('letGo', () => {
  it('removes the claim so it can be taken again', async () => {
    const { db, calls } = fakeDb();
    await letGo(db, 'checkout:cs_1');
    expect(calls).toEqual([{ table: 'stripe_events', op: 'delete', eq: ['id', 'checkout:cs_1'] }]);
  });
});

describe('recordSubscription: the site follows the plan Stripe charges for', () => {
  type Row = { plan: string | null; plan_billing: string | null; plan_next: string | null; plan_next_gallery: string[] | null };
  /** A database that answers the site's plan read with `row`, and notes every write. */
  function planDb(row: Row | null, opts: { readError?: string; tenantErrors?: (string | null)[] } = {}) {
    const calls: { table: string; op: string; value?: unknown }[] = [];
    const tenantErrors = [...(opts.tenantErrors ?? [])];
    const db = {
      from(table: string) {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: opts.readError === undefined ? null : { message: opts.readError } }) }) }),
          update: (value: unknown) => {
            calls.push({ table, op: 'update', value });
            const e = table === 'tenants' ? (tenantErrors.shift() ?? null) : null;
            const answer = Promise.resolve({ error: e === null ? null : { message: e } });
            return { eq: () => Object.assign(answer, { eq: () => answer }) };
          },
        };
      },
    };
    return { db: db as unknown as SupabaseClient<Database>, calls };
  }
  const priced = (key: string, cents = 500, interval: 'month' | 'year' = 'month') =>
    subscription({ items: { data: [{ current_period_start: START, current_period_end: END, price: { id: 'price_9', lookup_key: key, unit_amount: cents, currency: 'usd', recurring: { interval } } }] } as unknown as Stripe.Subscription['items'] });

  beforeEach(() => {
    plans.applyPlan.mockClear();
    plans.galleryFromProducts.mockClear();
  });

  it('a downgrade waiting for renewal happens when Stripe moves the price: the picked pieces become the gallery', async () => {
    const { db, calls } = planDb({ plan: 'lite', plan_billing: 'monthly', plan_next: 'showcase', plan_next_gallery: ['p2', 'p1'] });
    await recordSubscription(db, priced('bohdiai_showcase_yearly', 5000, 'year'));
    expect(calls[0]).toMatchObject({ table: 'subscriptions', value: { tier: 'showcase', stripe_price_id: 'price_9', unit_amount_cents: 5000, billing_interval: 'year' } });
    expect(plans.galleryFromProducts).toHaveBeenCalledWith(db, 't1', ['p2', 'p1'], 12);
    expect(plans.applyPlan).toHaveBeenCalledWith(db, 't1', 'showcase');
    expect(calls[1]).toMatchObject({ table: 'tenants', value: { plan_billing: 'yearly', plan_next: null, plan_next_billing: null, plan_next_gallery: null } });
    expect(calls[2]).toMatchObject({ table: 'tenants', value: { plan_renews_on: '2026-11-30' } });
  });

  it('a site already on the plan Stripe charges for is left alone', async () => {
    const { db, calls } = planDb({ plan: 'full', plan_billing: 'monthly', plan_next: null, plan_next_gallery: null });
    await recordSubscription(db, priced('bohdiai_full_monthly', 2500));
    expect(plans.applyPlan).not.toHaveBeenCalled();
    expect(calls.map((c) => c.table)).toEqual(['subscriptions', 'tenants']);
  });

  it('a change of billing alone saves the billing, nothing else switches', async () => {
    const { db, calls } = planDb({ plan: 'lite', plan_billing: 'yearly', plan_next: 'lite', plan_next_gallery: null });
    await recordSubscription(db, priced('bohdiai_lite_monthly', 1500));
    expect(plans.applyPlan).not.toHaveBeenCalled();
    expect(calls[1]).toMatchObject({ value: { plan_billing: 'monthly', plan_next: null } });
  });

  it('moves up with no gallery to make, and Free has no billing', async () => {
    const up = planDb({ plan: 'lite', plan_billing: 'monthly', plan_next: null, plan_next_gallery: null });
    await recordSubscription(up.db, priced('bohdiai_full_monthly', 2500));
    expect(plans.applyPlan).toHaveBeenCalledWith(up.db, 't1', 'full');
    expect(plans.galleryFromProducts).not.toHaveBeenCalled();
    const free = planDb({ plan: 'showcase', plan_billing: 'monthly', plan_next: null, plan_next_gallery: null });
    await recordSubscription(free.db, priced('bohdiai_free_monthly', 0));
    expect(free.calls[1]).toMatchObject({ value: { plan_billing: null } });
  });

  it('Showcase with no picks (a move Stripe made on its own) keeps the gallery as it is', async () => {
    const { db } = planDb({ plan: 'lite', plan_billing: 'monthly', plan_next: null, plan_next_gallery: null });
    await recordSubscription(db, priced('bohdiai_showcase_monthly'));
    expect(plans.galleryFromProducts).not.toHaveBeenCalled();
    expect(plans.applyPlan).toHaveBeenCalledWith(db, 't1', 'showcase');
  });

  it('a price that isn’t one of the plans changes nothing on the site', async () => {
    const { db, calls } = planDb({ plan: 'lite', plan_billing: 'monthly', plan_next: null, plan_next_gallery: null });
    await recordSubscription(db, priced('something_else'));
    expect(calls[0]?.value).not.toHaveProperty('tier');
    expect(plans.applyPlan).not.toHaveBeenCalled();
  });

  it('no site to follow: nothing more', async () => {
    const { db, calls } = planDb(null);
    await recordSubscription(db, priced('bohdiai_full_monthly'));
    expect(calls.map((c) => c.table)).toEqual(['subscriptions', 'tenants']);
  });

  it('says so when any step fails, so Stripe sends the notice again', async () => {
    const row = { plan: 'lite', plan_billing: 'monthly', plan_next: 'showcase', plan_next_gallery: ['p1'] };
    await expect(recordSubscription(planDb(row, { readError: 'down' }).db, priced('bohdiai_showcase_monthly'))).rejects.toThrow("Could not read the site's plan: down");
    plans.galleryFromProducts.mockResolvedValueOnce({ ok: false, error: 'gallery: full' });
    await expect(recordSubscription(planDb(row).db, priced('bohdiai_showcase_monthly'))).rejects.toThrow('Could not make the Showcase gallery: gallery: full');
    plans.applyPlan.mockResolvedValueOnce({ ok: false, error: 'switches: down' });
    await expect(recordSubscription(planDb(row).db, priced('bohdiai_showcase_monthly'))).rejects.toThrow('Could not put the site on its plan: switches: down');
    await expect(recordSubscription(planDb(row, { tenantErrors: ['locked'] }).db, priced('bohdiai_showcase_monthly'))).rejects.toThrow("Could not save the plan's billing: locked");
  });
});
