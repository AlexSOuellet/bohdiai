import { describe, it, expect, vi, beforeEach } from 'vitest';

/** A stand-in for a Supabase query: any chain of calls, awaited, gives the next
 *  queued result (or the default). Every call is recorded. */
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

const state = vi.hoisted(() => ({
  features: new Set<string>(['market_shop', 'market_dates']),
  queue: [] as unknown[],
  calls: [] as string[],
  rpc: { data: null as unknown, error: null as unknown },
  loaded: [] as unknown[],
  promos: [] as unknown[],
  counts: new Map<string, unknown>(),
}));
const revalidatePath = vi.hoisted(() => vi.fn());
const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn() }));

const fakeDb = () => ({
  from: (t: string) => {
    state.calls.push(`from(${t})`);
    return chain(() => state.queue.shift() ?? { data: null, error: null }, state.calls);
  },
  rpc: async (name: string, args: unknown) => {
    state.calls.push(`rpc(${name},${JSON.stringify(args)})`);
    return state.rpc;
  },
});
vi.mock('@/lib/backend/current-site', () => ({ requireActingSite: async () => ({ user: { id: 'u1' }, site: { tenantId: 't1' } }) }));
vi.mock('@/lib/backend/site-features', () => ({ getSiteFeatures: async () => state.features }));
vi.mock('@/lib/backend/features', () => ({ loadSiteFeatures: async () => state.features }));
vi.mock('@/lib/supabase-server', () => ({ createSupabaseServerClient: async () => fakeDb() }));
vi.mock('@/lib/storefront/catalog', async (orig) => ({ ...(await orig<object>()), loadProductsByIds: async () => state.loaded }));
vi.mock('@/lib/storefront/promotions-load', () => ({ loadShopPromotions: async () => ({ promos: state.promos, today: '2026-10-10' }) }));
vi.mock('@/lib/backend/catalog/queries', () => ({
  listProducts: async () => [
    { id: 'l1', name: 'Theo', status: 'active', photoUrl: null, soldOut: false },
    { id: 'l2', name: 'Old', status: 'archived', photoUrl: null, soldOut: false },
  ],
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('@/lib/market/stock', async (orig) => ({ ...(await orig<object>()), marketPieceStock: async () => state.counts }));
vi.mock('@/lib/logger', () => ({ logger }));

const { loadPaySettings, marketListingIds } = await import('./queries');
const { loadMarketInfo, loadMarketShop } = await import('./shop-view');
const { listMarketOrders, takings } = await import('@/lib/backend/markets/today');
const { recordMarketSale } = await import('@/lib/backend/markets/today-actions');
const { savePaySettings } = await import('@/lib/backend/payments/actions');
const { shopPicks, marketPageUrl } = await import('@/lib/backend/markets/shop-props');
const { saveMarket } = await import('@/lib/backend/markets/actions');
const { emptyMarketForm } = await import('@/lib/backend/markets/market-form');
const { EMPTY_PAY } = await import('./pay');

const db = () => fakeDb() as never;
const theo = { view: { id: 'l1', slug: 'theo', name: 'Theo', price: '$120', priceCents: 12000, description: '', status: 'active', media: [], variations: [] }, priceCents: 12000, isPreview: false };

beforeEach(() => {
  state.features = new Set(['market_shop', 'market_dates']);
  state.queue = [];
  state.calls = [];
  state.rpc = { data: null, error: null };
  state.loaded = [theo];
  state.promos = [];
  state.counts = new Map();
  revalidatePath.mockReset();
  logger.error.mockReset();
});

describe('market shop reads', () => {
  it('reads payment settings, or the defaults when none are saved', async () => {
    state.queue = [{ data: { venmo: 'r', venmo_on: true, cashapp: null, cashapp_on: false, zelle: null, zelle_on: false, cash_on: true }, error: null }, { data: null, error: null }];
    expect((await loadPaySettings(db(), 't1')).venmoOn).toBe(true);
    expect(await loadPaySettings(db(), 't1')).toEqual(EMPTY_PAY);
    state.queue = [{ data: null, error: { message: 'down' } }];
    await expect(loadPaySettings(db(), 't1')).rejects.toThrow('down');
  });
  it('reads the pieces a market brings, in order', async () => {
    state.queue = [{ data: [{ listing_id: 'a', position: 0 }, { listing_id: 'b', position: 1 }], error: null }, { data: null, error: { message: 'down' } }];
    expect(await marketListingIds(db(), 'e1')).toEqual(['a', 'b']);
    await expect(marketListingIds(db(), 'e1')).rejects.toThrow('down');
  });
});

describe('loadMarketShop', () => {
  const event = { id: 'e1', event_date: '2026-10-10', end_date: null, name: 'Holly Fair', location: 'Johnston', hours: null, address: null, booth: 'B4', url: null, status: 'upcoming' };
  it('builds the market page: open today, pieces with sale prices, methods on', async () => {
    state.promos = [{ id: 's', kind: 'sale', name: 'Fall', code: null, percentOff: 25, amountOffCents: null, startsOn: null, endsOn: null, maxUses: null, uses: 0, active: true }];
    state.queue = [{ data: event, error: null }, { data: [{ listing_id: 'l1', position: 0 }], error: null }, { data: null, error: null }];
    const view = await loadMarketShop(db(), 't1', 'e1');
    expect(view).toMatchObject({ marketId: 'e1', name: 'Holly Fair', state: 'open', booth: 'B4', methods: ['cash'] });
    expect(view?.pieces[0]?.salePrice).toBe('$90');
  });
  it('marks a piece with nothing left at this market sold out, and hands over every option’s price and count', async () => {
    state.loaded = [theo, { ...theo, view: { ...theo.view, id: 'l2', slug: 'scarf', name: 'Scarf' }, priceCents: 3000 }];
    state.counts = new Map([
      ['l1', { left: 0, options: [] }],
      ['l2', { left: null, options: [{ id: 'v1', label: 'Blue', priceCents: null, left: 2 }, { id: 'v2', label: 'Red', priceCents: 3500, left: null }] }],
    ]);
    state.queue = [{ data: event, error: null }, { data: [{ listing_id: 'l1', position: 0 }, { listing_id: 'l2', position: 1 }], error: null }, { data: null, error: null }];
    const view = await loadMarketShop(db(), 't1', 'e1');
    expect(view?.pieces.map((p) => p.status)).toEqual(['sold_out', 'active']);
    expect(view?.stock?.['l2']).toEqual({ left: null, options: [{ id: 'v1', label: 'Blue', price: '$30', left: 2 }, { id: 'v2', label: 'Red', price: '$35', left: null }] });
  });
  it('is null without the market shop or the market, and throws a failed read', async () => {
    state.features = new Set();
    expect(await loadMarketShop(db(), 't1', 'e1')).toBeNull();
    state.features = new Set(['market_shop']);
    state.queue = [{ data: null, error: null }];
    expect(await loadMarketShop(db(), 't1', 'e1')).toBeNull();
    state.queue = [{ data: null, error: { message: 'down' } }];
    await expect(loadMarketShop(db(), 't1', 'e1')).rejects.toThrow('down');
  });
});

describe('loadMarketInfo', () => {
  const event = { id: 'e1', event_date: '2026-10-17', end_date: null, name: 'Holly Fair', location: 'Johnston', hours: '9am – 3pm', address: '1 Main St', booth: 'B4', url: 'https://hollyfair.example', status: 'upcoming' };
  it('gives the market’s details and the pieces she’s bringing, with no way to pay', async () => {
    state.counts = new Map([['l1', { left: 0, options: [] }]]);
    state.queue = [{ data: event, error: null }, { data: [{ listing_id: 'l1', position: 0 }], error: null }];
    const view = await loadMarketInfo(db(), 't1', 'e1');
    expect(view).toEqual({
      marketId: 'e1',
      name: 'Holly Fair',
      date: '2026-10-17',
      endDate: '',
      town: 'Johnston',
      hours: '9am – 3pm',
      address: '1 Main St',
      booth: 'B4',
      url: 'https://hollyfair.example',
      state: 'before',
      pieces: [expect.objectContaining({ slug: 'theo', status: 'sold_out' })],
    });
    // Never reads the ways to pay.
    expect(state.calls).not.toContain('from(payment_settings)');
  });
  it('is null on Showcase or for no such market, and throws a failed read', async () => {
    state.features = new Set(['market_dates']);
    expect(await loadMarketInfo(db(), 't1', 'e1')).toBeNull();
    state.features = new Set(['market_shop']);
    state.queue = [{ data: null, error: null }];
    expect(await loadMarketInfo(db(), 't1', 'e1')).toBeNull();
    state.queue = [{ data: null, error: { message: 'down' } }];
    await expect(loadMarketInfo(db(), 't1', 'e1')).rejects.toThrow('down');
  });
});

describe('Today', () => {
  it('lists a market’s holds and sales', async () => {
    state.queue = [
      {
        data: [
          { id: 'o1', order_number: '1004', created_at: 'x', status: 'pending', customer_name: 'Pat', total_cents: 12000, payment_method: 'venmo', buyer_paid_at: 'y', order_items: [{ name_snapshot: 'Theo' }] },
          { id: 'o2', order_number: '1005', created_at: 'x', status: 'fulfilled', customer_name: 'At the table', total_cents: 9000, payment_method: 'card', buyer_paid_at: null, order_items: [] },
          { id: 'o3', order_number: '1006', created_at: 'x', status: 'paid', customer_name: 'Sam', total_cents: 1000, payment_method: null, buyer_paid_at: null, order_items: [] },
        ],
        error: null,
      },
    ];
    const orders = await listMarketOrders(db(), 't1', 'e1');
    expect(orders.map((o) => [o.status, o.method, o.saysPaid])).toEqual([
      ['pending', 'venmo', true],
      ['paid', 'card', false],
      ['paid', null, false],
    ]);
    expect(takings(orders)).toEqual({ count: 2, total: '$100', byMethod: [{ method: 'card', total: '$90' }, { method: 'other', total: '$10' }] });
    state.queue = [{ data: null, error: { message: 'down' } }];
    await expect(listMarketOrders(db(), 't1', 'e1')).rejects.toThrow('down');
  });

  it('records a sale at the running sale price', async () => {
    state.promos = [{ id: 's', kind: 'sale', name: 'Fall', code: null, percentOff: 25, amountOffCents: null, startsOn: null, endsOn: null, maxUses: null, uses: 0, active: true }];
    expect(await recordMarketSale('e1', 'l1', 'cash')).toEqual({ ok: true });
    expect(state.calls).toContain('rpc(market_record_sale,{"p_tenant_id":"t1","p_event_id":"e1","p_listing_id":"l1","p_method":"cash","p_price_cents":9000,"p_quantity":1})');
  });

  it('refuses a sale it can’t record, in plain words', async () => {
    expect((await recordMarketSale('e1', 'l1', 'bitcoin')).ok).toBe(false);
    state.loaded = [];
    expect((await recordMarketSale('e1', 'l1', 'cash')).ok).toBe(false);
    state.loaded = [theo];
    for (const code of ['P0040', 'P0021', 'XX000']) {
      state.rpc = { data: null, error: { code, message: 'x' } };
      expect((await recordMarketSale('e1', 'l1', 'cash')).ok).toBe(false);
    }
    state.features = new Set();
    expect((await recordMarketSale('e1', 'l1', 'cash')).ok).toBe(false);
  });
});

describe('Getting paid and the market page', () => {
  it('saves payment settings for this site', async () => {
    expect(await savePaySettings({ ...EMPTY_PAY, venmo: 'renee', venmoOn: true })).toEqual({ ok: true });
    expect(state.calls).toContain('upsert({"tenant_id":"t1","venmo":"renee","venmo_on":true,"cashapp":null,"cashapp_on":false,"zelle":null,"zelle_on":false,"cash_on":true})');
  });
  it('refuses when it should', async () => {
    expect((await savePaySettings({ ...EMPTY_PAY, venmoOn: true })).ok).toBe(false);
    state.queue = [{ error: { message: 'down' } }];
    expect((await savePaySettings(EMPTY_PAY)).ok).toBe(false);
    state.features = new Set();
    expect((await savePaySettings(EMPTY_PAY)).ok).toBe(false);
  });
  it('offers only live pieces to bring, and builds the page address', async () => {
    expect(await shopPicks(db(), 't1')).toEqual([{ id: 'l1', name: 'Theo', photoUrl: null, soldOut: false, onHand: null, options: [] }]);
    state.queue = [{ data: [{ id: 'l1', inventory_count: 7, listing_variants: [] }], error: null }];
    expect((await shopPicks(db(), 't1'))[0]).toMatchObject({ onHand: 7, options: [] });
    state.queue = [
      {
        data: [
          {
            id: 'l1',
            inventory_count: 9,
            listing_variants: [
              { id: 'v1', option_combination: { Size: 'L', Colour: 'Blue' }, inventory_count: 2, status: 'active' },
              { id: 'v2', option_combination: { Colour: 'Red' }, inventory_count: null, status: 'archived' },
            ],
          },
        ],
        error: null,
      },
    ];
    expect((await shopPicks(db(), 't1'))[0]).toMatchObject({ onHand: null, options: [{ id: 'v1', label: 'Blue / L', onHand: 2 }] });
    state.queue = [{ data: null, error: { message: 'down' } }];
    await expect(shopPicks(db(), 't1')).rejects.toThrow('on hand');
    expect(marketPageUrl('https://rose-n-cat.bohdiai.com', 'e1')).toBe('https://rose-n-cat.bohdiai.com/market/e1');
  });
  it('saves a market’s pieces only on sites with the market shop', async () => {
    state.rpc = { data: 'm1', error: null };
    const form = { ...emptyMarketForm(), name: 'Holly Fair', date: '2026-11-21', listingIds: ['l1'] };
    await saveMarket(form);
    expect(state.calls.at(-1)).toContain('"listing_ids":["l1"]');
    state.features = new Set(['market_dates']);
    await saveMarket(form);
    expect(state.calls.at(-1)).not.toContain('listing_ids');
  });
});
