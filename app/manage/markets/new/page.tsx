import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { emptyMarketForm } from '@/lib/backend/markets/market-form';
import { MarketEditor } from '../MarketEditor';

export const dynamic = 'force-dynamic';

export default async function NewMarketPage(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_dates')) notFound();
  return <MarketEditor initial={emptyMarketForm()} />;
}
