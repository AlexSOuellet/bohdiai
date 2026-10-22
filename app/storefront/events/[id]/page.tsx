import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { renderArchetypeMarketInfo } from '../../_components/StorefrontPage';
import { storefrontMetadata } from '@/lib/storefront/metadata';
import { supabaseAdmin } from '@/lib/supabase';
import { loadMarketInfo } from '@/lib/market/shop-view';

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function generateMetadata(): Promise<Metadata> {
  return storefrontMetadata({ path: '/events', titleSpot: 'events' });
}

/** A market's information page (Alex, 2026-10-22): its details and what she's
 *  bringing, reached by clicking the market on her site. Market and Full only. */
export default async function MarketInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const tenantId = (await headers()).get('x-tenant-id');
  if (tenantId === null) notFound();
  const market = await loadMarketInfo(supabaseAdmin(), tenantId, id);
  if (market === null) notFound();
  const page = await renderArchetypeMarketInfo(tenantId, market);
  if (page === null) notFound();
  return page;
}
