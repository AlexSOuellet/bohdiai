'use server';

// Editor look actions. Everything the maker changes writes to the STAGED draft
// (never live): stageLook writes the look into the draft, publishStore promotes
// it, resetStore discards it. Ownership is enforced via getCurrentShop before any
// write. Spec: Editor-Make-It-Yours-Design.md Part 1.

import { revalidatePath } from 'next/cache';
import { getCurrentShop } from '@/lib/dashboard/current-shop';
import { applyLookToEnvelope } from '@/lib/editor/apply-look';
import { isKnownSkin } from '@/lib/editor/look-shelf';
import { normaliseTexture, type StoredTexture } from '@/lib/editor/texture';
import { MOODS, type MoodKey } from '@/lib/moods';
import { readDraftTree, stageDraftTree, publishDraft, resetDraft } from '@/lib/editor/draft';
import { loadHomeEnvelope } from '@/lib/storefront/load-envelope';
import { logger } from '@/lib/logger';

export type ActionResult = { ok: true } | { ok: false; error: string };

function isMoodKey(value: string): value is MoodKey {
  return Object.prototype.hasOwnProperty.call(MOODS, value);
}

/** Stage a look change (feeling/skin/texture) onto the draft. Seeds the draft
 *  from the live envelope on first edit, else builds on the existing draft, so a
 *  maker stacking several changes accumulates them. The look lives on the
 *  envelope root, so we stage a full layout_tree ({ root }). Never touches live. */
export async function stageLook(skinKey: string, moodKey: string, texture?: StoredTexture): Promise<ActionResult> {
  if (!isKnownSkin(skinKey)) return { ok: false, error: 'Unknown look.' };
  if (!isMoodKey(moodKey)) return { ok: false, error: 'Unknown feeling.' };
  // Texture crosses the client boundary — clamp/normalise before it touches the envelope.
  const cleanTexture = texture !== undefined ? normaliseTexture(texture) : undefined;

  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to update.' };

  // Start from the current draft if there is one, else seed from the live envelope.
  const draftTree = await readDraftTree(shop.tenantId);
  let baseTree: Record<string, unknown>;
  if (draftTree !== null) {
    baseTree = draftTree;
  } else {
    const live = await loadHomeEnvelope(shop.tenantId);
    if (live === null) return { ok: false, error: 'Could not load your store.' };
    baseTree = { root: live };
  }

  let next: Record<string, unknown>;
  try {
    ({ next } = applyLookToEnvelope(
      baseTree,
      cleanTexture !== undefined ? { skinKey, moodKey, texture: cleanTexture } : { skinKey, moodKey },
    ));
  } catch (err) {
    logger.warn('stageLook: apply failed', { tenantId: shop.tenantId, err: String(err) });
    return { ok: false, error: 'This store can’t take a new look right now.' };
  }

  const staged = await stageDraftTree(shop.tenantId, next);
  if (!staged.ok) return { ok: false, error: 'Could not save your changes.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Publish the staged draft to the live store (promote + delete the draft). */
export async function publishStore(): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to publish.' };
  const res = await publishDraft(shop.tenantId);
  if (!res.ok) return { ok: false, error: 'Nothing to publish, or the store couldn’t be updated.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}

/** Discard the staged draft — back to what's live. */
export async function resetStore(): Promise<ActionResult> {
  const shop = await getCurrentShop();
  if (shop === null) return { ok: false, error: 'No store to reset.' };
  const res = await resetDraft(shop.tenantId);
  if (!res.ok) return { ok: false, error: 'Could not reset.' };
  revalidatePath('/dashboard/website');
  return { ok: true };
}
