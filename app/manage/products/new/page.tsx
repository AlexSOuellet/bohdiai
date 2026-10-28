import { photoLimit } from '@/lib/backend/catalog/photo-limit';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { hasProducts } from '@/lib/backend/features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listCollections, countHomeProducts } from '@/lib/backend/catalog/queries';
import { costsFromTools, photoFromTools, productFromTools } from '@/lib/tools/handoff';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { ProductEditor } from '../_components/ProductEditor';
import { isFreeSite } from '@/lib/backend/plan/free';

export const dynamic = 'force-dynamic';

/** A new product; from the Tools, it opens with what the tool worked out: the name,
 *  the price, its costs, and from Describe it the descriptions and the photo. */
export default async function NewProductPage({ searchParams }: PageProps<'/manage/products/new'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const sent = await searchParams;
  const on = await getSiteFeatures(site.tenantId);
  if (!hasProducts(on)) notFound();
  const db = await createSupabaseServerClient();
  const [collections, homeCount] = await Promise.all([
    listCollections(db, site.tenantId),
    countHomeProducts(db, site.tenantId, null),
  ]);
  // Describe it sends its photo by upload id; only one of this site's own uploads is used.
  const photoId = photoFromTools(sent);
  const photo = photoId === null ? null : (await db.from('uploads').select('id, public_url').eq('id', photoId).eq('tenant_id', site.tenantId).maybeSingle()).data;
  const fromTools = productFromTools(sent);
  return (
    <ProductEditor
      initial={photo === null || photo.public_url === null ? fromTools : { ...fromTools, photos: [{ uploadId: photo.id, url: photo.public_url }] }}
      costs={costsFromTools(sent)}
      collections={collections
        .filter((c) => c.status !== 'archived')
        .map((c) => ({ id: c.id, name: c.name }))}
      digital={on.has('digital_products')}
      photoLimit={photoLimit(on)}
      newArrivals={on.has('new_arrivals')}
      shopUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))}
      homeCount={homeCount}
      showcase={!on.has('catalog')}
      free={await isFreeSite(db, site.tenantId)}
      hasCollections={on.has('collections')}
    />
  );
}
