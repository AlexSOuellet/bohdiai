import { describe, it, expect, vi } from 'vitest';
import { signUp, type SignupDeps } from './signup';
import type { SignupFields } from './request';

const fields: SignupFields = { plan: 'lite', billing: 'monthly', makerName: 'Lena', businessName: 'Saltmarsh', email: 'lena@example.com' };

function deps(over: Partial<SignupDeps> = {}): SignupDeps {
  return {
    createUser: vi.fn(async () => ({ ok: true as const, userId: 'u1' })),
    passwordUser: vi.fn(async () => 'u1'),
    sitesOf: vi.fn(async () => []),
    createSite: vi.fn(async () => 't1'),
    setPlan: vi.fn(async () => undefined),
    removeUser: vi.fn(async () => undefined),
    checkout: vi.fn(async (tenantId: string) => `https://checkout.stripe.com/${tenantId}`),
    ...over,
  };
}

describe('signUp', () => {
  it('makes the account and the site, then sends them to Stripe', async () => {
    const d = deps();
    expect(await signUp(fields, 'tide pools 22', d)).toEqual({ ok: true, url: 'https://checkout.stripe.com/t1' });
    expect(d.createUser).toHaveBeenCalledWith('lena@example.com', 'tide pools 22', 'Lena');
    expect(d.createSite).toHaveBeenCalledWith('u1', fields);
    expect(d.checkout).toHaveBeenCalledWith('t1', fields);
  });

  it('removes the new account when the rest fails', async () => {
    const d = deps({ createSite: vi.fn(async () => Promise.reject(new Error('db down'))) });
    await expect(signUp(fields, 'tide pools 22', d)).rejects.toThrow('db down');
    expect(d.removeUser).toHaveBeenCalledWith('u1');
  });

  it('says so when the account could not be made', async () => {
    const d = deps({ createUser: vi.fn(async () => ({ ok: false as const, reason: 'failed' as const })) });
    expect(await signUp(fields, 'pw123456', d)).toEqual({ ok: false, reason: 'failed' });
  });

  describe('an email that already has an account', () => {
    const exists = { createUser: vi.fn(async () => ({ ok: false as const, reason: 'exists' as const })) };

    it('with the wrong password: the email already has an account', async () => {
      const d = deps({ ...exists, passwordUser: vi.fn(async () => null) });
      expect(await signUp(fields, 'nope', d)).toEqual({ ok: false, reason: 'accountExists' });
      expect(d.checkout).not.toHaveBeenCalled();
    });

    it('that left Stripe halfway: the same site, the plan picked now, back to Stripe', async () => {
      const d = deps({ ...exists, sitesOf: vi.fn(async () => [{ tenantId: 't9', draft: true, paid: false }]) });
      expect(await signUp(fields, 'tide pools 22', d)).toEqual({ ok: true, url: 'https://checkout.stripe.com/t9' });
      expect(d.setPlan).toHaveBeenCalledWith('t9', fields);
      expect(d.createSite).not.toHaveBeenCalled();
    });

    it('that has already paid: the email already has an account (they sign in)', async () => {
      const d = deps({ ...exists, sitesOf: vi.fn(async () => [{ tenantId: 't9', draft: true, paid: true }]) });
      expect(await signUp(fields, 'tide pools 22', d)).toEqual({ ok: false, reason: 'accountExists' });
    });

    it('with a live site and nothing waiting: the email already has an account', async () => {
      const d = deps({ ...exists, sitesOf: vi.fn(async () => [{ tenantId: 't2', draft: false, paid: false }]) });
      expect(await signUp(fields, 'tide pools 22', d)).toEqual({ ok: false, reason: 'accountExists' });
    });

    it('with no site at all: a new site on the same account', async () => {
      const d = deps({ ...exists });
      expect(await signUp(fields, 'tide pools 22', d)).toEqual({ ok: true, url: 'https://checkout.stripe.com/t1' });
      expect(d.createSite).toHaveBeenCalledWith('u1', fields);
      expect(d.removeUser).not.toHaveBeenCalled();
    });
  });
});
