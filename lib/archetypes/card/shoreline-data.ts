/**
 * Business card, shoreline design — what the multi-page site reads (Saltmarsh &
 * Lace demo spec, stage two). On Lite and Full the site has pages; on Showcase it
 * stays the one page. Which it is follows the site's switches, read fresh each
 * render, so an upgrade or downgrade changes the site at once.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { ProductView } from '@/lib/archetypes/content';
import { loadCatalog, loadCollections } from '@/lib/storefront/catalog';
import { loadSiteFeatures } from '@/lib/backend/features';
import { HOME_MAX } from '@/lib/catalog/home';
import { listTestimonials } from '@/lib/backend/testimonials/queries';
import { offLabel, withSale } from '@/lib/storefront/promotions';
import { loadRunningSale } from '@/lib/storefront/promotions-load';
import type { Testimonial } from '@/lib/backend/testimonials/testimonial-form';
import { loadCardData, type CardData } from './data';

export type ShorelineData = {
  card: CardData;
  /** True on Lite and Full (the catalog is on): the site has pages. */
  pages: boolean;
  /** Live products in shop order; empty on Showcase. */
  products: ProductView[];
  /** Hours, address, booth and website show on markets (Lite up). */
  marketDetails: boolean;
  /** Every photo on a product (Full); otherwise its main photo only. */
  allPhotos: boolean;
  /** The cart and order letter (Full). */
  cart: boolean;
  /** What her customers say (Full); empty when the switch is off. */
  testimonials: Testimonial[];
  /** The site-wide sale running today (Full promotions), worded for the banner. */
  sale: { name: string; off: string } | null;
  /** New arrivals are marked on her pieces (Full). */
  newArrivals: boolean;
  /** Her live collections in her order, each with its pieces (sale prices applied). */
  collections: { slug: string; name: string; products: ProductView[] }[];
};

export async function loadShorelineData(
  db: SupabaseClient<Database>,
  tenantId: string,
): Promise<ShorelineData> {
  const [card, features] = await Promise.all([
    loadCardData(db, tenantId),
    loadSiteFeatures(db, tenantId),
  ]);
  const pages = features.has('catalog');
  const loaded = pages ? await loadCatalog(db, tenantId) : null;
  const catalog = loaded?.products ?? [];
  // Full: a running sale wears its price on every piece, and gets a banner.
  const running = features.has('promotions') ? await loadRunningSale(db, tenantId) : null;
  const products = withSale(catalog, running);
  return {
    card,
    pages,
    products,
    marketDetails: features.has('market_details'),
    allPhotos: features.has('product_photos'),
    cart: features.has('cart'),
    sale: running === null ? null : { name: running.name, off: offLabel(running) },
    newArrivals: features.has('new_arrivals'),
    // Collections are Full only (Alex, 2026-10-20): none on Market, so no row and no pages.
    collections:
      loaded === null || !features.has('collections')
        ? []
        : (await loadCollections(db, tenantId, loaded))
            .filter((c) => c.products.length > 0)
            .map((c) => ({ slug: c.slug, name: c.view.name, products: withSale(c.products, running) })),
    testimonials: features.has('testimonials') ? await listTestimonials(db, tenantId) : [],
  };
}

/** The home page's pieces: the ones she marked for the home page, else the first few, up to the home page's limit. */
export function featuredProducts(products: readonly ProductView[], max = HOME_MAX): ProductView[] {
  const marked = products.filter((p) => p.onHome === true);
  return (marked.length > 0 ? marked : products).slice(0, max);
}
