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

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: PageProps<'/manage/products'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!hasProducts(on)) notFound();
  const db = await createSupabaseServerClient();
  const products = await listProducts(db, site.tenantId);
  // Showcase ticks its gallery (up to 12); a standard site on Market or Full ticks
  // the home page and its gallery (no limit); a custom site ticks the home page.
  const picks: Pick[] = !on.has('catalog') ? ['gallery'] : (await isFamilySite(db, site.tenantId)) ? ['home', 'gallery-open'] : ['home'];
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Products</h1>
        <div className="bk-head-actions">
          <Link href="/manage/products/new" className="bk-btn">
            Add product
          </Link>
        </div>
      </div>
      <main id="main" className="bk-content">
        <ListNotice message={listNotice(await searchParams)} />
        <ProductTable products={products} picks={picks} />
      </main>
    </>
  );
}
