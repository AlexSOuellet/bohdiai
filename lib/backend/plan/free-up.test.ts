import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const h = vi.hoisted(() => ({
  applyPlan: vi.fn(async (): Promise<{ ok: true } | { ok: false; error: string }> => ({ ok: true })),
  changeNow: vi.fn(async (): Promise<unknown> => ({ ok: true, sub: { items: { data: [{ current_period_end: Date.UTC(2026, 11, 9) / 1000 }] } } })),
  findPrice: vi.fn(async (_s: unknown, plan: string, billing: string) => ({ id: `price_${plan}_${billing}` })),
}));
vi.mock('./apply', () => ({ applyPlan: h.applyPlan }));
vi.mock('@/lib/billing/plan-change', () => ({ changeNow: h.changeNow, findPrice: h.findPrice }));
const { chargeAndStepUp, freeSite, movedUpError, stepUp } = await import('./free-up');

function fakeDb(opts: { row?: unknown; readError?: string; writeError?: string } = {}) {
  const writes: unknown[] = [];
  const db = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: opts.row ?? null, error: opts.readError === undefined ? null : { message: opts.readError } }) }) }),
      update: (v: unknown) => ({
        eq: async () => {
          writes.push(v);
          return { error: opts.writeError === undefined ? null : { message: opts.writeError } };
        },
      }),
    }),
  };
  return { db: db as unknown as SupabaseClient<Database>, writes };
}

beforeEach(() => {
  h.applyPlan.mockClear();
  h.changeNow.mockClear();
});

describe('freeSite', () => {
  it('says whether the account is on Free, and whether it’s free for this maker', async () => {
    expect(await freeSite(fakeDb({ row: { plan: 'free', plan_comp: null } }).db, 't1')).toEqual({ free: true, comp: false });
    expect(await freeSite(fakeDb({ row: { plan: 'free', plan_comp: 'free' } }).db, 't1')).toEqual({ free: true, comp: true });
    expect(await freeSite(fakeDb({ row: { plan: 'lite', plan_comp: null } }).db, 't1')).toEqual({ free: false, comp: false });
    expect(await freeSite(fakeDb().db, 't1')).toEqual({ free: false, comp: false });
  });
  it('says so when it can’t be read', async () => {
    await expect(freeSite(fakeDb({ readError: 'down' }).db, 't1')).rejects.toThrow('Could not read the plan: down');
  });
});

describe('stepUp', () => {
  it('puts the site on its plan with its billing and renewal day', async () => {
    const { db, writes } = fakeDb();
    expect(await stepUp(db, 't1', 'showcase', 'yearly', '2027-11-09')).toEqual({ ok: true });
    expect(h.applyPlan).toHaveBeenCalledWith(db, 't1', 'showcase');
    expect(writes).toEqual([{ plan_billing: 'yearly', plan_renews_on: '2027-11-09', plan_next: null, plan_next_billing: null, plan_next_gallery: null }]);
  });
  it('keeps the renewal day when there’s no new one, and says which step failed', async () => {
    const { db, writes } = fakeDb();
    await stepUp(db, 't1', 'lite', 'monthly', null);
    expect(writes[0]).not.toHaveProperty('plan_renews_on');
    h.applyPlan.mockResolvedValueOnce({ ok: false, error: 'down' });
    expect(await stepUp(db, 't1', 'lite', 'monthly', null)).toEqual({ ok: false, error: 'switches: down' });
    expect(await stepUp(fakeDb({ writeError: 'locked' }).db, 't1', 'lite', 'monthly', null)).toEqual({ ok: false, error: 'terms: locked' });
  });
});

describe('chargeAndStepUp', () => {
  const s = {} as Stripe;
  it('Stripe charges the first period, then the site steps up with Stripe’s renewal day', async () => {
    const { db, writes } = fakeDb();
    expect(await chargeAndStepUp(s, db, { tenantId: 't1', stripeId: 'sub_1', to: 'full', billing: 'monthly' })).toEqual({ ok: true });
    expect(h.changeNow).toHaveBeenCalledWith(s, 'sub_1', { id: 'price_full_monthly' }, { plan: 'full', billing: 'monthly' });
    expect(writes[0]).toMatchObject({ plan_billing: 'monthly', plan_renews_on: '2026-12-09' });
  });
  it('a declined card changes nothing', async () => {
    h.changeNow.mockResolvedValueOnce({ ok: false, declined: 'Your card was declined.' });
    const { db, writes } = fakeDb();
    expect(await chargeAndStepUp(s, db, { tenantId: 't1', stripeId: 'sub_1', to: 'full', billing: 'monthly' })).toEqual({ ok: false, declined: 'Your card was declined.' });
    expect(h.applyPlan).not.toHaveBeenCalled();
    expect(writes).toEqual([]);
  });
  it('no period back from Stripe keeps the renewal day', async () => {
    h.changeNow.mockResolvedValueOnce({ ok: true, sub: { items: { data: [] } } });
    const { db, writes } = fakeDb();
    await chargeAndStepUp(s, db, { tenantId: 't1', stripeId: 'sub_1', to: 'lite', billing: 'yearly' });
    expect(writes[0]).not.toHaveProperty('plan_renews_on');
  });
});

describe('movedUpError', () => {
  it('a declined card asks for another; anything else says the payment went through', () => {
    expect(movedUpError({ ok: false, declined: 'Your card was declined.' })).toBe('Your card was declined: Your card was declined. Try another card.');
    expect(movedUpError({ ok: false, error: 'switches: down' })).toBe('Your payment went through. Your site is being set up: refresh in a minute.');
  });
});
