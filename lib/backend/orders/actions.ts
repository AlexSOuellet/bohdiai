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
import { supabaseAdmin } from '@/lib/supabase';
import { paypalConfig } from '@/lib/paypal/config';
import { partnerToken, refundCapture } from '@/lib/paypal/api';

/** Give a PayPal sale's money back through PayPal (a sale paid any other way: nothing to do here). */
async function refundAtPayPal(tenantId: string, orderId: string): Promise<DoneResult> {
  const admin = supabaseAdmin();
  const { data: charge, error } = await admin
    .from('payments')
    .select('metadata')
    .eq('tenant_id', tenantId)
    .eq('order_id', orderId)
    .eq('processor', 'paypal')
    .eq('payment_type', 'charge')
    .eq('status', 'succeeded')
    .maybeSingle();
  if (error !== null) {
    logger.error('orders: paypal charge read failed', { tenantId, orderId, error: error.message });
    return { ok: false, error: 'The refund couldn’t be started. Try again in a moment.' };
  }
  if (charge === null) return { ok: true };
  const meta = charge.metadata as { capture_id?: unknown; refund_id?: unknown } | null;
  if (typeof meta?.refund_id === 'string') return { ok: true };
  const captureId = typeof meta?.capture_id === 'string' ? meta.capture_id : null;
  const config = paypalConfig();
  const { data: link } = await admin.from('paypal_connections').select('merchant_id').eq('tenant_id', tenantId).maybeSingle();
  // Her PayPal isn't connected any more: the refund is recorded here, like a Square
  // sale's, and the money is given back in her own PayPal.
  if (captureId === null || config === null || link === null) return { ok: true };
  try {
    const refundId = await refundCapture(config, await partnerToken(config), captureId, link.merchant_id);
    await admin.from('payments').update({ metadata: { capture_id: captureId, refund_id: refundId } }).eq('tenant_id', tenantId).eq('order_id', orderId).eq('processor', 'paypal').eq('payment_type', 'charge');
    return { ok: true };
  } catch (err) {
    logger.error('orders: paypal refund failed', { tenantId, orderId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'PayPal didn’t give the money back, so nothing changed. Try again in a moment, or refund it in your PayPal.' };
  }
}

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
  // A PayPal sale is refunded at PayPal first: the money goes back from her PayPal,
  // and only then is the order marked refunded here.
  if (status === 'refunded') {
    const back = await refundAtPayPal(site.tenantId, orderId);
    if (!back.ok) return back;
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
