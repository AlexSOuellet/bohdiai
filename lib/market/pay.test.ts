import { describe, it, expect } from 'vitest';
import { EMPTY_PAY, buildPayRow, cashAppLink, methodsOn, paySettingsFromRow, venmoLink } from './pay';
import { marketState, payNote, payStep } from './buyer';

describe('buildPayRow', () => {
  it('saves handles without their @ or $', () => {
    expect(buildPayRow({ ...EMPTY_PAY, venmo: '@Renee-M', venmoOn: true, cashapp: '$RoseNCat', cashappOn: true, zelle: ' 401-555-0100 ', zelleOn: true })).toEqual({
      ok: true,
      row: { venmo: 'Renee-M', venmo_on: true, cashapp: 'RoseNCat', cashapp_on: true, zelle: '401-555-0100', zelle_on: true, cash_on: true },
    });
  });
  it('needs the handle before a method goes on, and a handle that looks right', () => {
    expect(buildPayRow({ ...EMPTY_PAY, venmoOn: true })).toEqual({ ok: false, error: 'Add your Venmo username to turn Venmo on.' });
    expect(buildPayRow({ ...EMPTY_PAY, cashappOn: true }).ok).toBe(false);
    expect(buildPayRow({ ...EMPTY_PAY, zelleOn: true }).ok).toBe(false);
    expect(buildPayRow({ ...EMPTY_PAY, venmo: 'renee m' }).ok).toBe(false);
    expect(buildPayRow({ ...EMPTY_PAY, cashapp: '$1abc' }).ok).toBe(false);
    expect(buildPayRow({ ...EMPTY_PAY, zelle: 'x' }).ok).toBe(false);
  });
  it('keeps a handle while its method is off', () => {
    expect(buildPayRow({ ...EMPTY_PAY, venmo: 'renee' })).toMatchObject({ ok: true, row: { venmo: 'renee', venmo_on: false } });
  });
});

describe('settings', () => {
  it('reads a saved row, or the defaults (cash only) when there is none', () => {
    expect(paySettingsFromRow(null)).toEqual(EMPTY_PAY);
    expect(paySettingsFromRow({ venmo: 'r', venmo_on: true, cashapp: null, cashapp_on: false, zelle: null, zelle_on: false, cash_on: false })).toMatchObject({ venmo: 'r', cashapp: '', cashOn: false });
  });
  it('lists the ways a buyer may pay, in order', () => {
    expect(methodsOn({ ...EMPTY_PAY, zelleOn: true, venmoOn: true })).toEqual(['venmo', 'zelle', 'cash']);
    expect(methodsOn({ ...EMPTY_PAY, cashOn: false })).toEqual([]);
  });
});

describe('payment links', () => {
  it('opens Venmo with her name, the amount and a note', () => {
    expect(venmoLink('Renee-M', 10800, 'Rose n’ Cat · Theo · #1004')).toBe(
      `https://venmo.com/Renee-M?txn=pay&amount=108&note=${encodeURIComponent('Rose n’ Cat · Theo · #1004')}`,
    );
    expect(venmoLink('r', 1250, 'x')).toContain('amount=12.50');
  });
  it('opens Cash App with her $cashtag and the amount', () => {
    expect(cashAppLink('RoseNCat', 12000)).toBe('https://cash.app/$RoseNCat/120');
  });
});

describe('payStep', () => {
  const s = { venmo: 'renee', venmoOn: true, cashapp: 'rose', cashappOn: true, zelle: 'r@x.com', zelleOn: true, cashOn: true };
  it('gives the way to pay for each method she has on', () => {
    expect(payStep(s, 'venmo', 12000, 'n')).toMatchObject({ method: 'venmo', handle: '@renee' });
    expect(payStep(s, 'cashapp', 12000, 'n')).toEqual({ method: 'cashapp', link: 'https://cash.app/$rose/120', handle: '$rose' });
    expect(payStep(s, 'zelle', 12000, 'n')).toEqual({ method: 'zelle', handle: 'r@x.com' });
    expect(payStep(s, 'cash', 12000, 'n')).toEqual({ method: 'cash' });
  });
  it('is nothing for a method she has off', () => {
    const off = { ...EMPTY_PAY, cashOn: false };
    for (const m of ['venmo', 'cashapp', 'zelle', 'cash'] as const) expect(payStep(off, m, 100, 'n')).toBeNull();
  });
  it('writes a note she can match', () => {
    expect(payNote('Rose n’ Cat', 'Theo', '1004')).toBe('Rose n’ Cat · Theo · #1004');
  });
});

describe('marketState', () => {
  const m = { date: '2026-10-10', endDate: '2026-10-12', canceled: false };
  it('takes orders only on its days', () => {
    expect(marketState(m, '2026-10-09')).toBe('before');
    expect(marketState(m, '2026-10-10')).toBe('open');
    expect(marketState(m, '2026-10-12')).toBe('open');
    expect(marketState(m, '2026-10-13')).toBe('after');
    expect(marketState({ ...m, endDate: '' }, '2026-10-11')).toBe('after');
    expect(marketState({ ...m, canceled: true }, '2026-10-11')).toBe('canceled');
  });
});
