import { describe, it, expect } from 'vitest';
import { isFreeSite } from './free';
import { isFreePlan } from './plan';
import { planFeatureRows } from './plan-features';

const db = (answer: { data: unknown; error: unknown }) =>
  ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => answer }) }) }) }) as never;

describe('Free (Alex, 2026-10-24)', () => {
  it('is its own plan, below Showcase', () => {
    expect(isFreePlan('free')).toBe(true);
    expect(isFreePlan('showcase')).toBe(false);
    expect(isFreePlan(null)).toBe(false);
  });

  it('turns on products and the schedule with its costs, and none of the site screens', () => {
    const on = planFeatureRows('free').filter((r) => r.enabled).map((r) => r.feature_key);
    expect(on.sort()).toEqual(['catalog', 'market_dates', 'market_records']);
    expect(planFeatureRows('free').find((r) => r.feature_key === 'profile')?.enabled).toBe(false);
  });

  it('reads whether a site is on it', async () => {
    expect(await isFreeSite(db({ data: { plan: 'free' }, error: null }), 't1')).toBe(true);
    expect(await isFreeSite(db({ data: { plan: 'lite' }, error: null }), 't1')).toBe(false);
    expect(await isFreeSite(db({ data: null, error: null }), 't1')).toBe(false);
    await expect(isFreeSite(db({ data: null, error: { message: 'down' } }), 't1')).rejects.toThrow('Could not load the plan: down');
  });
});
