import { describe, it, expect } from 'vitest';
import { EMPTY_PAY } from '@/lib/market/pay';
import { payStep, sellMethods, sellTotal, sellTotalCents } from './sell';

const pieces = [
  { id: 'a', name: 'Carol star', priceCents: 1800, price: '$18' },
  { id: 'b', name: 'Old Saint Nick', priceCents: 2200, price: '$22' },
];
const pay = { ...EMPTY_PAY, venmo: 'lena-b', venmoOn: true, cashapp: 'lenab', cashappOn: true, zelle: 'lena@example.com', zelleOn: true, cashOn: true };

describe('selling at the table', () => {
  it('adds up what she tapped', () => {
    expect(sellTotalCents(pieces, ['a', 'b'])).toBe(4000);
    expect(sellTotal(pieces, ['a'])).toBe('$18');
    expect(sellTotalCents(pieces, ['gone'])).toBe(0);
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
