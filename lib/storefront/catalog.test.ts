import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import {
  formatPrice,
  imageUrlFromMetadata,
  resolveMediaMap,
  mediaForListing,
  toProductView,
  loadMediaMap,
  loadCatalog,
  loadCollections,
  loadProduct,
  type ListingRow,
  type AttributeRow,
  type VariantRow,
} from './catalog';

const row = (over: Partial<ListingRow> = {}): ListingRow => ({
  id: 'l1',
  slug: 'fig',
  name: 'Fig Candle',
  listing_type: 'product',
  base_price_cents: 2400,
  short_description: 'Figs',
  description: 'Long',
  metadata: {},
  media_ids: ['u1', 'u2'],
  inventory_count: null,
  is_preview: false,
  on_home: false,
  is_new: false,
  ...over,
});
const media = resolveMediaMap([
  { id: 'u1', public_url: 'https://x/1.webp', alt_text: null },
  { id: 'u2', public_url: 'https://x/2.webp', alt_text: 'Side' },
]);
const sizeAttr: AttributeRow = { listing_id: 'l1', name: 'Size', position: 0, variation_options: [{ value: 'Large', position: 1 }, { value: 'Small', position: 0 }] };
const variant = (choices: Record<string, string>, price: number | null, stock: number | null): VariantRow => ({ listing_id: 'l1', option_combination: choices, price_cents: price, inventory_count: stock });

describe('small helpers', () => {
  it('formats prices the long-standing way', () => {
    expect(formatPrice(2400)).toBe('$24');
    expect(formatPrice(2450)).toBe('$24.50');
  });
  it('reads the legacy metadata photo', () => {
    expect(imageUrlFromMetadata({ image_url: 'https://x/a.jpg' })).toBe('https://x/a.jpg');
    expect(imageUrlFromMetadata(null)).toBeUndefined();
    expect(imageUrlFromMetadata({ image_url: '' })).toBeUndefined();
  });
  it('skips uploads with no url', () => {
    expect(resolveMediaMap([{ id: 'a', public_url: null, alt_text: null }, { id: 'b', public_url: '', alt_text: null }]).size).toBe(0);
  });
});

describe('mediaForListing', () => {
  it('returns every uploaded photo in the maker’s order, alt falling back to the name', () => {
    expect(mediaForListing(row(), media)).toEqual([
      { kind: 'image', url: 'https://x/1.webp', alt: 'Fig Candle' },
      { kind: 'image', url: 'https://x/2.webp', alt: 'Side' },
    ]);
  });
  it('falls back to the legacy metadata photo, then to nothing', () => {
    expect(mediaForListing(row({ media_ids: [], metadata: { image_url: 'https://x/m.jpg' } }), media)).toEqual([{ kind: 'image', url: 'https://x/m.jpg', alt: 'Fig Candle' }]);
    expect(mediaForListing(row({ media_ids: null }), media)).toEqual([]);
  });
});

describe('toProductView', () => {
  it('projects a product without options', () => {
    expect(toProductView(row(), [], [], media)).toEqual({
      id: 'l1',
      slug: 'fig',
      name: 'Fig Candle',
      price: '$24',
      priceCents: 2400,
      shortDescription: 'Figs',
      description: 'Long',
      status: 'active',
      media: mediaForListing(row(), media),
      variations: [],
    });
  });
  it('marks a product the owner put on the home page, and only that one', () => {
    expect(toProductView(row({ on_home: true }), [], [], media).onHome).toBe(true);
    expect(toProductView(row(), [], [], media)).not.toHaveProperty('onHome');
  });
  it('is sold out when its stock is 0, not when it is blank', () => {
    expect(toProductView(row({ inventory_count: 0 }), [], [], media).status).toBe('sold_out');
    expect(toProductView(row({ inventory_count: null }), [], [], media).status).toBe('active');
  });
  it('lists options in order and each available combination with its own price', () => {
    const view = toProductView(row(), [sizeAttr], [variant({ Size: 'Large' }, 3000, null), variant({ Size: 'Small' }, null, 2)], media);
    expect(view.variations).toEqual([{ name: 'Size', options: ['Small', 'Large'] }]);
    expect(view.offers).toEqual([
      { choices: { Size: 'Small' }, price: '$24', soldOut: false },
      { choices: { Size: 'Large' }, price: '$30', soldOut: false },
    ]);
    expect(view.price).toBe('$24');
    expect(view.priceFrom).toBe(true);
    expect(view.status).toBe('active');
  });
  it('prices "from" the cheapest combination that can still be bought', () => {
    const view = toProductView(row(), [sizeAttr], [variant({ Size: 'Small' }, null, 0), variant({ Size: 'Large' }, 3000, null)], media);
    expect(view.price).toBe('$30');
    expect(view.priceFrom).toBeUndefined();
  });
  it('is sold out when every combination is, or none is available', () => {
    expect(toProductView(row(), [sizeAttr], [variant({ Size: 'Small' }, null, 0)], media).status).toBe('sold_out');
    expect(toProductView(row(), [sizeAttr], [], media)).toMatchObject({ status: 'sold_out', offers: [] });
  });
  it('ignores combinations that no longer match the options', () => {
    const view = toProductView(row(), [sizeAttr], [variant({ Colour: 'Red' }, 100, null), variant({ Size: 'Small' }, null, null)], media);
    expect(view.offers).toEqual([{ choices: { Size: 'Small' }, price: '$24', soldOut: false }]);
  });
});

/** A fake Supabase client: each table returns its canned rows, and every query records its calls. */
function fakeDb(tables: Record<string, unknown[]>, failing: string[] = []) {
  const calls: { table: string; method: string; args: unknown[] }[] = [];
  const from = vi.fn((table: string) => {
    const result = failing.includes(table) ? { data: null, error: { message: 'down' } } : { data: tables[table] ?? [], error: null };
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'in', 'is', 'order']) {
      q[m] = (...args: unknown[]) => {
        calls.push({ table, method: m, args });
        return q;
      };
    }
    q['maybeSingle'] = async () => ({ data: (result.data as unknown[] | null)?.[0] ?? null, error: result.error });
    q['then'] = (resolve: (v: unknown) => unknown) => resolve(result);
    return q;
  });
  return { db: { from } as unknown as SupabaseClient<Database>, calls, from };
}

describe('loadMediaMap', () => {
  it('does not query when there are no ids', async () => {
    const { db, from } = fakeDb({});
    expect((await loadMediaMap(db, [])).size).toBe(0);
    expect(from).not.toHaveBeenCalled();
  });
  it('queries live uploads once with de-duplicated ids', async () => {
    const { db, calls, from } = fakeDb({ uploads: [{ id: 'u1', public_url: 'https://x/1.webp', alt_text: 'one' }] });
    const map = await loadMediaMap(db, ['u1', 'u1', 'u2']);
    expect(map.get('u1')).toEqual({ url: 'https://x/1.webp', alt: 'one' });
    expect(from).toHaveBeenCalledTimes(1);
    expect(calls).toContainEqual({ table: 'uploads', method: 'in', args: ['id', ['u1', 'u2']] });
    expect(calls).toContainEqual({ table: 'uploads', method: 'is', args: ['deleted_at', null] });
  });
  it('throws when the uploads read fails, so a photo is never silently dropped', async () => {
    await expect(loadMediaMap(fakeDb({}, ['uploads']).db, ['u1'])).rejects.toThrow('Could not load photos: down');
  });
});

describe('loadCatalog', () => {
  it('loads live products of both kinds, with their options and live combinations', async () => {
    const { db, calls } = fakeDb({
      listings: [row()],
      uploads: [{ id: 'u1', public_url: 'https://x/1.webp', alt_text: null }],
      variation_attributes: [sizeAttr],
      listing_variants: [variant({ Size: 'Small' }, null, null)],
    });
    const catalog = await loadCatalog(db, 't1');
    expect(catalog.products.map((p) => p.slug)).toEqual(['fig']);
    expect(catalog.byId.get('l1')?.offers).toHaveLength(1);
    expect(calls).toContainEqual({ table: 'listings', method: 'eq', args: ['tenant_id', 't1'] });
    expect(calls).toContainEqual({ table: 'listings', method: 'in', args: ['listing_type', ['product', 'digital_product']] });
    expect(calls).toContainEqual({ table: 'listings', method: 'eq', args: ['status', 'active'] });
    expect(calls).toContainEqual({ table: 'listing_variants', method: 'eq', args: ['status', 'active'] });
  });
  it('skips the detail queries for an empty shop', async () => {
    const { db, from } = fakeDb({ listings: [] });
    expect((await loadCatalog(db, 't1')).products).toEqual([]);
    expect(from).toHaveBeenCalledTimes(1);
  });
  it('throws rather than show a wrong shop when a read fails', async () => {
    await expect(loadCatalog(fakeDb({ listings: [row()] }, ['listing_variants']).db, 't1')).rejects.toThrow('Could not load');
    await expect(loadCatalog(fakeDb({ listings: [row()] }, ['variation_attributes']).db, 't1')).rejects.toThrow('Could not load');
    await expect(loadCatalog(fakeDb({}, ['listings']).db, 't1')).rejects.toThrow('Could not load');
  });
});

describe('loadCollections', () => {
  it('orders products as the maker did, counts only live ones, and uses the chosen cover', async () => {
    const { db, calls } = fakeDb({
      listings: [row(), row({ id: 'l2', slug: 'pine', name: 'Pine' })],
      uploads: [{ id: 'u1', public_url: 'https://x/1.webp', alt_text: null }, { id: 'cov', public_url: 'https://x/cover.webp', alt_text: null }],
      collections: [
        { id: 'c1', slug: 'autumn', name: 'Autumn', featured_image_id: 'cov', listing_collections: [{ listing_id: 'l2', position: 0 }, { listing_id: 'gone', position: 1 }, { listing_id: 'l1', position: 2 }] },
        { id: 'c2', slug: 'gifts', name: 'Gifts', featured_image_id: null, listing_collections: [{ listing_id: 'l1', position: 0 }] },
      ],
    });
    const catalog = await loadCatalog(db, 't1');
    const collections = await loadCollections(db, 't1', catalog);
    expect(collections[0]!.products.map((p) => p.slug)).toEqual(['pine', 'fig']);
    expect(collections[0]!.view).toEqual({ slug: 'autumn', name: 'Autumn', count: 2, cover: { kind: 'image', url: 'https://x/cover.webp', alt: 'Autumn' } });
    expect(collections[1]!.view.cover).toEqual({ kind: 'image', url: 'https://x/1.webp', alt: 'Fig Candle' });
    expect(calls).toContainEqual({ table: 'collections', method: 'eq', args: ['status', 'active'] });
    expect(calls).toContainEqual({ table: 'collections', method: 'is', args: ['deleted_at', null] });
  });
  it('throws when the collections read fails', async () => {
    await expect(loadCollections(fakeDb({}, ['collections']).db, 't1', { products: [], byId: new Map() })).rejects.toThrow('Could not load collections');
  });
});

describe('loadProduct', () => {
  it('loads one live product with its lowest price and preview flag', async () => {
    const { db, calls } = fakeDb({ listings: [row({ is_preview: true })], variation_attributes: [], listing_variants: [] });
    const result = await loadProduct(db, 't1', 'fig');
    expect(result).toMatchObject({ isPreview: true, priceCents: 2400, view: { slug: 'fig', price: '$24' } });
    expect(calls).toContainEqual({ table: 'listings', method: 'eq', args: ['status', 'active'] });
  });
  it('is null when there is no such live product', async () => {
    expect(await loadProduct(fakeDb({ listings: [] }).db, 't1', 'nope')).toBeNull();
  });
  it('throws when the read fails', async () => {
    await expect(loadProduct(fakeDb({}, ['listings']).db, 't1', 'fig')).rejects.toThrow('Could not load the product');
  });
});
