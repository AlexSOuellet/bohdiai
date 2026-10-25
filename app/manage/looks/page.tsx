import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { supabaseAdmin } from '@/lib/supabase';
import { currentLook } from '@/lib/backend/looks/looks';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { LOOKS } from '@/lib/site/looks';
import { LookTryOn } from './LookTryOn';

export const dynamic = 'force-dynamic';

/** Try on a look (Full): her own site in every mood, then keep the one she likes. */
export default async function LooksPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('try_on')) notFound();
  const current = await currentLook(supabaseAdmin(), site.tenantId);
  if (current === null) notFound();
  return <LookTryOn looks={LOOKS} current={current.mood} siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))} noScene={!current.hasScene} />;
}
