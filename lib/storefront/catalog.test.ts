import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import {
  loadMediaMap,
  loadCatalog,
  formatPrice,
  imageUrlFromMetadata,
  resolveMediaMap,
  mediaForListing,
  listingToProductView,
  type ListingRow,
  type UploadRow,
} from './catalog';

function row(over: Partial<ListingRow> = {}): ListingRow {
  return {
    slug: 'amber-candle',
    name: 'Amber Candle',
    base_price_cents: 2400,
    short_description: 'A short line',
    description: 'The long body',
    metadata: null,
    primary_collection_id: null,
    media_ids: null,
    ...over,
  };
}

describe('formatPrice', () => {
  it('drops .00 for whole dollars and keeps cents otherwise', () => {
    expect(formatPrice(2400)).toBe('$24');
    expect(formatPrice(2450)).toBe('$24.50');
  });
});

describe('imageUrlFromMetadata', () => {
  it('reads image_url from a metadata object', () => {
    expect(imageUrlFromMetadata({ image_url: 'https://x/y.jpg' })).toBe('https://x/y.jpg');
  });
  it('returns undefined for null, arrays, or a missing/blank url', () => {
    expect(imageUrlFromMetadata(null)).toBeUndefined();
    expect(imageUrlFromMetadata([1, 2] as never)).toBeUndefined();
    expect(imageUrlFromMetadata({ image_url: '' })).toBeUndefined();
    expect(imageUrlFromMetadata({})).toBeUndefined();
  });
});

describe('resolveMediaMap', () => {
  it('maps id → url + alt, skipping uploads with no url', () => {
    const uploads: UploadRow[] = [
      { id: 'u1', public_url: 'https://x/1.jpg', alt_text: 'my candle' },
      { id: 'u2', public_url: null, alt_text: null },
    ];
    const map = resolveMediaMap(uploads);
    expect(map.get('u1')).toEqual({ url: 'https://x/1.jpg', alt: 'my candle' });
    expect(map.has('u2')).toBe(false);
  });
});

describe('mediaForListing', () => {
  it('resolves the first media_id present in the map', () => {
    const map = resolveMediaMap([{ id: 'u1', public_url: 'https://x/1.jpg', alt_text: 'alt' }]);
    const media = mediaForListing(row({ media_ids: ['u1'] }), map);
    expect(media).toEqual([{ kind: 'image', url: 'https://x/1.jpg', alt: 'alt' }]);
  });

  it('falls back to the product name when the upload has no alt', () => {
    const map = resolveMediaMap([{ id: 'u1', public_url: 'https://x/1.jpg', alt_text: null }]);
    const media = mediaForListing(row({ media_ids: ['u1'], name: 'Amber Candle' }), map);
    expect(media[0]?.alt).toBe('Amber Candle');
  });

  it('falls back to metadata.image_url when no media_id resolves', () => {
    const media = mediaForListing(
      row({ media_ids: ['missing'], metadata: { image_url: 'https://x/legacy.jpg' } }),
      new Map(),
    );
    expect(media).toEqual([{ kind: 'image', url: 'https://x/legacy.jpg', alt: 'Amber Candle' }]);
  });

  it('is empty when there is neither an upload nor a metadata url', () => {
    expect(mediaForListing(row({ media_ids: null, metadata: null }), new Map())).toEqual([]);
  });
});

describe('listingToProductView', () => {
  it('projects a full product, resolving the uploaded photo', () => {
    const map = resolveMediaMap([{ id: 'u1', public_url: 'https://x/1.jpg', alt_text: 'alt' }]);
    const pv = listingToProductView(row({ media_ids: ['u1'] }), map);
    expect(pv).toEqual({
      slug: 'amber-candle',
      name: 'Amber Candle',
      price: '$24',
      shortDescription: 'A short line',
      description: 'The long body',
      status: 'active',
      media: [{ kind: 'image', url: 'https://x/1.jpg', alt: 'alt' }],
      variations: [],
    });
  });

  it('omits shortDescription when null and empties description when null', () => {
    const pv = listingToProductView(row({ short_description: null, description: null }), new Map());
    expect('shortDescription' in pv).toBe(false);
    expect(pv.description).toBe('');
  });
});

/** Chainable Supabase fake: `from(table)` returns the next scripted result for that
 *  table (queued, consumed in order), recording the method chain for assertions. */
interface Recorded {
  table: string;
  calls: [string, ...unknown[]][];
}
type Result = { data?: unknown; error?: unknown };

function fakeDb(queues: Record<string, Result[]>): { db: SupabaseClient<Database>; recorded: Recorded[] } {
  const idx: Record<string, number> = {};
  const recorded: Recorded[] = [];
  const db = {
    from(table: string) {
      idx[table] = idx[table] ?? 0;
      // Real Supabase always sets `error` (null on success); default it the same way.
      const result: Result = { data: null, error: null, ...(queues[table] ?? [])[idx[table]!] };
      idx[table] += 1;
      const rec: Recorded = { table, calls: [] };
      recorded.push(rec);
      const b: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'is', 'in', 'order']) {
        b[m] = (...a: unknown[]) => {
          rec.calls.push([m, ...a]);
          return b;
        };
      }
      (b as { then: unknown }).then = (res: (v: Result) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve(result).then(res, rej);
      return b;
    },
  } as unknown as SupabaseClient<Database>;
  return { db, recorded };
}

describe('resolveMediaMap — blank url', () => {
  it('skips an upload whose url is an empty string', () => {
    expect(resolveMediaMap([{ id: 'u1', public_url: '', alt_text: 'x' }]).size).toBe(0);
  });
});

describe('listingToProductView — blank short description', () => {
  it('omits shortDescription when it is an empty string', () => {
    const pv = listingToProductView(row({ short_description: '' }), new Map());
    expect('shortDescription' in pv).toBe(false);
  });
});

describe('loadMediaMap', () => {
  it('does not query when there are no ids', async () => {
    const { db, recorded } = fakeDb({});
    const map = await loadMediaMap(db, []);
    expect(map.size).toBe(0);
    expect(recorded).toHaveLength(0);
  });

  it('queries live uploads once with de-duplicated ids and maps the rows', async () => {
    const { db, recorded } = fakeDb({
      uploads: [{ data: [{ id: 'u1', public_url: 'https://x/1.jpg', alt_text: 'one' }] }],
    });
    const map = await loadMediaMap(db, ['u1', 'u1', 'u2']);
    expect(map.get('u1')).toEqual({ url: 'https://x/1.jpg', alt: 'one' });
    expect(map.has('u2')).toBe(false);
    expect(recorded).toHaveLength(1);
    expect(recorded[0]!.calls).toContainEqual(['in', 'id', ['u1', 'u2']]);
    expect(recorded[0]!.calls).toContainEqual(['is', 'deleted_at', null]);
  });

  it('returns an empty map when the uploads query returns nothing', async () => {
    const { db } = fakeDb({ uploads: [{ data: null }] });
    expect((await loadMediaMap(db, ['u1'])).size).toBe(0);
  });

  it('throws when the uploads query fails, so a photo is never silently dropped', async () => {
    const { db } = fakeDb({ uploads: [{ data: null, error: { message: 'timeout' } }] });
    await expect(loadMediaMap(db, ['u1'])).rejects.toThrow('Could not load photos: timeout');
  });
});

describe('loadCatalog', () => {
  it('loads active products for the tenant and resolves their photos in one batch', async () => {
    const rows = [
      row({ slug: 'a', name: 'A', media_ids: ['u1'] }),
      row({ slug: 'b', name: 'B', media_ids: null, metadata: { image_url: 'https://x/legacy.jpg' } }),
    ];
    const { db, recorded } = fakeDb({
      listings: [{ data: rows }],
      uploads: [{ data: [{ id: 'u1', public_url: 'https://x/1.jpg', alt_text: null }] }],
    });
    const out = await loadCatalog(db, 't1');
    expect(out.rows).toBe(rows);
    expect(out.products.map((p) => p.media)).toEqual([
      [{ kind: 'image', url: 'https://x/1.jpg', alt: 'A' }],
      [{ kind: 'image', url: 'https://x/legacy.jpg', alt: 'B' }],
    ]);
    expect(out.mediaMap.get('u1')?.url).toBe('https://x/1.jpg');
    const listingCalls = recorded.find((r) => r.table === 'listings')!.calls;
    expect(listingCalls).toContainEqual(['eq', 'tenant_id', 't1']);
    expect(listingCalls).toContainEqual(['eq', 'listing_type', 'product']);
    expect(listingCalls).toContainEqual(['eq', 'status', 'active']);
    expect(listingCalls).toContainEqual(['order', 'created_at', { ascending: true }]);
    expect(recorded.filter((r) => r.table === 'uploads')).toHaveLength(1);
  });

  it('returns an empty catalog (and no uploads query) when the tenant has no products', async () => {
    const { db, recorded } = fakeDb({ listings: [{ data: null }] });
    const out = await loadCatalog(db, 't1');
    expect(out).toEqual({ products: [], rows: [], mediaMap: new Map() });
    expect(recorded.some((r) => r.table === 'uploads')).toBe(false);
  });
});
