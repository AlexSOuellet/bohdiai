import { describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { MakerSubscription } from './maker-subscription';
import { applyDiscount, createInviteCode, findInviteCodes, checkoutCoupon, checkPromo, claimPromo, clearDiscount, createPromo, discountLabel, discountRunning, endPromo, endsAfter, listPromos, normalizeCode, recordSignupPromo, releasePromo, yearlyValueCents, type Promo } from './promos';

const NOW = new Date('2026-11-04T12:00:00Z');

type Result = { data?: unknown; error: { code?: string; message: string } | null };

/** A fake database: every query on a table answers with that table's result, and writes are noted. */
function fakeDb(tables: Record<string, Result> = {}) {
  const writes: { table: string; op: string; value?: unknown }[] = [];
  const from = (table: string): unknown => {
    const result = tables[table] ?? { data: [], error: null };
    const step: unknown = new Proxy(
      {},
      {
        get: (_t, key) => {
          if (key === 'then') return (done: (r: Result) => void) => done(result);
          return (value: unknown) => {
            if (key === 'insert' || key === 'update' || key === 'delete') writes.push({ table, op: key, value });
            return step;
          };
        },
      },
    );
    return step;
  };
  return { db: { from } as unknown as SupabaseClient<Database>, writes };
}

function fakeStripe(coupon: Partial<Stripe.Coupon> | Error | null = null) {
  const update = vi.fn(async () => ({}));
  const createBalanceTransaction = vi.fn(async () => ({}));
  const create = vi.fn(async () => ({ id: 'made' }));
  const del = vi.fn(async () => ({}));
  const retrieve = vi.fn(async () => {
    if (coupon instanceof Error) throw coupon;
    if (coupon === null) throw Object.assign(new Error('gone'), { code: 'resource_missing' });
    return coupon;
  });
  const list = vi.fn(async () => ({ data: coupon === null || coupon instanceof Error ? [] : [coupon, { id: 'plain', percent_off: 5, metadata: {} }] }));
  const s = { subscriptions: { update }, customers: { createBalanceTransaction }, coupons: { create, del, retrieve, list } } as unknown as Stripe;
  return { s, update, createBalanceTransaction, create, del };
}

const coupon = (over: Partial<Stripe.Coupon> = {}): Partial<Stripe.Coupon> => ({ id: 'SPRING10', percent_off: 10, duration_in_months: null, redeem_by: null, max_redemptions: null, valid: true, metadata: { bohdiai_promo: 'everyone' }, ...over });
const promo: Promo = { code: 'SPRING10', percent: 10, months: null, audience: 'everyone', expires: null, maxUses: null };
const monthly: MakerSubscription = { stripeId: 'sub_1', customerId: 'cus_1', unitCents: 2500, interval: 'month', periodEnd: '2026-12-01T00:00:00Z', discountLabel: null, discountEndsAt: null };
const yearly: MakerSubscription = { ...monthly, unitCents: 25000, interval: 'year', periodEnd: '2027-11-01T00:00:00Z' };

describe('the words and the sums', () => {
  it('names a discount the way people say it', () => {
    expect(discountLabel({ percent: 100, months: 3 })).toBe('3 months free');
    expect(discountLabel({ percent: 100, months: 1 })).toBe('1 month free');
    expect(discountLabel({ percent: 100, months: null })).toBe('Free');
    expect(discountLabel({ percent: 10, months: null })).toBe('10% off');
    expect(discountLabel({ percent: 10, months: 3 })).toBe('10% off for 3 months');
  });
  it('tidies a typed code', () => {
    expect(normalizeCode('  spring10 ')).toBe('SPRING10');
  });
  it('values months on a yearly plan, never above the year', () => {
    expect(yearlyValueCents(25000, { percent: 100, months: 3 })).toBe(6250);
    expect(yearlyValueCents(25000, { percent: 10, months: 6 })).toBe(1250);
    expect(yearlyValueCents(25000, { percent: 100, months: 24 })).toBe(25000);
  });
  it('knows when a discount is still running', () => {
    expect(discountRunning({ discountLabel: null, discountEndsAt: null }, NOW)).toBe(false);
    expect(discountRunning({ discountLabel: '10% off', discountEndsAt: null }, NOW)).toBe(true);
    expect(discountRunning({ discountLabel: 'x', discountEndsAt: '2026-12-01T00:00:00Z' }, NOW)).toBe(true);
    expect(discountRunning({ discountLabel: 'x', discountEndsAt: '2026-10-01T00:00:00Z' }, NOW)).toBe(false);
  });
  it('counts months from today', () => {
    expect(endsAfter(3, NOW)).toBe('2027-02-04T00:00:00.000Z');
  });
});

describe('making and ending codes', () => {
  it('makes a coupon named by the code, marked as ours', async () => {
    const { s, create } = fakeStripe();
    await createPromo(s, { ...promo, code: 'WELCOME', percent: 100, months: 3, audience: 'new', expires: '2027-01-01T00:00:00Z', maxUses: 50 });
    expect(create).toHaveBeenCalledWith({ id: 'WELCOME', name: 'WELCOME', percent_off: 100, duration: 'repeating', duration_in_months: 3, redeem_by: 1798761600, max_redemptions: 50, metadata: { bohdiai_promo: 'new' } });
  });
  it('makes a percent off that never ends', async () => {
    const { s, create } = fakeStripe();
    await createPromo(s, promo);
    expect(create).toHaveBeenCalledWith({ id: 'SPRING10', name: 'SPRING10', percent_off: 10, duration: 'forever', metadata: { bohdiai_promo: 'everyone' } });
  });
  it('ends a code', async () => {
    const { s, del } = fakeStripe();
    await endPromo(s, 'SPRING10');
    expect(del).toHaveBeenCalledWith('SPRING10');
  });
  it('lists only our codes, with their uses', async () => {
    const { s } = fakeStripe(coupon({ redeem_by: 1798761600, metadata: { bohdiai_promo: 'new' } }));
    const { db } = fakeDb({ plan_promo_uses: { data: [{ code: 'SPRING10' }, { code: 'SPRING10' }, { code: 'OTHER' }], error: null } });
    expect(await listPromos(s, db)).toEqual([{ ...promo, audience: 'new', expires: '2027-01-01T00:00:00.000Z', uses: 2 }]);
  });
  it('says so when the uses can’t be read', async () => {
    await expect(listPromos(fakeStripe(coupon()).s, fakeDb({ plan_promo_uses: { error: { message: 'down' } } }).db)).rejects.toThrow('down');
  });
});

describe('invite codes', () => {
  const who = { name: 'Lena', email: 'lena@example.com', business: 'Saltmarsh', plan: 'full' as const, note: 'Hi' };
  const meta = { bohdiai_promo: 'new', invite_name: 'Lena', invite_email: 'lena@example.com', invite_business: 'Saltmarsh', invite_plan: 'full', invite_note: 'Hi' };

  it('makes a one-use code nobody could guess', async () => {
    const { s, create } = fakeStripe();
    const code = await createInviteCode(s, who, { percent: 100, months: 3 });
    expect(code.code).toMatch(/^INVITE-[0-9A-F]{12}$/);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ id: code.code, percent_off: 100, duration_in_months: 3, max_redemptions: 1, metadata: meta }));
  });
  it('keeps invite codes off the Promotions list, and lists the open ones as invites', async () => {
    const invite = coupon({ id: 'INVITE-A', metadata: meta });
    const { s } = fakeStripe(invite);
    const { db } = fakeDb();
    expect(await listPromos(s, db)).toEqual([]);
    expect(await findInviteCodes(s, db)).toEqual([{ code: 'INVITE-A', percent: 10, months: null, ...who }]);
  });
  it('fills in what a code left blank', async () => {
    const { s } = fakeStripe(coupon({ id: 'INVITE-A', metadata: { bohdiai_promo: 'new', invite_email: 'a@example.com', invite_plan: 'lite' } }));
    expect(await findInviteCodes(s, fakeDb().db)).toMatchObject([{ name: '', business: '', note: '', plan: 'lite' }]);
  });
  it('drops an invite once it’s used, ended, or isn’t one', async () => {
    const used = fakeDb({ plan_promo_uses: { data: [{ code: 'INVITE-A' }], error: null } }).db;
    expect(await findInviteCodes(fakeStripe(coupon({ id: 'INVITE-A', metadata: meta })).s, used)).toEqual([]);
    expect(await findInviteCodes(fakeStripe(coupon({ id: 'INVITE-A', metadata: meta, valid: false })).s, fakeDb().db)).toEqual([]);
    expect(await findInviteCodes(fakeStripe(coupon()).s, fakeDb().db)).toEqual([]);
    expect(await findInviteCodes(fakeStripe(coupon({ metadata: { ...meta, invite_plan: 'nope' } })).s, fakeDb().db)).toEqual([]);
  });
});

describe('checkPromo', () => {
  const ask = { code: 'SPRING10', email: 'a@example.com', tenantId: 't1', isNew: false };

  it('lets a good code through', async () => {
    expect(await checkPromo(fakeStripe(coupon()).s, fakeDb().db, ask)).toEqual({ ok: true, promo });
  });
  it('turns away a code that doesn’t exist, or isn’t the right shape', async () => {
    expect(await checkPromo(fakeStripe().s, fakeDb().db, ask)).toEqual({ ok: false, why: 'unknown' });
    expect(await checkPromo(fakeStripe(coupon()).s, fakeDb().db, { ...ask, code: 'a b' })).toEqual({ ok: false, why: 'unknown' });
  });
  it('turns away a coupon that isn’t one of our codes', async () => {
    expect(await checkPromo(fakeStripe(coupon({ metadata: {} })).s, fakeDb().db, ask)).toEqual({ ok: false, why: 'unknown' });
    expect(await checkPromo(fakeStripe(coupon({ percent_off: null })).s, fakeDb().db, ask)).toEqual({ ok: false, why: 'unknown' });
  });
  it('turns away an ended code', async () => {
    expect(await checkPromo(fakeStripe(coupon({ valid: false })).s, fakeDb().db, ask)).toEqual({ ok: false, why: 'unknown' });
  });
  it('keeps a new-sign-ups code from an existing maker, not a new one', async () => {
    const s = fakeStripe(coupon({ metadata: { bohdiai_promo: 'new' } })).s;
    expect(await checkPromo(s, fakeDb().db, ask)).toEqual({ ok: false, why: 'newOnly' });
    expect((await checkPromo(s, fakeDb().db, { ...ask, isNew: true, tenantId: null })).ok).toBe(true);
  });
  it('allows a maker one use, ever', async () => {
    const db = fakeDb({ plan_promo_uses: { data: [{ id: 'r' }], error: null } }).db;
    expect(await checkPromo(fakeStripe(coupon()).s, db, ask)).toEqual({ ok: false, why: 'used' });
    expect(await checkPromo(fakeStripe(coupon()).s, db, { ...ask, tenantId: null })).toEqual({ ok: false, why: 'used' });
  });
  it('stops a code at its total uses', async () => {
    const calls: Result[] = [{ data: [], error: null }, { data: [], error: null }, { data: [{ code: 'SPRING10' }], error: null }];
    const from = (): unknown => {
      const result = calls.shift();
      const step: unknown = new Proxy({}, { get: (_t, key) => (key === 'then' ? (done: (r: unknown) => void) => done(result) : () => step) });
      return step;
    };
    const db = { from } as unknown as SupabaseClient<Database>;
    expect(await checkPromo(fakeStripe(coupon({ max_redemptions: 1 })).s, db, ask)).toEqual({ ok: false, why: 'unknown' });
  });
  it('lets a real failure show', async () => {
    await expect(checkPromo(fakeStripe(new Error('stripe down')).s, fakeDb().db, ask)).rejects.toThrow('stripe down');
    await expect(checkPromo(fakeStripe(coupon()).s, fakeDb({ plan_promo_uses: { error: { message: 'down' } } }).db, ask)).rejects.toThrow('down');
  });
});

describe('holding a code', () => {
  it('says who got there first', async () => {
    expect(await claimPromo(fakeDb().db, 'X', 't1', 'a@example.com')).toBe(true);
    expect(await claimPromo(fakeDb({ plan_promo_uses: { error: { code: '23505', message: 'dup' } } }).db, 'X', 't1', 'a@example.com')).toBe(false);
    await expect(claimPromo(fakeDb({ plan_promo_uses: { error: { code: '500', message: 'down' } } }).db, 'X', 't1', 'a@example.com')).rejects.toThrow('down');
  });
  it('lets a held code go', async () => {
    const { db, writes } = fakeDb();
    await releasePromo(db, 'X', 't1');
    expect(writes).toEqual([{ table: 'plan_promo_uses', op: 'delete', value: undefined }]);
    await expect(releasePromo(fakeDb({ plan_promo_uses: { error: { message: 'down' } } }).db, 'X', 't1')).rejects.toThrow('down');
  });
});

describe('applyDiscount', () => {
  it('puts a code’s coupon on a monthly plan', async () => {
    const { s, update, create } = fakeStripe();
    const { db, writes } = fakeDb();
    await applyDiscount(s, db, monthly, { percent: 100, months: 3 }, NOW, 'WELCOME');
    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith('sub_1', { discounts: [{ coupon: 'WELCOME' }] });
    expect(writes[0]?.value).toEqual({ discount_label: '3 months free', discount_percent: 100, discount_ends_at: '2027-02-04T00:00:00.000Z' });
  });
  it('makes a coupon for a discount given directly', async () => {
    const { s, update, create } = fakeStripe();
    const { db, writes } = fakeDb();
    await applyDiscount(s, db, monthly, { percent: 10, months: null }, NOW);
    expect(create).toHaveBeenCalledWith({ name: '10% off', percent_off: 10, duration: 'forever' });
    expect(update).toHaveBeenCalledWith('sub_1', { discounts: [{ coupon: 'made' }] });
    expect(writes[0]?.value).toEqual({ discount_label: '10% off', discount_percent: 10, discount_ends_at: null });
  });
  it('gives months on a yearly plan as credit toward the renewal', async () => {
    const { s, update, createBalanceTransaction } = fakeStripe();
    const { db, writes } = fakeDb();
    await applyDiscount(s, db, yearly, { percent: 100, months: 3 }, NOW);
    expect(createBalanceTransaction).toHaveBeenCalledWith('cus_1', { amount: -6250, currency: 'usd', description: '3 months free' });
    expect(update).not.toHaveBeenCalled();
    expect(writes[0]?.value).toEqual({ discount_label: '3 months free', discount_percent: 0, discount_ends_at: yearly.periodEnd });
  });
  it('takes a running discount off before crediting a yearly plan', async () => {
    const { s, update } = fakeStripe();
    await applyDiscount(s, fakeDb().db, { ...yearly, discountLabel: '10% off' }, { percent: 100, months: 3 }, NOW);
    expect(update).toHaveBeenCalledWith('sub_1', { discounts: '' });
  });
  it('runs a percent off for good on a yearly plan as a coupon', async () => {
    const { s, update, createBalanceTransaction } = fakeStripe();
    await applyDiscount(s, fakeDb().db, yearly, { percent: 10, months: null }, NOW, 'SPRING10');
    expect(createBalanceTransaction).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith('sub_1', { discounts: [{ coupon: 'SPRING10' }] });
  });
  it('says so when the record can’t be saved', async () => {
    await expect(applyDiscount(fakeStripe().s, fakeDb({ subscriptions: { error: { message: 'down' } } }).db, monthly, promo, NOW, 'X')).rejects.toThrow('down');
  });
});

describe('clearDiscount', () => {
  it('takes the discount off in Stripe and on the record', async () => {
    const { s, update } = fakeStripe();
    const { db, writes } = fakeDb();
    await clearDiscount(s, db, monthly);
    expect(update).toHaveBeenCalledWith('sub_1', { discounts: '' });
    expect(writes[0]?.value).toEqual({ discount_label: null, discount_percent: null, discount_ends_at: null });
  });
});

describe('a code at sign-up', () => {
  it('uses the code’s own coupon when it can run', async () => {
    expect(await checkoutCoupon(fakeStripe().s, { ...promo, months: 3 }, 'month', 2500)).toBe('SPRING10');
    expect(await checkoutCoupon(fakeStripe().s, promo, 'year', 25000)).toBe('SPRING10');
  });
  it('takes months off a yearly first bill as money, once', async () => {
    const { s, create } = fakeStripe();
    expect(await checkoutCoupon(s, { ...promo, percent: 100, months: 3 }, 'year', 25000)).toBe('made');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ amount_off: 6250, currency: 'usd', duration: 'once', max_redemptions: 1 }));
  });
  const paid = { stripeId: 'sub_1', code: 'SPRING10', tenantId: 't1', email: 'a@example.com', now: NOW };
  it('notes the use and what’s running', async () => {
    const { db, writes } = fakeDb();
    await recordSignupPromo(db, { ...paid, discount: { percent: 100, months: 3 }, interval: 'month' });
    expect(writes).toEqual([
      { table: 'plan_promo_uses', op: 'insert', value: { code: 'SPRING10', tenant_id: 't1', email: 'a@example.com' } },
      { table: 'subscriptions', op: 'update', value: { discount_label: '3 months free', discount_percent: 100, discount_ends_at: '2027-02-04T00:00:00.000Z' } },
    ]);
  });
  it('records a percent off for good with no end', async () => {
    const { db, writes } = fakeDb();
    await recordSignupPromo(db, { ...paid, discount: { percent: 10, months: null }, interval: 'month' });
    expect(writes[1]?.value).toMatchObject({ discount_ends_at: null });
  });
  it('has nothing running after money off a yearly first bill', async () => {
    const { db, writes } = fakeDb();
    await recordSignupPromo(db, { ...paid, discount: { percent: 100, months: 3 }, interval: 'year' });
    expect(writes.map((w) => w.table)).toEqual(['plan_promo_uses']);
  });
});
