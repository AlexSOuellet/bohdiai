// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type * as Subscribe from '@/lib/newsletter/subscribe';

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
const formLimitResponse = vi.fn();
vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: (...a: unknown[]) => formLimitResponse(...a) }));
const subscribe = vi.fn();
vi.mock('@/lib/newsletter/subscribe', async (orig) => {
  const real: typeof Subscribe = await orig();
  return { ...real, subscribe: (...a: unknown[]) => subscribe(...a) };
});

const { POST } = await import('./route');

const post = (body: unknown) =>
  POST(
    new Request('https://bohdiai.com/api/newsletter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

describe('POST /api/newsletter', () => {
  beforeEach(() => {
    formLimitResponse.mockReset().mockResolvedValue(null);
    subscribe.mockReset().mockResolvedValue({ ok: true });
    vi.stubEnv('BEEHIIV_API_KEY', 'key');
    vi.stubEnv('BEEHIIV_PUBLICATION_ID', 'pub_1');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('signs the visitor up', async () => {
    const res = await post({ email: 'pat@example.com' });
    expect(res.status).toBe(200);
    expect(subscribe).toHaveBeenCalledWith('pat@example.com', { apiKey: 'key', publicationId: 'pub_1' });
  });

  it('answers ok to a bot and signs nobody up', async () => {
    expect((await post({ email: 'a@b.co', company: 'x' })).status).toBe(200);
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('says what’s wrong with a bad email or body', async () => {
    const bad = await post({ email: 'nope' });
    expect(bad.status).toBe(400);
    expect(((await bad.json()) as { error: string }).error).toMatch(/doesn’t look right/);
    expect((await post('not json')).status).toBe(400);
  });

  it('tells the visitor when signups aren’t set up', async () => {
    vi.stubEnv('BEEHIIV_API_KEY', '');
    const res = await post({ email: 'pat@example.com' });
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: string }).error).toMatch(/aren’t open yet/);
  });

  it('reports a beehiiv rejection and a crash', async () => {
    subscribe.mockResolvedValue({ ok: false, status: 401, detail: 'bad key' });
    expect((await post({ email: 'pat@example.com' })).status).toBe(502);
    subscribe.mockRejectedValue(new Error('network'));
    expect((await post({ email: 'pat@example.com' })).status).toBe(500);
  });

  it('respects the rate limit', async () => {
    formLimitResponse.mockResolvedValue(Response.json({ error: 'slow down' }, { status: 429 }));
    expect((await post({ email: 'pat@example.com' })).status).toBe(429);
    expect(subscribe).not.toHaveBeenCalled();
  });
});
