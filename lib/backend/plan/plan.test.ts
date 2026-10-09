import { describe, it, expect } from 'vitest';
import { PLANS } from '@/lib/site/plans';
import { includesLead, isSitePlan, moveUpMailto, planView } from './plan';
import { loadSitePlan } from './queries';

describe('Your plan', () => {
  it('knows the three maker plans and nothing else', () => {
    expect(isSitePlan('showcase')).toBe(true);
    expect(isSitePlan('full')).toBe(true);
    expect(isSitePlan('pro')).toBe(false);
    expect(isSitePlan(null)).toBe(false);
  });

  it('shows Showcase with Lite and Full above it, straight from the pricing list', () => {
    const view = planView('showcase');
    expect(view.current).toBe(PLANS.find((p) => p.id === 'maker-showcase'));
    expect(view.above.map((p) => p.id)).toEqual(['maker-lite', 'maker-full']);
  });

  it('shows only Full above Lite, and nothing above Full', () => {
    expect(planView('lite').above.map((p) => p.id)).toEqual(['maker-full']);
    expect(planView('full').above).toEqual([]);
  });

  it('opens Full’s list with Lite and leaves the others alone', () => {
    expect(includesLead(planView('full').current)).toBe('Everything in Lite, plus');
    expect(includesLead(planView('lite').current)).toBeNull();
  });

  it('writes the move-up email with the shop and plan in the subject', () => {
    const url = moveUpMailto('alex@bohdiai.com', 'Saltmarsh & Lace', planView('lite').current);
    expect(url.startsWith('mailto:alex@bohdiai.com?subject=')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('subject')).toBe('Upgrade Saltmarsh & Lace to Maker Lite');
    expect(params.get('body')).toContain('Saltmarsh & Lace');
  });
});

type Result = { data: { plan: string | null } | null; error: { message: string } | null };
function fakeDb(result: Result) {
  const chain = { select: () => chain, eq: () => chain, maybeSingle: () => Promise.resolve(result) };
  return { from: () => chain } as unknown as Parameters<typeof loadSitePlan>[0];
}

describe('loading the plan', () => {
  it('returns the stored plan', async () => {
    expect(await loadSitePlan(fakeDb({ data: { plan: 'lite' }, error: null }), 't')).toBe('lite');
  });

  it('returns null for no plan, an unknown plan, or no site', async () => {
    expect(await loadSitePlan(fakeDb({ data: { plan: null }, error: null }), 't')).toBeNull();
    expect(await loadSitePlan(fakeDb({ data: { plan: 'pro' }, error: null }), 't')).toBeNull();
    expect(await loadSitePlan(fakeDb({ data: null, error: null }), 't')).toBeNull();
  });

  it('says so when the read fails', async () => {
    await expect(loadSitePlan(fakeDb({ data: null, error: { message: 'down' } }), 't')).rejects.toThrow('Could not load your plan: down');
  });
});
