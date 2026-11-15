import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { hasProducts } from '@/lib/backend/features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listProducts } from '@/lib/backend/catalog/queries';
import { loadPieces } from '@/lib/tools/print/pieces';
import { logger } from '@/lib/logger';
import { PrintTool, type ProductChoice } from '../_components/PrintTool';

export const dynamic = 'force-dynamic';

/** Print it (Alex, 2026-11-15): every plan. The maker's saved pieces, and their
 *  products where the site has products, for adding the paper to one. */
export default async function Page(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const db = await createSupabaseServerClient();
  const pieces = await loadPieces(db, site.tenantId);
  let products: ProductChoice[] | null = null;
  if (hasProducts(await getSiteFeatures(site.tenantId))) {
    try {
      products = (await listProducts(db, site.tenantId)).filter((p) => p.status !== 'archived').map((p) => ({ id: p.id, name: p.name }));
    } catch (err) {
      // The tool still works; only adding the paper to a product is missing.
      logger.error('print: products list failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return <PrintTool pieces={pieces} products={products} />;
}
