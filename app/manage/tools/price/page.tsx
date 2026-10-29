import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { hasProducts } from '@/lib/backend/features';
import { priceFromCost } from '@/lib/tools/handoff';
import { PriceTool } from '../_components/PriceTool';

export const dynamic = 'force-dynamic';

/** Price it: blank on its own, or with the piece's cost when Cost to make opened it. */
export default async function Page({ searchParams }: PageProps<'/manage/tools/price'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  const { form, carry } = priceFromCost(await searchParams);
  return <PriceTool key={JSON.stringify(form)} initial={form} carry={carry} canSaveProduct={hasProducts(on)} />;
}
