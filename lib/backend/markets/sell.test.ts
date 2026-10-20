import { describe, it, expect } from 'vitest';
import { EMPTY_PAY } from '@/lib/market/pay';
import { addOne, payStep, pickedCount, sellMethods, sellTotal, sellTotalCents, takeOne } from './sell';

const pieces = [
  { id: 'a', listingId: 'a', variantId: null, name: 'Carol star', priceCents: 1800, price: '$18', left: null },
  { id: 'b', listingId: 'b', variantId: null, name: 'Old Saint Nick', priceCents: 2200, price: '$22', left: null },
];
const pay = { ...EMPTY_PAY, venmo: 'lena-b', venmoOn: true, cashapp: 'lenab', cashappOn: true, zelle: 'lena@example.com', zelleOn: true, cashOn: true };

describe('selling at the table', () => {
  it('adds up what she tapped', () => {
    expect(sellTotalCents(pieces, { a: 1, b: 1 })).toBe(4000);
    expect(sellTotalCents(pieces, { a: 3 })).toBe(5400);
    expect(sellTotal(pieces, { a: 1 })).toBe('$18');
    expect(sellTotalCents(pieces, { gone: 2 })).toBe(0);
  });

  it('adds one at a time, never past what’s left at the market, and takes one off', () => {
    const counted = { ...pieces[0]!, left: 2 };
    let picked = addOne({}, counted);
    picked = addOne(picked, counted);
    expect(addOne(picked, counted)).toBe(picked);
    expect(picked).toEqual({ a: 2 });
    expect(addOne({ a: 7 }, pieces[0]!)).toEqual({ a: 8 });
    expect(takeOne({ a: 2 }, 'a')).toEqual({ a: 1 });
    expect(takeOne({ a: 1, b: 1 }, 'a')).toEqual({ b: 1 });
    expect(takeOne({}, 'a')).toEqual({});
    expect(pickedCount({ a: 2, b: 1 })).toBe(3);
  });

  it('offers only the ways she takes payment, in order', () => {
    expect(sellMethods(pay)).toEqual(['venmo', 'cashapp', 'zelle', 'cash']);
    expect(sellMethods({ ...EMPTY_PAY, venmoOn: true, venmo: '' })).toEqual(['cash']);
    expect(sellMethods({ ...EMPTY_PAY, cashOn: false })).toEqual([]);
  });

  it('shows a QR with the amount for Venmo and Cash App, her address for Zelle, the sum for cash', () => {
    const venmo = payStep('venmo', pay, 4000, 'Saltmarsh & Lace');
    expect(venmo).toMatchObject({ kind: 'qr', label: 'Scan to pay $40 with Venmo' });
    expect(venmo.kind === 'qr' && venmo.url).toContain('amount=40');
    const cashapp = payStep('cashapp', pay, 1850, '');
    expect(cashapp.kind === 'qr' && cashapp.url).toBe('https://cash.app/$lenab/18.50');
    expect(payStep('zelle', pay, 4000, '')).toEqual({ kind: 'text', label: 'Zelle $40 to', text: 'lena@example.com' });
    expect(payStep('cash', pay, 4000, '')).toEqual({ kind: 'cash', label: 'Take $40 in cash' });
  });
});
