import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Json } from '@/lib/database.types';

/**
 * The editor's staged draft. Every editing function writes here (never straight to
 * the live store); Publish promotes the draft onto content_pages, Reset deletes it.
 * One draft row per tenant, holding the full home layout_tree ({ root }). Owner-only
 * at the DB layer (RLS); callers gate ownership before invoking these.
 * Spec: Project-Docs/Editor-Make-It-Yours-Design.md (Part 1).
 */

/** Read the tenant's staged layout_tree, or null when there is no draft. */
export async function readDraftTree(tenantId: string): Promise<Record<string, unknown> | null> {
  const { data } = await supabaseAdmin()
    .from('store_drafts')
    .select('layout_tree')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  const tree = data?.layout_tree;
  if (tree === null || tree === undefined || typeof tree !== 'object' || Array.isArray(tree)) return null;
  return tree as Record<string, unknown>;
}

/** Upsert the tenant's draft with a full layout_tree value. */
export async function stageDraftTree(tenantId: string, tree: Record<string, unknown>): Promise<{ ok: boolean }> {
  const { error } = await supabaseAdmin()
    .from('store_drafts')
    .upsert(
      { tenant_id: tenantId, layout_tree: tree as Json, updated_at: new Date().toISOString() },
      { onConflict: 'tenant_id' },
    );
  if (error !== null) {
    logger.error('draft: stage failed', { tenantId, err: error.message });
    return { ok: false };
  }
  return { ok: true };
}

/** Promote the draft onto the live home page and delete the draft. Returns false
 *  when there is no draft to publish or a write fails. Keeps tenants.mood_key in
 *  step with the promoted envelope, mirroring the prior commitLook behaviour. */
export async function publishDraft(tenantId: string): Promise<{ ok: boolean }> {
  const tree = await readDraftTree(tenantId);
  if (tree === null) return { ok: false };

  const db = supabaseAdmin();
  const { data: row, error: readErr } = await db
    .from('content_pages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .maybeSingle();
  if (readErr !== null || row === null) {
    logger.warn('draft: publish — home page not found', { tenantId });
    return { ok: false };
  }

  const { error: writeErr } = await db
    .from('content_pages')
    .update({ layout_tree: tree as Json })
    .eq('id', row.id);
  if (writeErr !== null) {
    logger.error('draft: publish write failed', { tenantId, err: writeErr.message });
    return { ok: false };
  }

  // Keep tenants.mood_key in step with the promoted envelope (as commitLook did).
  const root = tree['root'];
  const mood =
    root !== null && typeof root === 'object' && !Array.isArray(root)
      ? (root as Record<string, unknown>)['mood']
      : undefined;
  if (typeof mood === 'string') {
    const { error: moodErr } = await db.from('tenants').update({ mood_key: mood }).eq('id', tenantId);
    if (moodErr !== null) logger.warn('draft: publish mood sync failed', { tenantId, err: moodErr.message });
  }

  await resetDraft(tenantId); // draft is spent once live
  return { ok: true };
}

/** Discard the draft (Reset → back to live). No-op when there is no draft. */
export async function resetDraft(tenantId: string): Promise<{ ok: boolean }> {
  const { error } = await supabaseAdmin().from('store_drafts').delete().eq('tenant_id', tenantId);
  if (error !== null) {
    logger.error('draft: reset failed', { tenantId, err: error.message });
    return { ok: false };
  }
  return { ok: true };
}
