'use server';

/**
 * Orders — move one along (paid, handed over, canceled, refunded). Re-checks the
 * acting site on the server: the `cart` switch for any order, or the market shop
 * for a market sale (the Market plan has Orders for its market sales, Alex
 * 2026-10-21). The database function checks the owner is an admin of the site,
 * keeps stock in step, and records a card sale's refund beside its charge.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { isOrderStatus } from './orders';

const OFF = 'Orders aren’t switched on for this site.';

export async function setOrderStatus(orderId: string, status: string): Promise<DoneResult> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('cart') && !on.has('market_shop')) return { ok: false, error: OFF };
  if (!isOrderStatus(status)) return { ok: false, error: 'That isn’t a step an order can take.' };
  const db = await createSupabaseServerClient();
  if (!on.has('cart')) {
    // Without the cart only a market sale can be moved.
    const { data, error } = await db.from('orders').select('source').eq('id', orderId).eq('tenant_id', site.tenantId).maybeSingle();
    if (error !== null) {
      logger.error('orders: source read failed', { tenantId: site.tenantId, orderId, error: error.message });
      return { ok: false, error: 'The order couldn’t be updated. Try again in a moment.' };
    }
    if (data?.source !== 'market_mode') return { ok: false, error: OFF };
  }
  const { error } = await db.rpc('set_order_status', { p_tenant_id: site.tenantId, p_order_id: orderId, p_status: status });
  if (error !== null) {
    if (error.code === 'P0025') return { ok: false, error: 'Only a paid sale can be refunded, and only once.' };
    logger.error('orders: status change failed', { tenantId: site.tenantId, orderId, status, error: error.message });
    return { ok: false, error: 'The order couldn’t be updated. Try again in a moment.' };
  }
  revalidatePath('/manage/orders');
  revalidatePath('/manage');
  // A market sale also shows on its market's page and the market day.
  revalidatePath('/manage/markets', 'layout');
  return { ok: true };
}
