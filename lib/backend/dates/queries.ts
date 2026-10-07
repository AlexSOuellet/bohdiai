/** Market date reads, earliest first. Used by the backend (the person's own client,
 *  RLS applies) and by the storefront (service role). */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { marketDateFromRow, type MarketDate } from './dates-form';

export async function listMarketDates(db: SupabaseClient<Database>, tenantId: string): Promise<MarketDate[]> {
  const { data, error } = await db
    .from('events')
    .select('id, event_date, end_date, name, location, created_at')
    .eq('tenant_id', tenantId)
    .order('event_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error !== null) throw new Error(`Could not load the market dates: ${error.message}`);
  return (data ?? []).map((r) => marketDateFromRow(r.id, r));
}
