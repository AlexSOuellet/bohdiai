import 'server-only';
/**
 * The menu's Account link (buyer accounts, Full): its words when the shop's buyer
 * accounts are open, null otherwise. Every design's menu reads it.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { FeatureKey } from '@/lib/backend/features';
import { loadShopWords } from '@/lib/storefront/metadata';

export async function accountNavLabel(db: SupabaseClient<Database>, tenantId: string, features: ReadonlySet<FeatureKey>): Promise<string | null> {
  if (!features.has('buyer_accounts')) return null;
  const { data, error } = await db.from('tenants').select('buyer_accounts_on').eq('id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the buyer accounts switch: ${error.message}`);
  if (data?.buyer_accounts_on !== true) return null;
  return (await loadShopWords(tenantId)).account.nav;
}
