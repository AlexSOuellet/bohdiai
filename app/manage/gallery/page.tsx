import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listGallery } from '@/lib/backend/gallery/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { GalleryManager } from './GalleryManager';

export const dynamic = 'force-dynamic';

export default async function GalleryPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('gallery')) notFound();
  const initial = await listGallery(await createSupabaseServerClient(), site.tenantId);
  return <GalleryManager initial={initial} siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))} />;
}
