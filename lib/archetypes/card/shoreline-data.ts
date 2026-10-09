/**
 * Business card, shoreline design — what the multi-page site reads (Saltmarsh &
 * Lace demo spec, stage two). On Lite and Full the site has pages; on Showcase it
 * stays the one page. Which it is follows the site's switches, read fresh each
 * render, so an upgrade or downgrade changes the site at once.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { ProductView } from '@/lib/archetypes/content';
import { loadCatalog } from '@/lib/storefront/catalog';
import { loadSiteFeatures } from '@/lib/backend/features';
import { HOME_MAX } from '@/lib/catalog/home';
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
  const products = pages ? (await loadCatalog(db, tenantId)).products : [];
  return {
    card,
    pages,
    products,
    marketDetails: features.has('market_details'),
    allPhotos: features.has('product_photos'),
    cart: features.has('cart'),
  };
}

/** The home page's pieces: the ones she marked for the home page, else the first few, up to the home page's limit. */
export function featuredProducts(products: readonly ProductView[], max = HOME_MAX): ProductView[] {
  const marked = products.filter((p) => p.onHome === true);
  return (marked.length > 0 ? marked : products).slice(0, max);
}
