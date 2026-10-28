/**
 * Her Customer accounts switch (Full): whether customers can make an account on
 * her site. It also decides whether Customers is on the backend menu.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export async function customerAccountsOn(db: SupabaseClient<Database>, tenantId: string): Promise<boolean> {
  const { data, error } = await db.from('tenants').select('buyer_accounts_on').eq('id', tenantId).single();
  if (error !== null) throw new Error(`Could not read the customer accounts switch: ${error.message}`);
  return data.buyer_accounts_on;
}
