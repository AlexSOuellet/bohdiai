import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { customerAccountsOn } from '@/lib/backend/buyers/switch';
import { supabaseAdmin } from '@/lib/supabase';
import { listShopBuyers } from '@/lib/backend/buyers/queries';
import { CustomerList } from './CustomerList';

export const dynamic = 'force-dynamic';

/** Customers (Full): the people with an account at her shop, only while her
 *  Customer accounts switch is on. */
export default async function CustomersPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('buyer_accounts')) notFound();
  const db = supabaseAdmin();
  if (!(await customerAccountsOn(db, site.tenantId))) notFound();
  return <CustomerList customers={await listShopBuyers(db, site.tenantId)} />;
}
