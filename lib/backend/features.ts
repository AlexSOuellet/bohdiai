/**
 * Per-site feature switches (Maker Backend piece 1, spec §2). Alex decides which
 * features a site has; the client never sees a switch. A site with no row for a
 * key gets the key's default here. Later pieces add their keys to FEATURES.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export const FEATURES = {
  catalog: { default: true, description: 'Products and collections' },
  video: { default: false, description: 'One short video per product (Cloudflare Stream)' },
  digital_products: { default: false, description: 'Products or choices sold as downloadable files' },
  custom_domain_panel: { default: true, description: 'Domain status on the home screen and in settings' },
  profile: { default: false, description: 'About you: the words and contact details on a business card site' },
  gallery: { default: false, description: 'Gallery photos with captions, in the owner’s order' },
} as const satisfies Record<string, { default: boolean; description: string }>;

export type FeatureKey = keyof typeof FEATURES;
export const FEATURE_KEYS = Object.keys(FEATURES) as FeatureKey[];

export function isFeatureKey(value: string): value is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(value);
}

export type FeatureRow = { feature_key: string; enabled: boolean };

/** The set of features on for a site, from its rows plus the code defaults. */
export function resolveFeatures(rows: readonly FeatureRow[]): Set<FeatureKey> {
  const overrides = new Map<FeatureKey, boolean>();
  for (const row of rows) if (isFeatureKey(row.feature_key)) overrides.set(row.feature_key, row.enabled);
  return new Set(FEATURE_KEYS.filter((key) => overrides.get(key) ?? FEATURES[key].default));
}

export async function loadSiteFeatures(db: SupabaseClient<Database>, tenantId: string): Promise<Set<FeatureKey>> {
  const { data, error } = await db.from('tenant_features').select('feature_key, enabled').eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not load site features: ${error.message}`);
  return resolveFeatures((data ?? []) as FeatureRow[]);
}

export function hasFeature(on: ReadonlySet<FeatureKey>, key: FeatureKey): boolean {
  return on.has(key);
}
