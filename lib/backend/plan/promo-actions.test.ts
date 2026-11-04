import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  allowKey: vi.fn(),
  currentSubscription: vi.fn(),
  checkPromo: vi.fn(),
  claimPromo: vi.fn(),
  applyDiscount: vi.fn(),
  releasePromo: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('next/cache', () => ({ revalidatePath: m.revalidatePath }));
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { email: 'Lena@Example.com' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/action-limit', () => ({ allowKey: m.allowKey, ACTION_LIMITED: 'slow down', ACTION_UNAVAILABLE: 'unavailable' }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/billing/stripe', () => ({ stripe: () => ({}) }));
vi.mock('@/lib/billing/maker-subscription', () => ({ currentSubscription: m.currentSubscription }));
vi.mock('@/lib/billing/promos', async (orig) => ({ ...(await orig<object>()), checkPromo: m.checkPromo, claimPromo: m.claimPromo, applyDiscount: m.applyDiscount, releasePromo: m.releasePromo }));

import { redeemPromo } from './promo-actions';

const paying = { unitCents: 2500, discountLabel: null, discountEndsAt: null };
const promo = { code: 'SPRING10', percent: 10, months: null };

beforeEach(() => {
  vi.clearAllMocks();
  m.allowKey.mockResolvedValue('allowed');
  m.currentSubscription.mockResolvedValue(paying);
  m.checkPromo.mockResolvedValue({ ok: true, promo });
  m.claimPromo.mockResolvedValue(true);
  m.applyDiscount.mockResolvedValue(undefined);
  m.releasePromo.mockResolvedValue(undefined);
});

describe('redeemPromo', () => {
  it('holds the code, then puts it on the plan', async () => {
    expect(await redeemPromo(' spring10 ')).toEqual({ ok: true, message: 'Done: 10% off.' });
    expect(m.checkPromo).toHaveBeenCalledWith({}, {}, { code: 'SPRING10', email: 'lena@example.com', tenantId: 't1', isNew: false });
    expect(m.claimPromo).toHaveBeenCalledWith({}, 'SPRING10', 't1', 'lena@example.com');
    expect(m.applyDiscount).toHaveBeenCalledWith({}, {}, paying, promo, expect.any(Date), 'SPRING10');
  });
  it('asks for a code', async () => {
    expect(await redeemPromo('  ')).toEqual({ ok: false, error: 'Enter your code.' });
    expect(await redeemPromo(7)).toEqual({ ok: false, error: 'Enter your code.' });
  });
  it('slows down someone guessing', async () => {
    m.allowKey.mockResolvedValue('limited');
    expect(await redeemPromo('X')).toEqual({ ok: false, error: 'slow down' });
    m.allowKey.mockResolvedValue('unavailable');
    expect(await redeemPromo('X')).toEqual({ ok: false, error: 'unavailable' });
    expect(m.checkPromo).not.toHaveBeenCalled();
  });
  it('is for paid plans', async () => {
    m.currentSubscription.mockResolvedValue(null);
    expect((await redeemPromo('X')).ok).toBe(false);
    m.currentSubscription.mockResolvedValue({ ...paying, unitCents: 0 });
    expect(await redeemPromo('X')).toEqual({ ok: false, error: 'Promo codes are for paid plans.' });
  });
  it('allows one discount at a time', async () => {
    m.currentSubscription.mockResolvedValue({ ...paying, discountLabel: '3 months free', discountEndsAt: '2099-01-01T00:00:00Z' });
    expect(await redeemPromo('X')).toEqual({ ok: false, error: 'You already have a discount running (3 months free). You can use another code once it ends.' });
    expect(m.claimPromo).not.toHaveBeenCalled();
  });
  it('allows a new code once the last discount has ended', async () => {
    m.currentSubscription.mockResolvedValue({ ...paying, discountLabel: '3 months free', discountEndsAt: '2020-01-01T00:00:00Z' });
    expect((await redeemPromo('X')).ok).toBe(true);
  });
  it.each([
    ['unknown', 'That code isn’t valid. Check it and try again.'],
    ['used', 'You’ve already used that code.'],
    ['newOnly', 'That code is for new sign-ups.'],
  ])('says why a code is turned away: %s', async (why, error) => {
    m.checkPromo.mockResolvedValue({ ok: false, why });
    expect(await redeemPromo('X')).toEqual({ ok: false, error });
  });
  it('loses a race for the code gracefully', async () => {
    m.claimPromo.mockResolvedValue(false);
    expect(await redeemPromo('X')).toEqual({ ok: false, error: 'You’ve already used that code.' });
    expect(m.applyDiscount).not.toHaveBeenCalled();
  });
  it('gives the code back when Stripe fails', async () => {
    m.applyDiscount.mockRejectedValue(new Error('stripe down'));
    expect((await redeemPromo('X')).ok).toBe(false);
    expect(m.releasePromo).toHaveBeenCalledWith({}, 'X', 't1');
  });
  it('still answers when the code can’t be given back', async () => {
    m.applyDiscount.mockRejectedValue(new Error('stripe down'));
    m.releasePromo.mockRejectedValue(new Error('db down'));
    expect((await redeemPromo('X')).ok).toBe(false);
  });
  it('holds nothing back when the check itself fails', async () => {
    m.checkPromo.mockRejectedValue(new Error('down'));
    expect((await redeemPromo('X')).ok).toBe(false);
    expect(m.releasePromo).not.toHaveBeenCalled();
  });
});
