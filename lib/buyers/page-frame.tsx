import 'server-only';
/**
 * The account pages' shared steps: the shop from the host, 404 unless its buyer
 * accounts are open, its words, and the page painted in the design's own chrome.
 */
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { loadShopWords } from '@/lib/storefront/metadata';
import type { ShopWords } from '@/lib/storefront/words';
import { renderArchetypeShell } from '@/app/storefront/_components/StorefrontPage';
import { buyerAccountsOpen } from './accounts';
import { shopTenantId } from './session';
import { BUYER_ACCOUNT_CSS } from './styles';

export type AccountShop = { tenantId: string; words: ShopWords['account']; timeZone: string };

export async function accountShop(): Promise<AccountShop> {
  const tenantId = await shopTenantId();
  if (tenantId === null) notFound();
  const db = supabaseAdmin();
  if (!(await buyerAccountsOpen(db, tenantId))) notFound();
  const [words, tenant] = await Promise.all([loadShopWords(tenantId), db.from('tenants').select('time_zone').eq('id', tenantId).maybeSingle()]);
  if (tenant.error !== null) throw new Error(`Could not read the shop: ${tenant.error.message}`);
  return { tenantId, words: words.account, timeZone: tenant.data?.time_zone ?? 'UTC' };
}

/** The body in the shop's own chrome; a shop whose design paints no pages is a missing page. */
export async function accountPage(tenantId: string, body: ReactNode) {
  const page = await renderArchetypeShell(
    tenantId,
    <div className="ba-page">
      <style dangerouslySetInnerHTML={{ __html: BUYER_ACCOUNT_CSS }} />
      {body}
    </div>,
  );
  if (page === null) notFound();
  return page;
}
