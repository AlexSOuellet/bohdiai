/**
 * Whether a shop's cart takes payment online, and how: through the shop's own
 * Square (its checkout page) when Square is set up on BohdiAI, the cart is on, and
 * the shop's Square is connected with a location picked; otherwise through its own
 * PayPal when that's on (switched off since 2026-11-04). Null: the cart sends an
 * order request and nothing is charged. Read with the server's own key (the
 * connections are locked to it).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { OnlinePay } from '@/lib/archetypes/content';
import { loadSiteFeatures } from '@/lib/backend/features';
import { paypalPay } from '@/lib/paypal/online-pay';
import { squareConfig } from '@/lib/square/config';
import { cardState } from '@/lib/square/connection';

export async function onlinePay(db: SupabaseClient<Database>, tenantId: string): Promise<OnlinePay | null> {
  if (!(await loadSiteFeatures(db, tenantId)).has('cart')) return null;
  if ((await cardState(db, tenantId, squareConfig() !== null)) === 'ready') return { kind: 'square' };
  return paypalPay(db, tenantId);
}
