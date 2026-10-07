import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listCollections, countHomeProducts } from '@/lib/backend/catalog/queries';
import { emptyProductForm } from '@/lib/backend/catalog/product-form';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { ProductEditor } from '../_components/ProductEditor';

export const dynamic = 'force-dynamic';

export default async function NewProductPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('catalog')) notFound();
  const db = await createSupabaseServerClient();
  const [collections, homeCount] = await Promise.all([listCollections(db, site.tenantId), countHomeProducts(db, site.tenantId, null)]);
  return (
    <ProductEditor
      initial={emptyProductForm()}
      collections={collections.filter((c) => c.status !== 'archived').map((c) => ({ id: c.id, name: c.name }))}
      digital={on.has('digital_products')}
      newArrivals={on.has('new_arrivals')}
      shopUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))}
      homeCount={homeCount}
    />
  );
}
