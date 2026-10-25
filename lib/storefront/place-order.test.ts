// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as Catalog from '@/lib/storefront/catalog';

function chain(next: () => unknown, calls: string[]): unknown {
  const p: unknown = new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === 'then') return (ok: (v: unknown) => unknown, bad: (e: unknown) => unknown) => Promise.resolve(next()).then(ok, bad);
      return (...args: unknown[]) => {
        calls.push(`${String(prop)}(${args.map((a) => JSON.stringify(a)).join(',')})`);
        return p;
      };
    },
  });
  return p;
}

const A = '00000000-0000-4000-8000-000000000001';
const state = vi.hoisted(() => ({
  queue: [] as unknown[],
  calls: [] as string[],
  rpc: [] as { data: unknown; error: unknown }[],
  features: new Set<string>(['cart']),
  loaded: [] as unknown[],
  promos: [] as unknown[],
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => state.features }));
vi.mock('@/lib/storefront/promotions-load', () => ({ loadShopPromotions: async () => ({ promos: state.promos, today: '2026-10-25' }) }));
vi.mock('@/lib/storefront/catalog', async (orig) => ({ ...(await orig<typeof Catalog>()), loadProductsByIds: async () => state.loaded }));

const db = () =>
  ({
    from: (t: string) => {
      state.calls.push(`from(${t})`);
      return chain(() => state.queue.shift() ?? { data: null, error: null }, state.calls);
    },
    rpc: async (name: string, args: unknown) => {
      state.calls.push(`rpc(${name},${JSON.stringify(args)})`);
      return state.rpc.shift() ?? { data: null, error: null };
    },
  }) as never;

const { placeCartOrder } = await import('./place-order');

const snowman = { view: { id: A, slug: 'snowman', name: 'Skinny Snowman bundle', price: '$6', description: '', status: 'active', media: [], variations: [] }, priceCents: 600, isPreview: false };
const input = { name: 'Pat', email: 'pat@example.com', phone: '', note: '', listingIds: [A], code: '' };
const shop = { data: { business_name: 'Rustic Charm & More', contact_email: 'alex@bohdiai.com', currency: 'usd' }, error: null };
const placedRow = { data: { id: 'o1', total_cents: 600 }, error: null };

beforeEach(() => {
  state.queue = [];
  state.calls = [];
  state.rpc = [];
  state.features = new Set(['cart']);
  state.loaded = [snowman];
  state.promos = [];
});

describe('placeCartOrder', () => {
  it('saves a pending order priced from the catalog', async () => {
    state.queue.push(shop, placedRow);
    state.rpc.push({ data: '1001', error: null });
    const r = await placeCartOrder(db(), 't1', input, { verb: 'pay for' });
    expect(r).toEqual({
      ok: true,
      order: { orderId: 'o1', orderNumber: '1001', shopName: 'Rustic Charm & More', contactEmail: 'alex@bohdiai.com', currency: 'USD', lines: [{ listingId: A, variantId: null, name: 'Skinny Snowman bundle', option: null, priceCents: 600 }], subtotalCents: 600, discount: null, totalCents: 600 },
    });
    expect(state.calls.join(' ')).toContain('"unit_price_cents":600');
  });

  it('takes a running sale off, worked out again on the server', async () => {
    state.promos = [{ id: 'p1', kind: 'sale', name: 'Fall sale', code: null, percentOff: 50, amountOffCents: null, startsOn: null, endsOn: null, maxUses: null, uses: 0, active: true }];
    state.queue.push({ ...shop, data: { ...shop.data, currency: '' } }, { data: { id: 'o1', total_cents: 300 }, error: null });
    state.rpc.push({ data: '1002', error: null });
    const r = await placeCartOrder(db(), 't1', input, { verb: 'send' });
    expect(r.ok && r.order.currency).toBe('USD');
    expect(r.ok && r.order.totalCents).toBe(300);
  });

  it('turns away a missing shop, a shop without the cart, or one with nowhere to send orders', async () => {
    state.queue.push({ data: null, error: null });
    expect(await placeCartOrder(db(), 't1', input, { verb: 'send' })).toEqual({ ok: false, refusal: { status: 404, error: 'Shop not found.' } });
    state.queue.push(shop);
    state.features = new Set();
    expect((await placeCartOrder(db(), 't1', input, { verb: 'send' })).ok).toBe(false);
    state.features = new Set(['cart']);
    state.queue.push({ data: { ...shop.data, contact_email: '' }, error: null });
    const none = await placeCartOrder(db(), 't1', input, { verb: 'send' });
    expect(!none.ok && none.refusal.status).toBe(503);
    state.queue.push({ data: { ...shop.data, contact_email: null }, error: null });
    expect((await placeCartOrder(db(), 't1', input, { verb: 'send' })).ok).toBe(false);
  });

  it('names pieces that can’t be had any more, in the words of what she’s doing', async () => {
    state.queue.push(shop);
    state.loaded = [];
    const r = await placeCartOrder(db(), 't1', input, { verb: 'pay for' });
    expect(!r.ok && r.refusal.status).toBe(409);
    expect(!r.ok && r.refusal.unavailable?.length).toBe(1);
    expect(!r.ok && r.refusal.error).toContain('to pay for the rest');
  });

  it('refuses a code that isn’t good any more', async () => {
    state.queue.push(shop);
    const r = await placeCartOrder(db(), 't1', { ...input, code: 'NOPE' }, { verb: 'pay for' });
    expect(!r.ok && r.refusal.status).toBe(409);
  });

  it('applies a good code', async () => {
    state.promos = [{ id: 'p2', kind: 'code', name: 'Five off', code: 'FIVE', percentOff: null, amountOffCents: 100, startsOn: null, endsOn: null, maxUses: null, uses: 0, active: true }];
    state.queue.push(shop, { data: { id: 'o1', total_cents: 500 }, error: null });
    state.rpc.push({ data: '1003', error: null });
    const r = await placeCartOrder(db(), 't1', { ...input, code: 'FIVE' }, { verb: 'pay for' });
    expect(r.ok).toBe(true);
    expect(state.calls.join(' ')).toContain('"p_promotion_id":"p2"');
  });

  it('says so when a piece is taken or the code ends at the last moment', async () => {
    state.queue.push(shop);
    state.rpc.push({ data: null, error: { code: 'P0021', message: 'taken' } });
    expect(await placeCartOrder(db(), 't1', input, { verb: 'pay for' })).toMatchObject({ ok: false, refusal: { status: 409 } });
    state.queue.push(shop);
    state.rpc.push({ data: null, error: { code: 'P0022', message: 'ended' } });
    const r = await placeCartOrder(db(), 't1', input, { verb: 'pay for' });
    expect(!r.ok && r.refusal.error).toContain('pay for your order');
  });

  it('fails loudly on anything else', async () => {
    state.queue.push({ data: null, error: { message: 'down' } });
    await expect(placeCartOrder(db(), 't1', input, { verb: 'send' })).rejects.toThrow('tenant lookup');
    state.queue.push(shop);
    state.rpc.push({ data: null, error: { code: 'XX', message: 'boom' } });
    await expect(placeCartOrder(db(), 't1', input, { verb: 'send' })).rejects.toThrow('place_order_request');
    state.queue.push(shop, { data: null, error: { message: 'gone' } });
    state.rpc.push({ data: '1004', error: null });
    await expect(placeCartOrder(db(), 't1', input, { verb: 'send' })).rejects.toThrow('placed order lookup');
  });
});
