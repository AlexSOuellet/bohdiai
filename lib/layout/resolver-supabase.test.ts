import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock @/lib/supabase ──────────────────────────────────────────────────────
// We build a tiny stub supabase client that records `.from(table)` chains.
// Each table can be configured per-test to resolve to a `data`/`count` payload.

type QueryRecord = {
  table: string;
  ops: Array<{ op: string; args: unknown[] }>;
};

interface TableResponse {
  data?: unknown;
  count?: number;
}

const state = {
  records: [] as QueryRecord[],
  // Per-(table, callIndex) responses; default = { data: [] }
  responses: new Map<string, TableResponse[]>(),
  perTableCalls: new Map<string, number>(),
};

function nextResponse(table: string): TableResponse {
  const idx = state.perTableCalls.get(table) ?? 0;
  state.perTableCalls.set(table, idx + 1);
  const list = state.responses.get(table) ?? [];
  return list[idx] ?? { data: [] };
}

function makeBuilder(record: QueryRecord, response: TableResponse): unknown {
  const builder: Record<string, unknown> = {};
  const chain =
    (op: string) =>
    (...args: unknown[]) => {
      record.ops.push({ op, args });
      return builder;
    };
  for (const op of ['select', 'eq', 'in', 'is', 'order', 'limit', 'gte']) {
    builder[op] = chain(op);
  }
  builder['maybeSingle'] = () => Promise.resolve({ data: response.data ?? null, error: null });
  // The thenable: the builder itself can be awaited to get { data, count }.
  builder['then'] = (onFulfilled: (v: { data: unknown; count?: number; error: null }) => unknown) =>
    Promise.resolve({
      data: response.data ?? null,
      ...(response.count !== undefined ? { count: response.count } : {}),
      error: null,
    }).then(onFulfilled);
  return builder;
}

const mockClient = {
  from(table: string) {
    const response = nextResponse(table);
    const record: QueryRecord = { table, ops: [] };
    state.records.push(record);
    return makeBuilder(record, response);
  },
};

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => mockClient,
}));

// Import AFTER the mock is set up
import { createResolveContextForTenant } from './resolver-supabase';

beforeEach(() => {
  state.records = [];
  state.responses = new Map();
  state.perTableCalls = new Map();
});

function recordsFor(table: string): QueryRecord[] {
  return state.records.filter((r) => r.table === table);
}

function setResponse(table: string, responses: TableResponse[]): void {
  state.responses.set(table, responses);
}

describe('createResolveContextForTenant — tenantId', () => {
  it('returns tenantId on the context', () => {
    const ctx = createResolveContextForTenant('t-abc');
    expect(ctx.tenantId).toBe('t-abc');
  });
});

describe('fetchProducts', () => {
  it('queries listings with tenant + product + active filters', async () => {
    setResponse('listings', [
      {
        data: [
          {
            id: '1',
            slug: 's',
            name: 'N',
            short_description: 'd',
            base_price_cents: 1200,
            is_preview: false,
            metadata: { image_url: 'https://i/x.jpg' },
          },
        ],
      },
    ]);
    const ctx = createResolveContextForTenant('t1');
    const result = await ctx.fetchProducts({ count: 5, order: 'featured' });

    expect(result).toEqual([
      {
        id: '1',
        slug: 's',
        name: 'N',
        shortDescription: 'd',
        priceCents: 1200,
        imageUrl: 'https://i/x.jpg',
        isPreview: false,
      },
    ]);
    const r = recordsFor('listings')[0]!;
    expect(r.ops.find((o) => o.op === 'eq' && o.args[0] === 'tenant_id')!.args[1]).toBe('t1');
    expect(r.ops.find((o) => o.op === 'eq' && o.args[0] === 'listing_type')!.args[1]).toBe(
      'product',
    );
    expect(r.ops.find((o) => o.op === 'limit')!.args[0]).toBe(5);
    expect(r.ops.find((o) => o.op === 'order')!.args[0]).toBe('created_at');
  });

  it('filters by manual ids when provided', async () => {
    const ctx = createResolveContextForTenant('t1');
    await ctx.fetchProducts({ count: 3, order: 'featured', manualIds: ['a', 'b'] });
    const r = recordsFor('listings')[0]!;
    expect(r.ops.find((o) => o.op === 'in')!.args).toEqual(['id', ['a', 'b']]);
  });

  it('filters by collection slug — issues collections lookup then in', async () => {
    setResponse('collections', [{ data: { id: 'coll-1' } }]);
    const ctx = createResolveContextForTenant('t1');
    await ctx.fetchProducts({
      count: 3,
      order: 'featured',
      filter: { collectionSlug: 'wax' },
    });
    const collRec = recordsFor('collections')[0]!;
    expect(collRec.ops.find((o) => o.op === 'eq' && o.args[0] === 'slug')!.args[1]).toBe('wax');
    const listingsRec = recordsFor('listings')[0]!;
    expect(
      listingsRec.ops.find((o) => o.op === 'eq' && o.args[0] === 'primary_collection_id')!.args[1],
    ).toBe('coll-1');
  });

  it('does not chain primary_collection_id eq when collection lookup is null', async () => {
    setResponse('collections', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    await ctx.fetchProducts({
      count: 3,
      order: 'featured',
      filter: { collectionSlug: 'missing' },
    });
    const listingsRec = recordsFor('listings')[0]!;
    expect(
      listingsRec.ops.some((o) => o.op === 'eq' && o.args[0] === 'primary_collection_id'),
    ).toBe(false);
  });

  it('orders by newest/oldest/price-asc/price-desc/manual', async () => {
    const ctx = createResolveContextForTenant('t1');
    const orders = ['newest', 'oldest', 'price-asc', 'price-desc', 'manual'] as const;
    const expectedCol = {
      newest: 'created_at',
      oldest: 'created_at',
      'price-asc': 'base_price_cents',
      'price-desc': 'base_price_cents',
      manual: 'created_at',
    } as const;
    for (const order of orders) {
      state.records = [];
      state.perTableCalls = new Map();
      await ctx.fetchProducts({ count: 1, order });
      const r = recordsFor('listings')[0]!;
      const orderOp = r.ops.find((o) => o.op === 'order')!;
      expect(orderOp.args[0]).toBe(expectedCol[order]);
    }
  });

  it('defaults order to featured when undefined', async () => {
    const ctx = createResolveContextForTenant('t1');
    await ctx.fetchProducts({ count: 1, order: undefined });
    const r = recordsFor('listings')[0]!;
    expect(r.ops.find((o) => o.op === 'order')!.args[0]).toBe('created_at');
  });

  it('returns [] when data is null', async () => {
    setResponse('listings', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    expect(await ctx.fetchProducts({ count: 1, order: 'featured' })).toEqual([]);
  });

  it('omits optional fields when source columns are null', async () => {
    setResponse('listings', [
      {
        data: [
          {
            id: '1',
            slug: 's',
            name: 'N',
            short_description: null,
            base_price_cents: null,
            is_preview: null,
            metadata: null,
          },
        ],
      },
    ]);
    const ctx = createResolveContextForTenant('t1');
    const [p] = await ctx.fetchProducts({ count: 1, order: 'featured' });
    expect(p).toEqual({ id: '1', slug: 's', name: 'N', isPreview: false });
  });

  it('drops empty-string image_url from metadata', async () => {
    setResponse('listings', [
      {
        data: [
          {
            id: '1',
            slug: 's',
            name: 'N',
            short_description: null,
            base_price_cents: null,
            is_preview: true,
            metadata: { image_url: '' },
          },
        ],
      },
    ]);
    const ctx = createResolveContextForTenant('t1');
    const [p] = await ctx.fetchProducts({ count: 1, order: 'featured' });
    expect(p?.imageUrl).toBeUndefined();
    expect(p?.isPreview).toBe(true);
  });
});

describe('fetchProduct', () => {
  it('returns mapped product when found', async () => {
    setResponse('listings', [
      {
        data: {
          id: 'px',
          slug: 'sx',
          name: 'Nx',
          short_description: 'd',
          base_price_cents: 500,
          is_preview: false,
          metadata: { image_url: 'https://i/y.jpg' },
        },
      },
    ]);
    const ctx = createResolveContextForTenant('t1');
    const product = await ctx.fetchProduct('px');
    expect(product?.id).toBe('px');
    expect(product?.imageUrl).toBe('https://i/y.jpg');
  });

  it('returns undefined when not found', async () => {
    setResponse('listings', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    expect(await ctx.fetchProduct('nope')).toBeUndefined();
  });
});

describe('fetchCollections', () => {
  it('returns mapped collections with itemCount from a follow-up count query', async () => {
    setResponse('collections', [
      { data: [{ id: 'c1', slug: 'wax', name: 'Wax', description: null }] },
    ]);
    setResponse('listings', [{ data: null, count: 7 }]);
    const ctx = createResolveContextForTenant('t1');
    const result = await ctx.fetchCollections({ count: 3, order: 'newest' });
    expect(result).toEqual([{ slug: 'wax', name: 'Wax', itemCount: 7 }]);
    const listingsRec = recordsFor('listings')[0]!;
    expect(
      listingsRec.ops.find((o) => o.op === 'eq' && o.args[0] === 'primary_collection_id')!.args[1],
    ).toBe('c1');
  });

  it('uses in() when manualSlugs provided', async () => {
    setResponse('collections', [{ data: [] }]);
    const ctx = createResolveContextForTenant('t1');
    await ctx.fetchCollections({ count: 3, order: 'manual', manualSlugs: ['a', 'b'] });
    const r = recordsFor('collections')[0]!;
    expect(r.ops.find((o) => o.op === 'in')!.args).toEqual(['slug', ['a', 'b']]);
  });

  it('returns [] when collections data is null', async () => {
    setResponse('collections', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    expect(await ctx.fetchCollections({ count: 3, order: 'newest' })).toEqual([]);
  });

  it('defaults itemCount to 0 when count is null', async () => {
    setResponse('collections', [{ data: [{ id: 'c1', slug: 'a', name: 'A', description: null }] }]);
    setResponse('listings', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    const [c] = await ctx.fetchCollections({ count: 3, order: 'newest' });
    expect(c?.itemCount).toBe(0);
  });
});

describe('fetchCollection', () => {
  it('returns mapped collection with itemCount', async () => {
    setResponse('collections', [
      { data: { id: 'c1', slug: 'wax', name: 'Wax', description: null } },
    ]);
    setResponse('listings', [{ data: null, count: 4 }]);
    const ctx = createResolveContextForTenant('t1');
    const c = await ctx.fetchCollection('wax');
    expect(c).toEqual({ slug: 'wax', name: 'Wax', itemCount: 4 });
  });

  it('returns undefined when not found', async () => {
    setResponse('collections', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    expect(await ctx.fetchCollection('gone')).toBeUndefined();
  });

  it('defaults itemCount to 0 when count is null', async () => {
    setResponse('collections', [{ data: { id: 'c1', slug: 'a', name: 'A', description: null } }]);
    setResponse('listings', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    const c = await ctx.fetchCollection('a');
    expect(c?.itemCount).toBe(0);
  });
});

describe('fetchSubscriptions', () => {
  it('maps subscription rows', async () => {
    setResponse('listings', [
      {
        data: [
          {
            id: 's1',
            slug: 'sub',
            name: 'Sub',
            short_description: 'd',
            base_price_cents: 999,
            is_preview: false,
            metadata: null,
            subscription_interval: 'yearly',
            description: 'x',
          },
        ],
      },
    ]);
    const ctx = createResolveContextForTenant('t1');
    const subs = await ctx.fetchSubscriptions(5);
    expect(subs).toEqual([
      {
        id: 's1',
        name: 'Sub',
        priceCents: 999,
        interval: 'yearly',
        description: 'd',
        perks: [],
      },
    ]);
  });

  it('returns [] for null data and uses defaults for null fields', async () => {
    setResponse('listings', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    expect(await ctx.fetchSubscriptions(3)).toEqual([]);
  });

  it('falls back to priceCents=0 and interval=monthly when null', async () => {
    setResponse('listings', [
      {
        data: [
          {
            id: 's',
            slug: 's',
            name: 'n',
            short_description: null,
            base_price_cents: null,
            is_preview: false,
            metadata: null,
            subscription_interval: null,
            description: null,
          },
        ],
      },
    ]);
    const ctx = createResolveContextForTenant('t1');
    const [s] = await ctx.fetchSubscriptions(3);
    expect(s).toEqual({ id: 's', name: 'n', priceCents: 0, interval: 'monthly', perks: [] });
  });
});

describe('fetchSubscription', () => {
  it('returns mapped subscription', async () => {
    setResponse('listings', [
      {
        data: {
          id: 's',
          slug: 's',
          name: 'n',
          short_description: 'd',
          base_price_cents: 1,
          is_preview: false,
          metadata: null,
          subscription_interval: 'monthly',
          description: 'd',
        },
      },
    ]);
    const ctx = createResolveContextForTenant('t1');
    const s = await ctx.fetchSubscription('s');
    expect(s?.priceCents).toBe(1);
  });

  it('returns undefined when not found', async () => {
    setResponse('listings', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    expect(await ctx.fetchSubscription('gone')).toBeUndefined();
  });
});

describe('fetchSocialLinks', () => {
  it('returns []', async () => {
    const ctx = createResolveContextForTenant('t1');
    expect(await ctx.fetchSocialLinks()).toEqual([]);
  });
});

describe('fetchNavLinks', () => {
  it('maps rows using nav_label when set, else title; preserves nav_position; falls back to index when null', async () => {
    setResponse('content_pages', [
      {
        data: [
          { slug: 'about', title: 'About', nav_label: 'About us', nav_position: 1 },
          { slug: 'shop', title: 'Shop', nav_label: null, nav_position: null },
        ],
      },
    ]);
    const ctx = createResolveContextForTenant('t1');
    const result = await ctx.fetchNavLinks();
    expect(result).toEqual([
      { slug: 'about', label: 'About us', order: 1 },
      { slug: 'shop', label: 'Shop', order: 1 },
    ]);
  });

  it('returns [] when data is null', async () => {
    setResponse('content_pages', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    expect(await ctx.fetchNavLinks()).toEqual([]);
  });
});

describe('fetchEvents', () => {
  it('returns mapped events and applies upcoming filter', async () => {
    setResponse('events', [
      {
        data: [
          { id: 'e1', name: 'Show', event_date: '2026-07-01', location: 'Mall', notes: 'fun' },
          { id: 'e2', name: 'X', event_date: '2026-08-01', location: null, notes: null },
        ],
      },
    ]);
    const ctx = createResolveContextForTenant('t1');
    const result = await ctx.fetchEvents({ count: 5, upcoming: true });
    expect(result).toEqual([
      { id: 'e1', name: 'Show', date: '2026-07-01', location: 'Mall', description: 'fun' },
      { id: 'e2', name: 'X', date: '2026-08-01' },
    ]);
    const r = recordsFor('events')[0]!;
    expect(r.ops.some((o) => o.op === 'gte' && o.args[0] === 'event_date')).toBe(true);
    expect(r.ops.find((o) => o.op === 'limit')!.args[0]).toBe(5);
  });

  it('skips upcoming filter when upcoming=false', async () => {
    setResponse('events', [{ data: [] }]);
    const ctx = createResolveContextForTenant('t1');
    await ctx.fetchEvents({ count: 3, upcoming: false });
    const r = recordsFor('events')[0]!;
    expect(r.ops.some((o) => o.op === 'gte')).toBe(false);
  });

  it('returns [] when data is null', async () => {
    setResponse('events', [{ data: null }]);
    const ctx = createResolveContextForTenant('t1');
    expect(await ctx.fetchEvents({ count: 3, upcoming: true })).toEqual([]);
  });
});

describe('fetchCart', () => {
  it('returns empty cart shape', async () => {
    const ctx = createResolveContextForTenant('t1');
    expect(await ctx.fetchCart()).toEqual({ lines: [], subtotalCents: 0 });
  });
});
