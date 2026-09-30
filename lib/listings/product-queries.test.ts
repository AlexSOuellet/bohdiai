import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import {
  slugifyName,
  pickUniqueSlug,
  hasRealProducts,
  hasPlaceholderProducts,
  clearPlaceholderProducts,
  insertRealProduct,
  updateRealProduct,
  softDeleteProduct,
  loadWalkProducts,
} from './product-queries';

/** A chainable Supabase fake: `from(table)` returns the next scripted result for that
 *  table (queued, consumed in order), recording the method chain for assertions. */
interface Recorded {
  table: string;
  calls: [string, ...unknown[]][];
}
type Result = { data?: unknown; count?: number; error?: unknown };

function fakeDb(queues: Record<string, Result[]>): { db: SupabaseClient<Database>; recorded: Recorded[] } {
  const idx: Record<string, number> = {};
  const recorded: Recorded[] = [];
  const db = {
    from(table: string) {
      idx[table] = idx[table] ?? 0;
      const result = (queues[table] ?? [])[idx[table]!] ?? { data: null, error: null, count: 0 };
      idx[table] += 1;
      const rec: Recorded = { table, calls: [] };
      recorded.push(rec);
      const b: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'is', 'in', 'order', 'update', 'insert', 'single']) {
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

describe('slugifyName', () => {
  it('lowercases, hyphenates, and trims; empty falls back to "product"', () => {
    expect(slugifyName('Amber & Oud Candle')).toBe('amber-oud-candle');
    expect(slugifyName('  Hello!! ')).toBe('hello');
    expect(slugifyName('###')).toBe('product');
  });
});

describe('pickUniqueSlug', () => {
  it('returns the base slug when free', async () => {
    const { db } = fakeDb({ listings: [{ data: [{ slug: 'other' }] }] });
    expect(await pickUniqueSlug(db, 't1', 'Amber Candle')).toBe('amber-candle');
  });
  it('appends the first free numeric suffix on collision', async () => {
    const { db } = fakeDb({ listings: [{ data: [{ slug: 'amber-candle' }, { slug: 'amber-candle-2' }] }] });
    expect(await pickUniqueSlug(db, 't1', 'Amber Candle')).toBe('amber-candle-3');
  });
});

describe('hasRealProducts / hasPlaceholderProducts', () => {
  it('reads the count and filters real (is_preview false)', async () => {
    const { db, recorded } = fakeDb({ listings: [{ count: 2 }] });
    expect(await hasRealProducts(db, 't1')).toBe(true);
    expect(recorded[0]!.calls).toContainEqual(['eq', 'is_preview', false]);
  });
  it('placeholder check filters is_preview true and treats 0 as none', async () => {
    const { db, recorded } = fakeDb({ listings: [{ count: 0 }] });
    expect(await hasPlaceholderProducts(db, 't1')).toBe(false);
    expect(recorded[0]!.calls).toContainEqual(['eq', 'is_preview', true]);
  });
});

describe('clearPlaceholderProducts', () => {
  it('soft-deletes only the placeholder products', async () => {
    const { db, recorded } = fakeDb({ listings: [{ error: null }] });
    await clearPlaceholderProducts(db, 't1');
    const calls = recorded[0]!.calls;
    expect(calls[0]![0]).toBe('update');
    expect((calls[0]![1] as Record<string, unknown>)['deleted_at']).toBeTypeOf('string');
    expect(calls).toContainEqual(['eq', 'is_preview', true]);
  });
});

describe('insertRealProduct', () => {
  it('inserts a real product row with the resolved slug, media, and is_preview false', async () => {
    const { db, recorded } = fakeDb({
      listings: [
        { data: [] }, // pickUniqueSlug: no existing slugs
        { data: { id: 'l1', slug: 'amber-candle' } }, // insert().select().single()
      ],
    });
    const out = await insertRealProduct(db, 't1', {
      name: 'Amber Candle',
      priceCents: 2400,
      shortDescription: 'short',
      description: 'long',
      uploadId: 'u1',
    });
    expect(out).toEqual({ id: 'l1', slug: 'amber-candle' });
    const insertCall = recorded[1]!.calls.find((c) => c[0] === 'insert')!;
    const rowInserted = insertCall[1] as Record<string, unknown>;
    expect(rowInserted).toMatchObject({
      tenant_id: 't1',
      listing_type: 'product',
      slug: 'amber-candle',
      base_price_cents: 2400,
      is_preview: false,
      media_ids: ['u1'],
    });
  });

  it('inserts empty media_ids when there is no upload', async () => {
    const { db, recorded } = fakeDb({
      listings: [{ data: [] }, { data: { id: 'l2', slug: 'plain' } }],
    });
    await insertRealProduct(db, 't1', { name: 'Plain', priceCents: 1000 });
    const rowInserted = recorded[1]!.calls.find((c) => c[0] === 'insert')![1] as Record<string, unknown>;
    expect(rowInserted['media_ids']).toEqual([]);
  });
});

describe('softDeleteProduct', () => {
  it('sets deleted_at scoped to the tenant + id', async () => {
    const { db, recorded } = fakeDb({ listings: [{ error: null }] });
    await softDeleteProduct(db, 't1', 'l9');
    const calls = recorded[0]!.calls;
    expect(calls[0]![0]).toBe('update');
    expect(calls).toContainEqual(['eq', 'tenant_id', 't1']);
    expect(calls).toContainEqual(['eq', 'id', 'l9']);
  });
});

describe('loadWalkProducts', () => {
  it('resolves each product image from the uploads table', async () => {
    const { db } = fakeDb({
      listings: [
        {
          data: [
            {
              id: 'l1',
              name: 'Amber',
              base_price_cents: 2400,
              short_description: 's',
              description: 'd',
              metadata: null,
              media_ids: ['u1'],
            },
          ],
        },
      ],
      uploads: [{ data: [{ id: 'u1', public_url: 'https://x/1.jpg', alt_text: null }] }],
    });
    const out = await loadWalkProducts(db, 't1');
    expect(out).toEqual([
      { id: 'l1', name: 'Amber', price: '$24', shortDescription: 's', description: 'd', imageUrl: 'https://x/1.jpg' },
    ]);
  });

  it('falls back to the legacy metadata image url when there are no media_ids', async () => {
    const { db } = fakeDb({
      listings: [
        {
          data: [
            {
              id: 'l2',
              name: 'Legacy',
              base_price_cents: 1000,
              short_description: null,
              description: null,
              metadata: { image_url: 'https://x/legacy.jpg' },
              media_ids: [],
            },
          ],
        },
      ],
    });
    const out = await loadWalkProducts(db, 't1');
    expect(out[0]!.imageUrl).toBe('https://x/legacy.jpg');
    expect(out[0]!.shortDescription).toBe('');
  });
});

describe('pickUniqueSlug — no rows', () => {
  it('treats a null result as no taken slugs', async () => {
    const { db } = fakeDb({ listings: [{ data: null }] });
    expect(await pickUniqueSlug(db, 't1', 'Amber Candle')).toBe('amber-candle');
  });
});

describe('hasRealProducts / hasPlaceholderProducts — null count', () => {
  it('treats a missing count as zero for both checks', async () => {
    const { db } = fakeDb({ listings: [{ data: null }, { data: null }] });
    expect(await hasRealProducts(db, 't1')).toBe(false);
    expect(await hasPlaceholderProducts(db, 't1')).toBe(false);
  });
});

describe('insertRealProduct — failures and optional fields', () => {
  it('stores absent short/long descriptions as null', async () => {
    const { db, recorded } = fakeDb({ listings: [{ data: [] }, { data: { id: 'l3', slug: 'bare' } }] });
    await insertRealProduct(db, 't1', { name: 'Bare', priceCents: 500 });
    const row = recorded[1]!.calls.find((c) => c[0] === 'insert')![1] as Record<string, unknown>;
    expect(row['short_description']).toBeNull();
    expect(row['description']).toBeNull();
  });

  it('throws with the database message when the insert errors', async () => {
    const { db } = fakeDb({ listings: [{ data: [] }, { data: null, error: { message: 'duplicate key' } }] });
    await expect(insertRealProduct(db, 't1', { name: 'X', priceCents: 1 })).rejects.toThrow(
      'insertRealProduct failed: duplicate key',
    );
  });

  it('throws "no row" when the insert returns neither a row nor an error', async () => {
    const { db } = fakeDb({ listings: [{ data: [] }, { data: null, error: null }] });
    await expect(insertRealProduct(db, 't1', { name: 'X', priceCents: 1 })).rejects.toThrow(
      'insertRealProduct failed: no row',
    );
  });
});

describe('updateRealProduct', () => {
  it('patches the fields and replaces the photo when a new upload is given', async () => {
    const { db, recorded } = fakeDb({ listings: [{ error: null }] });
    await updateRealProduct(db, 't1', 'l1', {
      name: 'Amber',
      priceCents: 2600,
      shortDescription: 'short',
      description: 'long',
      uploadId: 'u9',
    });
    const calls = recorded[0]!.calls;
    expect(calls[0]).toEqual([
      'update',
      { name: 'Amber', short_description: 'short', description: 'long', base_price_cents: 2600, media_ids: ['u9'] },
    ]);
    expect(calls).toContainEqual(['eq', 'tenant_id', 't1']);
    expect(calls).toContainEqual(['eq', 'id', 'l1']);
  });

  it('leaves the photo alone and nulls absent descriptions when no upload is given', async () => {
    const { db, recorded } = fakeDb({ listings: [{ error: null }] });
    await updateRealProduct(db, 't1', 'l1', { name: 'Amber', priceCents: 2600, uploadId: null });
    const patch = recorded[0]!.calls[0]![1] as Record<string, unknown>;
    expect(patch).toEqual({ name: 'Amber', short_description: null, description: null, base_price_cents: 2600 });
    expect('media_ids' in patch).toBe(false);
  });

  it('throws with the database message when the update errors', async () => {
    const { db } = fakeDb({ listings: [{ error: { message: 'rls denied' } }] });
    await expect(updateRealProduct(db, 't1', 'l1', { name: 'A', priceCents: 1 })).rejects.toThrow(
      'updateRealProduct failed: rls denied',
    );
  });
});

describe('softDeleteProduct — failure', () => {
  it('throws with the database message when the update errors', async () => {
    const { db } = fakeDb({ listings: [{ error: { message: 'boom' } }] });
    await expect(softDeleteProduct(db, 't1', 'l1')).rejects.toThrow('softDeleteProduct failed: boom');
  });
});

describe('loadWalkProducts — fallbacks', () => {
  it('returns an empty list (and skips the uploads read) when the query returns nothing', async () => {
    const { db, recorded } = fakeDb({ listings: [{ data: null }] });
    expect(await loadWalkProducts(db, 't1')).toEqual([]);
    expect(recorded.some((r) => r.table === 'uploads')).toBe(false);
  });

  it('dedupes upload ids and falls back to metadata, then null, when an upload does not resolve', async () => {
    const base = { base_price_cents: 1250, short_description: null, description: null };
    const { db, recorded } = fakeDb({
      listings: [
        {
          data: [
            { ...base, id: 'l1', name: 'Gone', metadata: { image_url: 'https://x/legacy.jpg' }, media_ids: ['u1'] },
            { ...base, id: 'l2', name: 'Bare', metadata: null, media_ids: ['u1'] },
            { ...base, id: 'l3', name: 'NullMedia', metadata: null, media_ids: null },
          ],
        },
      ],
      uploads: [{ data: null }],
    });
    const out = await loadWalkProducts(db, 't1');
    expect(out.map((p) => p.imageUrl)).toEqual(['https://x/legacy.jpg', null, null]);
    expect(out[0]!.price).toBe('$12.50');
    expect(out[1]!.description).toBe('');
    const uploadsQuery = recorded.find((r) => r.table === 'uploads')!;
    expect(uploadsQuery.calls).toContainEqual(['in', 'id', ['u1']]);
  });
});
