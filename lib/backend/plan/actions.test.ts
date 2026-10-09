import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlanState } from './queries';

const state: {
  features: Set<string>;
  plan: PlanState | null;
  apply: { ok: true } | { ok: false; error: string };
  writeError: string | null;
} = {
  features: new Set(['plan', 'demo_checkout']),
  plan: null,
  apply: { ok: true },
  writeError: null,
};
const applyPlan = vi.fn(() => Promise.resolve(state.apply));
const revalidatePath = vi.fn();
const writes: unknown[] = [];

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/backend/current-site', () => ({
  requireActingSite: () => Promise.resolve({ site: { tenantId: 't1' } }),
}));
vi.mock('@/lib/backend/site-features', () => ({
  getSiteFeatures: () => Promise.resolve(state.features),
}));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({
      update: (arg: unknown) => ({
        eq: () => {
          writes.push(arg);
          return Promise.resolve({
            error: state.writeError === null ? null : { message: state.writeError },
          });
        },
      }),
    }),
  }),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('./queries', () => ({ loadPlanState: () => Promise.resolve(state.plan) }));
vi.mock('./apply', () => ({ applyPlan }));

const { upgradePlan, scheduleDowngrade, cancelScheduledChange, skipToRenewal, setDemoBilling } =
  await import('./actions');

function on(over: Partial<PlanState> = {}): PlanState {
  return {
    plan: 'showcase',
    billing: 'monthly',
    renewsOn: '2026-10-29',
    next: null,
    nextBilling: null,
    creditCents: 0,
    today: '2026-10-09',
    ...over,
  };
}

beforeEach(() => {
  state.features = new Set(['plan', 'demo_checkout']);
  state.plan = on();
  state.apply = { ok: true };
  state.writeError = null;
  applyPlan.mockClear();
  revalidatePath.mockClear();
  writes.length = 0;
});

describe('upgrade', () => {
  it('switches now, keeps the renewal day on the same billing, and refreshes the backend', async () => {
    expect(await upgradePlan('lite', 'monthly')).toEqual({ ok: true });
    expect(applyPlan).toHaveBeenCalledWith(expect.anything(), 't1', 'lite');
    expect(writes).toEqual([
      {
        plan_billing: 'monthly',
        plan_renews_on: '2026-10-29',
        plan_next: null,
        plan_next_billing: null,
        plan_credit_cents: 0,
      },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith('/manage', 'layout');
  });

  it('starts a new year from today when she picks yearly', async () => {
    await upgradePlan('full', 'yearly');
    expect(writes).toEqual([
      {
        plan_billing: 'yearly',
        plan_renews_on: '2027-10-09',
        plan_next: null,
        plan_next_billing: null,
        plan_credit_cents: 0,
      },
    ]);
  });

  it('lets a yearly site go monthly, keeping the unused year as credit', async () => {
    state.plan = on({ billing: 'yearly', renewsOn: '2027-04-09' });
    expect(await upgradePlan('lite', 'monthly')).toEqual({ ok: true });
    const w = writes[0] as {
      plan_billing: string;
      plan_renews_on: string;
      plan_credit_cents: number;
    };
    expect(w.plan_billing).toBe('monthly');
    expect(w.plan_renews_on).toBe('2026-11-09');
    expect(w.plan_credit_cents).toBeGreaterThan(0);
  });

  it('refuses a real site and a move that isn’t an upgrade', async () => {
    state.features = new Set(['plan']);
    expect((await upgradePlan('lite', 'monthly')).ok).toBe(false);
    state.features = new Set(['plan', 'demo_checkout']);
    expect(await upgradePlan('showcase', 'monthly')).toEqual({
      ok: false,
      error: 'That isn’t an upgrade from your plan.',
    });
    expect((await upgradePlan('pro', 'monthly')).ok).toBe(false);
    expect(applyPlan).not.toHaveBeenCalled();
  });

  it('refuses a site with no plan, and says so when a write fails', async () => {
    state.plan = null;
    expect(await upgradePlan('lite', 'monthly')).toEqual({
      ok: false,
      error: 'This site isn’t on a plan yet.',
    });
    state.plan = on();
    state.apply = { ok: false, error: 'switches: down' };
    expect((await upgradePlan('lite', 'monthly')).ok).toBe(false);
    state.apply = { ok: true };
    state.writeError = 'down';
    expect((await upgradePlan('lite', 'monthly')).ok).toBe(false);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('downgrade', () => {
  beforeEach(() => {
    state.plan = on({ plan: 'full', billing: 'yearly', renewsOn: '2027-04-09' });
  });

  it('waits for renewal: nothing switches now, the plan and billing to come are stored', async () => {
    expect(await scheduleDowngrade('showcase', 'monthly')).toEqual({ ok: true });
    expect(applyPlan).not.toHaveBeenCalled();
    expect(writes).toEqual([
      {
        plan_billing: 'yearly',
        plan_renews_on: '2027-04-09',
        plan_next: 'showcase',
        plan_next_billing: 'monthly',
      },
    ]);
  });

  it('refuses a move that isn’t a downgrade, a plan that doesn’t exist, or a billing that doesn’t', async () => {
    expect((await scheduleDowngrade('full', 'yearly')).ok).toBe(false);
    expect((await scheduleDowngrade('pro', 'yearly')).ok).toBe(false);
    expect((await scheduleDowngrade('lite', 'weekly')).ok).toBe(false);
    expect(writes).toEqual([]);
  });

  it('can be called off', async () => {
    expect(await cancelScheduledChange()).toEqual({ ok: true });
    expect(writes).toEqual([{ plan_next: null, plan_next_billing: null }]);
  });

  it('takes effect when the demo skips to renewal, and the new period starts today', async () => {
    state.plan = on({ plan: 'full', billing: 'yearly', renewsOn: '2027-04-09', next: 'lite' });
    expect(await skipToRenewal()).toEqual({ ok: true });
    expect(applyPlan).toHaveBeenCalledWith(expect.anything(), 't1', 'lite');
    expect(writes).toEqual([
      {
        plan_billing: 'yearly',
        plan_renews_on: '2027-10-09',
        plan_next: null,
        plan_next_billing: null,
        plan_credit_cents: 0,
      },
    ]);
  });

  it('starts the downgraded plan on the billing she picked', async () => {
    state.plan = on({
      plan: 'full',
      billing: 'yearly',
      renewsOn: '2027-04-09',
      next: 'showcase',
      nextBilling: 'monthly',
    });
    await skipToRenewal();
    expect(applyPlan).toHaveBeenCalledWith(expect.anything(), 't1', 'showcase');
    expect(writes).toEqual([
      {
        plan_billing: 'monthly',
        plan_renews_on: '2026-11-09',
        plan_next: null,
        plan_next_billing: null,
        plan_credit_cents: 0,
      },
    ]);
  });

  it('pays a renewal from credit first', async () => {
    state.plan = on({
      plan: 'lite',
      billing: 'monthly',
      renewsOn: '2026-11-09',
      creditCents: 1000,
    });
    await skipToRenewal();
    expect(writes).toEqual([
      {
        plan_billing: 'monthly',
        plan_renews_on: '2026-11-09',
        plan_next: null,
        plan_next_billing: null,
        plan_credit_cents: 0,
      },
    ]);
  });

  it('just renews when nothing is waiting, and stops if the switch fails', async () => {
    expect(await skipToRenewal()).toEqual({ ok: true });
    expect(applyPlan).not.toHaveBeenCalled();
    state.plan = on({ plan: 'full', renewsOn: '', next: 'lite' });
    state.apply = { ok: false, error: 'x' };
    expect((await skipToRenewal()).ok).toBe(false);
  });

  it('refuses a real site', async () => {
    state.features = new Set(['plan']);
    expect((await cancelScheduledChange()).ok).toBe(false);
    expect((await skipToRenewal()).ok).toBe(false);
  });
});

describe('demo billing switch', () => {
  it('puts the demo six months into a paid year, or 20 days from a monthly renewal', async () => {
    expect(await setDemoBilling('yearly')).toEqual({ ok: true });
    expect(await setDemoBilling('monthly')).toEqual({ ok: true });
    expect(writes).toEqual([
      {
        plan_billing: 'yearly',
        plan_renews_on: '2027-04-09',
        plan_next: null,
        plan_next_billing: null,
        plan_credit_cents: 0,
      },
      {
        plan_billing: 'monthly',
        plan_renews_on: '2026-10-29',
        plan_next: null,
        plan_next_billing: null,
        plan_credit_cents: 0,
      },
    ]);
  });

  it('refuses nonsense and real sites', async () => {
    expect((await setDemoBilling('weekly')).ok).toBe(false);
    state.features = new Set(['plan']);
    expect((await setDemoBilling('yearly')).ok).toBe(false);
    expect(writes).toEqual([]);
  });
});
