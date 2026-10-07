'use server';

/**
 * Orders — move one along (paid, handed over, canceled). Re-checks the acting
 * site and its `cart` switch on the server; the database function checks the
 * owner is an admin of the site and keeps stock in step.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { isOrderStatus } from './orders';

export async function setOrderStatus(orderId: string, status: string): Promise<DoneResult> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('cart')) return { ok: false, error: 'Orders aren’t switched on for this site.' };
  if (!isOrderStatus(status)) return { ok: false, error: 'That isn’t a step an order can take.' };
  const db = await createSupabaseServerClient();
  const { error } = await db.rpc('set_order_status', { p_tenant_id: site.tenantId, p_order_id: orderId, p_status: status });
  if (error !== null) {
    logger.error('orders: status change failed', { tenantId: site.tenantId, orderId, status, error: error.message });
    return { ok: false, error: 'The order couldn’t be updated. Try again in a moment.' };
  }
  revalidatePath('/manage/orders');
  revalidatePath('/manage');
  return { ok: true };
}
