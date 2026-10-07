import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listOrders } from '@/lib/backend/orders/queries';
import { OrdersManager } from './OrdersManager';

export const dynamic = 'force-dynamic';

export default async function OrdersPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('cart')) notFound();
  const db = await createSupabaseServerClient();
  const [orders, tenant] = await Promise.all([
    listOrders(db, site.tenantId),
    db.from('tenants').select('time_zone').eq('id', site.tenantId).maybeSingle(),
  ]);
  return <OrdersManager initial={orders} timeZone={tenant.data?.time_zone ?? 'America/New_York'} />;
}
