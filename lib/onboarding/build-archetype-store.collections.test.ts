import { describe, it, expect, vi, beforeEach } from 'vitest';

// persistCollections + stampAuthoredFindUs in isolation: a table-aware Supabase
// stand-in records every write so we can assert the rows and the round-robin
// product → collection assignment without a real database.
const collectionsInsert = vi.fn();
const listingUpdates: Array<{ patch: unknown; eqs: Array<[string, unknown]> }> = [];
const listingResult = vi.fn();
const listingLookups: Array<{ cols: string; eqs: Array<[string, unknown]>; ins: Array<[string, unknown]> }> = [];
const listingLookupResult = vi.fn();
const linksInsert = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from: (table: string) => {
      if (table === 'collections') {
        return { insert: (rows: unknown) => ({ select: (cols: string) => collectionsInsert(rows, cols) }) };
      }
      if (table === 'listing_collections') {
        return { insert: (rows: unknown) => Promise.resolve(linksInsert(rows)) };
      }
      if (table === 'listings') {
        return {
          select: (cols: string) => {
            const rec = { cols, eqs: [] as Array<[string, unknown]>, ins: [] as Array<[string, unknown]> };
            listingLookups.push(rec);
            const chain = {
              eq: (col: string, val: unknown) => {
                rec.eqs.push([col, val]);
                return chain;
              },
              in: (col: string, val: unknown) => {
                rec.ins.push([col, val]);
                return chain;
              },
              then: <T,>(resolve: (v: unknown) => T) => Promise.resolve(listingLookupResult(rec)).then(resolve),
            };
            return chain;
          },
          update: (patch: unknown) => {
            const rec = { patch, eqs: [] as Array<[string, unknown]> };
            listingUpdates.push(rec);
            const chain = {
              eq: (col: string, val: unknown) => {
                rec.eqs.push([col, val]);
                return chain;
              },
              then: <T,>(resolve: (v: { error: { message: string } | null }) => T) =>
                Promise.resolve(listingResult(rec)).then(resolve),
            };
            return chain;
          },
        };
      }
      throw new Error(`unexpected table: ${table}`);
    },
  }),
}));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { persistCollections, stampAuthoredFindUs } from './build-archetype-store';
import { logger } from '@/lib/logger';
import type { MainStreetContent } from '@/lib/archetypes/main-street/schemas';
import type { MainStreetAuthored } from '@/lib/archetypes/main-street/builder';
import type { ProductView } from '@/lib/archetypes/content';

const content = (items: Array<{ slug: string; name: string; description: string }> | undefined) =>
  (items === undefined ? {} : { collections: { title: 'Collections', items } }) as unknown as MainStreetContent;

const product = (slug: string): ProductView => ({
  slug,
  name: slug,
  price: '$10',
  description: 'd',
  status: 'active',
  media: [],
  variations: [],
});

const THREE = [
  { slug: 'winter', name: 'Winter', description: 'Dark scents' },
  { slug: 'summer', name: 'Summer', description: 'Bright scents' },
];

beforeEach(() => {
  collectionsInsert.mockReset();
  listingResult.mockReset().mockReturnValue({ error: null });
  listingUpdates.length = 0;
  listingLookups.length = 0;
  listingLookupResult.mockReset().mockImplementation((rec: { ins: Array<[string, unknown]> }) => ({
    data: ((rec.ins[0]?.[1] ?? []) as string[]).map((slug) => ({ id: `id-${slug}`, slug })),
    error: null,
  }));
  linksInsert.mockReset().mockReturnValue({ error: null });
  vi.mocked(logger.warn).mockClear();
  vi.mocked(logger.info).mockClear();
});

describe('persistCollections', () => {
  it('does nothing when the content has no collections or an empty list', async () => {
    await persistCollections('tn_1', content(undefined), [product('a')]);
    await persistCollections('tn_1', content([]), [product('a')]);
    expect(collectionsInsert).not.toHaveBeenCalled();
    expect(listingUpdates).toHaveLength(0);
  });

  it('inserts each authored collection as an active preview row for the tenant', async () => {
    collectionsInsert.mockResolvedValue({ data: [{ id: 'c1', slug: 'winter' }, { id: 'c2', slug: 'summer' }], error: null });
    await persistCollections('tn_1', content(THREE), []);
    const [rows, cols] = collectionsInsert.mock.calls[0]!;
    expect(cols).toBe('id, slug');
    expect(rows).toEqual([
      { tenant_id: 'tn_1', slug: 'winter', name: 'Winter', description: 'Dark scents', status: 'active', is_preview: true },
      { tenant_id: 'tn_1', slug: 'summer', name: 'Summer', description: 'Bright scents', status: 'active', is_preview: true },
    ]);
    // No products → no assignment writes and no "persisted" log.
    expect(listingUpdates).toHaveLength(0);
    expect(vi.mocked(logger.info)).not.toHaveBeenCalled();
  });

  it('round-robins products across the inserted collections, skipping products with no slug', async () => {
    collectionsInsert.mockResolvedValue({ data: [{ id: 'c1', slug: 'winter' }, { id: 'c2', slug: 'summer' }], error: null });
    await persistCollections('tn_1', content(THREE), [product('a'), product(''), product('b'), product('c')]);
    expect(listingUpdates.map((u) => [u.patch, u.eqs])).toEqual([
      [{ primary_collection_id: 'c1' }, [['tenant_id', 'tn_1'], ['slug', 'a']]],
      [{ primary_collection_id: 'c2' }, [['tenant_id', 'tn_1'], ['slug', 'b']]],
      [{ primary_collection_id: 'c1' }, [['tenant_id', 'tn_1'], ['slug', 'c']]],
    ]);
    expect(vi.mocked(logger.info)).toHaveBeenCalledWith('archetype-build: collections persisted', {
      tenantId: 'tn_1',
      collections: 2,
      productsAssigned: 3,
    });
  });

  it('also links each product to its collection in listing_collections, positioned in assignment order per collection', async () => {
    collectionsInsert.mockResolvedValue({ data: [{ id: 'c1', slug: 'winter' }, { id: 'c2', slug: 'summer' }], error: null });
    await persistCollections('tn_1', content(THREE), [product('a'), product(''), product('b'), product('c'), product('d')]);
    expect(listingLookups).toEqual([
      { cols: 'id, slug', eqs: [['tenant_id', 'tn_1']], ins: [['slug', ['a', 'b', 'c', 'd']]] },
    ]);
    expect(linksInsert).toHaveBeenCalledTimes(1);
    expect(linksInsert.mock.calls[0]![0]).toEqual([
      { tenant_id: 'tn_1', listing_id: 'id-a', collection_id: 'c1', position: 0 },
      { tenant_id: 'tn_1', listing_id: 'id-b', collection_id: 'c2', position: 0 },
      { tenant_id: 'tn_1', listing_id: 'id-c', collection_id: 'c1', position: 1 },
      { tenant_id: 'tn_1', listing_id: 'id-d', collection_id: 'c2', position: 1 },
    ]);
  });

  it('skips a product whose row is not found and keeps positions dense', async () => {
    collectionsInsert.mockResolvedValue({ data: [{ id: 'c1', slug: 'winter' }], error: null });
    listingLookupResult.mockReturnValue({ data: [{ id: 'id-a', slug: 'a' }, { id: 'id-c', slug: 'c' }], error: null });
    await persistCollections('tn_1', content(THREE), [product('a'), product('b'), product('c')]);
    expect(linksInsert.mock.calls[0]![0]).toEqual([
      { tenant_id: 'tn_1', listing_id: 'id-a', collection_id: 'c1', position: 0 },
      { tenant_id: 'tn_1', listing_id: 'id-c', collection_id: 'c1', position: 1 },
    ]);
  });

  it('logs and carries on when the product lookup or the link insert fails (never fails the build)', async () => {
    collectionsInsert.mockResolvedValue({ data: [{ id: 'c1', slug: 'winter' }], error: null });
    listingLookupResult.mockReturnValue({ data: null, error: { message: 'lookup down' } });
    await expect(persistCollections('tn_1', content(THREE), [product('a')])).resolves.toBeUndefined();
    expect(linksInsert).not.toHaveBeenCalled();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('archetype-build: listing lookup for collection links failed', {
      tenantId: 'tn_1',
      error: 'lookup down',
    });

    vi.mocked(logger.warn).mockClear();
    listingLookupResult.mockReturnValue({ data: [{ id: 'id-a', slug: 'a' }], error: null });
    linksInsert.mockReturnValue({ error: { message: 'dup link' } });
    await expect(persistCollections('tn_1', content(THREE), [product('a')])).resolves.toBeUndefined();
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('archetype-build: listing_collections insert failed', {
      tenantId: 'tn_1',
      count: 1,
      error: 'dup link',
    });
  });

  it('logs a failed assignment and carries on with the rest (never fails the build)', async () => {
    collectionsInsert.mockResolvedValue({ data: [{ id: 'c1', slug: 'winter' }], error: null });
    listingResult.mockImplementation((rec: { eqs: Array<[string, unknown]> }) =>
      rec.eqs.some(([c, v]) => c === 'slug' && v === 'b') ? { error: { message: 'row locked' } } : { error: null },
    );
    await expect(persistCollections('tn_1', content(THREE), [product('a'), product('b')])).resolves.toBeUndefined();
    expect(listingUpdates).toHaveLength(2);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('archetype-build: primary_collection assignment failed', {
      tenantId: 'tn_1',
      slug: 'b',
      error: 'row locked',
    });
  });

  it('logs and stops when the collections insert errors — no assignments attempted', async () => {
    collectionsInsert.mockResolvedValue({ data: null, error: { message: 'dup slug' } });
    await persistCollections('tn_1', content(THREE), [product('a')]);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('archetype-build: collections insert failed', {
      tenantId: 'tn_1',
      count: 2,
      error: 'dup slug',
    });
    expect(listingUpdates).toHaveLength(0);
  });

  it('treats a null insert result with no error as a failure too', async () => {
    collectionsInsert.mockResolvedValue({ data: null, error: null });
    await persistCollections('tn_1', content(THREE), [product('a')]);
    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith('archetype-build: collections insert failed', {
      tenantId: 'tn_1',
      count: 2,
      error: undefined,
    });
    expect(listingUpdates).toHaveLength(0);
  });

  it('skips assignment when the insert returns no rows', async () => {
    collectionsInsert.mockResolvedValue({ data: [], error: null });
    await persistCollections('tn_1', content(THREE), [product('a')]);
    expect(listingUpdates).toHaveLength(0);
    expect(vi.mocked(logger.info)).not.toHaveBeenCalled();
  });
});

describe('stampAuthoredFindUs', () => {
  const today = new Date(Date.UTC(2026, 8, 30));

  it('returns the authored envelope untouched when there is no find-us block or no rows', () => {
    const none = { content: { founder: { quote: 'q' } } } as unknown as MainStreetAuthored;
    expect(stampAuthoredFindUs(none, today)).toBe(none);
    const noContent = {} as unknown as MainStreetAuthored;
    expect(stampAuthoredFindUs(noContent, today)).toBe(noContent);
    const empty = { content: { founder: { findUs: { label: 'Find us', rows: [] } } } } as unknown as MainStreetAuthored;
    expect(stampAuthoredFindUs(empty, today)).toBe(empty);
  });

  it('stamps dates onto the rows without mutating the input, keeping the rest of the envelope', () => {
    const authored = {
      lookKey: 'main-street-ember',
      content: {
        shopName: 'Lumen',
        founder: { quote: 'q', findUs: { label: 'Find us', rows: [{ day: 'someday', where: 'Flea', time: '10–4' }] } },
      },
    } as unknown as MainStreetAuthored;
    const out = stampAuthoredFindUs(authored, today) as unknown as {
      lookKey: string;
      content: { shopName: string; founder: { quote: string; findUs: { label: string; rows: Array<{ date?: string; where: string }> } } };
    };
    expect(out).not.toBe(authored);
    expect(out.lookKey).toBe('main-street-ember');
    expect(out.content.shopName).toBe('Lumen');
    expect(out.content.founder.quote).toBe('q');
    expect(out.content.founder.findUs.label).toBe('Find us');
    expect(out.content.founder.findUs.rows[0]!.where).toBe('Flea');
    expect(out.content.founder.findUs.rows[0]!.date).toMatch(/^2026-(09|10)-\d{2}$/);
    // input rows untouched
    const inRow = (authored as unknown as { content: { founder: { findUs: { rows: Array<{ date?: string }> } } } }).content.founder.findUs.rows[0]!;
    expect(inRow.date).toBeUndefined();
  });
});
