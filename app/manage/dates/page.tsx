import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listMarketDates } from '@/lib/backend/dates/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { DatesManager } from './DatesManager';

export const dynamic = 'force-dynamic';

export default async function DatesPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('market_dates')) notFound();
  const initial = await listMarketDates(await createSupabaseServerClient(), site.tenantId);
  return <DatesManager initial={initial} siteUrl={storefrontOrigin(site.subdomain, (await headers()).get('host'))} />;
}
