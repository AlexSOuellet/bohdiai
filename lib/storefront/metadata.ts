import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { getSiteWords } from '@/lib/site-words/queries';
import { loadTenantSeoFacts } from './seo-data';
import { buildTenantMetadata, type PageSeo, type TenantSeoFacts } from './seo';
import { SHOP_WORD_SPOTS, SHOP_WORDS_PREFIX, type ShopWords } from './words';

/** Read the tenant context the proxy set on the request, or null on the apex. */
async function tenantContext(): Promise<{ tenantId: string; subdomain: string } | null> {
  const h = await headers();
  const tenantId = h.get('x-tenant-id');
  if (tenantId === null) return null;
  return { tenantId, subdomain: h.get('x-tenant-subdomain') ?? '' };
}

/** The site's shared storefront words, read once per request (the layout and the
 *  page's metadata both need them). */
export const loadShopWords = cache(
  (tenantId: string): Promise<ShopWords> => getSiteWords(supabaseAdmin(), tenantId, SHOP_WORD_SPOTS, SHOP_WORDS_PREFIX),
);

/** The current shop's storefront words, or null when not a tenant page. */
export async function storefrontShopWords(): Promise<ShopWords | null> {
  const ctx = await tenantContext();
  return ctx === null ? null : loadShopWords(ctx.tenantId);
}

/** The shop's SEO facts for the current request, or null when not a tenant page. */
export async function storefrontSeoFacts(): Promise<TenantSeoFacts | null> {
  const ctx = await tenantContext();
  if (ctx === null) return null;
  const facts = await loadTenantSeoFacts(ctx.tenantId, ctx.subdomain);
  if (facts !== null) return facts;
  return { shopName: ctx.subdomain || (await loadShopWords(ctx.tenantId)).seo.shopName, subdomain: ctx.subdomain };
}

/**
 * Build a storefront page's `<title>`/meta/OG/canonical from the tenant context,
 * in the site's own words. Call from a route's `generateMetadata`. Returns {} on
 * the apex (no tenant).
 */
export async function storefrontMetadata(page: PageSeo): Promise<Metadata> {
  const ctx = await tenantContext();
  if (ctx === null) return {};
  const [facts, words] = await Promise.all([storefrontSeoFacts(), loadShopWords(ctx.tenantId)]);
  if (facts === null) return {};
  return buildTenantMetadata(facts, page, words);
}
