import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getMoment } from '@/lib/backend/moment/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { HeadlineEditor } from './HeadlineEditor';

export const dynamic = 'force-dynamic';

export default async function HeadlinePage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('headline') && !on.has('moment')) notFound();
  const moment = await getMoment(await createSupabaseServerClient(), site.tenantId);
  return (
    <HeadlineEditor
      initial={{ headline: moment.headline, sub: moment.sub }}
      siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))}
    />
  );
}
