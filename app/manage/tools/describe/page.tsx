import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { hasProducts } from '@/lib/backend/features';
import { DescribeTool } from '../_components/DescribeTool';

export const dynamic = 'force-dynamic';

/** Describe it; its answer saves as a product where the site has products. */
export default async function Page(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  return <DescribeTool canSaveProduct={hasProducts(await getSiteFeatures(site.tenantId))} />;
}
