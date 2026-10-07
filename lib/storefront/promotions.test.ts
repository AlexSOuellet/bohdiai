import { describe, it, expect } from 'vitest';
import { bestDiscount, checkCode, isRunning, normalizeCode, runningSale, salePriceCents, shopToday, withSale, type Promotion } from './promotions';

const promo = (over: Partial<Promotion> = {}): Promotion => ({
  id: 'p1',
  kind: 'code',
  name: 'MARKET10',
  code: 'MARKET10',
  percentOff: 10,
  amountOffCents: null,
  startsOn: null,
  endsOn: null,
  maxUses: null,
  uses: 0,
  active: true,
  ...over,
});
const sale = (pct: number, over: Partial<Promotion> = {}): Promotion =>
  promo({ id: `s${pct}`, kind: 'sale', name: 'Fall Sale', code: null, percentOff: pct, ...over });

describe('days', () => {
  it('runs between its first and last day, inclusive, and not when paused', () => {
    const p = promo({ startsOn: '2026-10-10', endsOn: '2026-10-12' });
    expect(isRunning(p, '2026-10-09')).toBe(false);
    expect(isRunning(p, '2026-10-10')).toBe(true);
    expect(isRunning(p, '2026-10-12')).toBe(true);
    expect(isRunning(p, '2026-10-13')).toBe(false);
    expect(isRunning({ ...p, active: false }, '2026-10-11')).toBe(false);
  });
  it('reads today in the shop’s own time zone', () => {
    // 2am UTC on the 8th is still the 7th in Rhode Island.
    expect(shopToday('America/New_York', new Date('2026-10-08T02:00:00Z'))).toBe('2026-10-07');
    expect(shopToday('Not/AZone', new Date('2026-10-08T02:00:00Z'))).toBe('2026-10-07');
  });
});

describe('runningSale', () => {
  it('picks the biggest running sale and ignores codes', () => {
    expect(runningSale([sale(10), sale(20), promo({ percentOff: 50 })], '2026-10-07')?.percentOff).toBe(20);
    expect(runningSale([sale(20, { active: false })], '2026-10-07')).toBeNull();
  });
});

describe('checkCode', () => {
  it('takes a code typed loosely', () => {
    expect(normalizeCode(' market 10 ')).toBe('MARKET10');
    expect(checkCode([promo()], 'market10', '2026-10-07')).toEqual({ ok: true, promo: promo() });
  });
  it('says why a code does not work', () => {
    expect(checkCode([promo()], 'NOPE', '2026-10-07')).toEqual({ ok: false, error: 'That code isn’t valid.' });
    expect(checkCode([promo({ endsOn: '2026-10-01' })], 'MARKET10', '2026-10-07')).toEqual({ ok: false, error: 'That code has ended.' });
    expect(checkCode([promo({ maxUses: 5, uses: 5 })], 'MARKET10', '2026-10-07')).toEqual({ ok: false, error: 'That code has been used up.' });
    expect(checkCode([promo({ active: false })], 'MARKET10', '2026-10-07').ok).toBe(false);
  });
});

describe('bestDiscount', () => {
  const lines = [12000, 9999];
  it('takes a percent code off the order', () => {
    expect(bestDiscount(lines, null, promo())).toEqual({ cents: 2200, label: 'MARKET10', promotionId: 'p1', source: 'code' });
  });
  it('takes a dollar code off, never past the total', () => {
    expect(bestDiscount([1000], null, promo({ percentOff: null, amountOffCents: 1500 }))?.cents).toBe(1000);
  });
  it('gives whichever of sale and code saves more, never both', () => {
    expect(bestDiscount(lines, sale(20), promo())?.source).toBe('sale');
    expect(bestDiscount(lines, sale(5), promo())?.source).toBe('code');
  });
  it('is nothing when nothing applies', () => {
    expect(bestDiscount(lines, null, null)).toBeNull();
  });
});

describe('sale prices', () => {
  it('rounds to the cent', () => {
    expect(salePriceCents(9999, 15)).toBe(8499);
  });
  it('dresses priced products with their sale price', () => {
    const out = withSale([{ priceCents: 12000 }, { priceCents: 0 }, {}], { percentOff: 25 });
    expect(out.map((p) => ('salePrice' in p ? p.salePrice : undefined))).toEqual(['$90', undefined, undefined]);
    expect(withSale([{ priceCents: 12000 }], null)).toEqual([{ priceCents: 12000 }]);
  });
});
