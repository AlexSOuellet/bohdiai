import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isSitePlan, type SitePlan } from './plan';

/** The plan the site is on, or null for a site that has none set. */
export async function loadSitePlan(db: SupabaseClient<Database>, tenantId: string): Promise<SitePlan | null> {
  const { data, error } = await db.from('tenants').select('plan').eq('id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not load your plan: ${error.message}`);
  return isSitePlan(data?.plan) ? data.plan : null;
}
