import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { eventFromTools, takingsFromTools } from '@/lib/tools/handoff';
import { shopPicks } from '@/lib/backend/markets/shop-props';
import { MarketEditor } from '../MarketEditor';

export const dynamic = 'force-dynamic';

/** A new event; from Is this market worth it? in the Tools, it opens with the market's name and costs. */
export default async function NewMarketPage({ searchParams }: PageProps<'/manage/markets/new'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const sent = await searchParams;
  const initial = eventFromTools(sent);
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('market_dates')) notFound();
  if (!on.has('market_shop'))
    return (
      <MarketEditor
        initial={initial}
        details={on.has('market_details')}
        records={on.has('market_records')}
        takings={takingsFromTools(sent)}
      />
    );
  const picks = await shopPicks(await createSupabaseServerClient(), site.tenantId);
  return (
    <MarketEditor
      initial={initial}
      details={on.has('market_details')}
      records={on.has('market_records')}
      shop={{
        products: picks,
        marketUrl: null,
        fileBase: `${site.subdomain}-market-qr`,
      }}
    />
  );
}
