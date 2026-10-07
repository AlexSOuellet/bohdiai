import { describe, it, expect } from 'vitest';
import { EMPTY_PROMO, buildPromoRow, promoFormFrom, promoState } from './promo-form';
import type { Promotion } from '@/lib/storefront/promotions';

describe('buildPromoRow', () => {
  it('builds a code, upper-case, named after itself', () => {
    expect(buildPromoRow({ ...EMPTY_PROMO, code: 'market10', amount: '10', maxUses: '25' })).toEqual({
      ok: true,
      row: { kind: 'code', name: 'MARKET10', code: 'MARKET10', percent_off: 10, amount_off_cents: null, starts_on: null, ends_on: null, max_uses: 25 },
    });
  });
  it('builds a dollar code', () => {
    expect(buildPromoRow({ ...EMPTY_PROMO, code: 'TENOFF', amountType: 'dollars', amount: '12.50' })).toMatchObject({
      ok: true,
      row: { percent_off: null, amount_off_cents: 1250 },
    });
  });
  it('builds a sale: always a percent, no code, no use limit', () => {
    expect(buildPromoRow({ ...EMPTY_PROMO, kind: 'sale', name: 'Fall Sale', amountType: 'dollars', amount: '20', maxUses: '5', startsOn: '2026-10-10', endsOn: '2026-10-31' })).toEqual({
      ok: true,
      row: { kind: 'sale', name: 'Fall Sale', code: null, percent_off: 20, amount_off_cents: null, starts_on: '2026-10-10', ends_on: '2026-10-31', max_uses: null },
    });
  });
  it('says what is wrong', () => {
    expect(buildPromoRow({ ...EMPTY_PROMO, code: 'X', amount: '10' }).ok).toBe(false);
    expect(buildPromoRow({ ...EMPTY_PROMO, kind: 'sale', amount: '10' })).toEqual({ ok: false, error: 'Give the sale a name shoppers will see, like Fall Sale.' });
    expect(buildPromoRow({ ...EMPTY_PROMO, code: 'OK10', amount: '95' }).ok).toBe(false);
    expect(buildPromoRow({ ...EMPTY_PROMO, code: 'OK10', amountType: 'dollars', amount: '0.50' }).ok).toBe(false);
    expect(buildPromoRow({ ...EMPTY_PROMO, code: 'OK10', amount: '10', startsOn: '2026-10-10', endsOn: '2026-10-01' }).ok).toBe(false);
    expect(buildPromoRow({ ...EMPTY_PROMO, code: 'OK10', amount: '10', maxUses: 'lots' }).ok).toBe(false);
  });
});

const saved = (over: Partial<Promotion> = {}): Promotion => ({
  id: 'p1', kind: 'code', name: 'TENOFF', code: 'TENOFF', percentOff: null, amountOffCents: 1250, startsOn: null, endsOn: '2026-10-31', maxUses: 3, uses: 1, active: true, ...over,
});

describe('promoFormFrom', () => {
  it('round-trips a saved code', () => {
    const form = promoFormFrom(saved());
    expect(form).toEqual({ kind: 'code', name: '', code: 'TENOFF', amountType: 'dollars', amount: '12.50', startsOn: '', endsOn: '2026-10-31', maxUses: '3' });
    expect(buildPromoRow(form)).toMatchObject({ ok: true, row: { amount_off_cents: 1250, max_uses: 3 } });
  });
});

describe('promoState', () => {
  it('names where a promotion stands today', () => {
    expect(promoState(saved(), '2026-10-07')).toBe('running');
    expect(promoState(saved({ active: false }), '2026-10-07')).toBe('paused');
    expect(promoState(saved({ startsOn: '2026-10-20' }), '2026-10-07')).toBe('scheduled');
    expect(promoState(saved(), '2026-11-01')).toBe('ended');
    expect(promoState(saved({ uses: 3 }), '2026-10-07')).toBe('used-up');
  });
});
