import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import {
  hasRealCollections,
  hasPlaceholderCollections,
  clearPlaceholderCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  loadWalkCollections,
} from './collection-queries';

interface Recorded {
  table: string;
  calls: [string, ...unknown[]][];
}
type Result = { data?: unknown; count?: number; error?: unknown };

/** Chainable Supabase fake — `from(table)` returns the next scripted result for that
 *  table (queued in order), recording the method chain for assertions. */
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

describe('hasRealCollections / hasPlaceholderCollections', () => {
  it('real filters is_preview false', async () => {
    const { db, recorded } = fakeDb({ collections: [{ count: 1 }] });
    expect(await hasRealCollections(db, 't1')).toBe(true);
    expect(recorded[0]!.calls).toContainEqual(['eq', 'is_preview', false]);
  });
  it('placeholder filters is_preview true, 0 → false', async () => {
    const { db, recorded } = fakeDb({ collections: [{ count: 0 }] });
    expect(await hasPlaceholderCollections(db, 't1')).toBe(false);
    expect(recorded[0]!.calls).toContainEqual(['eq', 'is_preview', true]);
  });
});

describe('clearPlaceholderCollections', () => {
  it('detaches products from seeded collections, then soft-deletes them', async () => {
    const { db, recorded } = fakeDb({
      collections: [{ data: [{ id: 'c1' }, { id: 'c2' }] }, { error: null }],
      listings: [{ error: null }],
    });
    await clearPlaceholderCollections(db, 't1');
    // 1) select seeded ids, 2) listings detach (in primary_collection_id), 3) collections soft-delete
    const listingUpdate = recorded.find((r) => r.table === 'listings')!;
    expect(listingUpdate.calls[0]![0]).toBe('update');
    expect(listingUpdate.calls).toContainEqual(['in', 'primary_collection_id', ['c1', 'c2']]);
    const del = recorded.filter((r) => r.table === 'collections')[1]!;
    expect(del.calls[0]![0]).toBe('update');
    expect(del.calls).toContainEqual(['eq', 'is_preview', true]);
  });

  it('skips the detach when there are no seeded collections', async () => {
    const { db, recorded } = fakeDb({ collections: [{ data: [] }, { error: null }] });
    await clearPlaceholderCollections(db, 't1');
    expect(recorded.some((r) => r.table === 'listings')).toBe(false);
  });
});

describe('createCollection', () => {
  it('inserts a real collection and assigns its products', async () => {
    const { db, recorded } = fakeDb({
      collections: [
        { data: [] }, // pickUniqueCollectionSlug: no existing slugs
        { data: { id: 'c1', slug: 'weekend-bakes' } }, // insert().select().single()
      ],
      listings: [{ error: null }], // assignProducts
    });
    const out = await createCollection(db, 't1', { name: 'Weekend Bakes', productIds: ['l1', 'l2'] });
    expect(out).toEqual({ id: 'c1', slug: 'weekend-bakes' });
    const insert = recorded.find((r) => r.table === 'collections' && r.calls.some((c) => c[0] === 'insert'))!;
    const row = insert.calls.find((c) => c[0] === 'insert')![1] as Record<string, unknown>;
    expect(row).toMatchObject({ tenant_id: 't1', slug: 'weekend-bakes', is_preview: false });
    const assign = recorded.find((r) => r.table === 'listings')!;
    expect(assign.calls).toContainEqual(['in', 'id', ['l1', 'l2']]);
  });
});

describe('updateCollection', () => {
  it('updates fields then re-assigns (clearing existing first)', async () => {
    const { db, recorded } = fakeDb({
      collections: [{ error: null }],
      listings: [{ error: null }, { error: null }],
    });
    await updateCollection(db, 't1', 'c1', { name: 'Renamed', productIds: ['l3'] });
    const listingUpdates = recorded.filter((r) => r.table === 'listings');
    // First listing update detaches current members; second assigns the new set.
    expect(listingUpdates[0]!.calls).toContainEqual(['eq', 'primary_collection_id', 'c1']);
    expect(listingUpdates[1]!.calls).toContainEqual(['in', 'id', ['l3']]);
  });
});

describe('deleteCollection', () => {
  it('detaches products then soft-deletes the collection', async () => {
    const { db, recorded } = fakeDb({ listings: [{ error: null }], collections: [{ error: null }] });
    await deleteCollection(db, 't1', 'c9');
    const listing = recorded.find((r) => r.table === 'listings')!;
    expect(listing.calls).toContainEqual(['eq', 'primary_collection_id', 'c9']);
    const col = recorded.find((r) => r.table === 'collections')!;
    const patch = col.calls.find((c) => c[0] === 'update')![1] as Record<string, unknown>;
    expect(patch['deleted_at']).toBeTypeOf('string');
  });
});

describe('loadWalkCollections', () => {
  it('groups real products under their collection', async () => {
    const { db } = fakeDb({
      collections: [{ data: [{ id: 'c1', name: 'Weekend Bakes', description: 'desc' }] }],
      listings: [
        {
          data: [
            { id: 'l1', primary_collection_id: 'c1' },
            { id: 'l2', primary_collection_id: 'c1' },
            { id: 'l3', primary_collection_id: null },
          ],
        },
      ],
    });
    const out = await loadWalkCollections(db, 't1');
    expect(out).toEqual([{ id: 'c1', name: 'Weekend Bakes', description: 'desc', productIds: ['l1', 'l2'] }]);
  });
});

describe('hasRealCollections / hasPlaceholderCollections — null count', () => {
  it('treats a missing count as zero for both checks', async () => {
    const { db } = fakeDb({ collections: [{ data: null }, { data: null }] });
    expect(await hasRealCollections(db, 't1')).toBe(false);
    expect(await hasPlaceholderCollections(db, 't1')).toBe(false);
  });
});

describe('clearPlaceholderCollections — null result', () => {
  it('treats a null seeded list as none: no detach, still soft-deletes', async () => {
    const { db, recorded } = fakeDb({ collections: [{ data: null }, { error: null }] });
    await clearPlaceholderCollections(db, 't1');
    expect(recorded.some((r) => r.table === 'listings')).toBe(false);
    expect(recorded.filter((r) => r.table === 'collections')[1]!.calls[0]![0]).toBe('update');
  });
});

describe('createCollection — slugs, empty sets, failures', () => {
  it('picks the first free numeric suffix when the slug is taken', async () => {
    const { db, recorded } = fakeDb({
      collections: [
        { data: [{ slug: 'weekend-bakes' }, { slug: 'weekend-bakes-2' }] },
        { data: { id: 'c2', slug: 'weekend-bakes-3' } },
      ],
    });
    await createCollection(db, 't1', { name: 'Weekend Bakes', description: 'Fresh', productIds: [] });
    const row = recorded[1]!.calls.find((c) => c[0] === 'insert')![1] as Record<string, unknown>;
    expect(row['slug']).toBe('weekend-bakes-3');
    expect(row['description']).toBe('Fresh');
    // No products → no assignment write at all.
    expect(recorded.some((r) => r.table === 'listings')).toBe(false);
  });

  it('treats a null slug list as no taken slugs and stores a missing description as null', async () => {
    const { db, recorded } = fakeDb({
      collections: [{ data: null }, { data: { id: 'c3', slug: 'gifts' } }],
    });
    await createCollection(db, 't1', { name: 'Gifts', productIds: [] });
    const row = recorded[1]!.calls.find((c) => c[0] === 'insert')![1] as Record<string, unknown>;
    expect(row['slug']).toBe('gifts');
    expect(row['description']).toBeNull();
  });

  it('throws with the database message when the insert errors', async () => {
    const { db } = fakeDb({ collections: [{ data: [] }, { data: null, error: { message: 'dup' } }] });
    await expect(createCollection(db, 't1', { name: 'X', productIds: ['l1'] })).rejects.toThrow(
      'createCollection failed: dup',
    );
  });

  it('throws "no row" when the insert returns neither a row nor an error', async () => {
    const { db, recorded } = fakeDb({ collections: [{ data: [] }, { data: null, error: null }] });
    await expect(createCollection(db, 't1', { name: 'X', productIds: ['l1'] })).rejects.toThrow(
      'createCollection failed: no row',
    );
    expect(recorded.some((r) => r.table === 'listings')).toBe(false);
  });
});

describe('updateCollection — edge cases', () => {
  it('stores a null description and only detaches when no products remain', async () => {
    const { db, recorded } = fakeDb({ collections: [{ error: null }], listings: [{ error: null }] });
    await updateCollection(db, 't1', 'c1', { name: 'Empty', productIds: [] });
    const patch = recorded.find((r) => r.table === 'collections')!.calls[0]![1];
    expect(patch).toEqual({ name: 'Empty', description: null });
    const listingUpdates = recorded.filter((r) => r.table === 'listings');
    expect(listingUpdates).toHaveLength(1);
    expect(listingUpdates[0]!.calls).toContainEqual(['eq', 'primary_collection_id', 'c1']);
  });

  it('throws before touching products when the update errors', async () => {
    const { db, recorded } = fakeDb({ collections: [{ error: { message: 'denied' } }] });
    await expect(updateCollection(db, 't1', 'c1', { name: 'X', productIds: ['l1'] })).rejects.toThrow(
      'updateCollection failed: denied',
    );
    expect(recorded.some((r) => r.table === 'listings')).toBe(false);
  });
});

describe('deleteCollection — failure', () => {
  it('throws with the database message when the soft-delete errors', async () => {
    const { db } = fakeDb({ listings: [{ error: null }], collections: [{ error: { message: 'nope' } }] });
    await expect(deleteCollection(db, 't1', 'c1')).rejects.toThrow('deleteCollection failed: nope');
  });
});

describe('loadWalkCollections — fallbacks', () => {
  it('returns [] when there are no collections', async () => {
    const { db } = fakeDb({ collections: [{ data: null }], listings: [{ data: null }] });
    expect(await loadWalkCollections(db, 't1')).toEqual([]);
  });

  it('gives an empty description and no products to a collection with none', async () => {
    const { db } = fakeDb({
      collections: [{ data: [{ id: 'c1', name: 'Solo', description: null }] }],
      listings: [{ data: null }],
    });
    expect(await loadWalkCollections(db, 't1')).toEqual([
      { id: 'c1', name: 'Solo', description: '', productIds: [] },
    ]);
  });
});
