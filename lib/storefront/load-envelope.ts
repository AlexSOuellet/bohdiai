import 'server-only';
import { cache } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Per-request cached loaders for storefront data — one round-trip per key per
 * request, no matter how many consumers ask (layout JSON-LD, generateMetadata
 * SEO facts, the page component itself, sub-page wrappers).
 *
 * Owns the two tables every storefront page reads:
 *   - `content_pages` (via `loadHomeEnvelope`) — the archetype envelope with
 *     `content`, `lookKey`, `mood`, `catalogSize`, and layout tree.
 *   - `tenants` (via `loadTenantChrome`) — logo URL + brand colors for chrome.
 *
 * Fixes Audit-2026-07-05 #79 (same envelope loaded 3-4× per request). Every
 * caller imports from here instead of hitting Supabase directly.
 */

/** Load the tenant's home ('/') envelope, or null when the tenant has no
 *  published home. Cached per-request. */
export const loadHomeEnvelope = cache(async (tenantId: string): Promise<Record<string, unknown> | null> => {
  const { data } = await supabaseAdmin()
    .from('content_pages')
    .select('layout_tree')
    .eq('tenant_id', tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .maybeSingle();
  const tree = data?.layout_tree;
  if (tree === null || tree === undefined || typeof tree !== 'object' || Array.isArray(tree)) return null;
  const root = (tree as Record<string, unknown>)['root'];
  if (root === null || typeof root !== 'object' || Array.isArray(root)) return null;
  const rootObj = root as Record<string, unknown>;
  return rootObj['kind'] === 'archetype' ? rootObj : null;
});

/** Load the tenant's STAGED (draft) home envelope root, or null when there is no
 *  draft. Same shape and guards as loadHomeEnvelope; reads store_drafts instead of
 *  the published content_pages row. Owner-gated at the call site (preview token). */
export const loadDraftEnvelope = cache(async (tenantId: string): Promise<Record<string, unknown> | null> => {
  const { data } = await supabaseAdmin()
    .from('store_drafts')
    .select('layout_tree')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  const tree = data?.layout_tree;
  if (tree === null || tree === undefined || typeof tree !== 'object' || Array.isArray(tree)) return null;
  const root = (tree as Record<string, unknown>)['root'];
  if (root === null || typeof root !== 'object' || Array.isArray(root)) return null;
  const rootObj = root as Record<string, unknown>;
  return rootObj['kind'] === 'archetype' ? rootObj : null;
});

/** Load the tenant's logo URL + brand colors in a single round-trip. Both are
 *  chrome facts, not authored content. `logoUrl` is undefined when no logo is
 *  stored; `brandColors` is [] when no color analysis has run. Cached per-request. */
export const loadTenantChrome = cache(async (tenantId: string): Promise<{ logoUrl: string | undefined; brandColors: string[]; moodKey: string | undefined }> => {
  const { data } = await supabaseAdmin()
    .from('tenants')
    .select('logo_url, brand_colors, mood_key')
    .eq('id', tenantId)
    .maybeSingle();
  return {
    logoUrl: data?.logo_url ?? undefined,
    brandColors: data?.brand_colors ?? [],
    // The tenant's ORIGINAL mood at onboarding (`tenants.mood_key`). Distinct from
    // any editor preview mood override or draft mood swap — this is the maker's
    // original family. Downstream renderers (e.g. Cheerful's collage source, D73)
    // need this to distinguish native-family vs try-on state.
    moodKey: data?.mood_key ?? undefined,
  };
});
