import { describe, expect, it } from 'vitest';
import { billingView, stripeBillingView } from './billing-view';

const terms = { plan: 'showcase' as const, billing: 'monthly' as const, renewsOn: '2026-11-19', next: null, nextBilling: null, creditCents: 0, comp: null };

describe('billingView', () => {
  it('names the next charge: amount, plan, how often, and the day', () => {
    expect(billingView(terms)).toEqual({ planName: 'Maker Showcase', how: 'monthly', amount: '$5', on: expect.stringContaining('November 19, 2026') });
  });
  it('charges for a change waiting for the renewal, less any credit', () => {
    expect(billingView({ ...terms, plan: 'full', next: 'lite', nextBilling: 'yearly', creditCents: 2000 }).amount).toBe('$130');
  });
  it('says nothing is charged on a free site', () => {
    expect(billingView({ ...terms, comp: 'free' }).amount).toBeNull();
  });
});

describe('stripeBillingView', () => {
  it('words Stripe’s next charge, the card and each past charge', () => {
    const v = stripeBillingView({
      card: { brand: 'visa', last4: '4242', expMonth: 3, expYear: 2029 },
      next: { cents: 1350, on: Date.UTC(2026, 11, 1, 12) / 1000 },
      charges: [{ id: 'in_1', on: Date.UTC(2026, 10, 1, 12) / 1000, cents: 1500, currency: 'usd', receiptUrl: 'https://invoice.stripe.com/i/1' }],
      planName: 'Maker Market',
    });
    expect(v.next).toMatch(/^\$13\.50 for Maker Market, on .*December 1, 2026\.$/);
    expect(v.card).toBe('Visa ending 4242, expires 03/2029.');
    expect(v.charges).toEqual([{ id: 'in_1', on: expect.stringContaining('November 1, 2026'), amount: '$15', receiptUrl: 'https://invoice.stripe.com/i/1' }]);
  });
  it('says when nothing more is coming, when no card is on file, and names an unknown brand plainly', () => {
    expect(stripeBillingView({ card: null, next: null, charges: [], planName: 'x' })).toEqual({ next: 'Nothing more will be charged.', card: 'No card is on file. Put one on so your plan keeps renewing.', charges: [] });
    expect(stripeBillingView({ card: { brand: 'link', last4: '0005', expMonth: 12, expYear: 2030 }, next: null, charges: [], planName: 'x' }).card).toBe('Card ending 0005, expires 12/2030.');
  });
});
