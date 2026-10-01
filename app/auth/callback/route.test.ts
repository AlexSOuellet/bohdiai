import { describe, it, expect, vi, beforeEach } from 'vitest';

const exchangeCodeForSession = vi.fn();
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { exchangeCodeForSession } }) }));
vi.mock('next/headers', () => ({ cookies: async () => ({ getAll: () => [], set: () => undefined }) }));

import { GET } from './route';

const ORIGIN = 'https://app.bohdiai.com';
const get = (qs: string) => GET(new Request(`${ORIGIN}/auth/callback${qs}`));

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  exchangeCodeForSession.mockResolvedValue({ error: null });
});

describe('GET /auth/callback', () => {
  it('signs in and goes to a same-site next path', async () => {
    const res = await get('?code=c&next=%2Fmanage%2Fproducts%3Fx%3D1');
    expect(exchangeCodeForSession).toHaveBeenCalledWith('c');
    expect(res.headers.get('location')).toBe(`${ORIGIN}/manage/products?x=1`);
  });

  it('goes home when there is no next', async () => {
    expect((await get('?code=c')).headers.get('location')).toBe(`${ORIGIN}/`);
  });

  it.each(['//evil.com', '/\\evil.com', '@evil.com', '.evil.com/x', 'https://evil.com', 'evil', ''])(
    'never redirects off-site for next=%j',
    async (next) => {
      const res = await get(`?code=c&next=${encodeURIComponent(next)}`);
      expect(res.headers.get('location')).toBe(`${ORIGIN}/`);
    },
  );

  it('sends a failed exchange to the error page', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: 'bad code' } });
    expect((await get('?code=c&next=%2Fmanage')).headers.get('location')).toBe(`${ORIGIN}/auth/error`);
  });
});
