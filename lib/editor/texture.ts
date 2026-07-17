/**
 * Editor Door 2 — the saved texture setting and how it resolves at render time.
 *
 * The picker is deliberately small (D63): a maker keeps the family's own wallpaper
 * or turns it off, and can dial the family wallpaper's strength. That choice is
 * stored on the home envelope's `root.texture` and re-applied on the live site, not
 * just in the editor preview. The per-niche blend shelf was removed; the renderer's
 * blend path is kept for a future curated library but nothing wires it today.
 */

export type TextureMode = 'default' | 'none';

export interface StoredTexture {
  /** 'default' = the family's own wallpaper; 'none' = no texture at all. */
  mode: TextureMode;
  /** Strength override for the family wallpaper (0.05–1). null = the family's own
   *  default strength. Ignored when mode is 'none'. */
  opacity: number | null;
}

const MIN_OPACITY = 0.05;
const MAX_OPACITY = 1;

function clampOpacity(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, value))
    : null;
}

/** Parse a stored `root.texture` value into a typed setting, or null if it's absent
 *  or malformed (legacy stores have no texture field — they fall back to the family
 *  default, same as `{ mode: 'default', opacity: null }`). */
export function readStoredTexture(value: unknown): StoredTexture | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  const mode = o['mode'];
  if (mode !== 'default' && mode !== 'none') return null;
  return { mode, opacity: mode === 'none' ? null : clampOpacity(o['opacity']) };
}

/** Normalise any texture-like input into a clean StoredTexture (used when saving a
 *  maker's picker selection). */
export function normaliseTexture(value: unknown): StoredTexture {
  return readStoredTexture(value) ?? { mode: 'default', opacity: null };
}

export interface TextureRenderParams {
  /** Passed to the renderer as `previewTexture`: 'default' | 'none' | undefined. */
  previewTexture: string | undefined;
  /** Passed to the renderer as `previewTextureOpacity`. */
  previewTextureOpacity: number | undefined;
}

/**
 * Decide the effective texture params for a render. Editor preview params (from the
 * URL) always win; when none are present (a normal live-site visit), the saved
 * `root.texture` applies. A store with neither shows its family default.
 */
export function resolveTextureParams(
  previewTexture: string | undefined,
  previewTextureOpacity: number | undefined,
  storedTextureValue: unknown,
): TextureRenderParams {
  // Any editor preview param present → it fully defines the texture for this render.
  if (previewTexture !== undefined || previewTextureOpacity !== undefined) {
    return { previewTexture, previewTextureOpacity };
  }
  const stored = readStoredTexture(storedTextureValue);
  if (stored === null) return { previewTexture: undefined, previewTextureOpacity: undefined };
  if (stored.mode === 'none') return { previewTexture: 'none', previewTextureOpacity: undefined };
  return { previewTexture: 'default', previewTextureOpacity: stored.opacity ?? undefined };
}
