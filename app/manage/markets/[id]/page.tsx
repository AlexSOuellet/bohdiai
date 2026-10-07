import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getMarket } from '@/lib/backend/markets/queries';
import { marketPageUrl, shopPicks } from '@/lib/backend/markets/shop-props';
import { marketListingIds } from '@/lib/market/queries';
import { storefrontOrigin } from '@/lib/dashboard/storefront-url';
import { MarketEditor } from '../MarketEditor';

export const dynamic = 'force-dynamic';

/** A mistyped address is "not found", not a database error. */
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditMarketPage({ params }: PageProps<'/manage/markets/[id]'>): Promise<React.ReactElement> {
  const { id } = await params;
  if (!ID.test(id)) notFound();
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('market_dates')) notFound();
  const db = await createSupabaseServerClient();
  const market = await getMarket(db, site.tenantId, id);
  if (market === null) notFound();
  if (!on.has('market_shop')) return <MarketEditor key={id} initial={market} />;
  const [picks, listingIds] = await Promise.all([shopPicks(db, site.tenantId), marketListingIds(db, id)]);
  const origin = storefrontOrigin(site.subdomain, (await headers()).get('host'));
  return (
    <MarketEditor
      key={id}
      initial={{ ...market, listingIds }}
      shop={{ products: picks, marketUrl: marketPageUrl(origin, id), fileBase: `${site.subdomain}-market-qr`, todayHref: `/manage/markets/${id}/today` }}
    />
  );
}
