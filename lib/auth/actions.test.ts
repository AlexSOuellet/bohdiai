import { describe, it, expect, vi, beforeEach } from 'vitest';

const signUpMock = vi.fn();
const signInMock = vi.fn();

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: {
        signUp: (args: unknown) => signUpMock(args),
        signInWithPassword: (args: unknown) => signInMock(args),
      },
    }),
}));

import { signUpMaker, signInMaker } from './actions';

beforeEach(() => {
  signUpMock.mockReset();
  signInMock.mockReset();
  signUpMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  signInMock.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
});

describe('signUpMaker', () => {
  it('rejects an empty email without calling supabase', async () => {
    const result = await signUpMaker({ email: '  ', password: 'sup3rsecret' });
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/email/i) });
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it('rejects a too-short password without calling supabase', async () => {
    const result = await signUpMaker({ email: 'maker@example.com', password: 'short' });
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/password/i) });
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it('signs up with a normalized email and reports success', async () => {
    const result = await signUpMaker({ email: '  Maker@Example.com ', password: 'sup3rsecret' });
    expect(result).toEqual({ ok: true });
    expect(signUpMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'maker@example.com', password: 'sup3rsecret' }),
    );
  });

  it('surfaces the supabase error message on failure', async () => {
    signUpMock.mockResolvedValue({ data: { user: null }, error: { message: 'User already registered' } });
    const result = await signUpMaker({ email: 'maker@example.com', password: 'sup3rsecret' });
    expect(result).toEqual({ ok: false, error: 'User already registered' });
  });
});

describe('signInMaker', () => {
  it('signs in with a normalized email and reports success', async () => {
    const result = await signInMaker({ email: ' Maker@Example.com', password: 'sup3rsecret' });
    expect(result).toEqual({ ok: true });
    expect(signInMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'maker@example.com', password: 'sup3rsecret' }),
    );
  });

  it('surfaces an invalid-credentials error', async () => {
    signInMock.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } });
    const result = await signInMaker({ email: 'maker@example.com', password: 'wrongpass123' });
    expect(result).toEqual({ ok: false, error: 'Invalid login credentials' });
  });

  it('rejects an empty email without calling supabase', async () => {
    const result = await signInMaker({ email: '', password: 'sup3rsecret' });
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/email/i) });
    expect(signInMock).not.toHaveBeenCalled();
  });
});
