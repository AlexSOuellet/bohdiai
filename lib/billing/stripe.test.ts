import { describe, it, expect } from 'vitest';
import { billingFor, lookupKey, stripe, stripePlans } from './stripe';
import { plansFor } from '@/lib/site/plans';

describe('stripePlans', () => {
  it('has Free at $0 and every maker plan monthly and yearly, at the prices bohdiai.com shows', () => {
    const plans = stripePlans();
    expect(plans[0]).toMatchObject({ plan: 'free', billing: 'monthly', cents: 0, lookupKey: 'bohdiai_free_monthly' });
    for (const p of plansFor('maker')) {
      expect(plans).toContainEqual(expect.objectContaining({ plan: p.tier, billing: 'monthly', cents: p.monthly * 100, name: p.name }));
      expect(plans).toContainEqual(expect.objectContaining({ plan: p.tier, billing: 'yearly', cents: p.yearly * 100, name: p.name }));
    }
    expect(plans).toHaveLength(1 + plansFor('maker').length * 2);
  });
});

describe('lookupKey', () => {
  it('names a plan and how it is paid', () => {
    expect(lookupKey('lite', 'yearly')).toBe('bohdiai_lite_yearly');
  });

  it('has Free monthly whatever was picked', () => {
    expect(billingFor('free', 'yearly')).toBe('monthly');
    expect(lookupKey('free', 'yearly')).toBe('bohdiai_free_monthly');
  });
});

describe('stripe', () => {
  it('refuses to start without a key', () => {
    expect(() => stripe('')).toThrow(/STRIPE_SECRET_KEY/);
  });
});
