import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getMarket } from '@/lib/backend/markets/queries';
import { MarketEditor } from '../MarketEditor';

export const dynamic = 'force-dynamic';

/** A mistyped address is "not found", not a database error. */
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditMarketPage({ params }: PageProps<'/manage/markets/[id]'>): Promise<React.ReactElement> {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_dates')) notFound();
  const market = await getMarket(await createSupabaseServerClient(), site.tenantId, id);
  if (market === null) notFound();
  return <MarketEditor key={id} initial={market} />;
}
