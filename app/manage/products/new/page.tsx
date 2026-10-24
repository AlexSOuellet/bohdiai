import { photoLimit } from '@/lib/backend/catalog/photo-limit';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { hasProducts } from '@/lib/backend/features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listCollections, countHomeProducts } from '@/lib/backend/catalog/queries';
import { productFromTools } from '@/lib/tools/handoff';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { ProductEditor } from '../_components/ProductEditor';

export const dynamic = 'force-dynamic';

/** A new product; from the Tools, it opens with the tool's name and price. */
export default async function NewProductPage({ searchParams }: PageProps<'/manage/products/new'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!hasProducts(on)) notFound();
  const db = await createSupabaseServerClient();
  const [collections, homeCount] = await Promise.all([
    listCollections(db, site.tenantId),
    countHomeProducts(db, site.tenantId, null),
  ]);
  return (
    <ProductEditor
      initial={productFromTools(await searchParams)}
      collections={collections
        .filter((c) => c.status !== 'archived')
        .map((c) => ({ id: c.id, name: c.name }))}
      digital={on.has('digital_products')}
      photoLimit={photoLimit(on)}
      newArrivals={on.has('new_arrivals')}
      shopUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))}
      homeCount={homeCount}
      showcase={!on.has('catalog')}
      hasCollections={on.has('collections')}
    />
  );
}
