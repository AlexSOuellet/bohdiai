import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => Promise.resolve({ env: {} }) }));

const { allowCheckup, checkupLimitResponse } = await import('./limit');

const req = new Request('https://bohdiai.com/api/checkup/next', { headers: { 'cf-connecting-ip': '1.2.3.4' } });
const limiter = (success: boolean): RateLimit => ({ limit: vi.fn().mockResolvedValue({ success }) });

describe('checkup rate limit', () => {
  it('keys by visitor and lets them through under the limit', async () => {
    const l = limiter(true);
    expect(await allowCheckup(req, l)).toBe('allowed');
    expect(l.limit).toHaveBeenCalledWith({ key: 'checkup:1.2.3.4' });
    expect(await checkupLimitResponse(req, l)).toBeNull();
  });

  it('turns them away when over, and fails closed without the binding', async () => {
    const over = await checkupLimitResponse(req, limiter(false));
    expect(over?.status).toBe(429);
    expect(await allowCheckup(req)).toBe('unavailable');
    expect((await checkupLimitResponse(req))?.status).toBe(503);
  });
});
