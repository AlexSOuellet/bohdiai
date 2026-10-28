import type { Metadata } from 'next';
import { storefrontMetadata } from '@/lib/storefront/metadata';
import { accountPage, accountShop } from '@/lib/buyers/page-frame';
import { MIN_BUYER_PASSWORD } from '@/lib/buyers/limits';
import { NewPassword } from '@/lib/buyers/AccountForms';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return { ...(await storefrontMetadata({ path: '/account/reset', titleSpot: 'account', noindex: true })), referrer: 'same-origin' };
}

/** The emailed reset link lands here. Opening it spends nothing: the token is
 *  only used when the buyer sends the new password. */
export default async function AccountResetPage({ searchParams }: { searchParams: Promise<{ token_hash?: string | string[] }> }) {
  const shop = await accountShop();
  const raw = (await searchParams).token_hash;
  const tokenHash = typeof raw === 'string' ? raw : '';
  return accountPage(shop.tenantId, <NewPassword w={shop.words} tokenHash={tokenHash} minPassword={MIN_BUYER_PASSWORD} />);
}
