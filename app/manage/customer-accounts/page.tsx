import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { customerAccountsOn } from '@/lib/backend/buyers/switch';
import { supabaseAdmin } from '@/lib/supabase';
import { CustomerAccountsSwitch } from './CustomerAccountsSwitch';

export const dynamic = 'force-dynamic';

/** Customer accounts (Full, under My site): her switch for sign-in on her site. */
export default async function CustomerAccountsPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('buyer_accounts')) notFound();
  return <CustomerAccountsSwitch on={await customerAccountsOn(supabaseAdmin(), site.tenantId)} />;
}
