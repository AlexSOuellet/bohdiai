/**
 * Shared catalog projection — the ONE place a `listings` row becomes a renderer
 * `ProductView`. Every storefront read site (home, /shop, product detail, collection
 * detail) goes through here, so the mapping can't drift.
 *
 * A product's photo is resolved the proper way — from its `media_ids` through the
 * `uploads` table (the maker's real uploaded photo) — falling back to the legacy
 * `metadata.image_url` shortcut the placeholder products still use. Once a maker
 * uploads a real photo, the media_ids path wins; placeholders keep rendering until
 * they're cleared.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/database.types';
import type { ProductView, CatalogMedia } from '@/lib/archetypes/content';

/** The listing columns the catalog projection reads. */
export interface ListingRow {
  slug: string;
  name: string;
  base_price_cents: number;
  short_description: string | null;
  description: string | null;
  metadata: Json;
  primary_collection_id: string | null;
  media_ids: string[] | null;
}

/** An uploads row as the projection reads it. */
export interface UploadRow {
  id: string;
  public_url: string | null;
  alt_text: string | null;
}

/** id → the resolved media for that upload (url + optional alt). */
export type MediaMap = Map<string, { url: string; alt: string | null }>;

/** Format cents to a display price. Matches the storefront's long-standing format
 *  ("$24", "$24.50") so moving the projection here changes no rendered output. */
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
    if (typeof u.public_url === 'string' && u.public_url.length > 0) {
      map.set(u.id, { url: u.public_url, alt: u.alt_text });
    }
  }
  return map;
}

/** Resolve a listing's media: the first uploaded photo it references, else the legacy
 *  metadata URL, else nothing. Alt falls back to the product name. */
export function mediaForListing(row: ListingRow, mediaMap: MediaMap): CatalogMedia[] {
  for (const id of row.media_ids ?? []) {
    const hit = mediaMap.get(id);
    if (hit !== undefined) return [{ kind: 'image', url: hit.url, alt: hit.alt ?? row.name }];
  }
  const legacy = imageUrlFromMetadata(row.metadata);
  return legacy ? [{ kind: 'image', url: legacy, alt: row.name }] : [];
}

/** Project one listing row to a ProductView, resolving its photo through `mediaMap`. */
export function listingToProductView(row: ListingRow, mediaMap: MediaMap): ProductView {
  return {
    slug: row.slug,
    name: row.name,
    price: formatPrice(row.base_price_cents),
    ...(row.short_description ? { shortDescription: row.short_description } : {}),
    description: row.description ?? '',
    status: 'active',
    media: mediaForListing(row, mediaMap),
    variations: [],
  };
}

/** The columns a catalog load selects from `listings`. */
const LISTING_COLUMNS =
  'slug, name, base_price_cents, short_description, description, metadata, primary_collection_id, media_ids';

/** Load a tenant's active product catalog as ProductViews, resolving every referenced
 *  uploaded photo in one batch. Returns the ProductViews plus the raw rows and the
 *  media map, so callers that also build collection bands / filter by collection reuse
 *  the same rows and resolved photos. */
export async function loadCatalog(
  db: SupabaseClient<Database>,
  tenantId: string,
): Promise<{ products: ProductView[]; rows: ListingRow[]; mediaMap: MediaMap }> {
  const { data } = await db
    .from('listings')
    .select(LISTING_COLUMNS)
    .eq('tenant_id', tenantId)
    .eq('listing_type', 'product')
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  const rows = (data ?? []) as ListingRow[];
  const ids = [...new Set(rows.flatMap((r) => r.media_ids ?? []))];

  let mediaMap: MediaMap = new Map();
  if (ids.length > 0) {
    const { data: uploads } = await db
      .from('uploads')
      .select('id, public_url, alt_text')
      .in('id', ids)
      .is('deleted_at', null);
    mediaMap = resolveMediaMap((uploads ?? []) as UploadRow[]);
  }

  return { products: rows.map((r) => listingToProductView(r, mediaMap)), rows, mediaMap };
}
