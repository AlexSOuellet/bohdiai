import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { storefrontMetadata } from '@/lib/storefront/metadata';
import { accountPage, accountShop } from '@/lib/buyers/page-frame';
import { currentBuyer } from '@/lib/buyers/session';
import { listBuyerOrders } from '@/lib/buyers/accounts';
import { MIN_BUYER_PASSWORD } from '@/lib/buyers/limits';
import { SignInOrCreate } from '@/lib/buyers/AccountForms';
import { MyAccount } from '@/lib/buyers/AccountViews';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/account', titleSpot: 'account', noindex: true });
}

/** My account when signed in; otherwise sign in or create an account (buyer accounts, Full). */
export default async function AccountPage() {
  const shop = await accountShop();
  const buyer = await currentBuyer(shop.tenantId);
  if (buyer === null) return accountPage(shop.tenantId, <SignInOrCreate w={shop.words} minPassword={MIN_BUYER_PASSWORD} />);
  const orders = await listBuyerOrders(supabaseAdmin(), shop.tenantId, buyer.profileId);
  return accountPage(shop.tenantId, <MyAccount w={shop.words} name={buyer.name} orders={orders} timeZone={shop.timeZone} />);
}
