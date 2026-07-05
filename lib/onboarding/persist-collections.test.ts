/**
 * Tests for persistCollections — the last mile of the build that turns the
 * copywriter's authored `content.collections.items` into real DB rows and
 * round-robin assigns each product to a primary collection.
 *
 * We stub the Supabase admin client with a hand-rolled mock so the test runs
 * in memory. The test asserts the SHAPE of the calls (right table, right rows,
 * right assignments) rather than any real Postgres behavior — mirroring how
 * build-archetype-store.test.ts covers its heavy neighbors.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MainStreetContent } from '@/lib/archetypes/main-street/schemas';
import type { ProductView } from '@/lib/archetypes/content';

// Track every call made against Supabase during the test so we can assert on it.
const insertCalls: unknown[] = [];
const updateCalls: Array<{ update: unknown; matchers: Record<string, unknown> }> = [];
let insertReturn: { data: Array<{ id: string; slug: string }> | null; error: { message: string } | null } = {
  data: null,
  error: null,
};

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    from(table: string) {
      return {
        insert(rows: unknown) {
          insertCalls.push({ table, rows });
          return {
            select: () => Promise.resolve(insertReturn),
          };
        },
        update(patch: unknown) {
          const matchers: Record<string, unknown> = {};
          const chain: Record<string, unknown> = {
            eq(col: string, val: unknown) {
              matchers[col] = val;
              return chain;
            },
            then(resolve: (value: { error: null }) => unknown) {
              updateCalls.push({ update: patch, matchers });
              return resolve({ error: null });
            },
          };
          return chain;
        },
      };
    },
  }),
}));

// Import AFTER the mock is registered so the module picks it up.
const { persistCollections } = await import('./build-archetype-store');

function makeContent(items: MainStreetContent['collections'] extends { items?: infer I } | undefined ? I : never): MainStreetContent {
  return {
    shopName: 'Test Shop',
    identity: { wordmark: 'TS', nav: [] },
    moment: {
      media: { kind: 'still', prompt: { composition: 'x', subject: 'x', environment: 'x', atmosphere: 'x', camera: 'x', lighting: 'x', style: 'x' }, alt: 'x' },
      story: ['a', 'b'],
      eyebrow: 'e',
      brand: 'b',
      ctaLabel: 'c',
    },
    goods: { title: 'Goods' },
    collections: { title: 'Collections', items },
    founder: {
      quote: 'q',
      attribution: 'me',
      photo: { prompt: 'x', alt: 'x' },
    },
    close: { label: 'l', headline: 'H', ctaLabel: 'c' },
  } as unknown as MainStreetContent;
}

function makeProducts(count: number): ProductView[] {
  return Array.from({ length: count }, (_, i) => ({
    slug: `p-${i}`,
    name: `Product ${i}`,
    price: '$10',
    status: 'active' as const,
    media: [],
    variations: [],
    description: `A test product ${i}`,
  }));
}

describe('persistCollections', () => {
  beforeEach(() => {
    insertCalls.length = 0;
    updateCalls.length = 0;
    insertReturn = { data: null, error: null };
  });

  it('does nothing when no collections were authored', async () => {
    const content = makeContent(undefined as never);
    await persistCollections('tenant-1', content, makeProducts(3));
    expect(insertCalls).toHaveLength(0);
    expect(updateCalls).toHaveLength(0);
  });

  it('inserts an active row per authored collection under the tenant id', async () => {
    const items = [
      { name: 'Winter Warmers', description: 'Rich, dark scents.', slug: 'winter-warmers' },
      { name: 'Summer Fresh', description: 'Bright, uplifting scents.', slug: 'summer-fresh' },
    ];
    insertReturn = {
      data: items.map((c, i) => ({ id: `col-${i}`, slug: c.slug })),
      error: null,
    };
    const content = makeContent(items);
    await persistCollections('tenant-1', content, []);
    expect(insertCalls).toHaveLength(1);
    expect(insertCalls[0]).toEqual({
      table: 'collections',
      rows: items.map((c) => ({
        tenant_id: 'tenant-1',
        slug: c.slug,
        name: c.name,
        description: c.description,
        status: 'active',
      })),
    });
  });

  it('round-robin assigns each product a primary_collection_id', async () => {
    const items = [
      { name: 'A', description: 'a', slug: 'a' },
      { name: 'B', description: 'b', slug: 'b' },
    ];
    insertReturn = {
      data: [{ id: 'col-a', slug: 'a' }, { id: 'col-b', slug: 'b' }],
      error: null,
    };
    const content = makeContent(items);
    const products = makeProducts(5);
    await persistCollections('tenant-1', content, products);

    // Five products → col-a, col-b, col-a, col-b, col-a (round-robin).
    expect(updateCalls).toHaveLength(5);
    expect(updateCalls[0]).toEqual({
      update: { primary_collection_id: 'col-a' },
      matchers: { tenant_id: 'tenant-1', slug: 'p-0' },
    });
    expect(updateCalls[1]).toEqual({
      update: { primary_collection_id: 'col-b' },
      matchers: { tenant_id: 'tenant-1', slug: 'p-1' },
    });
    expect(updateCalls[2]!.update).toEqual({ primary_collection_id: 'col-a' });
    expect(updateCalls[3]!.update).toEqual({ primary_collection_id: 'col-b' });
    expect(updateCalls[4]!.update).toEqual({ primary_collection_id: 'col-a' });
  });

  it('skips the insert step when the DB errors — never fails the build', async () => {
    const items = [{ name: 'X', description: 'x', slug: 'x' }];
    insertReturn = { data: null, error: { message: 'rls denied' } };
    const content = makeContent(items);
    await persistCollections('tenant-1', content, makeProducts(2));
    // Insert was attempted but returned an error; no product assignments follow.
    expect(insertCalls).toHaveLength(1);
    expect(updateCalls).toHaveLength(0);
  });
});
