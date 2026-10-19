import { describe, expect, it } from 'vitest';
import { billingView } from './billing-view';

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
