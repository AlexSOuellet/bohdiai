import { describe, it, expect } from 'vitest';
import { galleryFromProducts, galleryToProducts, pickedForShowcase, productsFromGallery, showcaseCandidates } from './convert';

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

type Op = { table: string; op: string; args: unknown[] };
type Fail = Partial<Record<'products' | 'photos' | 'clear' | 'insert' | 'untick' | 'tick', string>>;

/** Her products and their photos, as the database would answer, failing where asked; keeps every call. */
function showcaseDb(products: unknown[] | null, uploads: unknown[] | null, fail: Fail = {}) {
  const ops: Op[] = [];
  const answer = (err: string | undefined, data: unknown = null) => Promise.resolve({ data: err === undefined ? data : null, error: err === undefined ? null : { message: err } });
  const db = {
    from: (table: string) => {
      const mine: Op[] = [];
      const chain: Record<string, unknown> = {};
      const note = (op: string, args: unknown[]) => {
        const o = { table, op, args };
        ops.push(o);
        mine.push(o);
      };
      const has = (op: string) => mine.some((o) => o.op === op);
      const finish = () => {
        if (table === 'uploads') return answer(fail.photos, uploads);
        if (table === 'gallery_items') return answer(has('delete') ? fail.clear : fail.insert);
        if (has('update')) return answer((mine.find((o) => o.op === 'update')?.args[0] as { in_gallery: boolean }).in_gallery ? fail.tick : fail.untick);
        return answer(fail.products, products);
      };
      for (const op of ['select', 'eq', 'is', 'in', 'order', 'update', 'delete']) {
        chain[op] = (...args: unknown[]) => {
          note(op, args);
          return chain;
        };
      }
      chain['insert'] = (...args: unknown[]) => {
        note('insert', args);
        return finish();
      };
      chain['then'] = (f: (v: unknown) => unknown, r?: (e: unknown) => unknown) => finish().then(f, r);
      return chain;
    },
  };
  return { db: db as unknown as Parameters<typeof showcaseCandidates>[0], ops };
}

const listing = (id: string, name: string, media: string[]) => ({ id, name, media_ids: media, on_home: false, created_at: '' });
const isWrite = (o: Op) => ['delete', 'insert', 'update'].includes(o.op);

describe('the products that can stand in the Showcase gallery', () => {
  it('gives each live product with a photo, with its main photo and that photo’s address', async () => {
    const { db, ops } = showcaseDb(
      [listing('a', 'Carol star', ['ua', 'ux']), listing('b', 'No photo yet', []), listing('c', 'Old Saint Nick', ['uc'])],
      [
        { id: 'ua', public_url: 'https://cdn.example.com/ua.jpg' },
        { id: 'uc', public_url: 'https://cdn.example.com/uc.jpg' },
      ],
    );
    expect(await showcaseCandidates(db, 't1')).toEqual({
      ok: true,
      products: [
        { id: 'a', name: 'Carol star', uploadId: 'ua', url: 'https://cdn.example.com/ua.jpg' },
        { id: 'c', name: 'Old Saint Nick', uploadId: 'uc', url: 'https://cdn.example.com/uc.jpg' },
      ],
    });
    expect(ops.find((o) => o.table === 'uploads' && o.op === 'in')?.args).toEqual(['id', ['ua', 'uc']]);
    expect(ops.filter((o) => o.table === 'listings' && o.op === 'eq').map((o) => o.args)).toEqual([
      ['tenant_id', 't1'],
      ['status', 'active'],
    ]);
  });

  it('leaves out a product whose photo is gone or has no address', async () => {
    const { db } = showcaseDb([listing('a', 'A', ['ua']), listing('b', 'B', ['ub'])], [{ id: 'ub', public_url: null }]);
    expect(await showcaseCandidates(db, 't1')).toEqual({ ok: true, products: [] });
  });

  it('never asks for photos when no product has one', async () => {
    const { db, ops } = showcaseDb([listing('b', 'B', [])], null);
    expect(await showcaseCandidates(db, 't1')).toEqual({ ok: true, products: [] });
    expect(ops.some((o) => o.table === 'uploads')).toBe(false);
  });

  it('treats no answer as no products, and no photo answer as no photos', async () => {
    expect(await showcaseCandidates(showcaseDb(null, null).db, 't1')).toEqual({ ok: true, products: [] });
    expect(await showcaseCandidates(showcaseDb([listing('a', 'A', ['ua'])], null).db, 't1')).toEqual({ ok: true, products: [] });
  });

  it('says which read failed', async () => {
    expect(await showcaseCandidates(showcaseDb([], [], { products: 'down' }).db, 't1')).toEqual({ ok: false, error: 'products: down' });
    expect(await showcaseCandidates(showcaseDb([listing('a', 'A', ['ua'])], [], { photos: 'down' }).db, 't1')).toEqual({ ok: false, error: 'photos: down' });
  });
});

describe('making the picked products her Showcase gallery', () => {
  const products = [listing('a', 'Carol star', ['ua']), listing('b', 'Old Saint Nick', ['ub']), listing('c', 'Amber lady', ['uc'])];
  const uploads = [
    { id: 'ua', public_url: 'https://cdn.example.com/ua.jpg' },
    { id: 'ub', public_url: 'https://cdn.example.com/ub.jpg' },
    { id: 'uc', public_url: 'https://cdn.example.com/uc.jpg' },
  ];

  it('replaces the gallery with their photos in her order, captioned with their names, and ticks only them', async () => {
    const { db, ops } = showcaseDb(products, uploads);
    expect(await galleryFromProducts(db, 't1', ['c', 'a', 'b'], 2)).toEqual({ ok: true, count: 2 });
    expect(ops.find((o) => o.op === 'insert')?.args[0]).toEqual([
      { tenant_id: 't1', upload_id: 'uc', position: 0, caption: 'Amber lady' },
      { tenant_id: 't1', upload_id: 'ua', position: 1, caption: 'Carol star' },
    ]);
    expect(ops.filter(isWrite).map((o) => `${o.table}.${o.op}`)).toEqual(['gallery_items.delete', 'gallery_items.insert', 'listings.update', 'listings.update']);
    expect(ops.filter((o) => o.op === 'update').map((o) => o.args[0])).toEqual([{ in_gallery: false }, { in_gallery: true }]);
    expect(ops.filter((o) => o.table === 'listings' && o.op === 'in').at(-1)?.args).toEqual(['id', ['c', 'a']]);
  });

  it('changes nothing when none of the picks can stand in the gallery', async () => {
    const { db, ops } = showcaseDb(products, uploads);
    expect(await galleryFromProducts(db, 't1', ['nope'], 12)).toEqual({ ok: true, count: 0 });
    expect(ops.some(isWrite)).toBe(false);
  });

  it('passes on a failed read of her products, touching nothing', async () => {
    const { db, ops } = showcaseDb(products, uploads, { products: 'down' });
    expect(await galleryFromProducts(db, 't1', ['a'], 12)).toEqual({ ok: false, error: 'products: down' });
    expect(ops.some(isWrite)).toBe(false);
  });

  it('says which write failed, and stops there', async () => {
    const run = async (fail: Fail) => {
      const { db, ops } = showcaseDb(products, uploads, fail);
      return { result: await galleryFromProducts(db, 't1', ['a'], 12), writes: ops.filter(isWrite).length };
    };
    expect(await run({ clear: 'locked' })).toEqual({ result: { ok: false, error: 'gallery: locked' }, writes: 1 });
    expect(await run({ insert: 'full' })).toEqual({ result: { ok: false, error: 'gallery: full' }, writes: 2 });
    expect(await run({ untick: 'locked' })).toEqual({ result: { ok: false, error: 'gallery ticks: locked' }, writes: 3 });
    expect(await run({ tick: 'locked' })).toEqual({ result: { ok: false, error: 'gallery ticks: locked' }, writes: 4 });
  });
});
