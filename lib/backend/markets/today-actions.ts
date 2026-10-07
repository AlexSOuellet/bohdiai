'use server';

/**
 * Today at the table — the owner records a sale herself (a buyer who just hands
 * her cash). Confirm / Not received use the Orders screen's setOrderStatus.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { loadProductsByIds } from '@/lib/storefront/catalog';
import { runningSale, salePriceCents } from '@/lib/storefront/promotions';
import { loadShopPromotions } from '@/lib/storefront/promotions-load';
import type { DoneResult } from '../catalog/results';

const METHODS = ['venmo', 'cashapp', 'zelle', 'cash', 'card'] as const;

export async function recordMarketSale(eventId: string, listingId: string, method: string): Promise<DoneResult> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) return { ok: false, error: 'The market shop isn’t switched on for this site.' };
  if (!(METHODS as readonly string[]).includes(method)) return { ok: false, error: 'Pick how they paid.' };
  const db = await createSupabaseServerClient();
  const [piece] = await loadProductsByIds(db, site.tenantId, [listingId]);
  if (piece === undefined) return { ok: false, error: 'That piece isn’t on your site any more.' };
  const promo = await loadShopPromotions(db, site.tenantId);
  const sale = runningSale(promo.promos, promo.today);
  const price = sale?.percentOff == null ? piece.priceCents : salePriceCents(piece.priceCents, sale.percentOff);

  const { error } = await db.rpc('market_record_sale', {
    p_tenant_id: site.tenantId,
    p_event_id: eventId,
    p_listing_id: listingId,
    p_method: method,
    p_price_cents: price,
  });
  if (error !== null) {
    if (error.code === 'P0040') return { ok: false, error: 'This market isn’t on today, so it can’t take a sale.' };
    if (error.code === 'P0021') return { ok: false, error: 'That one is already sold or held, or isn’t marked for this market.' };
    logger.error('market: record sale failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'The sale couldn’t be recorded. Try again in a moment.' };
  }
  revalidatePath(`/manage/markets/${eventId}/today`);
  return { ok: true };
}
