import { describe, it, expect, vi, beforeEach } from 'vitest';

let getUserResult: { data: { user: unknown }; error: unknown } = {
  data: { user: null },
  error: null,
};

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve({
      auth: { getUser: () => Promise.resolve(getUserResult) },
    }),
}));

const redirectMock = vi.fn((path: string): never => {
  throw new Error(`REDIRECT:${path}`);
});
vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}));

import { getCurrentUser, requireUser } from './session';

const USER = { id: 'u1', email: 'maker@example.com' };

beforeEach(() => {
  getUserResult = { data: { user: null }, error: null };
  redirectMock.mockClear();
});

describe('getCurrentUser', () => {
  it('returns the user when a session exists', async () => {
    getUserResult = { data: { user: USER }, error: null };
    expect(await getCurrentUser()).toEqual(USER);
  });

  it('returns null when there is no session', async () => {
    getUserResult = { data: { user: null }, error: { message: 'no session' } };
    expect(await getCurrentUser()).toBeNull();
  });
});

describe('requireUser', () => {
  it('returns the user when logged in', async () => {
    getUserResult = { data: { user: USER }, error: null };
    expect(await requireUser()).toEqual(USER);
  });

  it('redirects to /signin when logged out', async () => {
    getUserResult = { data: { user: null }, error: null };
    await expect(requireUser()).rejects.toThrow('REDIRECT:/signin');
    expect(redirectMock).toHaveBeenCalledWith('/signin');
  });
});
