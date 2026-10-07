/** Market shop reads: a shop's payment settings and the pieces each market brings.
 *  The backend passes the owner's own client (RLS applies); the storefront passes
 *  the service role. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { paySettingsFromRow, type PaySettings } from './pay';

type Db = SupabaseClient<Database>;

export async function loadPaySettings(db: Db, tenantId: string): Promise<PaySettings> {
  const { data, error } = await db.from('payment_settings').select('venmo, venmo_on, cashapp, cashapp_on, zelle, zelle_on, cash_on').eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not load the payment details: ${error.message}`);
  return paySettingsFromRow(data);
}

/** The listing ids a market brings, in the owner's order. */
export async function marketListingIds(db: Db, eventId: string): Promise<string[]> {
  const { data, error } = await db.from('market_listings').select('listing_id, position').eq('event_id', eventId).order('position', { ascending: true });
  if (error !== null) throw new Error(`Could not load what this market brings: ${error.message}`);
  return (data ?? []).map((r) => r.listing_id);
}
