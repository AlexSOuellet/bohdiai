/** Market date reads, earliest first. Used by the backend (the person's own client,
 *  RLS applies) and by the storefront (service role). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { MARKET_PUBLIC_COLUMNS, marketDateFromRow, type MarketDate } from './dates-form';

export async function listMarketDates(db: SupabaseClient<Database>, tenantId: string): Promise<MarketDate[]> {
  const { data, error } = await db
    .from('events')
    .select(MARKET_PUBLIC_COLUMNS)
    .eq('tenant_id', tenantId)
    .order('event_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error !== null) throw new Error(`Could not load the market dates: ${error.message}`);
  return (data ?? []).map((r) => marketDateFromRow(r.id, r));
}
