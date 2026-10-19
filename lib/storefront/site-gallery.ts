/**
 * A site's gallery section (Alex, 2026-10-19; Project-Docs/Plan-Backends.md, the
 * gallery section). Separate from products: photos of the maker's work with their
 * names, no prices.
 *
 *  - Showcase (the gallery-from-catalog switch): always on; up to 12 ticked
 *    products, or the newest 12 when none are ticked. Products only.
 *  - Market and Full: on when the owner switched it on (site_added_sections);
 *    every ticked product, newest first, then their own photos (the loose-photo
 *    store, gallery_items) in their order. No limit.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { ProductView } from '@/lib/archetypes/content';
import type { FeatureKey } from '@/lib/backend/features';
import type { GalleryItem } from '@/lib/backend/gallery/gallery-form';
import { listGallery } from '@/lib/backend/gallery/queries';
import { showcaseGallery } from '@/lib/catalog/home';
import { loadCatalog } from './catalog';

export type GalleryPiece = { key: string; url: string; alt: string; name: string };

/** A product's gallery piece: its first photo and its name. A product with no photo has no piece. */
function fromProduct(p: Pick<ProductView, 'slug' | 'name' | 'media'>): GalleryPiece[] {
  const shot = p.media.find((m) => m.kind === 'image' && m.url !== undefined && m.url !== '');
  return shot?.url === undefined ? [] : [{ key: `p-${p.slug}`, url: shot.url, alt: shot.alt || p.name, name: p.name }];
}

function fromPhoto(g: GalleryItem): GalleryPiece {
  return { key: `g-${g.id}`, url: g.url, alt: g.caption, name: g.caption };
}

/** Pure: the gallery from what the site has. `catalog` is the live catalog, oldest first. */
export function buildSiteGallery(input: {
  showcase: boolean;
  enabled: boolean;
  catalog: readonly Pick<ProductView, 'slug' | 'name' | 'media' | 'inGallery'>[];
  photos: readonly GalleryItem[];
}): GalleryPiece[] {
  if (input.showcase) return showcaseGallery(input.catalog).flatMap(fromProduct);
  if (!input.enabled) return [];
  const ticked = [...input.catalog].filter((p) => p.inGallery === true).reverse();
  return [...ticked.flatMap(fromProduct), ...input.photos.map(fromPhoto)];
}

/** Whether the owner switched the gallery on (Market and Full). */
export async function galleryEnabled(db: SupabaseClient<Database>, tenantId: string): Promise<boolean> {
  const { data, error } = await db
    .from('site_added_sections')
    .select('enabled')
    .eq('tenant_id', tenantId)
    .eq('section', 'gallery')
    .maybeSingle();
  if (error !== null) throw new Error(`Could not read the gallery switch: ${error.message}`);
  return data?.enabled === true;
}

/** Read the site's gallery for its pages (service role). */
export async function loadSiteGallery(db: SupabaseClient<Database>, tenantId: string, features: ReadonlySet<FeatureKey>): Promise<GalleryPiece[]> {
  const showcase = features.has('gallery_pieces');
  const enabled = showcase ? true : await galleryEnabled(db, tenantId);
  if (!enabled) return [];
  const [catalog, photos] = await Promise.all([loadCatalog(db, tenantId), showcase ? Promise.resolve([]) : listGallery(db, tenantId)]);
  return buildSiteGallery({ showcase, enabled, catalog: catalog.products, photos });
}
