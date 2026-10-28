import type { Metadata } from 'next';
import { storefrontMetadata } from '@/lib/storefront/metadata';
import { accountPage, accountShop } from '@/lib/buyers/page-frame';
import { ForgotPassword } from '@/lib/buyers/AccountForms';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/account/forgot', titleSpot: 'account', noindex: true });
}

export default async function AccountForgotPage() {
  const shop = await accountShop();
  return accountPage(shop.tenantId, <ForgotPassword w={shop.words} />);
}
