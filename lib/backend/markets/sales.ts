/**
 * Sales (Events; Alex, 2026-10-22): every market sale, grouped by the event it was
 * made at, newest event first. Holds a buyer turned away (canceled) are left out.
 * Reads through the owner's own client (RLS applies).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { toTodayOrder, type TodayOrder } from './today';

export const SALES_SHOWN = 500;

export type EventSales = {
  id: string;
  name: string;
  date: string;
  endDate: string;
  town: string;
  /** Newest first. */
  sales: TodayOrder[];
};

export async function listSalesByEvent(db: SupabaseClient<Database>, tenantId: string): Promise<EventSales[]> {
  const [orders, events] = await Promise.all([
    db
      .from('orders')
      .select('id, order_number, created_at, status, customer_name, total_cents, payment_method, buyer_paid_at, event_id, order_items(name_snapshot)')
      .eq('tenant_id', tenantId)
      .eq('source', 'market_mode')
      .not('event_id', 'is', null)
      .in('status', ['pending', 'paid', 'fulfilled', 'refunded'])
      .order('created_at', { ascending: false })
      .limit(SALES_SHOWN),
    db.from('events').select('id, name, event_date, end_date, location').eq('tenant_id', tenantId),
  ]);
  if (orders.error !== null) throw new Error(`Could not load your sales: ${orders.error.message}`);
  if (events.error !== null) throw new Error(`Could not load your events: ${events.error.message}`);
  const eventById = new Map((events.data ?? []).map((e) => [e.id, e]));
  const byEvent = new Map<string, EventSales>();
  for (const o of orders.data ?? []) {
    const e = o.event_id === null ? undefined : eventById.get(o.event_id);
    if (e === undefined) continue;
    const group = byEvent.get(e.id) ?? { id: e.id, name: e.name, date: e.event_date, endDate: e.end_date ?? '', town: e.location ?? '', sales: [] };
    group.sales.push(toTodayOrder(o));
    byEvent.set(e.id, group);
  }
  return [...byEvent.values()].sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
}
