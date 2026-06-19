import { describe, it, expect, vi, beforeEach } from 'vitest';

const oauthMock = vi.fn();

vi.mock('@/lib/supabase-browser', () => ({
  createSupabaseBrowserClient: () => ({
    auth: { signInWithOAuth: (args: unknown) => oauthMock(args) },
  }),
}));

import { signInWithGoogle } from './oauth';

beforeEach(() => {
  oauthMock.mockReset();
  oauthMock.mockResolvedValue({ data: { url: 'https://accounts.google.com/...' }, error: null });
});

describe('signInWithGoogle', () => {
  it('starts the Google OAuth flow with a callback redirect carrying the next path', async () => {
    const result = await signInWithGoogle('/onboarding');

    expect(result).toEqual({ ok: true });
    const arg = oauthMock.mock.calls[0]?.[0] as {
      provider: string;
      options: { redirectTo: string };
    };
    expect(arg.provider).toBe('google');
    expect(arg.options.redirectTo).toContain('/auth/callback?next=');
    expect(arg.options.redirectTo).toContain(encodeURIComponent('/onboarding'));
  });

  it('defaults the next path to the home page', async () => {
    await signInWithGoogle();
    const arg = oauthMock.mock.calls[0]?.[0] as { options: { redirectTo: string } };
    expect(arg.options.redirectTo).toContain(encodeURIComponent('/'));
  });

  it('returns the error when the provider call fails', async () => {
    oauthMock.mockResolvedValue({ data: null, error: { message: 'provider disabled' } });
    expect(await signInWithGoogle('/onboarding')).toEqual({ ok: false, error: 'provider disabled' });
  });
});
