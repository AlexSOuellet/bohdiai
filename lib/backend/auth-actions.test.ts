import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as ActionLimit from './action-limit';

const { signInWithPassword, updateUser, signOut, allowAction, sendAuthLink, getUserShops, findUserByEmail } = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  allowAction: vi.fn(),
  sendAuthLink: vi.fn(),
  getUserShops: vi.fn(),
  findUserByEmail: vi.fn(),
}));

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({ auth: { signInWithPassword, updateUser, signOut, getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) } }),
}));
vi.mock('./action-limit', async (importOriginal) => ({ ...(await importOriginal<typeof ActionLimit>()), allowAction }));
vi.mock('./auth-links', () => ({ sendAuthLink }));
vi.mock('@/lib/auth/membership', () => ({ getUserShops }));
vi.mock('./user-lookup', () => ({ findUserByEmail }));
vi.mock('next/navigation', () => ({ redirect: vi.fn((p: string) => { throw new Error(`REDIRECT ${p}`); }) }));

import { signIn, requestPasswordReset, setPassword, RESET_SENT } from './auth-actions';

beforeEach(() => {
  vi.clearAllMocks();
  allowAction.mockResolvedValue('allowed');
});

describe('signIn', () => {
  it('signs in and goes to the backend', async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    await expect(signIn({ email: ' Maker@Example.com ', password: 'longenough' })).rejects.toThrow('REDIRECT /manage');
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'maker@example.com', password: 'longenough' });
  });
  it('gives one message for any wrong email or password', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
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

describe('setPassword', () => {
  it('refuses short passwords', async () => {
    expect(await setPassword({ password: 'short', confirm: 'short' })).toEqual({ ok: false, error: 'Use at least 10 characters.' });
  });
  it('refuses a mismatch', async () => {
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough2' })).toEqual({ ok: false, error: 'The two passwords don’t match.' });
  });
  it('saves and goes to the backend', async () => {
    updateUser.mockResolvedValue({ error: null });
    await expect(setPassword({ password: 'longenough1', confirm: 'longenough1' })).rejects.toThrow('REDIRECT /manage');
    expect(updateUser).toHaveBeenCalledWith({ password: 'longenough1' });
  });
  it('shows the error when saving fails', async () => {
    updateUser.mockResolvedValue({ error: { message: 'weak' } });
    expect(await setPassword({ password: 'longenough1', confirm: 'longenough1' })).toEqual({ ok: false, error: 'Your password wasn’t saved: weak' });
  });
});
