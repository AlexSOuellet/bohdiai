// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { allowFormSubmit, clientIp } from './rate-limit';

const logError = vi.fn();
vi.mock('@/lib/logger', () => ({ logger: { error: (...a: unknown[]) => logError(...a), warn: vi.fn(), info: vi.fn() } }));

// The app reads the binding from the Worker's env; a Worker set up without it has none.
vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => Promise.resolve({ env: {} }),
}));

function req(headers: Record<string, string> = {}): Request {
  return new Request('https://cut-pro-lawncare.bohdiai.com/api/estimate', { method: 'POST', headers });
}

function limiter(success: boolean | Error) {
  const keys: string[] = [];
  const binding = {
    limit: ({ key }: { key: string }) => {
      keys.push(key);
      return success instanceof Error ? Promise.reject(success) : Promise.resolve({ success });
    },
  };
  return { binding: binding as unknown as RateLimit, keys };
}

describe('clientIp', () => {
  it('reads the address Cloudflare stamps on the request', () => {
    expect(clientIp(req({ 'cf-connecting-ip': '203.0.113.7' }))).toBe('203.0.113.7');
  });

  it('ignores x-forwarded-for, which a visitor can write themselves', () => {
    expect(clientIp(req({ 'x-forwarded-for': '198.51.100.1' }))).toBeNull();
  });
});

describe('allowFormSubmit', () => {
  it('counts each visitor separately per form', async () => {
    const { binding, keys } = limiter(true);
    expect(await allowFormSubmit(req({ 'cf-connecting-ip': '203.0.113.7' }), 'estimate', binding)).toBe('allowed');
    expect(await allowFormSubmit(req({ 'cf-connecting-ip': '203.0.113.7' }), 'contact', binding)).toBe('allowed');
    expect(keys).toEqual(['estimate:203.0.113.7', 'contact:203.0.113.7']);
  });

  it('says limited once the visitor has used their allowance', async () => {
    const { binding } = limiter(false);
    expect(await allowFormSubmit(req({ 'cf-connecting-ip': '203.0.113.7' }), 'estimate', binding)).toBe('limited');
  });

  it('is unavailable — not open — when the limiter errors, and logs why', async () => {
    logError.mockReset();
    const { binding } = limiter(new Error('limiter down'));
    expect(await allowFormSubmit(req({ 'cf-connecting-ip': '203.0.113.7' }), 'estimate', binding)).toBe('unavailable');
    expect(logError).toHaveBeenCalled();
  });

  it('is unavailable — not open — when the Worker has no limiter binding, and logs why', async () => {
    logError.mockReset();
    expect(await allowFormSubmit(req({ 'cf-connecting-ip': '203.0.113.7' }), 'estimate')).toBe('unavailable');
    expect(logError).toHaveBeenCalled();
  });
});

describe('formLimitResponse', () => {
  it('answers nothing when the visitor may go ahead', async () => {
    const { binding } = limiter(true);
    vi.doMock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => Promise.resolve({ env: { FORM_LIMITER: binding } }) }));
    vi.resetModules();
    const { formLimitResponse: fresh } = await import('./rate-limit');
    expect(await fresh(req(), 'contact', (m) => ({ error: m }))).toBeNull();
  });

  it('answers 429 in the form’s own shape when the visitor is over their allowance', async () => {
    const { binding } = limiter(false);
    vi.doMock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => Promise.resolve({ env: { FORM_LIMITER: binding } }) }));
    vi.resetModules();
    const { formLimitResponse: fresh } = await import('./rate-limit');
    const res = await fresh(req(), 'waitlist', (m) => ({ ok: false, message: m }));
    expect(res?.status).toBe(429);
    expect(await res?.json()).toEqual({ ok: false, message: expect.stringMatching(/wait a minute/i) });
  });

  it('answers 503 when the limiter is down, never letting the submission through', async () => {
    vi.doMock('@opennextjs/cloudflare', () => ({ getCloudflareContext: () => Promise.resolve({ env: {} }) }));
    vi.resetModules();
    const { formLimitResponse: fresh } = await import('./rate-limit');
    const res = await fresh(req(), 'contact', (m) => ({ error: m }));
    expect(res?.status).toBe(503);
    expect(await res?.json()).toEqual({ error: expect.stringMatching(/can’t send right now/i) });
  });
});
