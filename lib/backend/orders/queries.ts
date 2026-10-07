/** Order reads for the backend, newest first, through the owner's own client (RLS applies). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { formatPrice } from '@/lib/storefront/catalog';
import { isOrderStatus, type OrderRow } from './orders';
import { METHOD_LABEL, isPayMethod } from '@/lib/market/pay';

export const ORDERS_SHOWN = 200;

export async function listOrders(db: SupabaseClient<Database>, tenantId: string): Promise<OrderRow[]> {
  const { data, error } = await db
    .from('orders')
    .select('id, order_number, created_at, status, customer_name, customer_email, customer_phone, customer_note, total_cents, discount_cents, discount_label, source, payment_method, order_items(name_snapshot, unit_price_cents, quantity, created_at)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(ORDERS_SHOWN);
  if (error !== null) throw new Error(`Could not load the orders: ${error.message}`);
  return (data ?? []).map((o) => ({
    id: o.id,
    number: o.order_number,
    createdAt: o.created_at,
    status: isOrderStatus(o.status) ? o.status : 'pending',
    name: o.customer_name,
    email: o.customer_email,
    phone: o.customer_phone ?? '',
    note: o.customer_note ?? '',
    total: formatPrice(o.total_cents),
    via:
      o.source === 'market_mode'
        ? ['At the market', o.payment_method === 'card' ? 'Card' : isPayMethod(o.payment_method) ? METHOD_LABEL[o.payment_method] : null].filter((x) => x !== null).join(' · ')
        : undefined,
    discount: o.discount_cents > 0 ? { label: o.discount_label ?? 'Discount', amount: formatPrice(o.discount_cents) } : undefined,
    items: [...o.order_items]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((i) => ({ name: i.quantity > 1 ? `${i.name_snapshot} × ${i.quantity}` : i.name_snapshot, price: formatPrice(i.unit_price_cents * i.quantity) })),
  }));
}

/** How many orders are waiting on the owner (status New), for the home screen. */
export async function countNewOrders(db: SupabaseClient<Database>, tenantId: string): Promise<number> {
  const { count, error } = await db.from('orders').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pending');
  if (error !== null) throw new Error(`Could not count the orders: ${error.message}`);
  return count ?? 0;
}
