/**
 * Shared catalog projection — the ONE place catalog rows become what a shopper sees
 * (spec piece 1 §7). Every storefront read (home, /shop, collections, product page)
 * goes through here, so the rules can't drift:
 *   - only live products, live combinations and live collections render;
 *   - every photo in the maker's order (uploads), legacy metadata photo as fallback;
 *   - options and each buyable combination with its own price (lib/catalog/price);
 *   - sold out when stock is 0 (lib/catalog/stock);
 *   - collections read from listing_collections, in the maker's order.
 * A failed read throws (the error page) rather than render an empty or wrong shop.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/database.types';
import type { ProductView, CatalogMedia, CollectionView, CatalogVariation, ProductOffer } from '@/lib/archetypes/content';
import { effectivePriceCents, priceRange } from '@/lib/catalog/price';
import { isStockSoldOut } from '@/lib/catalog/stock';
import { combinationsOf, combinationKey } from '@/lib/catalog/combinations';

type Db = SupabaseClient<Database>;

/** The listing columns the projection reads. */
export interface ListingRow {
  id: string;
  slug: string;
  name: string;
  listing_type: string;
  base_price_cents: number;
  short_description: string | null;
  description: string | null;
  metadata: Json;
  media_ids: string[] | null;
  inventory_count: number | null;
  is_preview: boolean;
  on_home: boolean;
}

/** One option of a listing with its choices, as the projection reads it. */
export interface AttributeRow {
  listing_id: string;
  name: string;
  position: number;
  variation_options: { value: string; position: number }[];
}

/** One live combination of a listing's options. */
export interface VariantRow {
  listing_id: string;
  option_combination: Json;
  price_cents: number | null;
  inventory_count: number | null;
}

/** An uploads row as the projection reads it. */
export interface UploadRow {
  id: string;
  public_url: string | null;
  alt_text: string | null;
}

/** id → the resolved media for that upload (url + optional alt). */
export type MediaMap = Map<string, { url: string; alt: string | null }>;

export interface Catalog {
  products: ProductView[];
  /** listing id → its ProductView, for collection membership. */
  byId: Map<string, ProductView>;
}

export interface StoreCollection {
  id: string;
  slug: string;
  view: CollectionView;
  /** Live products in the maker's order. */
  products: ProductView[];
}

const LISTING_COLUMNS =
  'id, slug, name, listing_type, base_price_cents, short_description, description, metadata, media_ids, inventory_count, is_preview, on_home';
const PRODUCT_TYPES = ['product', 'digital_product'];

/** Format cents to a display price. Matches the storefront's long-standing format
 *  ("$24", "$24.50"). */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

/** Read `image_url` from a listings.metadata JSONB blob (the legacy placeholder path). */
export function imageUrlFromMetadata(m: Json): string | undefined {
  if (m === null || typeof m !== 'object' || Array.isArray(m)) return undefined;
  const url = (m as Record<string, unknown>)['image_url'];
  return typeof url === 'string' && url.length > 0 ? url : undefined;
}

/** Build the id → media lookup from a set of uploads rows (only those with a url). */
export function resolveMediaMap(uploads: readonly UploadRow[]): MediaMap {
  const map: MediaMap = new Map();
  for (const u of uploads) {
    if (typeof u.public_url === 'string' && u.public_url.length > 0) map.set(u.id, { url: u.public_url, alt: u.alt_text });
  }
  return map;
}

/** Every uploaded photo a listing references, in order; else the legacy metadata photo;
 *  else nothing. Alt falls back to the product name. */
export function mediaForListing(row: Pick<ListingRow, 'name' | 'media_ids' | 'metadata'>, mediaMap: MediaMap): CatalogMedia[] {
  const resolved = (row.media_ids ?? []).flatMap((id): CatalogMedia[] => {
    const hit = mediaMap.get(id);
    return hit === undefined ? [] : [{ kind: 'image', url: hit.url, alt: hit.alt ?? row.name }];
  });
  if (resolved.length > 0) return resolved;
  const legacy = imageUrlFromMetadata(row.metadata);
  return legacy !== undefined ? [{ kind: 'image', url: legacy, alt: row.name }] : [];
}

/** A combination's stored JSON as option name → choice, or null when it isn't one. */
function asCombination(json: Json): Record<string, string> | null {
  if (json === null || typeof json !== 'object' || Array.isArray(json)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(json)) {
    if (typeof v !== 'string') return null;
    out[k] = v;
  }
  return out;
}

const byPosition = <T extends { position: number }>(a: T, b: T): number => a.position - b.position;

/** Project one listing (+ its options and live combinations) to a ProductView, with its
 *  lowest price in cents. Only combinations that match the current options count. */
function buildProduct(
  row: ListingRow,
  attributes: readonly AttributeRow[],
  variants: readonly VariantRow[],
  mediaMap: MediaMap,
): { view: ProductView; minPriceCents: number } {
  const variations: CatalogVariation[] = [...attributes]
    .sort(byPosition)
    .map((a) => ({ name: a.name, options: [...a.variation_options].sort(byPosition).map((o) => o.value) }));
  const base = {
    slug: row.slug,
    name: row.name,
    ...(row.short_description ? { shortDescription: row.short_description } : {}),
    description: row.description ?? '',
    media: mediaForListing(row, mediaMap),
    variations,
    ...(row.on_home ? { onHome: true } : {}),
  };
  const product = { basePriceCents: row.base_price_cents };

  if (variations.length === 0) {
    return {
      view: { ...base, price: formatPrice(row.base_price_cents), status: isStockSoldOut(row.inventory_count) ? 'sold_out' : 'active' },
      minPriceCents: row.base_price_cents,
    };
  }

  const byKey = new Map<string, VariantRow>();
  for (const v of variants) {
    const c = asCombination(v.option_combination);
    if (c !== null) byKey.set(combinationKey(c), v);
  }
  const offers: ProductOffer[] = [];
  const buyable: { priceCents: number | null }[] = [];
  const all: { priceCents: number | null }[] = [];
  for (const choices of combinationsOf(variations.map((v) => ({ name: v.name, choices: v.options })))) {
    const v = byKey.get(combinationKey(choices));
    if (v === undefined) continue;
    const soldOut = isStockSoldOut(v.inventory_count);
    offers.push({ choices, price: formatPrice(effectivePriceCents(product, { priceCents: v.price_cents })), soldOut });
    all.push({ priceCents: v.price_cents });
    if (!soldOut) buyable.push({ priceCents: v.price_cents });
  }
  const { min, max } = priceRange(product, buyable.length > 0 ? buyable : all);
  return {
    view: {
      ...base,
      price: formatPrice(min),
      ...(min !== max ? { priceFrom: true } : {}),
      status: buyable.length === 0 ? 'sold_out' : 'active',
      offers,
    },
    minPriceCents: min,
  };
}

/** Project one listing (+ its options and live combinations) to a ProductView. */
export function toProductView(
  row: ListingRow,
  attributes: readonly AttributeRow[],
  variants: readonly VariantRow[],
  mediaMap: MediaMap,
): ProductView {
  return buildProduct(row, attributes, variants, mediaMap).view;
}

/** Batch-load the media map for a set of upload ids (empty when none; throws when the
 *  uploads read fails rather than returning an empty map). Shared by the
 *  catalog load, the walk product list, and the backend so a maker's
 *  uploaded photo resolves the same everywhere. */
export async function loadMediaMap(db: Db, ids: readonly string[]): Promise<MediaMap> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const { data, error } = await db.from('uploads').select('id, public_url, alt_text').in('id', unique).is('deleted_at', null);
  // Never swallow this: an empty map here would show a product with no photos, and a
  // backend save from that screen would then overwrite its media_ids with [].
  if (error !== null) throw new Error(`Could not load photos: ${error.message}`);
  return resolveMediaMap((data ?? []) as UploadRow[]);
}

/** Options and live combinations for a set of listings, grouped by listing. */
async function loadDetails(
  db: Db,
  ids: readonly string[],
): Promise<{ attributes: Map<string, AttributeRow[]>; variants: Map<string, VariantRow[]> }> {
  const attributes = new Map<string, AttributeRow[]>();
  const variants = new Map<string, VariantRow[]>();
  if (ids.length === 0) return { attributes, variants };
  const [a, v] = await Promise.all([
    db.from('variation_attributes').select('listing_id, name, position, variation_options(value, position)').in('listing_id', [...ids]),
    db
      .from('listing_variants')
      .select('listing_id, option_combination, price_cents, inventory_count')
      .in('listing_id', [...ids])
      .eq('status', 'active'),
  ]);
  if (a.error !== null) throw new Error(`Could not load product options: ${a.error.message}`);
  if (v.error !== null) throw new Error(`Could not load product combinations: ${v.error.message}`);
  for (const row of (a.data ?? []) as AttributeRow[]) attributes.set(row.listing_id, [...(attributes.get(row.listing_id) ?? []), row]);
  for (const row of (v.data ?? []) as VariantRow[]) variants.set(row.listing_id, [...(variants.get(row.listing_id) ?? []), row]);
  return { attributes, variants };
}

/** A shop's live catalog, oldest first (the order shoppers have always seen). */
export async function loadCatalog(db: Db, tenantId: string): Promise<Catalog> {
  const { data, error } = await db
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('tenant_id', tenantId)
    .in('listing_type', PRODUCT_TYPES)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (error !== null) throw new Error(`Could not load products: ${error.message}`);
  const rows = (data ?? []) as ListingRow[];
  if (rows.length === 0) return { products: [], byId: new Map() };

  const [mediaMap, details] = await Promise.all([
    loadMediaMap(db, rows.flatMap((r) => r.media_ids ?? [])),
    loadDetails(db, rows.map((r) => r.id)),
  ]);
  const byId = new Map<string, ProductView>();
  const products = rows.map((r) => {
    const view = toProductView(r, details.attributes.get(r.id) ?? [], details.variants.get(r.id) ?? [], mediaMap);
    byId.set(r.id, view);
    return view;
  });
  return { products, byId };
}

interface CollectionRow {
  id: string;
  slug: string;
  name: string;
  featured_image_id: string | null;
  listing_collections: { listing_id: string; position: number }[];
}

/** A shop's live collections in the maker's order, each with its live products in
 *  order. Membership only resolves to products already in the live catalog, so a
 *  draft or archived product never appears through a collection. */
export async function loadCollections(db: Db, tenantId: string, catalog: Catalog): Promise<StoreCollection[]> {
  const { data, error } = await db
    .from('collections')
    .select('id, slug, name, featured_image_id, listing_collections(listing_id, position)')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('position', { ascending: true });
  if (error !== null) throw new Error(`Could not load collections: ${error.message}`);
  const rows = (data ?? []) as CollectionRow[];
  const covers = await loadMediaMap(db, rows.flatMap((c) => (c.featured_image_id === null ? [] : [c.featured_image_id])));
  return rows.map((c) => {
    const products = [...c.listing_collections]
      .sort(byPosition)
      .map((m) => catalog.byId.get(m.listing_id))
      .filter((p): p is ProductView => p !== undefined);
    const chosen = c.featured_image_id === null ? undefined : covers.get(c.featured_image_id);
    const cover: CatalogMedia | undefined =
      chosen !== undefined ? { kind: 'image', url: chosen.url, alt: chosen.alt ?? c.name } : products[0]?.media[0];
    return { id: c.id, slug: c.slug, view: { slug: c.slug, name: c.name, count: products.length, cover }, products };
  });
}

/** One live product by its web address, for the product page. Not filtered on
 *  listing_type: the page has always shown any live listing by its address. */
export async function loadProduct(
  db: Db,
  tenantId: string,
  slug: string,
): Promise<{ view: ProductView; isPreview: boolean; priceCents: number } | null> {
  const { data, error } = await db
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();
  if (error !== null) throw new Error(`Could not load the product: ${error.message}`);
  if (data === null) return null;
  const row = data as ListingRow;
  const [mediaMap, details] = await Promise.all([loadMediaMap(db, row.media_ids ?? []), loadDetails(db, [row.id])]);
  const built = buildProduct(row, details.attributes.get(row.id) ?? [], details.variants.get(row.id) ?? [], mediaMap);
  return { view: built.view, isPreview: row.is_preview, priceCents: built.minPriceCents };
}
