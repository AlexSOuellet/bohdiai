import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cronKey, CRON_KEY_HEADER } from '@/lib/visits/cron-key';

const state = vi.hoisted(() => ({ reader: true, result: { saved: 1, sites: 1, failed: [] as string[] } as unknown, throws: false }));
const logger = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/logger', () => ({ logger }));
vi.mock('@/lib/visits/queries', () => ({ appVisitsReader: () => (state.reader ? () => Promise.resolve([]) : null) }));
vi.mock('@/lib/visits/months', () => ({
  saveFinishedMonths: () => (state.throws ? Promise.reject(new Error('db down')) : Promise.resolve(state.result)),
}));

const { POST } = await import('./route');
const SECRET = 'x'.repeat(40);

async function call(key: string | null): Promise<Response> {
  return POST(new Request('https://bohdiai.com/api/cron/visit-months', { method: 'POST', headers: key === null ? {} : { [CRON_KEY_HEADER]: key } }));
}

beforeEach(() => {
  vi.stubEnv('BACKEND_SESSION_SECRET', SECRET);
  state.reader = true;
  state.throws = false;
  state.result = { saved: 1, sites: 1, failed: [] };
  logger.error.mockReset();
});

describe('POST /api/cron/visit-months', () => {
  it('is not found without the job key', async () => {
    expect((await call(null)).status).toBe(404);
    expect((await call('nope')).status).toBe(404);
  });
  it('saves the months with the key', async () => {
    const res = await call(await cronKey(SECRET, 'visit-months'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ saved: 1, sites: 1, failed: [] });
  });
  it('answers and logs every failure', async () => {
    const key = await cronKey(SECRET, 'visit-months');
    state.reader = false;
    expect((await call(key)).status).toBe(503);
    state.reader = true;
    state.result = { saved: 0, sites: 1, failed: ['t 2026-09-01: x'] };
    expect((await call(key)).status).toBe(500);
    state.throws = true;
    expect((await call(key)).status).toBe(500);
    expect(logger.error).toHaveBeenCalledTimes(3);
  });
});
