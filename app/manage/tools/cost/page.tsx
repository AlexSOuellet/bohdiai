import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { hasProducts } from '@/lib/backend/features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadProductCosts } from '@/lib/tools/product-costs';
import { paperFromTools } from '@/lib/tools/handoff';
import { CostTool, type FromProduct } from '../_components/CostTool';

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cost to make; opened from a product, it starts from that product's costs. */
export default async function CostPage({ searchParams }: PageProps<'/manage/tools/cost'>): Promise<React.ReactElement> {
  const params = await searchParams;
  const raw = params['product'];
  const id = typeof raw === 'string' && ID.test(raw) ? raw : null;
  let product: FromProduct | null = null;
  if (id !== null) {
    const { site } = await requireActingSite();
    if (hasProducts(await getSiteFeatures(site.tenantId))) {
      const db = await createSupabaseServerClient();
      const { data } = await db.from('listings').select('id, name').eq('id', id).eq('tenant_id', site.tenantId).is('deleted_at', null).maybeSingle();
      if (data !== null) product = { id: data.id, name: data.name, costs: await loadProductCosts(db, site.tenantId, data.id) };
    }
  }
  // Print it sends its paper with a product (Alex, 2026-11-15).
  return <CostTool product={product} paper={product === null ? null : paperFromTools(params)} />;
}
