import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getProduct, listCollections } from '@/lib/backend/catalog/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { ProductEditor } from '../_components/ProductEditor';

export const dynamic = 'force-dynamic';

/** A mistyped address is "not found", not a database error. */
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProductPage({ params }: PageProps<'/manage/products/[id]'>): Promise<React.ReactElement> {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('catalog')) notFound();
  const db = await createSupabaseServerClient();
  const [product, collections] = await Promise.all([getProduct(db, site.tenantId, id), listCollections(db, site.tenantId)]);
  if (product === null) notFound();
  return (
    <ProductEditor
      key={id}
      initial={product}
      collections={collections.filter((c) => c.status !== 'archived' || product.collectionIds.includes(c.id)).map((c) => ({ id: c.id, name: c.name }))}
      digital={on.has('digital_products')}
      shopUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))}
    />
  );
}
