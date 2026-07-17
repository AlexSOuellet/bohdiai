/**
 * Editor — committing a new look ("Use this look").
 *
 * Door 1 changes nothing but the skin. The maker's content envelope (D37) holds
 * the look as `root.lookKey` and the feeling as `root.mood`; this swaps those two
 * and stashes the prior pair on `root.previousLook` so a revert is one write away.
 * Everything else on the envelope — the authored content, the baked accent
 * override, the true catalog size — is preserved byte-for-byte. Pure: it returns
 * the next tree, it does not touch the database.
 */
import { isKnownSkin } from './look-shelf';
import type { MoodKey } from '@/lib/moods';
import type { StoredTexture } from './texture';

export interface LookChange {
  skinKey: string;
  moodKey: MoodKey;
  /** Editor Door 2 texture setting to persist on `root.texture`. Optional — omitted
   *  leaves any existing texture setting untouched (Door 1 changes look only). */
  texture?: StoredTexture;
}

/** What the prior look was, stashed for a one-click revert. */
export interface PriorLook {
  lookKey: string;
  mood: string;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/**
 * Return a new layout tree with the look swapped to `change`. Throws when the
 * tree isn't a Main Street archetype envelope or the skin is unknown — a re-skin
 * must never half-apply onto a malformed or legacy store.
 */
export function applyLookToEnvelope(
  layoutTree: unknown,
  change: LookChange,
): { next: Record<string, unknown>; prior: PriorLook } {
  if (!isKnownSkin(change.skinKey)) {
    throw new Error(`Cannot apply unknown skin "${change.skinKey}"`);
  }

  const tree = asObject(layoutTree);
  const root = tree === null ? null : asObject(tree['root']);
  if (tree === null || root === null || root['kind'] !== 'archetype') {
    throw new Error('Layout tree is not an archetype envelope');
  }

  const prior: PriorLook = {
    lookKey: typeof root['lookKey'] === 'string' ? (root['lookKey'] as string) : '',
    mood: typeof root['mood'] === 'string' ? (root['mood'] as string) : '',
  };

  const nextRoot: Record<string, unknown> = {
    ...root,
    lookKey: change.skinKey,
    mood: change.moodKey,
    previousLook: prior,
  };
  // Door 2 texture, when the caller sends one, rides on the same envelope write.
  if (change.texture !== undefined) {
    nextRoot['texture'] = { mode: change.texture.mode, opacity: change.texture.opacity };
  }

  return { next: { ...tree, root: nextRoot }, prior };
}
