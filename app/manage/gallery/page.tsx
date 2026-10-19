import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listGallery } from '@/lib/backend/gallery/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { GalleryManager } from './GalleryManager';
import { isFamilySite } from '@/lib/backend/site-kind';
import { galleryEnabled } from '@/lib/storefront/site-gallery';

export const dynamic = 'force-dynamic';

export default async function GalleryPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('gallery')) notFound();
  const db = await createSupabaseServerClient();
  const initial = await listGallery(db, site.tenantId);
  // A standard site on Market or Full: the gallery section's switch and its ticked products.
  let standard = null;
  if (on.has('catalog') && (await isFamilySite(db, site.tenantId))) {
    const [shown, ticked] = await Promise.all([
      galleryEnabled(db, site.tenantId),
      db.from('listings').select('id', { count: 'exact', head: true }).eq('tenant_id', site.tenantId).eq('in_gallery', true).eq('status', 'active').is('deleted_at', null),
    ]);
    if (ticked.error !== null) throw new Error(`Could not count the gallery’s products: ${ticked.error.message}`);
    standard = { shown, ticked: ticked.count ?? 0 };
  }
  return <GalleryManager initial={initial} siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))} standard={standard} />;
}
