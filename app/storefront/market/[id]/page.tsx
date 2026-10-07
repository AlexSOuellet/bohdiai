import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { renderArchetypeMarket } from '../../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';
import { supabaseAdmin } from '@/lib/supabase';
import { loadMarketShop } from '@/lib/market/shop-view';

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/market', pageName: 'At the market', noindex: true });
}

/** A market's own shop: the page buyers reach by scanning the code at her table. */
export default async function MarketShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const tenantId = (await headers()).get('x-tenant-id');
  if (tenantId === null) notFound();
  const market = await loadMarketShop(supabaseAdmin(), tenantId, id);
  if (market === null) notFound();
  const page = await renderArchetypeMarket(tenantId, market);
  if (page === null) notFound();
  return page;
}
