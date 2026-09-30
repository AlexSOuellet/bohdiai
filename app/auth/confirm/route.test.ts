import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyOtp = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({ auth: { verifyOtp } }),
}));

import { GET, POST } from './route';

const ERROR = 'https://app.bohdiai.com/auth/error?reason=link';
const get = (qs: string) => new Request(`https://app.bohdiai.com/auth/confirm${qs}`);
const post = (fields: Record<string, string>) =>
  new Request('https://app.bohdiai.com/auth/confirm', { method: 'POST', body: new URLSearchParams(fields) });

beforeEach(() => verifyOtp.mockReset());

describe('GET /auth/confirm', () => {
  it('redirects to the Continue page and does not spend the token', async () => {
    const res = await GET(get('?token_hash=t&type=invite'));
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/auth/continue?token_hash=t&type=invite');
  });

  it('encodes the token in the redirect', async () => {
    const res = await GET(get('?token_hash=a%26b%3Dc&type=recovery'));
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/auth/continue?token_hash=a%26b%3Dc&type=recovery');
  });

  it.each(['', '?type=invite', '?token_hash=t', '?token_hash=&type=invite', '?token_hash=t&type=signup'])(
    'sends %j to the error page',
    async (qs) => {
      const res = await GET(get(qs));
      expect(res.status).toBe(303);
      expect(res.headers.get('location')).toBe(ERROR);
    },
  );
});

describe('POST /auth/confirm', () => {
  it.each(['invite', 'recovery'])('verifies a %s and goes to set-password', async (type) => {
    verifyOtp.mockResolvedValue({ error: null });
    const res = await POST(post({ token_hash: 't', type }));
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 't', type });
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/manage/set-password');
  });

  it('sends a bad or used token to the error page', async () => {
    verifyOtp.mockResolvedValue({ error: { message: 'expired' } });
    const res = await POST(post({ token_hash: 't', type: 'invite' }));
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe(ERROR);
  });

  it.each([{ type: 'invite' }, { token_hash: '', type: 'invite' }, { token_hash: 't', type: 'signup' }, { token_hash: 't' }])(
    'refuses %j without calling Supabase',
    async (fields) => {
      const res = await POST(post(fields));
      expect(verifyOtp).not.toHaveBeenCalled();
      expect(res.headers.get('location')).toBe(ERROR);
    },
  );

  it('refuses a cross-origin post without calling Supabase', async () => {
    const req = new Request('https://app.bohdiai.com/auth/confirm', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
      body: new URLSearchParams({ token_hash: 't', type: 'invite' }),
    });
    const res = await POST(req);
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get('location')).toBe(ERROR);
  });

  it('accepts a same-origin post', async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const req = new Request('https://app.bohdiai.com/auth/confirm', {
      method: 'POST',
      headers: { origin: 'https://app.bohdiai.com' },
      body: new URLSearchParams({ token_hash: 't', type: 'invite' }),
    });
    expect((await POST(req)).headers.get('location')).toBe('https://app.bohdiai.com/manage/set-password');
  });
});
