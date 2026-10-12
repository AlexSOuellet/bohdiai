import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { SitePlan } from './plan';
import { planFeatureRows } from './plan-features';

/** Put a site on `plan`: store the plan and set every switch the plans decide.
 *  Runs with the service role (the owner never writes switches); callers check
 *  who is allowed first. Hides only — no content is touched. */
export async function applyPlan(
  db: SupabaseClient<Database>,
  tenantId: string,
  plan: SitePlan,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = planFeatureRows(plan).map((r) => ({ tenant_id: tenantId, ...r }));
  const { error: fErr } = await db.from('tenant_features').upsert(rows);
  if (fErr !== null) return { ok: false, error: `switches: ${fErr.message}` };
  const { error: pErr } = await db.from('tenants').update({ plan }).eq('id', tenantId);
  if (pErr !== null) return { ok: false, error: `plan: ${pErr.message}` };
  return { ok: true };
}
