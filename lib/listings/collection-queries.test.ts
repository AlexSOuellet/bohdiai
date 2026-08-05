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
