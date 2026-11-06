import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ getUserById: vi.fn(), generateLink: vi.fn(), verifyOtp: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({ auth: { admin: { getUserById: m.getUserById, generateLink: m.generateLink } } }) }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => ({ auth: { verifyOtp: m.verifyOtp } }) }));

import { inviteToken } from '@/lib/founder/invite-link';
import { POST } from './route';

const SECRET = 'a-secret-that-is-long-enough-to-trust-here';
const ORIGIN = 'https://app.bohdiai.com';
const openUser = { data: { user: { email: 'lena@example.com', app_metadata: { invite_open: true } } }, error: null };

const send = (token: string, origin = ORIGIN): Promise<Response> => POST(new Request(`${ORIGIN}/auth/invite/start`, { method: 'POST', headers: { origin }, body: new URLSearchParams({ t: token }) }));
const where = (res: Response): string | null => res.headers.get('location');

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('BACKEND_SESSION_SECRET', SECRET);
  m.getUserById.mockResolvedValue(openUser);
  m.generateLink.mockResolvedValue({ data: { properties: { hashed_token: 'tok' } }, error: null });
  m.verifyOtp.mockResolvedValue({ error: null });
});

describe('POST /auth/invite/start', () => {
  it('signs an open invite in and goes to set a password', async () => {
    const res = await send(await inviteToken(SECRET, 'u1'));
    expect(where(res)).toBe(`${ORIGIN}/auth/set-password`);
    expect(m.getUserById).toHaveBeenCalledWith('u1');
    expect(m.verifyOtp).toHaveBeenCalledWith({ token_hash: 'tok', type: 'recovery' });
  });
  it('sends a maker who already set a password to sign in, opening nothing', async () => {
    m.getUserById.mockResolvedValue({ data: { user: { email: 'lena@example.com', app_metadata: { invite_open: false } } }, error: null });
    expect(where(await send(await inviteToken(SECRET, 'u1')))).toBe(`${ORIGIN}/signin`);
    expect(m.generateLink).not.toHaveBeenCalled();
  });
  it('opens nothing for an account that was never invited', async () => {
    m.getUserById.mockResolvedValue({ data: { user: { email: 'lena@example.com', app_metadata: {} } }, error: null });
    expect(where(await send(await inviteToken(SECRET, 'u1')))).toBe(`${ORIGIN}/signin`);
    expect(m.generateLink).not.toHaveBeenCalled();
  });
  it('turns away a link we didn’t sign', async () => {
    expect(where(await send('u1.abc'))).toContain('/auth/error');
    expect(m.getUserById).not.toHaveBeenCalled();
  });
  it('turns away a post from another site', async () => {
    expect(where(await send(await inviteToken(SECRET, 'u1'), 'https://evil.example'))).toContain('/auth/error');
    expect(m.getUserById).not.toHaveBeenCalled();
  });
  it('turns away a post with nothing in it', async () => {
    expect(where(await POST(new Request(`${ORIGIN}/auth/invite/start`, { method: 'POST', headers: { origin: ORIGIN }, body: new URLSearchParams() })))).toContain('/auth/error');
    expect(where(await POST(new Request(`${ORIGIN}/auth/invite/start`, { method: 'POST', headers: { origin: ORIGIN }, body: 'x' })))).toContain('/auth/error');
  });
  it('fails closed without a secret to trust', async () => {
    const token = await inviteToken(SECRET, 'u1');
    vi.stubEnv('BACKEND_SESSION_SECRET', 'short');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(where(await send(token))).toContain('/auth/error');
  });
  it.each([
    ['the account can’t be read', () => m.getUserById.mockResolvedValue({ data: null, error: { message: 'down' } })],
    ['the sign-in can’t be made', () => m.generateLink.mockResolvedValue({ data: null, error: { message: 'down' } })],
    ['the sign-in doesn’t take', () => m.verifyOtp.mockResolvedValue({ error: { message: 'down' } })],
    ['something else fails', () => m.getUserById.mockRejectedValue('down')],
  ])('says the link is broken when %s', async (_name, breakIt) => {
    breakIt();
    expect(where(await send(await inviteToken(SECRET, 'u1')))).toContain('/auth/error');
  });
});
