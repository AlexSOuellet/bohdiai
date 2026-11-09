import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import { changeAtRenewal, changeNow, dropAtRenewal, findPrice, planOfKey, previewNow, quoteFromPreview, whenChange } from './plan-change';
import { SITE_PLANS } from '@/lib/backend/plan/plan';

const price = (id: string, cents: number, interval: 'month' | 'year' = 'month') => ({ id, unit_amount: cents, recurring: { interval } }) as unknown as Stripe.Price;

function subscription(over: Record<string, unknown> = {}) {
  return {
    id: 'sub_1',
    customer: 'cus_1',
    schedule: null,
    discounts: [],
    metadata: { tenant_id: 't1', plan: 'lite', billing: 'monthly' },
    items: { data: [{ id: 'si_1', price: price('price_lite_m', 1500), current_period_start: 1000, current_period_end: 2000 }] },
    ...over,
  };
}

function fakeStripe(sub: Record<string, unknown> = subscription(), opts: { updateThrows?: unknown; phase?: { start_date: number; end_date: number } | null } = {}) {
  const calls: string[] = [];
  const s = {
    prices: { list: vi.fn(async () => ({ data: [price('price_full_m', 2500)] })) },
    subscriptions: {
      retrieve: vi.fn(async () => sub),
      update: vi.fn(async (_id: string, params: unknown) => {
        calls.push('update');
        if (opts.updateThrows !== undefined) throw opts.updateThrows;
        return { ...sub, changed: params };
      }),
    },
    subscriptionSchedules: {
      create: vi.fn(async () => {
        calls.push('create');
        return { id: 'sched_new' };
      }),
      retrieve: vi.fn(async () => ({ current_phase: opts.phase === undefined ? { start_date: 1000, end_date: 2000 } : opts.phase })),
      update: vi.fn(async () => {
        calls.push('schedule-update');
        return {};
      }),
      release: vi.fn(async () => {
        calls.push('release');
        return {};
      }),
    },
    invoices: { createPreview: vi.fn(async () => ({ amount_due: 700 })) },
  };
  return { s: s as unknown as Stripe, raw: s, calls };
}

describe('planOfKey', () => {
  it('reads the plan and billing back from a price’s lookup key', () => {
    expect(planOfKey('bohdiai_full_yearly')).toEqual({ plan: 'full', billing: 'yearly' });
    expect(planOfKey('bohdiai_free_monthly')).toEqual({ plan: 'free', billing: 'monthly' });
    expect(planOfKey('bohdiai_lite_monthly')).toEqual({ plan: 'lite', billing: 'monthly' });
  });
  it('knows nothing of any other price', () => {
    expect(planOfKey(null)).toBeNull();
    expect(planOfKey(undefined)).toBeNull();
    expect(planOfKey('bohdiai_gold_monthly')).toBeNull();
    expect(planOfKey('other_full_monthly')).toBeNull();
    expect(planOfKey('bohdiai_full_weekly')).toBeNull();
  });
});

describe('findPrice', () => {
  it('finds the live price by its lookup key', async () => {
    const { s, raw } = fakeStripe();
    expect((await findPrice(s, 'full', 'monthly')).id).toBe('price_full_m');
    expect(raw.prices.list).toHaveBeenCalledWith({ lookup_keys: ['bohdiai_full_monthly'], active: true, limit: 1 });
  });
  it('says which price is missing', async () => {
    const { s, raw } = fakeStripe();
    raw.prices.list.mockResolvedValueOnce({ data: [] });
    await expect(findPrice(s, 'lite', 'yearly')).rejects.toThrow('Stripe has no price bohdiai_lite_yearly');
  });
});

describe('previewNow', () => {
  it('asks Stripe what the change charges today, for the rest of the period', async () => {
    const { s, raw } = fakeStripe();
    expect(await previewNow(s, 'sub_1', price('price_full_m', 2500))).toEqual({ amount_due: 700 });
    expect(raw.invoices.createPreview).toHaveBeenCalledWith({
      customer: 'cus_1',
      subscription: 'sub_1',
      subscription_details: { items: [{ id: 'si_1', price: 'price_full_m' }], proration_behavior: 'always_invoice', billing_cycle_anchor: { type: 'unchanged' } },
    });
  });
  it('starts a new period today when leaving the $0 plan', async () => {
    const { s, raw } = fakeStripe(subscription({ customer: { id: 'cus_2' }, items: { data: [{ id: 'si_0', price: price('price_free', 0), current_period_start: 1, current_period_end: 2 }] } }));
    await previewNow(s, 'sub_1', price('price_showcase_m', 500));
    expect(raw.invoices.createPreview).toHaveBeenCalledWith(expect.objectContaining({ customer: 'cus_2', subscription_details: expect.objectContaining({ billing_cycle_anchor: { type: 'now' } }) }));
  });
  it('refuses a subscription with no customer or no price', async () => {
    await expect(previewNow(fakeStripe(subscription({ customer: null })).s, 'sub_1', price('p', 1))).rejects.toThrow('has no customer');
    await expect(previewNow(fakeStripe(subscription({ items: { data: [] } })).s, 'sub_1', price('p', 1))).rejects.toThrow('has no price');
  });
});

describe('changeNow', () => {
  it('changes the price, charges now, refuses an unpaid change, and names the new plan', async () => {
    const { s, raw } = fakeStripe();
    const r = await changeNow(s, 'sub_1', price('price_full_m', 2500), { plan: 'full', billing: 'monthly' });
    expect(r.ok).toBe(true);
    expect(raw.subscriptions.update).toHaveBeenCalledWith('sub_1', {
      items: [{ id: 'si_1', price: 'price_full_m' }],
      proration_behavior: 'always_invoice',
      payment_behavior: 'error_if_incomplete',
      billing_cycle_anchor: { type: 'unchanged' },
      metadata: { tenant_id: 't1', plan: 'full', billing: 'monthly' },
    });
    expect(raw.subscriptionSchedules.release).not.toHaveBeenCalled();
  });
  it('lets go of a change waiting for renewal first', async () => {
    const { s, calls } = fakeStripe(subscription({ schedule: { id: 'sched_1' } }));
    await changeNow(s, 'sub_1', price('price_full_m', 2500), { plan: 'full', billing: 'monthly' });
    expect(calls).toEqual(['release', 'update']);
  });
  it('says the card was declined and changes nothing', async () => {
    const { s } = fakeStripe(subscription(), { updateThrows: { type: 'StripeCardError', message: 'Your card was declined.' } });
    expect(await changeNow(s, 'sub_1', price('price_full_m', 2500), { plan: 'full', billing: 'monthly' })).toEqual({ ok: false, declined: 'Your card was declined.' });
  });
  it('passes any other failure on', async () => {
    await expect(changeNow(fakeStripe(subscription(), { updateThrows: new Error('down') }).s, 'sub_1', price('p', 1), { plan: 'full', billing: 'monthly' })).rejects.toThrow('down');
    await expect(changeNow(fakeStripe(subscription(), { updateThrows: { type: 'StripeCardError' } }).s, 'sub_1', price('p', 1), { plan: 'full', billing: 'monthly' })).rejects.toEqual({ type: 'StripeCardError' });
    await expect(changeNow(fakeStripe(subscription(), { updateThrows: null }).s, 'sub_1', price('p', 1), { plan: 'full', billing: 'monthly' })).rejects.toBeNull();
  });
});

describe('changeAtRenewal', () => {
  it('keeps this period as it is, then the new price from renewal, with the discount carried over', async () => {
    const { s, raw, calls } = fakeStripe(subscription({ discounts: ['di_1', { id: 'di_2' }, null] }));
    await changeAtRenewal(s, 'sub_1', price('price_show_y', 5000, 'year'), { plan: 'showcase', billing: 'yearly' });
    expect(calls).toEqual(['create', 'schedule-update']);
    expect(raw.subscriptionSchedules.create).toHaveBeenCalledWith({ from_subscription: 'sub_1' });
    const discounts = [{ discount: 'di_1' }, { discount: 'di_2' }];
    expect(raw.subscriptionSchedules.update).toHaveBeenCalledWith('sched_new', {
      end_behavior: 'release',
      phases: [
        { items: [{ price: 'price_lite_m', quantity: 1 }], start_date: 1000, end_date: 2000, discounts, metadata: { tenant_id: 't1', plan: 'lite', billing: 'monthly' } },
        {
          items: [{ price: 'price_show_y', quantity: 1 }],
          duration: { interval: 'year', interval_count: 1 },
          proration_behavior: 'none',
          discounts,
          metadata: { tenant_id: 't1', plan: 'showcase', billing: 'yearly' },
        },
      ],
    });
  });
  it('replaces a change already waiting, on the same schedule', async () => {
    const { s, raw, calls } = fakeStripe(subscription({ schedule: 'sched_1' }));
    await changeAtRenewal(s, 'sub_1', price('price_show_m', 500), { plan: 'showcase', billing: 'monthly' });
    expect(calls).toEqual(['schedule-update']);
    expect(raw.subscriptionSchedules.update).toHaveBeenCalledWith('sched_1', expect.objectContaining({ phases: [expect.anything(), expect.objectContaining({ duration: { interval: 'month', interval_count: 1 } })] }));
  });
  it('falls back to the subscription’s own period when the schedule has no current phase', async () => {
    const { s, raw } = fakeStripe(subscription(), { phase: null });
    await changeAtRenewal(s, 'sub_1', price('price_show_m', 500), { plan: 'showcase', billing: 'monthly' });
    expect(raw.subscriptionSchedules.update).toHaveBeenCalledWith('sched_new', expect.objectContaining({ phases: [expect.objectContaining({ start_date: 1000, end_date: 2000 }), expect.anything()] }));
  });
});

describe('dropAtRenewal', () => {
  it('lets the waiting change go', async () => {
    const { s, raw } = fakeStripe(subscription({ schedule: 'sched_1' }));
    await dropAtRenewal(s, 'sub_1');
    expect(raw.subscriptionSchedules.release).toHaveBeenCalledWith('sched_1');
  });
  it('does nothing when nothing is waiting', async () => {
    const { s, raw } = fakeStripe();
    await dropAtRenewal(s, 'sub_1');
    expect(raw.subscriptionSchedules.release).not.toHaveBeenCalled();
  });
});

describe('quoteFromPreview', () => {
  const lines = (...amounts: number[]) => ({ data: amounts.map((amount) => ({ amount })) }) as unknown as Stripe.Invoice['lines'];
  const base = { from: 'lite' as const, fromBilling: 'monthly' as const, billing: 'monthly' as const, priceCents: 2500, renewsOn: '2026-11-25', today: '2026-11-10' };

  it('shows the rest of the period, the credit for the unused part and what’s due today', () => {
    const q = quoteFromPreview({ amount_due: 500, total: 500, starting_balance: 0, ending_balance: 0, lines: lines(1250, -750) }, base);
    expect(q).toMatchObject({ partCents: 1250, creditCents: 750, creditUsedCents: 750, todayCents: 500, accountCreditUsedCents: 0, creditLeftCents: 0, prorated: true, renewsOn: '2026-11-25', renewalCents: 2500 });
    expect(q.daysLeft).toBeGreaterThan(0);
  });
  it('counts credit already on the account, and credit left over', () => {
    const q = quoteFromPreview({ amount_due: 0, total: 300, starting_balance: -1000, ending_balance: -700, lines: lines(1000, -700) }, base);
    expect(q).toMatchObject({ accountCreditUsedCents: 300, todayCents: 0, creditLeftCents: 700 });
  });
  it('a change of billing starts a new period today', () => {
    const q = quoteFromPreview({ amount_due: 25000, total: 25000, starting_balance: 0, ending_balance: null, lines: lines(25000) }, { ...base, billing: 'yearly', priceCents: 25000 });
    expect(q).toMatchObject({ prorated: false, daysLeft: 0, renewsOn: '2027-11-10', creditLeftCents: 0 });
  });
  it('leaving Free starts a new period today', () => {
    const q = quoteFromPreview({ amount_due: 500, total: 500, starting_balance: 0, ending_balance: 0, lines: lines(500) }, { ...base, from: 'free', priceCents: 500 });
    expect(q).toMatchObject({ prorated: false, renewsOn: '2026-12-10' });
  });
  it('a credit bigger than the charge leaves nothing due and the rest as credit', () => {
    const q = quoteFromPreview({ amount_due: 0, total: -2000, starting_balance: 0, ending_balance: -2000, lines: lines(1000, -3000) }, { ...base, fromBilling: 'yearly', billing: 'monthly' });
    expect(q).toMatchObject({ creditUsedCents: 1000, accountCreditUsedCents: 0, todayCents: 0, creditLeftCents: 2000 });
  });
});

describe('whenChange', () => {
  const rank = (p: string) => (p === 'free' ? -1 : (SITE_PLANS as readonly string[]).indexOf(p));
  it('up, or monthly to yearly, is now', () => {
    expect(whenChange({ plan: 'showcase', billing: 'yearly' }, { plan: 'full', billing: 'monthly' }, rank)).toBe('now');
    expect(whenChange({ plan: 'free', billing: 'monthly' }, { plan: 'showcase', billing: 'monthly' }, rank)).toBe('now');
    expect(whenChange({ plan: 'lite', billing: 'monthly' }, { plan: 'lite', billing: 'yearly' }, rank)).toBe('now');
  });
  it('down, or yearly to monthly, waits for renewal', () => {
    expect(whenChange({ plan: 'full', billing: 'monthly' }, { plan: 'lite', billing: 'yearly' }, rank)).toBe('renewal');
    expect(whenChange({ plan: 'lite', billing: 'yearly' }, { plan: 'lite', billing: 'monthly' }, rank)).toBe('renewal');
  });
  it('the same plan and billing is no change', () => {
    expect(whenChange({ plan: 'lite', billing: 'monthly' }, { plan: 'lite', billing: 'monthly' }, rank)).toBe('same');
  });
});
