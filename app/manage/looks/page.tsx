import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { supabaseAdmin } from '@/lib/supabase';
import { currentLook } from '@/lib/backend/looks/looks';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { LOOKS } from '@/lib/site/looks';
import { LookTryOn } from './LookTryOn';
import { PublishPanel } from '../_components/PublishPanel';
import { getSiteOpen } from '@/lib/backend/publish/queries';
import { publishSite } from '@/lib/backend/publish/actions';

export const dynamic = 'force-dynamic';

/** Try on a look (Full): her own site in every mood, then keep the one she likes. */
export default async function LooksPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('try_on')) notFound();
  const current = await currentLook(supabaseAdmin(), site.tenantId);
  if (current === null) notFound();
  const host = (await headers()).get('host');
  const open = await getSiteOpen(supabaseAdmin(), site.tenantId, site.subdomain, process.env['BACKEND_SESSION_SECRET'], host);
  return (
    <>
      {open.canPublish && <PublishPanel siteUrl={`https://${site.subdomain}.bohdiai.com`} previewUrl={open.openUrl} publish={publishSite} />}
      <LookTryOn looks={LOOKS} current={current.mood} siteUrl={storefrontOrigin(site.subdomain, host)} noScene={!current.hasScene} />
    </>
  );
}
