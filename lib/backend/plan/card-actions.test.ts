import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  features: new Set<string>(['plan']),
  sub: { stripeId: 'sub_1', customerId: 'cus_1' } as { stripeId: string; customerId: string } | null,
  startCardPage: vi.fn(async () => 'https://checkout.stripe.com/c/cs_card'),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT ${url}`);
  }),
  error: vi.fn(),
}));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ host: 'app.bohdiai.com', 'x-forwarded-proto': 'https' }) }));
vi.mock('next/navigation', () => ({ redirect: h.redirect }));
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => h.features }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/logger', () => ({ logger: { error: h.error } }));
vi.mock('@/lib/billing/stripe', () => ({ stripe: () => ({}) }));
vi.mock('@/lib/billing/maker-subscription', () => ({ currentSubscription: async () => h.sub }));
vi.mock('@/lib/billing/card', () => ({ startCardPage: h.startCardPage }));
const { updateCard } = await import('./card-actions');

beforeEach(() => {
  h.features = new Set(['plan']);
  h.sub = { stripeId: 'sub_1', customerId: 'cus_1' };
  h.startCardPage.mockClear();
});

describe('updateCard', () => {
  it('sends the maker to Stripe’s card page, coming back to Billing', async () => {
    await expect(updateCard()).rejects.toThrow('REDIRECT https://checkout.stripe.com/c/cs_card');
    expect(h.startCardPage).toHaveBeenCalledWith({}, {
      customerId: 'cus_1',
      tenantId: 't1',
      doneUrl: 'https://app.bohdiai.com/manage/billing/card?session={CHECKOUT_SESSION_ID}',
      backUrl: 'https://app.bohdiai.com/manage/billing',
    });
  });
  it('a site with no plan, or not billed by card, has nothing to update', async () => {
    h.features = new Set();
    expect(await updateCard()).toEqual({ ok: false, error: 'This site isn’t on a plan yet.' });
    h.features = new Set(['plan']);
    h.sub = null;
    expect(await updateCard()).toEqual({ ok: false, error: 'This site isn’t billed by card. Nothing to update.' });
    expect(h.startCardPage).not.toHaveBeenCalled();
  });
  it('says so when Stripe’s page can’t be opened', async () => {
    h.startCardPage.mockRejectedValueOnce(new Error('stripe down'));
    expect(await updateCard()).toEqual({ ok: false, error: 'Stripe’s card page couldn’t be opened. Try again in a moment.' });
    h.startCardPage.mockRejectedValueOnce('down');
    expect((await updateCard()).ok).toBe(false);
    expect(h.error).toHaveBeenCalledTimes(2);
  });
});
