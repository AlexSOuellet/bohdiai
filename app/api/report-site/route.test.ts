// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = vi.hoisted(() => ({
  inserted: [] as unknown[],
  tenant: { id: 't1', business_name: 'Rustic Charm', subdomain: 'rustic-charm' } as null | Record<
    string,
    string
  >,
  error: null as null | { message: string },
  told: [] as unknown[],
}));
vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: async () => null }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (t: string) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        is: () => chain,
        maybeSingle: async () => ({ data: state.tenant, error: null }),
        insert: async (row: unknown) => {
          state.inserted.push({ t, row });
          return { error: state.error };
        },
      };
      return chain;
    },
  }),
}));
vi.mock('@/lib/site-reports/tell', () => ({
  tellAlex: async (r: unknown) => void state.told.push(r),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

const { POST } = await import('./route');
const post = (body: unknown): Request =>
  new Request('https://bohdiai.com/api/report-site', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
const good = { site: 'rustic-charm', reason: 'scam', details: 'Never shipped.', email: '' };

beforeEach(() => {
  state.inserted = [];
  state.told = [];
  state.error = null;
  state.tenant = { id: 't1', business_name: 'Rustic Charm', subdomain: 'rustic-charm' };
});

describe('POST /api/report-site (go-live step 3, Alex 2026-11-16)', () => {
  it('saves the report against the site and emails Alex', async () => {
    const res = await POST(post(good));
    expect(res.status).toBe(200);
    expect(state.inserted).toEqual([
      {
        t: 'site_reports',
        row: { tenant_id: 't1', reason: 'scam', details: 'Never shipped.', email: '' },
      },
    ]);
    expect(state.told).toEqual([
      expect.objectContaining({ siteName: 'Rustic Charm', tenantId: 't1', reason: 'scam' }),
    ]);
  });
  it('names what to fix, and saves nothing', async () => {
    const res = await POST(post({ ...good, details: '' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ problem: 'details' });
    expect(state.inserted).toEqual([]);
  });
  it('says so when there’s no site at that address', async () => {
    state.tenant = null;
    expect(await (await POST(post(good))).json()).toEqual({ problem: 'notFound' });
    expect(state.told).toEqual([]);
  });
  it('answers a bot as if it worked, and saves nothing', async () => {
    expect((await POST(post({ ...good, company: 'Acme' }))).status).toBe(200);
    expect(state.inserted).toEqual([]);
  });
  it('says it failed when it can’t be saved, and emails no one', async () => {
    state.error = { message: 'down' };
    const res = await POST(post(good));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ failed: true });
    expect(state.told).toEqual([]);
  });
});
