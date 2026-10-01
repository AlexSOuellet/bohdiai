import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { listProducts } from '@/lib/backend/catalog/queries';
import { ProductTable } from './ProductTable';
import { ListNotice, listNotice } from '../_components/ListNotice';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({ searchParams }: PageProps<'/manage/products'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('catalog')) notFound();
  const products = await listProducts(await createSupabaseServerClient(), site.tenantId);
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Products</h1>
        <div className="bk-head-actions">
          <Link href="/manage/products/new" className="bk-btn">Add product</Link>
        </div>
      </div>
      <main id="main" className="bk-content">
        <ListNotice message={listNotice(await searchParams)} />
        <ProductTable products={products} />
      </main>
    </>
  );
}
