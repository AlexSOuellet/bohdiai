import 'server-only';
/**
 * Buyers (Full): the people with an account at her shop, newest first, with
 * their email, when they joined, and what they've ordered while signed in.
 * Service role (their emails live in the shared sign-in system); the caller
 * has already checked the acting site.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { formatPrice } from '@/lib/storefront/catalog';

export type ShopBuyer = { id: string; name: string; email: string; joined: string; orders: number; spent: string };

export const BUYERS_SHOWN = 500;

/** Orders that count toward what a buyer has spent (refunded and canceled ones don't). */
const COUNTED = new Set(['paid', 'fulfilled', 'shipped', 'delivered', 'partially_refunded']);

export async function listShopBuyers(db: SupabaseClient<Database>, tenantId: string): Promise<ShopBuyer[]> {
  const { data: profiles, error } = await db
    .from('customer_profiles')
    .select('id, user_id, display_name, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(BUYERS_SHOWN);
  if (error !== null) throw new Error(`Could not load the buyers: ${error.message}`);
  const rows = profiles ?? [];
  if (rows.length === 0) return [];

  const { data: orders, error: ordersError } = await db
    .from('orders')
    .select('customer_profile_id, status, total_cents')
    .eq('tenant_id', tenantId)
    .in('customer_profile_id', rows.map((p) => p.id));
  if (ordersError !== null) throw new Error(`Could not load the buyers' orders: ${ordersError.message}`);
  const tally = new Map<string, { orders: number; cents: number }>();
  for (const o of orders ?? []) {
    if (o.customer_profile_id === null) continue;
    const t = tally.get(o.customer_profile_id) ?? { orders: 0, cents: 0 };
    t.orders += 1;
    if (COUNTED.has(o.status)) t.cents += o.total_cents;
    tally.set(o.customer_profile_id, t);
  }

  const emails = await Promise.all(
    rows.map(async (p) => {
      const { data, error: userError } = await db.auth.admin.getUserById(p.user_id);
      if (userError !== null) throw new Error(`Could not load a buyer's email: ${userError.message}`);
      return data.user.email ?? '';
    }),
  );

  return rows.map((p, i) => {
    const t = tally.get(p.id) ?? { orders: 0, cents: 0 };
    return { id: p.id, name: p.display_name ?? '', email: emails[i] ?? '', joined: p.created_at, orders: t.orders, spent: formatPrice(t.cents) };
  });
}
