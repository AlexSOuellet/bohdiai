import { describe, it, expect, vi, beforeEach } from 'vitest';

const { requireUser, getUserShops } = vi.hoisted(() => ({ requireUser: vi.fn(), getUserShops: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ requireUser }));
vi.mock('@/lib/auth/membership', () => ({ getUserShops }));

import { POST } from './route';

const URL_ = 'https://app.bohdiai.com/manage/switch-site';
const send = (body: BodyInit | null, headers: Record<string, string> = {}) =>
  POST(new Request(URL_, { method: 'POST', body, headers }));
const form = (tenantId: string) => new URLSearchParams({ tenantId });

beforeEach(() => {
  vi.resetAllMocks();
  requireUser.mockResolvedValue({ id: 'u1' });
  getUserShops.mockResolvedValue([{ tenantId: 'a', subdomain: 'alpha', businessName: 'Alpha' }]);
});

describe('POST /manage/switch-site', () => {
  it('sets the cookie for a site the person administers', async () => {
    const res = await send(form('a'));
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/manage');
    expect(res.headers.get('set-cookie')).toContain('bohdi_site=a');
  });

  it('does not set the cookie for someone else’s site', async () => {
    const res = await send(form('zzz'));
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/manage');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('does not set the cookie when the Origin is another site', async () => {
    const res = await send(form('a'), { origin: 'https://evil.example' });
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(getUserShops).not.toHaveBeenCalled();
  });

  it('accepts a matching Origin', async () => {
    const res = await send(form('a'), { origin: 'https://app.bohdiai.com' });
    expect(res.headers.get('set-cookie')).toContain('bohdi_site=a');
  });

  it('goes home on a body that is not a form', async () => {
    const res = await send('{"tenantId":"a"}', { 'content-type': 'application/json' });
    expect(res.headers.get('location')).toBe('https://app.bohdiai.com/manage');
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('lets the sign-in redirect through when signed out', async () => {
    requireUser.mockRejectedValue(new Error('REDIRECT /signin'));
    await expect(send(form('a'))).rejects.toThrow('REDIRECT /signin');
  });
});
