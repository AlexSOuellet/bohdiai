import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { isFreePlan } from './plan';

/** Whether the site is on Free: a backend with no site (Alex, 2026-10-24). */
export async function isFreeSite(db: SupabaseClient<Database>, tenantId: string): Promise<boolean> {
  const { data, error } = await db.from('tenants').select('plan').eq('id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not load the plan: ${error.message}`);
  return isFreePlan(data?.plan);
}
