import type * as FreeUp from './free-up';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  features: new Set<string>(['plan']),
  facts: { free: true, comp: false },
  sub: { stripeId: 'sub_1', customerId: 'cus_1' } as { stripeId: string; customerId: string } | null,
  card: null as unknown,
  stepUp: vi.fn(async (): Promise<unknown> => ({ ok: true })),
  chargeAndStepUp: vi.fn(async (): Promise<unknown> => ({ ok: true })),
  startCardPage: vi.fn(async () => 'https://checkout.stripe.com/c/cs_card'),
  send: vi.fn(async () => undefined),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
}));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ host: 'app.bohdiai.com', 'x-forwarded-proto': 'https' }) }));
vi.mock('next/navigation', () => ({ redirect: h.redirect }));
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { email: 'dana@example.com' }, site: { tenantId: 't1', businessName: 'Dana Makes', subdomain: 'dana' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => h.features }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/billing/stripe', () => ({ stripe: () => ({}) }));
vi.mock('@/lib/billing/maker-subscription', () => ({ currentSubscription: async () => h.sub }));
vi.mock('@/lib/billing/card', () => ({ cardOnFile: async () => h.card, startCardPage: h.startCardPage }));
vi.mock('./emails', () => ({ sendPlanChange: h.send }));
vi.mock('./free-up', async (orig) => ({ ...(await orig<typeof FreeUp>()), freeSite: async () => h.facts, stepUp: h.stepUp, chargeAndStepUp: h.chargeAndStepUp }));
const { upgradeFromFree } = await import('./free-actions');

beforeEach(() => {
  h.features = new Set(['plan']);
  h.facts = { free: true, comp: false };
  h.sub = { stripeId: 'sub_1', customerId: 'cus_1' };
  h.card = null;
  for (const f of [h.stepUp, h.chargeAndStepUp, h.startCardPage, h.send]) f.mockClear();
});

describe('upgradeFromFree', () => {
  it('with no card yet: Stripe’s card page, remembering the plan to move to', async () => {
    await expect(upgradeFromFree('showcase', 'monthly')).rejects.toThrow('REDIRECT https://checkout.stripe.com/c/cs_card');
    expect(h.startCardPage).toHaveBeenCalledWith({}, {
      customerId: 'cus_1',
      tenantId: 't1',
      doneUrl: 'https://app.bohdiai.com/manage/plan/card?session={CHECKOUT_SESSION_ID}',
      backUrl: 'https://app.bohdiai.com/manage/plan',
      then: { plan: 'showcase', billing: 'monthly' },
    });
    expect(h.chargeAndStepUp).not.toHaveBeenCalled();
  });
  it('with a card on file: charged now, emailed, then the site form', async () => {
    h.card = { last4: '4242' };
    await expect(upgradeFromFree('full', 'yearly')).rejects.toThrow('REDIRECT /welcome');
    expect(h.chargeAndStepUp).toHaveBeenCalledWith({}, {}, { tenantId: 't1', stripeId: 'sub_1', to: 'full', billing: 'yearly' });
    expect(h.send).toHaveBeenCalledWith(expect.objectContaining({ makerEmail: 'dana@example.com', change: { kind: 'upgrade', to: 'Maker Full' } }));
  });
  it('a declined card says so and changes nothing', async () => {
    h.card = { last4: '4242' };
    h.chargeAndStepUp.mockResolvedValueOnce({ ok: false, declined: 'Your card was declined.' });
    expect(await upgradeFromFree('full', 'yearly')).toEqual({ ok: false, error: 'Your card was declined: Your card was declined. Try another card.' });
    expect(h.send).not.toHaveBeenCalled();
  });
  it('free for this maker: no Stripe at all, straight to the site form', async () => {
    h.facts = { free: true, comp: true };
    await expect(upgradeFromFree('lite', 'monthly')).rejects.toThrow('REDIRECT /welcome');
    expect(h.stepUp).toHaveBeenCalledWith({}, 't1', 'lite', 'monthly', null);
    expect(h.startCardPage).not.toHaveBeenCalled();
    h.stepUp.mockResolvedValueOnce({ ok: false, error: 'switches: down' });
    expect(await upgradeFromFree('lite', 'monthly')).toEqual({ ok: false, error: 'Your plan couldn’t be changed. Try again in a moment.' });
  });
  it('refuses nonsense, no plan screen, a paid account, and an account with no billing', async () => {
    expect((await upgradeFromFree('gold', 'monthly')).ok).toBe(false);
    expect((await upgradeFromFree('lite', 'weekly')).ok).toBe(false);
    h.features = new Set();
    expect(await upgradeFromFree('lite', 'monthly')).toEqual({ ok: false, error: 'This site isn’t on a plan yet.' });
    h.features = new Set(['plan']);
    h.facts = { free: false, comp: false };
    expect(await upgradeFromFree('lite', 'monthly')).toEqual({ ok: false, error: 'You’re already on a paid plan.' });
    h.facts = { free: true, comp: false };
    h.sub = null;
    expect(await upgradeFromFree('lite', 'monthly')).toEqual({ ok: false, error: 'This account’s plan is changed by Alex. Use Contact support.' });
  });
  it('says so when Stripe fails', async () => {
    h.startCardPage.mockRejectedValueOnce(new Error('stripe down'));
    expect(await upgradeFromFree('lite', 'monthly')).toEqual({ ok: false, error: 'Your plan couldn’t be changed. Try again in a moment.' });
    h.startCardPage.mockRejectedValueOnce('down');
    expect((await upgradeFromFree('lite', 'monthly')).ok).toBe(false);
  });
});
