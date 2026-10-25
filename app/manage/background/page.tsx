import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { isFamilySite } from '@/lib/backend/site-kind';
import { getBackgroundView } from '@/lib/backend/scene/background';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { BackgroundEditor } from './BackgroundEditor';

export const dynamic = 'force-dynamic';

/** What sits behind her pages (standard sites, every plan). */
export default async function BackgroundPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('background')) notFound();
  const db = await createSupabaseServerClient();
  if (!(await isFamilySite(db, site.tenantId))) notFound();
  return <BackgroundEditor initial={await getBackgroundView(db, site.tenantId)} siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))} />;
}
