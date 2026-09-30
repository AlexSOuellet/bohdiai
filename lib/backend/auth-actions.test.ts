import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';
import type * as ActionLimit from './action-limit';

const { signInWithPassword, updateUser, signOut, allowAction, allowKey, sendAuthLink, getUserShops, findUserByEmail, getClaims, requireUser } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  allowAction: vi.fn(),
  allowKey: vi.fn(),
  getClaims: vi.fn(),
  requireUser: vi.fn(),
  sendAuthLink: vi.fn(),
  getUserShops: vi.fn(),
  findUserByEmail: vi.fn(),
}));

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({ auth: { signInWithPassword, updateUser, signOut, getClaims, getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) } }),
}));
vi.mock('./action-limit', async (importOriginal) => ({ ...(await importOriginal<typeof ActionLimit>()), allowAction, allowKey }));
vi.mock('@/lib/auth/session', () => ({ requireUser }));
vi.mock('./auth-links', () => ({ sendAuthLink }));
vi.mock('@/lib/auth/membership', () => ({ getUserShops }));
vi.mock('./user-lookup', () => ({ findUserByEmail }));
vi.mock('next/navigation', () => ({ redirect: vi.fn((p: string) => { throw new Error(`REDIRECT ${p}`); }) }));

import { signIn, requestPasswordReset, setPassword } from './auth-actions';
import { RESET_SENT } from './auth-messages';

beforeEach(() => {
  vi.clearAllMocks();
  allowAction.mockResolvedValue('allowed');
  allowKey.mockResolvedValue('allowed');
  requireUser.mockResolvedValue({ id: 'u1' });
});

describe('signIn', () => {
  it('signs in and goes to the backend', async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    await expect(signIn({ email: ' Maker@Example.com ', password: 'longenough' })).rejects.toThrow('REDIRECT /manage');
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'maker@example.com', password: 'longenough' });
  });
  it('gives one message for any wrong email or password', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials', status: 400, code: 'invalid_credentials' } });
    expect(await signIn({ email: 'a@b.co', password: 'longenough' })).toEqual({ ok: false, error: 'That email and password don’t match.' });
  });
  it('says unavailable, not wrong password, for other sign-in errors', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'boom', status: 500, code: 'unexpected_failure' } });
    expect(await signIn({ email: 'a@b.co', password: 'longenough' })).toEqual({ ok: false, error: 'Sign-in is unavailable for a moment. Please try again in a few minutes.' });
  });
  it('treats the invalid_credentials code as a wrong password', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'x', status: 422, code: 'invalid_credentials' } });
    expect(await signIn({ email: 'a@b.co', password: 'longenough' })).toEqual({ ok: false, error: 'That email and password don’t match.' });
  });
  it('is turned away when rate limited', async () => {
    allowAction.mockResolvedValue('limited');
    expect(await signIn({ email: 'a@b.co', password: 'x' })).toEqual({ ok: false, error: 'Too many tries. Please wait a minute and try again.' });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
  it('asks for an email', async () => {
    expect(await signIn({ email: ' ', password: 'longenough' })).toEqual({ ok: false, error: 'Enter your email address.' });
  });
});

describe('requestPasswordReset', () => {
  it('sends a reset only to someone who administers a site, and always answers the same', async () => {
    findUserByEmail.mockResolvedValue({ id: 'u1' });
    getUserShops.mockResolvedValue([{ tenantId: 't', subdomain: 's', businessName: 'Classic Loafs' }]);
    expect(await requestPasswordReset({ email: 'maker@example.com' })).toEqual({ ok: true, message: RESET_SENT });
    expect(sendAuthLink).toHaveBeenCalledWith(expect.objectContaining({ kind: 'recovery', email: 'maker@example.com', siteName: 'Classic Loafs' }));
  });
  it('sends nothing for an unknown email but answers the same', async () => {
    findUserByEmail.mockResolvedValue(null);
    expect(await requestPasswordReset({ email: 'nobody@example.com' })).toEqual({ ok: true, message: RESET_SENT });
    expect(sendAuthLink).not.toHaveBeenCalled();
  });
  it('sends nothing when the account administers no site, and answers the same', async () => {
    findUserByEmail.mockResolvedValue({ id: 'u1' });
    getUserShops.mockResolvedValue([]);
    expect(await requestPasswordReset({ email: 'maker@example.com' })).toEqual({ ok: true, message: RESET_SENT });
    expect(sendAuthLink).not.toHaveBeenCalled();
  });
  it('also limits per email, keyed by a hash of the normalized address', async () => {
    findUserByEmail.mockResolvedValue(null);
    await requestPasswordReset({ email: ' Maker@Example.com ' });
    const hash = createHash('sha256').update('maker@example.com').digest('hex');
    expect(allowKey).toHaveBeenCalledWith(`reset-email:${hash}`);
  });
  it('is turned away when the email is rate limited', async () => {
    allowKey.mockResolvedValue('limited');
    expect(await requestPasswordReset({ email: 'maker@example.com' })).toEqual({ ok: false, error: 'Too many tries. Please wait a minute and try again.' });
    expect(findUserByEmail).not.toHaveBeenCalled();
  });
  it('fails closed when the email limiter is unavailable', async () => {
    allowKey.mockResolvedValue('unavailable');
    const r = await requestPasswordReset({ email: 'maker@example.com' });
    expect(r.ok).toBe(false);
    expect(findUserByEmail).not.toHaveBeenCalled();
  });
  it('shows a real error when sending fails', async () => {
    findUserByEmail.mockResolvedValue({ id: 'u1' });
    getUserShops.mockResolvedValue([{ tenantId: 't', subdomain: 's', businessName: 'S' }]);
    sendAuthLink.mockRejectedValue(new Error('Could not send the email: down'));
    expect(await requestPasswordReset({ email: 'maker@example.com' })).toEqual({
      ok: false,
      error: 'The reset email didn’t send. Please try again in a few minutes.',
    });
  });
});

const LINK_AGAIN = 'This link is no longer valid. Use Forgot password on the sign-in page to get a fresh one.';
const nowSec = () => Math.floor(Date.now() / 1000);
const claims = (amr: unknown) => getClaims.mockResolvedValue({ data: { claims: { amr } }, error: null });

describe('setPassword', () => {
  beforeEach(() => claims([{ method: 'otp', timestamp: nowSec() - 60 }]));

  it('requires a signed-in user', async () => {
    requireUser.mockRejectedValue(new Error('REDIRECT /signin'));
    await expect(setPassword({ password: 'longenough1', confirm: 'longenough1' })).rejects.toThrow('REDIRECT /signin');
    expect(updateUser).not.toHaveBeenCalled();
  });
  it('refuses short passwords', async () => {
    expect(await setPassword({ password: 'short', confirm: 'short' })).toEqual({ ok: false, error: 'Use at least 10 characters.' });
  });
  it('refuses a mismatch', async () => {
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough2' })).toEqual({ ok: false, error: 'The two passwords don’t match.' });
  });
  it('rejects a session that signed in with a password', async () => {
    claims([{ method: 'password', timestamp: nowSec() - 5 }]);
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough1' })).toEqual({ ok: false, error: LINK_AGAIN });
    expect(updateUser).not.toHaveBeenCalled();
  });
  it('rejects a stale link session', async () => {
    claims([{ method: 'otp', timestamp: nowSec() - 16 * 60 }]);
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough1' })).toEqual({ ok: false, error: LINK_AGAIN });
    expect(updateUser).not.toHaveBeenCalled();
  });
  it('rejects a link timestamp in the future', async () => {
    claims([{ method: 'otp', timestamp: nowSec() + 120 }]);
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough1' })).toEqual({ ok: false, error: LINK_AGAIN });
    expect(updateUser).not.toHaveBeenCalled();
  });
  it('rejects when the claims cannot be read', async () => {
    getClaims.mockResolvedValue({ data: null, error: { message: 'Auth session missing!' } });
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough1' })).toEqual({ ok: false, error: LINK_AGAIN });
  });
  it.each(['otp', 'recovery', 'invite', 'magiclink'])('accepts a fresh %s session', async (method) => {
    claims([{ method, timestamp: nowSec() - 30 }]);
    updateUser.mockResolvedValue({ error: null });
    await expect(setPassword({ password: 'longenough1', confirm: 'longenough1' })).rejects.toThrow('REDIRECT /manage');
    expect(updateUser).toHaveBeenCalledWith({ password: 'longenough1' });
  });
  it('shows the error when saving fails', async () => {
    updateUser.mockResolvedValue({ error: { message: 'weak' } });
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough1' })).toEqual({ ok: false, error: 'Your password wasn’t saved: weak' });
  });
  it('maps a missing session at save time to the same message', async () => {
    updateUser.mockResolvedValue({ error: { message: 'Auth session missing!', name: 'AuthSessionMissingError' } });
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough1' })).toEqual({ ok: false, error: LINK_AGAIN });
  });
});
