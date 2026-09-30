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
  it('shows a Continue form and does not spend the token', async () => {
    const res = await GET(get('?token_hash=t&type=invite'));
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('method="post"');
    expect(html).toContain('name="token_hash" value="t"');
    expect(html).toContain('name="type" value="invite"');
    expect(html).toContain('Continue');
  });

  it('escapes the token in the page', async () => {
    const html = await (await GET(get('?token_hash=%22%3E%3Cscript%3E&type=recovery'))).text();
    expect(html).not.toContain('<script>');
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
});
