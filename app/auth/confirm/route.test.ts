import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifyOtp = vi.fn();
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: async () => ({ auth: { verifyOtp } }),
}));

import { GET } from './route';

const req = (qs: string) => new Request(`https://app.bohdiai.com/auth/confirm${qs}`);

describe('GET /auth/confirm', () => {
  beforeEach(() => verifyOtp.mockReset());

  it('verifies an invite and goes to set-password', async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const res = await GET(req('?token_hash=t&type=invite'));
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 't', type: 'invite' });
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/manage/set-password');
  });

  it('verifies a recovery and goes to set-password', async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const res = await GET(req('?token_hash=t&type=recovery'));
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/manage/set-password');
  });

  it('sends a bad or used token to the error page', async () => {
    verifyOtp.mockResolvedValue({ error: { message: 'expired' } });
    const res = await GET(req('?token_hash=t&type=invite'));
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/auth/error?reason=link');
  });

  it('refuses unknown types without calling Supabase', async () => {
    const res = await GET(req('?token_hash=t&type=signup'));
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/auth/error?reason=link');
  });
});
