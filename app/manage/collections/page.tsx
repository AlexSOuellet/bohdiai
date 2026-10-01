import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listCollections } from '@/lib/backend/catalog/queries';
import { CollectionList } from './CollectionList';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('catalog')) notFound();
  const collections = await listCollections(await createSupabaseServerClient(), site.tenantId);
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Collections</h1>
      </div>
      <main id="main" className="bk-content">
        <p className="bk-note">The order here is the order on your shop.</p>
        <CollectionList collections={collections} />
      </main>
    </>
  );
}
