import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getCollection, listProducts } from '@/lib/backend/catalog/queries';
import { CollectionEditor } from './CollectionEditor';

export const dynamic = 'force-dynamic';

/** A mistyped address is "not found", not a database error. */
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditCollectionPage({ params }: PageProps<'/manage/collections/[id]'>): Promise<React.ReactElement> {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('catalog')) notFound();
  const db = await createSupabaseServerClient();
  const [collection, products] = await Promise.all([getCollection(db, site.tenantId, id), listProducts(db, site.tenantId)]);
  if (collection === null) notFound();
  return <CollectionEditor key={id} initial={collection} products={products} />;
}
