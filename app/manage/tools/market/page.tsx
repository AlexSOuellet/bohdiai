import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { MarketTool } from '../_components/MarketTool';

export const dynamic = 'force-dynamic';

/** Market day; it saves as an event where the site has a schedule. */
export default async function Page(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  return <MarketTool canSaveEvent={on.has('market_dates')} />;
}
