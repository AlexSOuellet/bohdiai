/**
 * Whether a shop's cart takes payment through its own PayPal, and what the PayPal
 * button needs: BohdiAI's public app ID (made to be shown to buyers), the shop's
 * PayPal account ID and its currency. Null when PayPal isn't set up on BohdiAI, the
 * cart is off, or the shop's PayPal can't take payments yet. Read with the server's
 * own key (the connection is locked to it).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { OnlinePay } from '@/lib/archetypes/content';
import { loadSiteFeatures } from '@/lib/backend/features';
import { paypalConfig } from './config';
import { paidInto } from './connection';

export async function onlinePay(db: SupabaseClient<Database>, tenantId: string): Promise<OnlinePay | null> {
  const config = paypalConfig();
  if (config === null || !(await loadSiteFeatures(db, tenantId)).has('cart')) return null;
  const merchantId = await paidInto(db, tenantId);
  if (merchantId === null) return null;
  const { data, error } = await db.from('tenants').select('currency').eq('id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the shop's currency: ${error.message}`);
  return { clientId: config.clientId, merchantId, currency: (data?.currency || 'USD').toUpperCase() };
}
