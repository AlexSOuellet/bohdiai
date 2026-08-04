/**
 * MARQUEE — content assembly.
 *
 * The band's phrases are NEVER hardcoded. Two lines, two sources (mirrors the
 * original two-row mockup — a bright brand line over a dim logistics line):
 *
 *  - voice — the brand phrases Bohdi AUTHORS for the marquee at build time
 *            (`content.marquee.voice`). Legacy stores authored before that field
 *            existed fall back to deriving the voice from the store's other
 *            authored copy (hero eyebrow, goods label, close sign-off + headline).
 *  - info  — the store's live data: its find-us dates and its collection names.
 *            Assembled from what the store HAS, so it updates itself. Crucially,
 *            this line draws ONLY from sections the maker has made REAL (the `shown`
 *            set) — a store must never scroll the seeded sample dates the build
 *            stamped on before the maker entered any of their own. Before the maker
 *            enters real dates the info line is simply empty; the voice line still
 *            scrolls.
 *
 * The only literals here are punctuation separators (structure, not content).
 * Either line can come back empty (a store with no dates, or no authored label);
 * the band renders whichever lines have content, and nothing when both are empty.
 */
import type { MainStreetContent } from './schemas';
import type { SectionKey } from './families';
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
 *
 * `shown` is the set of sections the maker has made real (kept or edited). The info
 * line draws find-us dates only when `findUs` is in it, and collection names only
 * when `collections` is in it — so a store never scrolls seeded sample data the
 * maker never entered. Defaults to empty: with no resolution passed, the info line
 * stays empty (the safe, honest default).
 */
export function buildMarqueeLines(
  content: MainStreetContent,
  collections: readonly CollectionView[] = [],
  shown: ReadonlySet<SectionKey> = new Set(),
): MarqueeLines {
  // VOICE — the phrases Bohdi authored for the marquee. Legacy stores (no
  // authored marquee) fall back to deriving the voice from other authored copy.
  const authored = content.marquee?.voice;
  const voice = tidy(
    authored && authored.length > 0
      ? authored
      : [content.moment.eyebrow, content.goods.label, content.close.label, content.close.headline],
  );

  // INFO — live logistics, but ONLY from sections the maker has actually made real.
  // Each find-us row becomes "where · day time"; each collection contributes its name.
  const findRows = shown.has('findUs') ? (content.founder.findUs?.rows ?? []) : [];
  const collectionNames = shown.has('collections') ? collections.map((c) => c.name) : [];
  const info = tidy([
    ...findRows.map((r) => `${r.where} · ${r.day} ${r.time}`),
    ...collectionNames,
  ]);

  return { voice, info };
}
