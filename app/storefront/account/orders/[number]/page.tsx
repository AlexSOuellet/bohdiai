import type { Metadata, Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { storefrontMetadata } from '@/lib/storefront/metadata';
import { accountPage, accountShop } from '@/lib/buyers/page-frame';
import { currentBuyer } from '@/lib/buyers/session';
import { loadBuyerOrder } from '@/lib/buyers/accounts';
import { OrderPage } from '@/lib/buyers/AccountViews';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/account', titleSpot: 'account', noindex: true });
}

/** One of the signed-in buyer's own orders; anyone else's is a missing page. */
export default async function AccountOrderPage({ params }: { params: Promise<{ number: string }> }) {
  const shop = await accountShop();
  const buyer = await currentBuyer(shop.tenantId);
  // The shop's pages are served under /storefront; typed routes know them by that path.
  if (buyer === null) redirect('/account' as Route);
  const { number } = await params;
  const order = await loadBuyerOrder(supabaseAdmin(), shop.tenantId, buyer.profileId, decodeURIComponent(number));
  if (order === null) notFound();
  return accountPage(shop.tenantId, <OrderPage w={shop.words} order={order} timeZone={shop.timeZone} />);
}
