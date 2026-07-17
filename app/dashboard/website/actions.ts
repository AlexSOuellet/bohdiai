'use server';

// "Use this look" — commit a new feeling/skin onto the maker's live store. Pure
// re-skin: the content envelope keeps every authored field; only the look swaps
// (see lib/editor/apply-look). Ownership is enforced before any write.

import { revalidatePath } from 'next/cache';
import { getCurrentShop } from '@/lib/dashboard/current-shop';
import { applyLookToEnvelope } from '@/lib/editor/apply-look';
import { isKnownSkin } from '@/lib/editor/look-shelf';
import { normaliseTexture, type StoredTexture } from '@/lib/editor/texture';
import { MOODS, type MoodKey } from '@/lib/moods';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Json } from '@/lib/database.types';

export type UseLookResult = { ok: true } | { ok: false; error: string };

function isMoodKey(value: string): value is MoodKey {
  return Object.prototype.hasOwnProperty.call(MOODS, value);
}

// Named commitLook (not useThisLook) so the hooks linter doesn't mistake this
// server action for a React hook on its `use` prefix. The button still says
// "Use this look".
export async function commitLook(skinKey: string, moodKey: string, texture?: StoredTexture): Promise<UseLookResult> {
  if (!isKnownSkin(skinKey)) return { ok: false, error: 'Unknown look.' };
  if (!isMoodKey(moodKey)) return { ok: false, error: 'Unknown feeling.' };
  // Texture crosses the client boundary — clamp/normalise before it touches the envelope.
  const cleanTexture = texture !== undefined ? normaliseTexture(texture) : undefined;

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };

  const db = supabaseAdmin();

  const { data: row, error: readErr } = await db
    .from('content_pages')
    .select('id, layout_tree')
    .eq('tenant_id', shop.tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .maybeSingle();

  if (readErr !== null || row === null) {
    logger.warn('useThisLook: home page not found', { tenantId: shop.tenantId });
    return { ok: false, error: 'Could not load your store.' };
  }

  let next: Record<string, unknown>;
  try {
    ({ next } = applyLookToEnvelope(
      row.layout_tree,
      cleanTexture !== undefined ? { skinKey, moodKey, texture: cleanTexture } : { skinKey, moodKey },
    ));
  } catch (err) {
    logger.warn('useThisLook: apply failed', { tenantId: shop.tenantId, err: String(err) });
    return { ok: false, error: 'This store can’t take a new look right now.' };
  }

  const { error: writeErr } = await db
    .from('content_pages')
    .update({ layout_tree: next as Json })
    .eq('id', row.id);

  if (writeErr !== null) {
    logger.error('useThisLook: write failed', { tenantId: shop.tenantId, err: writeErr.message });
    return { ok: false, error: 'Could not save the new look.' };
  }

  // Keep the tenant's fast-path feeling cache in step with the envelope.
  const { error: moodErr } = await db
    .from('tenants')
    .update({ mood_key: moodKey })
    .eq('id', shop.tenantId);
  if (moodErr !== null) {
    logger.warn('useThisLook: mood_key sync failed', { tenantId: shop.tenantId, err: moodErr.message });
  }

  revalidatePath('/dashboard/website');
  return { ok: true };
}
