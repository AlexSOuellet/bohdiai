import type * as PlanChange from '@/lib/billing/plan-change';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlanState } from './queries';
import type * as Convert from './convert';

const state: {
  features: Set<string>;
  plan: PlanState | null;
  apply: { ok: true } | { ok: false; error: string };
  writeError: string | null;
  convert: { ok: true; added: number } | { ok: false; error: string };
} = {
  features: new Set(['plan', 'demo_checkout']),
  plan: null,
  apply: { ok: true },
  writeError: null,
  convert: { ok: true, added: 0 },
};
const applyPlan = vi.fn(() => Promise.resolve(state.apply));
const revalidatePath = vi.fn();
const writes: unknown[] = [];

vi.mock('next/cache', () => ({ revalidatePath }));
const billing = vi.hoisted(() => ({ currentSubscription: vi.fn(), setEndsWithTerm: vi.fn() }));
vi.mock('@/lib/billing/stripe', () => ({ stripe: () => ({}) }));
vi.mock('@/lib/billing/maker-subscription', () => billing);
const pc = vi.hoisted(() => ({
  findPrice: vi.fn(async (_s: unknown, plan: string, billing: string) => ({ id: `price_${plan}_${billing}` })),
  changeNow: vi.fn(async (): Promise<unknown> => ({ ok: true, sub: { items: { data: [{ current_period_end: Date.UTC(2026, 10, 29) / 1000 }] } } })),
  changeAtRenewal: vi.fn(async () => undefined),
  dropAtRenewal: vi.fn(async () => undefined),
}));
vi.mock('@/lib/billing/plan-change', async (orig) => ({ ...(await orig<typeof PlanChange>()), ...pc }));
vi.mock('@/lib/backend/current-site', () => ({
  requireActingSite: () => Promise.resolve({ user: { email: 'lena@example.com' }, site: { tenantId: 't1', businessName: 'Lena Hart Decoupage', subdomain: 'lena' } }),
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
const sendPlanChange = vi.fn((_input: unknown) => Promise.resolve());
vi.mock('./emails', () => ({ sendPlanChange }));
const galleryToProducts = vi.fn(() => Promise.resolve(state.convert));
const candidates = [
  { id: 'p1', name: 'Carol star', uploadId: 'u1', url: 'https://cdn/1.jpg' },
  { id: 'p2', name: 'Old Saint Nick', uploadId: 'u2', url: 'https://cdn/2.jpg' },
];
const showcaseCandidates = vi.fn(() => Promise.resolve({ ok: true as const, products: candidates }));
const galleryFromProducts = vi.fn(() => Promise.resolve({ ok: true as const, count: 1 }));
vi.mock('./convert', async (orig) => ({
  ...(await orig<typeof Convert>()),
  galleryToProducts,
  showcaseCandidates,
  galleryFromProducts,
}));

const { upgradePlan, scheduleDowngrade, cancelScheduledChange, skipToRenewal, setDemoBilling, cancelAtTermEnd, keepSite, changeBilling } =
  await import('./actions');

function on(over: Partial<PlanState> = {}): PlanState {
  return {
    plan: 'showcase',
    billing: 'monthly',
    renewsOn: '2026-10-29',
    next: null,
    nextBilling: null,
    creditCents: 0,
    cancels: false,
    comp: null,
    nextGallery: [],
    today: '2026-10-09',
    ...over,
  };
}

beforeEach(() => {
  state.features = new Set(['plan', 'demo_checkout']);
  state.plan = on();
  state.apply = { ok: true };
  state.writeError = null;
  state.convert = { ok: true, added: 0 };
  galleryToProducts.mockClear();
  applyPlan.mockClear();
  revalidatePath.mockClear();
  billing.currentSubscription.mockReset();
  billing.currentSubscription.mockResolvedValue(null);
  billing.setEndsWithTerm.mockReset();
  for (const f of Object.values(pc)) f.mockClear();
  sendPlanChange.mockClear();
  writes.length = 0;
});

describe('upgrade', () => {
  it('turns the gallery into products when leaving Showcase, and stops if that fails', async () => {
    await upgradePlan('lite', 'monthly');
    expect(galleryToProducts).toHaveBeenCalledWith(expect.anything(), 't1');
    state.plan = on({ plan: 'lite' });
    galleryToProducts.mockClear();
    await upgradePlan('full', 'monthly');
    expect(galleryToProducts).not.toHaveBeenCalled();
    state.plan = on();
    state.convert = { ok: false, error: 'products: full' };
    applyPlan.mockClear();
    expect((await upgradePlan('lite', 'monthly')).ok).toBe(false);
    expect(applyPlan).not.toHaveBeenCalled();
  });

  it('switches now, keeps the renewal day on the same billing, and refreshes the backend', async () => {
    expect(await upgradePlan('lite', 'monthly')).toEqual({ ok: true });
    expect(applyPlan).toHaveBeenCalledWith(expect.anything(), 't1', 'lite');
    expect(writes).toEqual([
      {
        plan_billing: 'monthly',
        plan_renews_on: '2026-10-29',
        plan_next: null,
        plan_next_billing: null,
        plan_next_gallery: null,
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
        plan_next_gallery: null,
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

  it('refuses a sample site Stripe doesn’t bill, and a move that isn’t an upgrade', async () => {
    state.features = new Set(['plan']);
    expect(await upgradePlan('lite', 'monthly')).toEqual({ ok: false, error: 'This site’s plan is changed by Alex. Use the email button on Your plan.' });
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
    expect(await scheduleDowngrade('showcase', 'monthly', ['p1'])).toEqual({ ok: true });
    expect(applyPlan).not.toHaveBeenCalled();
    expect(writes).toEqual([
      {
        plan_billing: 'yearly',
        plan_renews_on: '2027-04-09',
        plan_next: 'showcase',
        plan_next_billing: 'monthly',
        plan_next_gallery: ['p1'],
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
    expect(writes).toEqual([{ plan_next: null, plan_next_billing: null, plan_next_gallery: null }]);
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
        plan_next_gallery: null,
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
        plan_next_gallery: null,
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
        plan_next_gallery: null,
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

  it('refuses a sample site Stripe doesn’t bill; the renewal skip is the demo’s alone', async () => {
    state.features = new Set(['plan']);
    expect((await cancelScheduledChange()).ok).toBe(false);
    expect((await skipToRenewal()).ok).toBe(false);
    billing.currentSubscription.mockResolvedValue({ stripeId: 'sub_1' });
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
        plan_next_gallery: null,
        plan_credit_cents: 0,
      },
      {
        plan_billing: 'monthly',
        plan_renews_on: '2026-10-29',
        plan_next: null,
        plan_next_billing: null,
        plan_next_gallery: null,
        plan_credit_cents: 0,
      },
    ]);
  });

  it('refuses nonsense and sites that aren’t the demo', async () => {
    expect((await setDemoBilling('weekly')).ok).toBe(false);
    state.features = new Set(['plan']);
    expect((await setDemoBilling('yearly')).ok).toBe(false);
    expect(writes).toEqual([]);
  });
});

describe('downgrading to Showcase', () => {
  beforeEach(() => {
    state.plan = on({ plan: 'lite', billing: 'monthly', renewsOn: '2026-10-29' });
    galleryFromProducts.mockClear();
  });

  it('stores the products she picked, in her order, dropping unknown ones', async () => {
    expect(await scheduleDowngrade('showcase', 'monthly', ['p2', 'nope', 'p1'])).toEqual({ ok: true });
    expect(writes).toEqual([expect.objectContaining({ plan_next: 'showcase', plan_next_gallery: ['p2', 'p1'] })]);
  });

  it('asks her to pick at least one when she has products to show', async () => {
    expect(await scheduleDowngrade('showcase', 'monthly', [])).toEqual({ ok: false, error: 'Pick at least one product to show on your Showcase page.' });
    expect(writes).toEqual([]);
  });

  it('turns her picks into the gallery when the downgrade takes effect', async () => {
    state.plan = on({ plan: 'lite', next: 'showcase', nextGallery: ['p2', 'p1'] });
    expect(await skipToRenewal()).toEqual({ ok: true });
    expect(galleryFromProducts).toHaveBeenCalledWith(expect.anything(), 't1', ['p2', 'p1'], 12);
    expect(applyPlan).toHaveBeenCalledWith(expect.anything(), 't1', 'showcase');
  });

  it('stops before switching if the gallery can’t be made', async () => {
    state.plan = on({ plan: 'lite', next: 'showcase', nextGallery: ['p1'] });
    galleryFromProducts.mockResolvedValueOnce({ ok: false, error: 'gallery: down' } as never);
    applyPlan.mockClear();
    expect((await skipToRenewal()).ok).toBe(false);
    expect(applyPlan).not.toHaveBeenCalled();
  });

  it('says so when her products can’t be read', async () => {
    showcaseCandidates.mockResolvedValueOnce({ ok: false, error: 'products: down' } as never);
    expect((await scheduleDowngrade('showcase', 'monthly', ['p1'])).ok).toBe(false);
  });
});

describe('cancel at the end of the term', () => {
  beforeEach(() => {
    writes.length = 0;
    sendPlanChange.mockClear();
    state.features = new Set(['plan']);
    state.writeError = null;
    state.plan = on();
    billing.currentSubscription.mockReset().mockResolvedValue(null);
    billing.setEndsWithTerm.mockReset().mockResolvedValue(undefined);
  });

  it('tells Stripe the plan ends with this term, and that it doesn’t after all', async () => {
    billing.currentSubscription.mockResolvedValue({ stripeId: 'sub_1' });
    expect(await cancelAtTermEnd()).toEqual({ ok: true });
    // A downgrade waiting for renewal gives way to the cancel.
    expect(pc.dropAtRenewal).toHaveBeenCalledWith({}, 'sub_1');
    expect(billing.setEndsWithTerm).toHaveBeenLastCalledWith({}, { stripeId: 'sub_1' }, true);
    pc.dropAtRenewal.mockClear();
    expect(await keepSite()).toEqual({ ok: true });
    expect(billing.setEndsWithTerm).toHaveBeenLastCalledWith({}, { stripeId: 'sub_1' }, false);
    expect(pc.dropAtRenewal).not.toHaveBeenCalled();
  });

  it('says nothing is cancelled when Stripe can’t be told', async () => {
    billing.currentSubscription.mockResolvedValue({ stripeId: 'sub_1' });
    billing.setEndsWithTerm.mockRejectedValue(new Error('stripe down'));
    expect((await cancelAtTermEnd()).ok).toBe(false);
    expect((await keepSite()).ok).toBe(false);
    expect(writes).toEqual([]);
    expect(sendPlanChange).not.toHaveBeenCalled();
  });

  it('copes with a failure that isn’t an Error', async () => {
    billing.currentSubscription.mockRejectedValue('down');
    expect((await cancelAtTermEnd()).ok).toBe(false);
  });

  it('marks the site to close at the end of its term, on any site with a plan, and emails it', async () => {
    expect(await cancelAtTermEnd()).toEqual({ ok: true });
    expect(writes).toEqual([{ plan_cancels: true, plan_next: null, plan_next_billing: null, plan_next_gallery: null }]);
    expect(sendPlanChange).toHaveBeenCalledWith(expect.objectContaining({ makerEmail: 'lena@example.com', change: { kind: 'cancel', on: expect.stringContaining('October 29, 2026') } }));
  });

  it('keeps the site when the maker changes their mind, and emails that too', async () => {
    expect(await keepSite()).toEqual({ ok: true });
    expect(writes).toEqual([{ plan_cancels: false }]);
    expect(sendPlanChange).toHaveBeenCalledWith(expect.objectContaining({ change: { kind: 'keep' } }));
  });

  it('says so when it can’t be saved, and sends nothing', async () => {
    state.writeError = 'boom';
    expect(await cancelAtTermEnd()).toEqual({ ok: false, error: 'Your cancellation couldn’t be saved. Try again in a moment.' });
    expect(sendPlanChange).not.toHaveBeenCalled();
  });

  it('refuses a site with no plan', async () => {
    state.features = new Set();
    expect((await cancelAtTermEnd()).ok).toBe(false);
    expect(writes).toEqual([]);
  });
});

describe('a site Stripe bills', () => {
  const declined = { ok: false, declined: 'Your card was declined.' };
  beforeEach(() => {
    state.features = new Set(['plan']);
    state.plan = on({ plan: 'lite', billing: 'monthly', renewsOn: '2026-11-20' });
    billing.currentSubscription.mockResolvedValue({ stripeId: 'sub_1' });
  });

  it('upgrades: Stripe charges first, then the site switches, with Stripe’s renewal day', async () => {
    expect(await upgradePlan('full', 'monthly')).toEqual({ ok: true });
    expect(pc.changeNow).toHaveBeenCalledWith({}, 'sub_1', { id: 'price_full_monthly' }, { plan: 'full', billing: 'monthly' });
    expect(applyPlan).toHaveBeenCalledWith(expect.anything(), 't1', 'full');
    expect(writes).toEqual([{ plan_billing: 'monthly', plan_renews_on: '2026-11-29', plan_next: null, plan_next_billing: null, plan_next_gallery: null }]);
    expect(sendPlanChange).toHaveBeenCalledWith(expect.objectContaining({ change: { kind: 'upgrade', to: 'Maker Full' } }));
  });

  it('keeps the renewal day it had when Stripe gives none back', async () => {
    pc.changeNow.mockResolvedValueOnce({ ok: true, sub: { items: { data: [] } } });
    await upgradePlan('full', 'monthly');
    expect(writes).toEqual([expect.objectContaining({ plan_renews_on: '2026-11-20' })]);
  });

  it('a declined card changes nothing and says what to do', async () => {
    pc.changeNow.mockResolvedValueOnce(declined);
    expect(await upgradePlan('full', 'monthly')).toEqual({ ok: false, error: 'Your card was declined: Your card was declined. Update your card under Billing, then try again.' });
    expect(applyPlan).not.toHaveBeenCalled();
    expect(writes).toEqual([]);
    expect(sendPlanChange).not.toHaveBeenCalled();
  });

  it('Stripe failing changes nothing', async () => {
    pc.changeNow.mockRejectedValueOnce(new Error('stripe down'));
    expect((await upgradePlan('full', 'monthly')).ok).toBe(false);
    pc.findPrice.mockRejectedValueOnce('no price');
    expect((await upgradePlan('full', 'monthly')).ok).toBe(false);
    expect(applyPlan).not.toHaveBeenCalled();
  });

  it('paid but the site couldn’t switch: says the payment went through', async () => {
    const paid = { ok: false, error: 'Your payment went through. Your site is switching over: refresh in a minute.' };
    state.apply = { ok: false, error: 'switches: down' };
    expect(await upgradePlan('full', 'monthly')).toEqual(paid);
    state.apply = { ok: true };
    state.writeError = 'down';
    expect(await upgradePlan('full', 'monthly')).toEqual(paid);
  });

  it('downgrades at renewal: Stripe holds it, the site says it’s waiting, nothing switches', async () => {
    expect(await scheduleDowngrade('showcase', 'yearly', ['p1'])).toEqual({ ok: true });
    expect(pc.changeAtRenewal).toHaveBeenCalledWith({}, 'sub_1', { id: 'price_showcase_yearly' }, { plan: 'showcase', billing: 'yearly' });
    expect(applyPlan).not.toHaveBeenCalled();
    expect(writes).toEqual([{ plan_billing: 'monthly', plan_renews_on: '2026-11-20', plan_next: 'showcase', plan_next_billing: 'yearly', plan_next_gallery: ['p1'] }]);
  });

  it('a downgrade Stripe can’t hold isn’t saved; one that can’t be saved is let go in Stripe', async () => {
    pc.changeAtRenewal.mockRejectedValueOnce(new Error('stripe down'));
    expect((await scheduleDowngrade('showcase', 'monthly', ['p1'])).ok).toBe(false);
    expect(writes).toEqual([]);
    state.writeError = 'down';
    expect((await scheduleDowngrade('showcase', 'monthly', ['p1'])).ok).toBe(false);
    expect(pc.dropAtRenewal).toHaveBeenCalledWith({}, 'sub_1');
  });

  it('keep my plan lets the waiting change go in Stripe first', async () => {
    expect(await cancelScheduledChange()).toEqual({ ok: true });
    expect(pc.dropAtRenewal).toHaveBeenCalledWith({}, 'sub_1');
    expect(writes).toEqual([{ plan_next: null, plan_next_billing: null, plan_next_gallery: null }]);
    pc.dropAtRenewal.mockRejectedValueOnce(new Error('stripe down'));
    writes.length = 0;
    expect((await cancelScheduledChange()).ok).toBe(false);
    expect(writes).toEqual([]);
  });

  it('monthly to yearly happens now', async () => {
    expect(await changeBilling('yearly')).toEqual({ ok: true });
    expect(pc.changeNow).toHaveBeenCalledWith({}, 'sub_1', { id: 'price_lite_yearly' }, { plan: 'lite', billing: 'yearly' });
    expect(writes).toEqual([{ plan_billing: 'yearly', plan_renews_on: '2026-11-29', plan_next: null, plan_next_billing: null, plan_next_gallery: null }]);
    expect(sendPlanChange).toHaveBeenCalledWith(expect.objectContaining({ change: { kind: 'billing', billing: 'yearly', on: null } }));
  });

  it('monthly to yearly: a declined card, a Stripe failure, or a failed save', async () => {
    pc.changeNow.mockResolvedValueOnce(declined);
    expect((await changeBilling('yearly')).ok).toBe(false);
    pc.changeNow.mockRejectedValueOnce(new Error('down'));
    expect((await changeBilling('yearly')).ok).toBe(false);
    expect(writes).toEqual([]);
    state.writeError = 'down';
    expect(await changeBilling('yearly')).toEqual({ ok: false, error: 'Your payment went through. Your site is switching over: refresh in a minute.' });
  });

  it('yearly to monthly waits for renewal', async () => {
    state.plan = on({ plan: 'lite', billing: 'yearly', renewsOn: '2027-05-01' });
    expect(await changeBilling('monthly')).toEqual({ ok: true });
    expect(pc.changeAtRenewal).toHaveBeenCalledWith({}, 'sub_1', { id: 'price_lite_monthly' }, { plan: 'lite', billing: 'monthly' });
    expect(writes).toEqual([{ plan_next: 'lite', plan_next_billing: 'monthly', plan_next_gallery: null }]);
    expect(sendPlanChange).toHaveBeenCalledWith(expect.objectContaining({ change: { kind: 'billing', billing: 'monthly', on: expect.stringContaining('May 1, 2027') } }));
  });

  it('yearly to monthly: Stripe can’t hold it, or it can’t be saved (then let go)', async () => {
    state.plan = on({ plan: 'lite', billing: 'yearly', renewsOn: '2027-05-01' });
    pc.changeAtRenewal.mockRejectedValueOnce(new Error('down'));
    expect((await changeBilling('monthly')).ok).toBe(false);
    state.writeError = 'down';
    expect((await changeBilling('monthly')).ok).toBe(false);
    expect(pc.dropAtRenewal).toHaveBeenCalledWith({}, 'sub_1');
  });

  it('refuses nonsense and no change at all', async () => {
    expect((await changeBilling('weekly')).ok).toBe(false);
    expect(await changeBilling('monthly')).toEqual({ ok: false, error: 'Your plan is already billed that way.' });
    state.plan = null;
    expect((await changeBilling('yearly')).ok).toBe(false);
  });
});

describe('a site that’s free for this maker', () => {
  beforeEach(() => {
    state.features = new Set(['plan']);
    state.plan = on({ plan: 'lite', comp: 'free', renewsOn: '2026-11-20' });
  });

  it('moves up or down with nothing charged and nothing asked of Stripe', async () => {
    expect(await upgradePlan('full', 'yearly')).toEqual({ ok: true });
    expect(applyPlan).toHaveBeenCalledWith(expect.anything(), 't1', 'full');
    expect(writes).toEqual([{ plan_billing: 'yearly', plan_renews_on: '2026-11-20', plan_next: null, plan_next_billing: null, plan_next_gallery: null }]);
    expect(await scheduleDowngrade('showcase', 'monthly', ['p1'])).toEqual({ ok: true });
    expect(pc.changeNow).not.toHaveBeenCalled();
    expect(pc.changeAtRenewal).not.toHaveBeenCalled();
    expect(billing.currentSubscription).not.toHaveBeenCalled();
  });

  it('switches billing straight away, or says so when it can’t', async () => {
    expect(await changeBilling('yearly')).toEqual({ ok: true });
    expect(writes).toEqual([{ plan_billing: 'yearly', plan_next: null, plan_next_billing: null, plan_next_gallery: null }]);
    state.writeError = 'down';
    expect((await changeBilling('yearly')).ok).toBe(false);
  });

  it('the demo and sample sites switch billing elsewhere', async () => {
    state.features = new Set(['plan', 'demo_checkout']);
    expect((await changeBilling('yearly')).ok).toBe(false);
    state.features = new Set(['plan']);
    state.plan = on({ plan: 'lite' });
    expect((await changeBilling('yearly')).ok).toBe(false);
    expect((await scheduleDowngrade('showcase', 'monthly', ['p1'])).ok).toBe(false);
  });
});
