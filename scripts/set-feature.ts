/**
 * Claude's tool for Alex's feature switches until his admin exists.
 *   npx tsx --env-file=.env.local scripts/set-feature.ts <subdomain> <feature> on|off
 *   npx tsx --env-file=.env.local scripts/set-feature.ts <subdomain>            (list)
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { FEATURES, FEATURE_KEYS, isFeatureKey, loadSiteFeatures } from '../lib/backend/features';

async function main(): Promise<void> {
  const [subdomain, feature, state] = process.argv.slice(2);
  if (subdomain === undefined) throw new Error('usage: set-feature.ts <subdomain> [<feature> on|off]');
  const db = createClient<Database>(process.env['SUPABASE_URL']!, process.env['SUPABASE_SERVICE_ROLE_KEY']!);

  const { data: tenant, error } = await db.from('tenants').select('id').eq('subdomain', subdomain).is('deleted_at', null).maybeSingle();
  if (error !== null) throw new Error(error.message);
  if (tenant === null) throw new Error(`No site "${subdomain}"`);

  if (feature !== undefined) {
    if (!isFeatureKey(feature)) throw new Error(`Unknown feature "${feature}". Known: ${FEATURE_KEYS.join(', ')}`);
    if (state !== 'on' && state !== 'off') throw new Error('state must be on or off');
    const { error: upErr } = await db
      .from('tenant_features')
      .upsert({ tenant_id: tenant.id, feature_key: feature, enabled: state === 'on' });
    if (upErr !== null) throw new Error(upErr.message);
  }

  const on = await loadSiteFeatures(db, tenant.id);
  for (const key of FEATURE_KEYS) console.log(`${on.has(key) ? 'ON ' : 'off'}  ${key} — ${FEATURES[key].description}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
