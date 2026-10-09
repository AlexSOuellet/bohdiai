import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { features: new Set<string>(['plan', 'demo_checkout']), plan: 'showcase' as string | null, apply: { ok: true } as { ok: true } | { ok: false; error: string } };
const applyPlan = vi.fn(() => Promise.resolve(state.apply));
const revalidatePath = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: () => Promise.resolve({ site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: () => Promise.resolve(state.features) }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: () => Promise.resolve({}) }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('./queries', () => ({ loadSitePlan: () => Promise.resolve(state.plan) }));
vi.mock('./apply', () => ({ applyPlan }));

const { changePlan } = await import('./actions');

beforeEach(() => {
  state.features = new Set(['plan', 'demo_checkout']);
  state.plan = 'showcase';
  state.apply = { ok: true };
  applyPlan.mockClear();
  revalidatePath.mockClear();
});

describe('changing the plan', () => {
  it('switches a demo site and refreshes the whole backend', async () => {
    expect(await changePlan('lite')).toEqual({ ok: true });
    expect(applyPlan).toHaveBeenCalledWith({}, 't1', 'lite');
    expect(revalidatePath).toHaveBeenCalledWith('/manage', 'layout');
  });

  it('refuses a real site (no demo checkout) and points at the email', async () => {
    state.features = new Set(['plan']);
    const r = await changePlan('lite');
    expect(r.ok).toBe(false);
    expect(applyPlan).not.toHaveBeenCalled();
  });

  it('refuses nonsense, no plan yet, and the plan it is already on', async () => {
    expect((await changePlan('pro')).ok).toBe(false);
    state.plan = null;
    expect((await changePlan('lite')).ok).toBe(false);
    state.plan = 'lite';
    expect(await changePlan('lite')).toEqual({ ok: false, error: 'You’re already on that plan.' });
    expect(applyPlan).not.toHaveBeenCalled();
  });

  it('says so when the switch fails', async () => {
    state.apply = { ok: false, error: 'switches: down' };
    expect(await changePlan('full')).toEqual({ ok: false, error: 'The plan couldn’t be changed. Try again in a moment.' });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
