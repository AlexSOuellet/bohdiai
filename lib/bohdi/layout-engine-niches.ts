// Single source of truth for which niches Bohdi composes via the layout
// language. Niches NOT in this set still run through Bohdi (when in
// BOHDI_NICHES) using the legacy block-and-tokens path, or through the
// legacy one-shot pipeline if not in BOHDI_NICHES at all.

export const LAYOUT_ENGINE_NICHES = new Set<string>(['candles']);

export function isLayoutEngineNiche(slug: string): boolean {
  return LAYOUT_ENGINE_NICHES.has(slug);
}
