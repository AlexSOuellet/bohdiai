import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { hasProducts } from '@/lib/backend/features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listProducts } from '@/lib/backend/catalog/queries';
import { ProductTable, type Pick } from './ProductTable';
import { isFamilySite } from '@/lib/backend/site-kind';
import { ListNotice, listNotice } from '../_components/ListNotice';
import { isFreeSite } from '@/lib/backend/plan/free';
import { loadCostSummaries, pricedBelowCost } from '@/lib/tools/product-costs';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: PageProps<'/manage/products'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!hasProducts(on)) notFound();
  const db = await createSupabaseServerClient();
  const [products, free, prices] = await Promise.all([
    listProducts(db, site.tenantId),
    isFreeSite(db, site.tenantId),
    db.from('listings').select('id, base_price_cents').eq('tenant_id', site.tenantId).is('deleted_at', null),
  ]);
  // Pieces priced below what they cost to make, from their costs in the Tools.
  let belowCost: string[] = [];
  try {
    const costs = await loadCostSummaries(db, site.tenantId);
    belowCost = (prices.data ?? []).filter((r) => pricedBelowCost(r.base_price_cents > 0 ? r.base_price_cents : null, costs.get(r.id) ?? null)).map((r) => r.id);
  } catch (err) {
    logger.error('catalog: cost summaries failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
  }
  // Free has no site, so nothing to tick. Showcase ticks its gallery (up to 12); a
  // standard site on Market or Full ticks the home page and its gallery (no limit);
  // a custom site ticks the home page.
  const picks: Pick[] = free ? [] : !on.has('catalog') ? ['gallery'] : (await isFamilySite(db, site.tenantId)) ? ['home', 'gallery-open'] : ['home'];
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Products</h1>
        <div className="bk-head-actions">
          {free && (
            <Link href="/manage/tools/cost" className="bk-btn">
              Price a new piece
            </Link>
          )}
          <Link href="/manage/products/new" className={free ? 'bk-btn bk-btn-quiet' : 'bk-btn'}>
            Add product
          </Link>
        </div>
      </div>
      <main id="main" className="bk-content">
        <ListNotice message={listNotice(await searchParams)} />
        <ProductTable
          products={products}
          picks={picks}
          belowCost={belowCost}
          {...(free ? { emptyNote: 'No products yet. Price your first piece in Cost to make and save it as a product.' } : {})}
        />
      </main>
    </>
  );
}
