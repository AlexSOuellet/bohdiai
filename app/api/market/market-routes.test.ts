// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as Catalog from '@/lib/storefront/catalog';

const TENANT = '4b8f0f5e-8f3a-4a57-9a8e-1f2d3c4b5a69';
const EVENT = '00000000-0000-4000-8000-0000000000e1';
const THEO = '00000000-0000-4000-8000-000000000001';
const ORDER = '00000000-0000-4000-8000-0000000000a1';

const rpc = vi.fn();
const state = vi.hoisted(() => ({
  tenant: { business_name: 'Rose n’ Cat' } as { business_name: string } | null,
  features: new Set<string>(['market_shop']),
  brought: [] as string[],
  loaded: [] as unknown[],
  promos: [] as unknown[],
  pay: { venmo: 'renee', venmoOn: true, cashapp: '', cashappOn: false, zelle: '', zelleOn: false, cashOn: true },
}));

vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/lib/forms/rate-limit', () => ({ formLimitResponse: async () => null }));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => state.features }));
vi.mock('@/lib/market/queries', () => ({ marketListingIds: async () => state.brought, loadPaySettings: async () => state.pay }));
vi.mock('@/lib/storefront/promotions-load', () => ({ loadShopPromotions: async () => ({ promos: state.promos, today: '2026-10-10' }) }));
vi.mock('@/lib/storefront/catalog', async (orig) => ({ ...(await orig<typeof Catalog>()), loadProductsByIds: async () => state.loaded }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.tenant, error: null }) }) }) }) }),
    rpc: (...a: unknown[]) => rpc(...a),
  }),
}));

const { POST: hold } = await import('./hold/route');
const { POST: paid } = await import('./paid/route');
const { POST: release } = await import('./release/route');

const theo = {
  view: { id: THEO, slug: 'theo', name: 'Theo', price: '$120', description: '', status: 'active', media: [], variations: [] },
  priceCents: 12000,
  isPreview: false,
};

function request(url: string, body: unknown, tenant: string | null = TENANT): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (tenant !== null) headers.set('x-tenant-id', tenant);
  return new Request(`https://rose-n-cat.bohdiai.com${url}`, { method: 'POST', headers, body: JSON.stringify(body) });
}
const good = { eventId: EVENT, listingId: THEO, name: 'Pat', email: '', method: 'venmo', code: '' };

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ data: [{ order_id: ORDER, order_number: '1004' }], error: null });
  state.tenant = { business_name: 'Rose n’ Cat' };
  state.features = new Set(['market_shop']);
  state.brought = [THEO];
  state.loaded = [theo];
  state.promos = [];
});

describe('POST /api/market/hold', () => {
  it('holds the baby and hands back the Venmo step with the amount', async () => {
    const res = await hold(request('/api/market/hold', good));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { orderId: string; amount: string; pay: { method: string; link: string; handle: string } };
    expect(body).toMatchObject({ orderId: ORDER, orderNumber: '1004', piece: 'Theo', amount: '$120', discount: null });
    expect(body.pay.handle).toBe('@renee');
    expect(body.pay.link).toContain('venmo.com/renee?txn=pay&amount=120');
    expect(rpc).toHaveBeenCalledWith('market_hold', expect.objectContaining({ p_event_id: EVENT, p_listing_id: THEO, p_name: 'Pat', p_method: 'venmo', p_price_cents: 12000, p_discount_cents: 0 }));
  });

  it('takes a market code off and counts it', async () => {
    state.promos = [{ id: 'c1', kind: 'code', name: 'MARKET10', code: 'MARKET10', percentOff: 10, amountOffCents: null, startsOn: null, endsOn: null, maxUses: null, uses: 0, active: true }];
    const res = await hold(request('/api/market/hold', { ...good, code: 'market10' }));
    expect(((await res.json()) as { amount: string }).amount).toBe('$108');
    expect(rpc).toHaveBeenCalledWith('market_hold', expect.objectContaining({ p_discount_cents: 1200, p_discount_label: 'MARKET10', p_promotion_id: 'c1' }));
  });

  it('refuses what it should, in plain words', async () => {
    expect((await hold(request('/api/market/hold', good, null))).status).toBe(404);
    expect((await hold(request('/api/market/hold', { ...good, name: '' }))).status).toBe(400);
    state.features = new Set();
    expect((await hold(request('/api/market/hold', good))).status).toBe(404);
    state.features = new Set(['market_shop']);
    state.brought = [];
    expect((await hold(request('/api/market/hold', good))).status).toBe(409);
    state.brought = [THEO];
    state.loaded = [{ ...theo, view: { ...theo.view, status: 'sold_out' } }];
    expect((await hold(request('/api/market/hold', good))).status).toBe(409);
    state.loaded = [theo];
    expect((await hold(request('/api/market/hold', { ...good, code: 'NOPE' }))).status).toBe(409);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('turns the database’s refusals into plain words', async () => {
    for (const code of ['P0040', 'P0021', 'P0041', 'P0022']) {
      rpc.mockResolvedValueOnce({ data: null, error: { code, message: 'x' } });
      const res = await hold(request('/api/market/hold', good));
      expect(res.status).toBe(409);
    }
    rpc.mockResolvedValueOnce({ data: null, error: { code: 'XX000', message: 'x' } });
    expect((await hold(request('/api/market/hold', good))).status).toBe(500);
  });
});

describe('POST /api/market/paid and /release', () => {
  it('marks a hold paid, or releases it', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect((await paid(request('/api/market/paid', { orderId: ORDER }))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('market_mark_paid', { p_tenant_id: TENANT, p_order_id: ORDER });
    expect((await release(request('/api/market/release', { orderId: ORDER }))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('market_release', { p_tenant_id: TENANT, p_order_id: ORDER });
  });
  it('says so when the hold is not open, the request is wrong, or the shop is missing', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'P0002', message: 'x' } });
    expect((await paid(request('/api/market/paid', { orderId: ORDER }))).status).toBe(409);
    expect((await paid(request('/api/market/paid', { orderId: 'nope' }))).status).toBe(400);
    expect((await release(request('/api/market/release', { orderId: ORDER }, null))).status).toBe(404);
    rpc.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'x' } });
    expect((await release(request('/api/market/release', { orderId: ORDER }))).status).toBe(500);
  });
});
