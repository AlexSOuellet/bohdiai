/**
 * The shopper is back on the cart from Square's checkout page with our order's ID:
 * what Square says about it, asked by our server (never read from the address).
 * Only an order of this shop paid through Square is looked at; anything else shows
 * nothing extra. A check that fails says the payment is still being confirmed (never
 * nothing: the shopper may have paid), and is logged; the order is still confirmed
 * by Square's own notice.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { CheckoutReturn } from '@/lib/archetypes/content';
import { logger } from '@/lib/logger';
import { squareConfig } from '@/lib/square/config';
import { confirmSquareOrder, squareOrderFor } from '@/lib/square/online';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function squareReturn(db: SupabaseClient<Database>, tenantId: string, orderId: string): Promise<CheckoutReturn | null> {
  const config = squareConfig();
  if (config === null || !UUID.test(orderId)) return null;
  let squareOrderId: string | null;
  try {
    squareOrderId = await squareOrderFor(db, tenantId, orderId);
  } catch (err) {
    logger.error('square online: return lookup failed', { tenantId, orderId, error: err instanceof Error ? err.message : String(err) });
    return null;
  }
  if (squareOrderId === null) return null;
  try {
    const outcome = await confirmSquareOrder(db, config, tenantId, squareOrderId);
    return outcome.kind === 'unknown' ? null : outcome;
  } catch (err) {
    logger.error('square online: return check failed', { tenantId, orderId, error: err instanceof Error ? err.message : String(err) });
    const { data } = await db.from('orders').select('order_number').eq('id', orderId).eq('tenant_id', tenantId).maybeSingle();
    return data === null ? null : { kind: 'waiting', orderNumber: data.order_number };
  }
}
