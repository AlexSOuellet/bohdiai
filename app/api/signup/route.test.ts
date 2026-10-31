// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const signUp = vi.fn();
const signupDeps = vi.fn((..._a: unknown[]) => ({}));
const logError = vi.fn();

vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: () => Promise.resolve(null) }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/logger', () => ({ logger: { error: (...a: unknown[]) => logError(...a), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/signup/signup', () => ({ signUp: (...a: unknown[]) => signUp(...a) }));
vi.mock('@/lib/signup/server', () => ({ signupDeps: (...a: unknown[]) => signupDeps(...a) }));

import { POST } from './route';
import { SIGNUP_FIELD } from '@/lib/signup/request';

const good = {
  [SIGNUP_FIELD.plan]: 'showcase',
  [SIGNUP_FIELD.billing]: 'monthly',
  [SIGNUP_FIELD.name]: 'Lena',
  [SIGNUP_FIELD.business]: 'Saltmarsh',
  [SIGNUP_FIELD.email]: 'lena@example.com',
  [SIGNUP_FIELD.password]: 'tide pools 22',
};
const post = (body: unknown): Promise<Response> =>
  POST(new Request('https://bohdiai.com/api/signup', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'content-type': 'application/json' } }));

describe('POST /api/signup', () => {
  beforeEach(() => {
    signUp.mockReset();
    signupDeps.mockClear();
    logError.mockReset();
  });

  it('answers with Stripe’s page, and Stripe comes back to this site', async () => {
    signUp.mockResolvedValue({ ok: true, url: 'https://checkout.stripe.com/c/cs_1' });
    const res = await post(good);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: 'https://checkout.stripe.com/c/cs_1' });
    expect(signupDeps).toHaveBeenCalledWith({}, 'https://bohdiai.com');
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ plan: 'showcase', email: 'lena@example.com' }), 'tide pools 22', {});
  });

  it('names the problem and makes nothing when the form isn’t right', async () => {
    const res = await post({ ...good, [SIGNUP_FIELD.email]: 'nope' });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ problem: { spot: 'email', values: {} } });
    expect(signUp).not.toHaveBeenCalled();
  });

  it('says the email already has an account', async () => {
    signUp.mockResolvedValue({ ok: false, reason: 'accountExists' });
    const res = await post(good);
    expect(await res.json()).toEqual({ problem: { spot: 'accountExists', values: {} } });
  });

  it('says it failed, and logs why, when something breaks', async () => {
    signUp.mockRejectedValue(new Error('stripe down'));
    const res = await post(good);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ failed: true });
    expect(logError).toHaveBeenCalledWith('signup failed', { error: 'stripe down' });
  });

  it('says it failed when the account could not be made', async () => {
    signUp.mockResolvedValue({ ok: false, reason: 'failed' });
    expect((await post(good)).status).toBe(502);
  });

  it('turns away a body that isn’t JSON', async () => {
    const res = await post('not json');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ failed: true });
  });

  it('answers a bot as if it worked, and makes nothing', async () => {
    const res = await post({ ...good, [SIGNUP_FIELD.honeypot]: 'Acme' });
    expect(await res.json()).toEqual({ ok: true });
    expect(signUp).not.toHaveBeenCalled();
  });
});
