/**
 * MARQUEE — content assembly.
 *
 * The band's phrases are NEVER hardcoded and never a separate authored field —
 * they are assembled from the store's OWN content and data at render, so the
 * marquee stays in sync with the site and costs no extra generation. Two lines,
 * two sources (mirrors the original two-row mockup — a bright brand line over a
 * dim logistics line):
 *
 *  - voice — the brand phrases Bohdi already authored for THIS store: the hero
 *            eyebrow, the goods label, the close sign-off + headline. Real words,
 *            not filler.
 *  - info  — the store's live data: its find-us dates and its collection names.
 *            Assembled from what the store HAS, so it updates itself.
 *
 * The only literals here are punctuation separators (structure, not content).
 * Either line can come back empty (a store with no dates, or no authored label);
 * the band renders whichever lines have content, and nothing when both are empty.
 */
import type { MainStreetContent } from './schemas';
import type { CollectionView } from '../content';

export interface MarqueeLines {
  /** The bright top line — brand voice, from authored copy. */
  voice: string[];
  /** The dim bottom line — live logistics, from store data. */
  info: string[];
}

/** Trim, drop empties, and de-duplicate while preserving order — so the same
 *  phrase authored in two places (e.g. a label that echoes the eyebrow) only
 *  scrolls once. */
function tidy(phrases: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of phrases) {
    const p = raw?.trim();
    if (!p) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/**
 * Assemble the marquee's two lines from the store's own content and collections.
 * Pure — the dispatcher, MainStreet, and tests all share this one rule.
 */
export function buildMarqueeLines(
  content: MainStreetContent,
  collections: readonly CollectionView[] = [],
): MarqueeLines {
  // VOICE — brand phrases the store already holds (authored by Bohdi).
  const voice = tidy([
    content.moment.eyebrow,
    content.goods.label,
    content.close.label,
    content.close.headline,
  ]);

  // INFO — live logistics assembled from the store's real data. Each find-us
  // row becomes "where · day time"; each collection contributes its own name.
  const findRows = content.founder.findUs?.rows ?? [];
  const info = tidy([
    ...findRows.map((r) => `${r.where} · ${r.day} ${r.time}`),
    ...collections.map((c) => c.name),
  ]);

  return { voice, info };
}
