import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadPaySettings } from '@/lib/market/queries';
import { PayManager } from './PayManager';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) notFound();
  return <PayManager initial={await loadPaySettings(await createSupabaseServerClient(), site.tenantId)} />;
}
