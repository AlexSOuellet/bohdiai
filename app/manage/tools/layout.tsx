import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { hasProducts } from '@/lib/backend/features';
import { ToolsShell } from './_components/ToolsShell';

export const dynamic = 'force-dynamic';

/** Tools on every plan (Alex, 2026-10-24). A result saves as a product where the
 *  site has products, and as an event where it has a schedule. */
export default async function ToolsLayout({ children }: { children: React.ReactNode }): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  return (
    <ToolsShell canSaveProduct={hasProducts(on)} canSaveEvent={on.has('market_dates')}>
      {children}
    </ToolsShell>
  );
}
