import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listPromotions } from '@/lib/storefront/promotions-load';
import { shopToday } from '@/lib/storefront/promotions';
import { PromotionsManager } from './PromotionsManager';

export const dynamic = 'force-dynamic';

export default async function PromotionsPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('promotions')) notFound();
  const db = await createSupabaseServerClient();
  const [promos, tenant] = await Promise.all([listPromotions(db, site.tenantId), db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle()]);
  return <PromotionsManager initial={promos} today={shopToday(tenant.data?.time_zone ?? null)} />;
}
