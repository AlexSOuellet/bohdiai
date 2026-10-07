/**
 * Today at the table (Market POS piece 2): a market's holds and sales for the
 * owner's phone. Reads through the owner's own client (RLS applies).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { formatPrice } from '@/lib/storefront/catalog';
import { isPayMethod, type PayMethod } from '@/lib/market/pay';

export type TodayOrder = {
  id: string;
  number: string;
  createdAt: string;
  status: 'pending' | 'paid';
  name: string;
  piece: string;
  amount: string;
  amountCents: number;
  method: PayMethod | 'card' | null;
  saysPaid: boolean;
};

export async function listMarketOrders(db: SupabaseClient<Database>, tenantId: string, eventId: string): Promise<TodayOrder[]> {
  const { data, error } = await db
    .from('orders')
    .select('id, order_number, created_at, status, customer_name, total_cents, payment_method, buyer_paid_at, order_items(name_snapshot)')
    .eq('tenant_id', tenantId)
    .eq('event_id', eventId)
    .in('status', ['pending', 'paid', 'fulfilled'])
    .order('created_at', { ascending: false });
  if (error !== null) throw new Error(`Could not load today’s sales: ${error.message}`);
  return (data ?? []).map((o) => ({
    id: o.id,
    number: o.order_number,
    createdAt: o.created_at,
    status: o.status === 'pending' ? 'pending' : 'paid',
    name: o.customer_name,
    piece: o.order_items.map((i) => i.name_snapshot).join(', '),
    amount: formatPrice(o.total_cents),
    amountCents: o.total_cents,
    method: o.payment_method === 'card' ? 'card' : isPayMethod(o.payment_method) ? o.payment_method : null,
    saysPaid: o.buyer_paid_at !== null,
  }));
}

/** The day's takings: how many sold and the total, all of it and by method. */
export function takings(orders: readonly TodayOrder[]): { count: number; total: string; byMethod: { method: string; total: string }[] } {
  const paid = orders.filter((o) => o.status === 'paid');
  const by = new Map<string, number>();
  for (const o of paid) by.set(o.method ?? 'other', (by.get(o.method ?? 'other') ?? 0) + o.amountCents);
  return {
    count: paid.length,
    total: formatPrice(paid.reduce((s, o) => s + o.amountCents, 0)),
    byMethod: [...by].map(([method, cents]) => ({ method, total: formatPrice(cents) })),
  };
}
