import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { listProducts, getProduct, listCollections, getCollection, stockLabel, priceRangeLabel } from './queries';

type Rows = Record<string, unknown[]>;
function fakeDb(rows: Rows): SupabaseClient<Database> {
  const from = (table: string) => {
    let data: unknown[] = rows[table] ?? [];
    const q = {
      select: () => q,
      eq: (col: string, val: unknown) => {
        data = data.filter((r) => {
          const v = (r as Record<string, unknown>)[col];
          return v === undefined || v === val;
        });
        return q;
      },
      in: () => q,
      is: () => q,
      order: () => q,
      maybeSingle: async () => ({ data: data[0] ?? null, error: null }),
      then: (resolve: (v: { data: unknown[]; error: null }) => unknown) => resolve({ data, error: null }),
    };
    return q;
  };
  return { from } as unknown as SupabaseClient<Database>;
}

const listing = {
  id: 'l1',
  tenant_id: 't1',
  slug: 'fig',
  name: 'Fig Candle',
  status: 'active',
  listing_type: 'product',
  base_price_cents: 2400,
  inventory_count: 0,
  short_description: 'Figs',
  description: null,
  media_ids: ['u1'],
  file_upload_id: null,
  metadata: {},
  variation_attributes: [],
  listing_variants: [],
  listing_collections: [{ collection_id: 'c1' }],
};

describe('labels', () => {
  it('describes stock in plain words', () => {
    expect(stockLabel({ inventoryCount: null, hasOptions: false, combinations: [] })).toBe('Made to order');
    expect(stockLabel({ inventoryCount: 0, hasOptions: false, combinations: [] })).toBe('Sold out');
    expect(stockLabel({ inventoryCount: 4, hasOptions: false, combinations: [] })).toBe('4 in stock');
    expect(stockLabel({ inventoryCount: null, hasOptions: true, combinations: [{ inventoryCount: 2 }, { inventoryCount: null }, { inventoryCount: 3 }] })).toBe('5 in stock');
  });
  it('shows a price range only when prices differ', () => {
    expect(priceRangeLabel(2400, [])).toBe('$24');
    expect(priceRangeLabel(2400, [{ priceCents: 1800 }, { priceCents: null }])).toBe('$18–$24');
  });
});

describe('listProducts', () => {
  it('lists the shop’s products with photo, price, stock and status', async () => {
    const db = fakeDb({ listings: [listing], uploads: [{ id: 'u1', public_url: 'https://x/u1.webp', alt_text: null }] });
    expect(await listProducts(db, 't1')).toEqual([
      {
        id: 'l1',
        name: 'Fig Candle',
        status: 'active',
        priceLabel: '$24',
        stockLabel: 'Sold out',
        soldOut: true,
        photoUrl: 'https://x/u1.webp',
        photoUploadId: 'u1',
        collectionIds: ['c1'],
      },
    ]);
  });
  it('shows the first photo that still resolves, like the storefront does', async () => {
    const db = fakeDb({ listings: [{ ...listing, media_ids: ['gone', 'u1'] }], uploads: [{ id: 'u1', public_url: 'https://x/u1.webp', alt_text: null }] });
    expect(await listProducts(db, 't1')).toMatchObject([{ photoUrl: 'https://x/u1.webp', photoUploadId: 'u1' }]);
  });
  it('has no photo when none resolve', async () => {
    const db = fakeDb({ listings: [{ ...listing, media_ids: ['gone'] }], uploads: [] });
    expect(await listProducts(db, 't1')).toMatchObject([{ photoUrl: null, photoUploadId: null }]);
  });
  it('falls back to the legacy sample photo the shop shows, which is not an upload', async () => {
    const db = fakeDb({ listings: [{ ...listing, media_ids: [], metadata: { image_url: 'https://stock/fig.jpg' } }], uploads: [] });
    expect(await listProducts(db, 't1')).toMatchObject([{ photoUrl: 'https://stock/fig.jpg', photoUploadId: null }]);
  });
  it('prefers a real photo over the sample photo', async () => {
    const db = fakeDb({
      listings: [{ ...listing, metadata: { image_url: 'https://stock/fig.jpg' } }],
      uploads: [{ id: 'u1', public_url: 'https://x/u1.webp', alt_text: null }],
    });
    expect(await listProducts(db, 't1')).toMatchObject([{ photoUrl: 'https://x/u1.webp', photoUploadId: 'u1' }]);
  });
});

describe('getProduct', () => {
  it('turns the rows back into the editor’s form', async () => {
    const withOptions = {
      ...listing,
      inventory_count: null,
      variation_attributes: [
        {
          name: 'Size',
          position: 0,
          variation_options: [
            { value: 'Large', position: 1, kind: 'physical', file_upload_id: null },
            { value: 'Small', position: 0, kind: 'physical', file_upload_id: null },
          ],
        },
      ],
      listing_variants: [
        { option_combination: { Size: 'Small' }, price_cents: null, inventory_count: 2, status: 'active' },
        { option_combination: { Size: 'Large' }, price_cents: 3000, inventory_count: null, status: 'archived' },
      ],
    };
    const db = fakeDb({ listings: [withOptions], uploads: [{ id: 'u1', public_url: 'https://x/u1.webp', alt_text: null, file_name: 'a.webp' }] });
    const form = await getProduct(db, 't1', 'l1');
    expect(form).toMatchObject({
      id: 'l1',
      slug: 'fig',
      name: 'Fig Candle',
      price: '24',
      stock: '',
      status: 'active',
      kind: 'physical',
      photos: [{ uploadId: 'u1', url: 'https://x/u1.webp' }],
      samplePhotoUrl: null,
      collectionIds: ['c1'],
      options: [{ name: 'Size', choices: [{ value: 'Small' }, { value: 'Large' }] }],
      variants: [
        { choices: { Size: 'Small' }, price: '', stock: '2', available: true },
        { choices: { Size: 'Large' }, price: '30', stock: '', available: false },
      ],
    });
  });
  it('carries the legacy sample photo only when the product has no real photos', async () => {
    const sample = { ...listing, media_ids: [], metadata: { image_url: 'https://stock/fig.jpg' } };
    expect(await getProduct(fakeDb({ listings: [sample], uploads: [] }), 't1', 'l1')).toMatchObject({ photos: [], samplePhotoUrl: 'https://stock/fig.jpg' });
    const both = { ...listing, metadata: { image_url: 'https://stock/fig.jpg' } };
    const db = fakeDb({ listings: [both], uploads: [{ id: 'u1', public_url: 'https://x/u1.webp', alt_text: null, file_name: 'a.webp' }] });
    expect(await getProduct(db, 't1', 'l1')).toMatchObject({ photos: [{ uploadId: 'u1' }], samplePhotoUrl: null });
  });
  it('is null for a product that isn’t there', async () => {
    expect(await getProduct(fakeDb({ listings: [] }), 't1', 'nope')).toBeNull();
  });
});

describe('collections', () => {
  const rows = {
    collections: [
      { id: 'c1', tenant_id: 't1', name: 'Autumn', status: 'draft', description: 'Warm', featured_image_id: null, listing_collections: [
          { listing_id: 'l2', position: 1, listings: { deleted_at: null } },
          { listing_id: 'l9', position: 2, listings: { deleted_at: '2026-09-01T00:00:00Z' } },
          { listing_id: 'l8', position: 3, listings: null },
          { listing_id: 'l1', position: 0, listings: { deleted_at: null } },
        ] },
    ],
  };
  it('counts only live products — what shoppers see — leaving out drafts, archived and deleted', async () => {
    const live = { status: 'active', deleted_at: null };
    const listed = {
      collections: [
        {
          id: 'c1',
          tenant_id: 't1',
          name: 'Autumn',
          status: 'draft',
          listing_collections: [
            { listing_id: 'l1', listings: live },
            { listing_id: 'l2', listings: { status: 'draft', deleted_at: null } },
            { listing_id: 'l3', listings: { status: 'archived', deleted_at: null } },
            { listing_id: 'l4', listings: { status: 'active', deleted_at: '2026-09-01T00:00:00Z' } },
            { listing_id: 'l5', listings: null },
          ],
        },
      ],
    };
    expect(await listCollections(fakeDb(listed), 't1')).toEqual([{ id: 'c1', name: 'Autumn', status: 'draft', productCount: 1 }]);
  });
  it('loads one as the editor’s form, products in the maker’s order, leaving out deleted products', async () => {
    expect(await getCollection(fakeDb(rows), 't1', 'c1')).toEqual({
      id: 'c1',
      name: 'Autumn',
      description: 'Warm',
      status: 'draft',
      featuredImageId: null,
      productIds: ['l1', 'l2'],
    });
  });
});
