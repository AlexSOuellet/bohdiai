import { describe, it, expect } from 'vitest';
import { PLANS } from '@/lib/site/plans';
import { includesLead, isSitePlan, moveUpMailto, planView } from './plan';
import { loadPlanState } from './queries';

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

type Row = {
  plan: string | null;
  plan_billing: string | null;
  plan_renews_on: string | null;
  plan_next: string | null;
  plan_next_billing: string | null;
  plan_credit_cents: number;
  time_zone: string | null;
};
type Result = { data: Row | null; error: { message: string } | null };
function fakeDb(result: Result) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: () => Promise.resolve(result),
  };
  return { from: () => chain } as unknown as Parameters<typeof loadPlanState>[0];
}
const row = (over: Partial<Row> = {}): Row => ({
  plan: 'lite',
  plan_billing: 'yearly',
  plan_renews_on: '2027-04-09',
  plan_next: 'showcase',
  plan_next_billing: 'monthly',
  plan_credit_cents: 250,
  time_zone: 'America/New_York',
  ...over,
});

describe('loading the plan', () => {
  it('reads the plan, billing, renewal, waiting downgrade, credit and the shop’s today', async () => {
    const state = await loadPlanState(fakeDb({ data: row(), error: null }), 't');
    expect(state).toMatchObject({
      plan: 'lite',
      billing: 'yearly',
      renewsOn: '2027-04-09',
      next: 'showcase',
      nextBilling: 'monthly',
      creditCents: 250,
    });
    expect(state?.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('reads a plan with no billing yet as monthly, renewing a month out', async () => {
    const state = await loadPlanState(
      fakeDb({
        data: row({
          plan_billing: null,
          plan_renews_on: null,
          plan_next: 'pro',
          plan_next_billing: 'weekly',
        }),
        error: null,
      }),
      't',
    );
    expect(state?.billing).toBe('monthly');
    expect(state?.renewsOn).not.toBe('');
    expect(state?.next).toBeNull();
    expect(state?.nextBilling).toBeNull();
  });

  it('returns null for no plan, an unknown plan, or no site', async () => {
    expect(await loadPlanState(fakeDb({ data: row({ plan: null }), error: null }), 't')).toBeNull();
    expect(
      await loadPlanState(fakeDb({ data: row({ plan: 'pro' }), error: null }), 't'),
    ).toBeNull();
    expect(await loadPlanState(fakeDb({ data: null, error: null }), 't')).toBeNull();
  });

  it('says so when the read fails', async () => {
    await expect(
      loadPlanState(fakeDb({ data: null, error: { message: 'down' } }), 't'),
    ).rejects.toThrow('Could not load your plan: down');
  });
});
