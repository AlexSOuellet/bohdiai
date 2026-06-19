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

import { getCurrentUser } from './session';

const USER = { id: 'u1', email: 'maker@example.com' };

beforeEach(() => {
  getUserResult = { data: { user: null }, error: null };
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
