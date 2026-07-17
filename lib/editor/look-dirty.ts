/**
 * Editor — is the maker's current try-on different from what's live?
 *
 * "Use this look" is enabled only when this returns true. A change to ANY of the
 * three saved dimensions counts: the skin, the feeling (some skins belong to more
 * than one feeling, so a feeling swap can keep the same skin yet still be a real
 * change — different family layout, wallpaper, and nav), or the Door 2 texture.
 */
import type { StoredTexture } from './texture';

export interface LookSelection {
  skin: string;
  feeling: string;
  texture: StoredTexture;
}

export function isLookDirty(selected: LookSelection, live: LookSelection): boolean {
  return (
    selected.skin !== live.skin ||
    selected.feeling !== live.feeling ||
    selected.texture.mode !== live.texture.mode ||
    selected.texture.opacity !== live.texture.opacity
  );
}
