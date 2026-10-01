/** The catalog's part of the home screen (spec piece 1 §3): counts and Needs attention. */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { HomeContributor, HomeData } from '../home';
import { listProducts, listCollections, type ProductRowView, type CollectionRowView } from './queries';

const n = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

export function catalogHomeData(products: readonly ProductRowView[], collections: readonly CollectionRowView[]): HomeData {
  const current = products.filter((p) => p.status !== 'archived');
  const live = current.filter((p) => p.status === 'active');
  const drafts = current.filter((p) => p.status === 'draft');
  const liveCollections = collections.filter((c) => c.status === 'active').length;
  const draftCollections = collections.filter((c) => c.status === 'draft').length;

  // A product showing only the legacy sample photo still needs a real one (no upload id).
  const noPhoto = current.filter((p) => p.photoUploadId === null).length;
  const soldOut = live.filter((p) => p.soldOut).length;
  const attention: string[] = [];
  if (noPhoto > 0) attention.push(`${n(noPhoto, 'product has', 'products have')} no photo.`);
  if (drafts.length > 0) attention.push(`${n(drafts.length, 'product is', 'products are')} still ${drafts.length === 1 ? 'a draft' : 'drafts'}.`);
  if (soldOut > 0) attention.push(`${n(soldOut, 'live product is', 'live products are')} sold out.`);

  return {
    tiles: [
      { label: 'Products', value: String(live.length), note: n(drafts.length, 'draft', 'drafts') },
      { label: 'Collections', value: String(liveCollections), note: n(draftCollections, 'draft', 'drafts') },
    ],
    attention,
  };
}

export const catalogHome: HomeContributor = {
  feature: 'catalog',
  load: async (tenantId) => {
    const db = await createSupabaseServerClient();
    const [products, collections] = await Promise.all([listProducts(db, tenantId), listCollections(db, tenantId)]);
    return catalogHomeData(products, collections);
  },
};
