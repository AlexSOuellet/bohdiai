import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { hasProducts } from '@/lib/backend/features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listProducts } from '@/lib/backend/catalog/queries';
import { logger } from '@/lib/logger';
import { DescribeTool } from '../_components/DescribeTool';

export const dynamic = 'force-dynamic';

/** Describe it: from nothing, or from one of the maker's products (Alex, 2026-10-28).
 *  A new piece saves as a product where the site has products; a chosen one saves to itself. */
export default async function Page(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const canSaveProduct = hasProducts(await getSiteFeatures(site.tenantId));
  let products: { id: string; name: string }[] = [];
  if (canSaveProduct) {
    try {
      products = (await listProducts(await createSupabaseServerClient(), site.tenantId)).filter((p) => p.status !== 'archived').map((p) => ({ id: p.id, name: p.name }));
    } catch (err) {
      // The tool still works from nothing; only the choice of products is missing.
      logger.error('describe: products list failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return <DescribeTool canSaveProduct={canSaveProduct} products={products} />;
}
