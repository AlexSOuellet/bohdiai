import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { supabaseAdmin } from '@/lib/supabase';
import { listShopBuyers } from '@/lib/backend/buyers/queries';
import { BuyersManager } from './BuyersManager';

export const dynamic = 'force-dynamic';

/** Buyers (Full): her switch for buyer accounts and the people who have one. */
export default async function BuyersPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('buyer_accounts')) notFound();
  const db = supabaseAdmin();
  const [tenant, buyers] = await Promise.all([db.from('tenants').select('buyer_accounts_on').eq('id', site.tenantId).single(), listShopBuyers(db, site.tenantId)]);
  if (tenant.error !== null) throw new Error(`Could not read the buyer accounts switch: ${tenant.error.message}`);
  return <BuyersManager on={tenant.data.buyer_accounts_on} buyers={buyers} />;
}
