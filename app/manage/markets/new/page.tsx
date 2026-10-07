import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { emptyMarketForm } from '@/lib/backend/markets/market-form';
import { shopPicks } from '@/lib/backend/markets/shop-props';
import { MarketEditor } from '../MarketEditor';

export const dynamic = 'force-dynamic';

export default async function NewMarketPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('market_dates')) notFound();
  if (!on.has('market_shop')) return <MarketEditor initial={emptyMarketForm()} />;
  const picks = await shopPicks(await createSupabaseServerClient(), site.tenantId);
  return <MarketEditor initial={emptyMarketForm()} shop={{ products: picks, marketUrl: null, fileBase: `${site.subdomain}-market-qr`, todayHref: null }} />;
}
