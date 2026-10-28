'use server';

/**
 * Saving a tool's numbers onto a product she already has (Alex, 2026-10-24): she
 * opens a product's costs in Cost to make, changes a number, and saves them back.
 * Her price stays her own; the product page shows the new suggested one.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { hasProducts } from '@/lib/backend/features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '@/lib/backend/catalog/results';
import { saveProductCosts, type CostSettings } from './product-costs';

const FAILED = 'The costs couldn’t be saved. Try again in a moment.';

export async function saveCostsToProduct(listingId: string, costs: CostSettings): Promise<DoneResult> {
  const { site } = await requireActingSite();
  if (!hasProducts(await getSiteFeatures(site.tenantId))) return { ok: false, error: 'Products aren’t switched on for this site.' };
  const db = await createSupabaseServerClient();
  const { data: product, error } = await db.from('listings').select('id').eq('id', listingId).eq('tenant_id', site.tenantId).is('deleted_at', null).maybeSingle();
  if (error !== null) {
    logger.error('tools: product lookup failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: FAILED };
  }
  if (product === null) return { ok: false, error: 'That product isn’t on your site any more.' };
  try {
    const done = await saveProductCosts(db, site.tenantId, listingId, costs);
    if (!done.ok) return done;
  } catch (err) {
    logger.error('tools: product costs save failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: FAILED };
  }
  revalidatePath(`/manage/products/${listingId}`);
  revalidatePath('/manage/products');
  revalidatePath('/manage');
  return { ok: true };
}
