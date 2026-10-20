/** The catalog's part of the home screen (spec piece 1 §3): counts and Needs attention. */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { HomeContributor, HomeData } from '../home';
import { GALLERY_MAX } from '@/lib/catalog/home';
import {
  listProducts,
  listCollections,
  type ProductRowView,
  type CollectionRowView,
} from './queries';

const n = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

/** The catalog's counts and Needs attention. `collections` is null on a site without
 *  collections (Market, Showcase): no Collections tile. */
export function catalogHomeData(
  products: readonly ProductRowView[],
  collections: readonly CollectionRowView[] | null,
): HomeData {
  const current = products.filter((p) => p.status !== 'archived');
  const live = current.filter((p) => p.status === 'active');
  const drafts = current.filter((p) => p.status === 'draft');

  // A product showing only the legacy sample photo still needs a real one (no upload id).
  const noPhoto = current.filter((p) => p.photoUploadId === null).length;
  const soldOut = live.filter((p) => p.soldOut).length;
  const attention: string[] = [];
  if (noPhoto > 0) attention.push(`${n(noPhoto, 'product has', 'products have')} no photo.`);
  if (drafts.length > 0)
    attention.push(
      `${n(drafts.length, 'product is', 'products are')} still ${drafts.length === 1 ? 'a draft' : 'drafts'}.`,
    );
  if (soldOut > 0)
    attention.push(`${n(soldOut, 'live product is', 'live products are')} sold out.`);

  return {
    tiles: [
      { label: 'Products', value: String(live.length), note: n(drafts.length, 'draft', 'drafts') },
      ...(collections === null
        ? []
        : [
            {
              label: 'Collections',
              value: String(collections.filter((c) => c.status === 'active').length),
              note: n(collections.filter((c) => c.status === 'draft').length, 'draft', 'drafts'),
            },
          ]),
    ],
    attention,
  };
}

export const catalogHome: HomeContributor = {
  feature: 'catalog',
  load: async (tenantId) => {
    const db = await createSupabaseServerClient();
    return catalogHomeData(await listProducts(db, tenantId), null);
  },
};

/** The Collections tile, on sites with collections (Full). */
export const collectionsHome: HomeContributor = {
  feature: 'collections',
  load: async (tenantId) => {
    const db = await createSupabaseServerClient();
    return { tiles: catalogHomeData([], await listCollections(db, tenantId)).tiles.filter((t) => t.label === 'Collections'), attention: [] };
  },
};

/** Showcase's part of the home screen: the catalog's counts and Needs attention, with
 *  the gallery pick in place of collections (Showcase has none). */
export function showcaseHomeData(products: readonly ProductRowView[]): HomeData {
  const base = catalogHomeData(products, null);
  const picked = products.filter((p) => p.inGallery && p.status !== 'archived').length;
  const productTiles = base.tiles.filter((t) => t.label === 'Products');
  return {
    tiles: [
      ...productTiles,
      {
        label: 'Gallery',
        value: picked === 0 ? `Newest ${GALLERY_MAX}` : `${picked} of ${GALLERY_MAX}`,
        note: picked === 0 ? 'none picked yet' : 'picked by you',
      },
    ],
    attention: base.attention,
  };
}

export const showcaseHome: HomeContributor = {
  feature: 'gallery_pieces',
  load: async (tenantId) => showcaseHomeData(await listProducts(await createSupabaseServerClient(), tenantId)),
};
