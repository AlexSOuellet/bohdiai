import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { WorthTool } from '../_components/WorthTool';

export const dynamic = 'force-dynamic';

/** Is this market worth it? (Alex, 2026-10-28); it saves as an event where the site
 *  has a schedule (never on Free). */
export default async function Page(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  return <WorthTool canSaveEvent={on.has('market_dates')} />;
}
