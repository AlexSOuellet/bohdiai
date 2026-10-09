import { describe, it, expect } from 'vitest';
import { galleryToProducts, pickedForShowcase, productsFromGallery } from './convert';

const photos = [
  { uploadId: 'u1', caption: 'Cabbage rose oyster dish' },
  { uploadId: 'u2', caption: 'The lady in amber' },
  { uploadId: 'u3', caption: '' },
  { uploadId: 'u4', caption: 'Carol star' },
];

describe('gallery photos become products', () => {
  it('names each from its caption, in gallery order, with no price yet', () => {
    const made = productsFromGallery(photos, new Set(), new Set(), 0);
    expect(made.map((p) => p.name)).toEqual(['Cabbage rose oyster dish', 'The lady in amber', 'Piece 3', 'Carol star']);
    expect(made.map((p) => p.slug)).toEqual(['cabbage-rose-oyster-dish', 'the-lady-in-amber', 'piece-3', 'carol-star']);
    expect(made.every((p) => p.base_price_cents === 0)).toBe(true);
    expect(made[0]?.media_ids).toEqual(['u1']);
  });

  it('skips photos that are already products and never reuses an address', () => {
    const made = productsFromGallery(photos, new Set(['u1']), new Set(['the-lady-in-amber']), 0);
    expect(made.map((p) => p.slug)).toEqual(['the-lady-in-amber-2', 'piece-2', 'carol-star']);
  });

  it('fills the home page up to its limit, counting what’s already there', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ uploadId: `u${i}`, caption: `Piece ${i}` }));
    expect(productsFromGallery(many, new Set(), new Set(), 0).filter((p) => p.on_home)).toHaveLength(5);
    expect(productsFromGallery(many, new Set(), new Set(), 4).filter((p) => p.on_home)).toHaveLength(1);
    expect(productsFromGallery(many, new Set(), new Set(), 8).filter((p) => p.on_home)).toHaveLength(0);
  });
});

type Rows = { gallery: unknown[]; listings: unknown[]; galleryError?: string; listingsError?: string; insertError?: string };
function fakeDb(rows: Rows) {
  const inserted: unknown[] = [];
  const result = (data: unknown[], err?: string) => Promise.resolve({ data: err === undefined ? data : null, error: err === undefined ? null : { message: err } });
  const db = {
    from: (table: string) => {
      if (table === 'gallery_items') {
        const chain = { select: () => chain, eq: () => chain, order: () => chain, then: (f: (v: unknown) => unknown) => result(rows.gallery, rows.galleryError).then(f) };
        return chain;
      }
      return {
        select: () => ({ eq: () => result(rows.listings, rows.listingsError) }),
        insert: (arg: unknown[]) => {
          inserted.push(...arg);
          return Promise.resolve({ error: rows.insertError === undefined ? null : { message: rows.insertError } });
        },
      };
    },
  };
  return { db: db as unknown as Parameters<typeof galleryToProducts>[0], inserted };
}

describe('writing them', () => {
  const gallery = [
    { upload_id: 'u1', caption: 'Carol star', position: 0, created_at: '' },
    { upload_id: 'u2', caption: 'Old Saint Nick', position: 1, created_at: '' },
  ];

  it('adds live products for the photos not already used', async () => {
    const { db, inserted } = fakeDb({ gallery, listings: [{ slug: 'carol-star', media_ids: ['u1'], on_home: true, deleted_at: null }] });
    expect(await galleryToProducts(db, 't1')).toEqual({ ok: true, added: 1 });
    expect(inserted).toEqual([expect.objectContaining({ tenant_id: 't1', name: 'Old Saint Nick', status: 'active', listing_type: 'product', base_price_cents: 0, media_ids: ['u2'] })]);
  });

  it('adds nothing when every photo is a product already', async () => {
    const { db, inserted } = fakeDb({ gallery, listings: [{ slug: 'a', media_ids: ['u1', 'u2'], on_home: false, deleted_at: null }] });
    expect(await galleryToProducts(db, 't1')).toEqual({ ok: true, added: 0 });
    expect(inserted).toEqual([]);
  });

  it('says which read or write failed', async () => {
    expect(await galleryToProducts(fakeDb({ gallery, listings: [], galleryError: 'down' }).db, 't1')).toEqual({ ok: false, error: 'gallery: down' });
    expect(await galleryToProducts(fakeDb({ gallery, listings: [], listingsError: 'down' }).db, 't1')).toEqual({ ok: false, error: 'products: down' });
    expect(await galleryToProducts(fakeDb({ gallery, listings: [], insertError: 'full' }).db, 't1')).toEqual({ ok: false, error: 'products: full' });
  });
});

describe('picking products for Showcase', () => {
  const products = [
    { id: 'a', name: 'A', uploadId: 'ua' },
    { id: 'b', name: 'B', uploadId: 'ub' },
    { id: 'c', name: 'C', uploadId: 'uc' },
  ];
  it('keeps her order, drops unknown and repeated ids, and stops at the limit', () => {
    expect(pickedForShowcase(['c', 'x', 'a', 'c', 'b'], products, 2).map((p) => p.id)).toEqual(['c', 'a']);
    expect(pickedForShowcase([], products, 12)).toEqual([]);
  });
});
