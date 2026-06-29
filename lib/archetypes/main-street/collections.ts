/**
 * Main Street — the collections-beat treatments.
 *
 * The collections beat has SIX bands, one unique SHAPE per family — a collections
 * band shows GROUPS the shopper walks into, never individual products, so none of
 * these rhyme with the eight goods treatments (which show the goods themselves).
 * Which one a shop wears is a family-level look choice (recorded in
 * `Family-Style-Sheets.md`), authored as `collections.treatment` and previewable
 * via `?collections=`. Like goods, the home shows only a SAMPLING — two or three
 * collections as a teaser — and points the shopper at the Collections page.
 *
 *  - cupboard — wide labeled shelves, a paper slip on each (Cozy). Stacked
 *               full-width strips, warm and domestic.
 *  - crates   — stacked wooden crates, names stenciled on the wood (Rustic). An
 *               asymmetric photo grid, one tall beside two.
 *  - portals  — tall lit doorways emerging from shadow (Dark). Vertical columns,
 *               dim with an ember floor-glow.
 *  - chapters — a couture lookbook contents page (Luxury). Roman numerals, gold
 *               hairlines, generous air, one plate per chapter.
 *  - lanes    — full-width candy color bands, a punched circular cover (Cheerful).
 *               Bold, blocky, color-positive.
 *  - cascade  — a diagonal of overlapping covers stepping across the band (Modern).
 *               Image-forward, minimal; not rows, columns, grid, or bands.
 *
 * No family→default-collections wiring lives in code yet — that arrives with the
 * family layer (same as goods / About / Nav). Until then the dispatcher falls back
 * to the documented default below.
 */
import type { CollectionView } from '../content';

export type { CollectionView } from '../content';

/** The six collections treatments, as a tuple — the single source the schema enum
 *  and the authoring menu both read so they can never drift apart. */
export const COLLECTIONS_TREATMENTS = ['cupboard', 'crates', 'portals', 'chapters', 'lanes', 'cascade'] as const;
export type CollectionsTreatment = (typeof COLLECTIONS_TREATMENTS)[number];

/** One-line purpose for each treatment, shown to Bohdi so he picks the one that
 *  fits the shop. The SHAPE is the idea; the family's own fonts/imagery fill it. */
export const COLLECTIONS_TREATMENT_MENU: Record<CollectionsTreatment, string> = {
  cupboard: 'wide labeled shelves stacked down the band, a paper slip on each — warm and domestic, like collections lined up in a cupboard',
  crates: 'stacked wooden crates, names stenciled on the wood — an asymmetric grid, one tall crate beside two; hand-built and weathered',
  portals: 'tall lit doorways emerging from shadow — vertical columns, dim with an ember glow at the floor; moody and a little mysterious',
  chapters: 'a couture lookbook contents page — roman numerals, gold hairlines, generous air, one refined plate per chapter; elegant',
  lanes: 'full-width candy-colored bands with a punched circular cover — bold, blocky, color-positive; the store that smiles back',
  cascade: 'a diagonal of overlapping covers stepping across the band — image-forward and minimal; not rows, columns, or a grid',
};

/**
 * The documented fallback treatment for a shop with no authored pick and no family
 * wiring yet. NOT a family default (those live in `Family-Style-Sheets.md` and get
 * wired with the family layer) — just a neutral stand-in so the beat always renders.
 */
export const DEFAULT_COLLECTIONS_TREATMENT: CollectionsTreatment = 'cupboard';

/** The collections SECTION content — the authored heading + cues (the band data
 *  is the CollectionView[] loaded separately). Mirrors the goods section shape so
 *  every treatment reads one contract; the schema's `collections` field conforms. */
export interface CollectionsSection {
  title: string;
  /** The band this shop wears (a family-level look choice). Absent → the
   *  dispatcher falls back to DEFAULT_COLLECTIONS_TREATMENT. */
  treatment?: CollectionsTreatment | undefined;
  /** Optional eyebrow over the heading. */
  label?: string | undefined;
  /** Label for the "see all collections" cue → the Collections page. */
  viewAllLabel?: string | undefined;
}

/** How many collections the home teaser shows — a SAMPLING, never the full set
 *  (the full list lives on the Collections page). Every band is designed around
 *  two or three; more than that is trimmed here. */
export const HOME_COLLECTIONS_SAMPLE = 3;

/** Trim the collections to the home teaser size, preserving order (the rows arrive
 *  ordered by `position`). Pure so the dispatcher and tests share one rule. */
export function sampleCollections(collections: readonly CollectionView[]): CollectionView[] {
  return collections.slice(0, HOME_COLLECTIONS_SAMPLE);
}
