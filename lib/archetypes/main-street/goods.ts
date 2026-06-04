/**
 * Main Street — goods-beat treatment selection.
 *
 * The goods beat has FOUR bodies, all motion-bearing, none of them the banned
 * card grid. Which one a shop wears is SELECTED, never authored and never a
 * maker choice — it falls out of how much the maker actually sells (catalog
 * size), with mood breaking the tie among the small-catalog treatments:
 *
 *  - marquee     — continuous horizontal drift. Wants a deep catalog to feel
 *                  full (twenty things gliding past read rich; four read broke).
 *  - procession  — full-width products that zoom in as you scroll, name beside.
 *                  A mid catalog where each piece deserves its own moment.
 *  - switcher    — one big image, a list of pieces beside it; pointing at a row
 *                  cross-fades the image. Curated, interactive. Small catalogs.
 *  - slideshow   — one product at a time, auto-advancing on a slow cross-fade
 *                  with a gentle drift. Cinematic, hands-off. Small catalogs.
 *
 * This keeps every Main Street from sharing one shape: the skin changes the
 * world, the treatment changes the bones of the goods beat.
 */

export type GoodsTreatment = 'marquee' | 'procession' | 'switcher' | 'slideshow';

/** Catalog-size thresholds. A deep catalog loops in the marquee; a mid catalog
 *  walks the procession; a small catalog gets one of the two single-piece
 *  treatments. */
const DEEP_MIN = 12;
const MID_MIN = 6;

/** Moods that read as cinematic/atmospheric prefer the passive slideshow; the
 *  crisper, more interactive moods prefer the switcher. Matched case-insensitively
 *  and loosely so a skin's mood lean ("cozy", "dark sunset") still resolves. */
const CINEMATIC = ['dark', 'sunset', 'botanical', 'cozy', 'rustic'];

function isCinematic(mood: string | undefined): boolean {
  if (!mood) return false;
  const m = mood.toLowerCase();
  return CINEMATIC.some((c) => m.includes(c));
}

/**
 * Pick the goods treatment for a shop. Deterministic: same catalog size + mood
 * always yields the same shape, so a render is reproducible.
 *
 * @param productCount how many catalog rows the shop has
 * @param mood the shop's mood lean (optional; only breaks the small-catalog tie)
 */
export function selectGoodsTreatment(productCount: number, mood?: string): GoodsTreatment {
  if (productCount >= DEEP_MIN) return 'marquee';
  if (productCount >= MID_MIN) return 'procession';
  return isCinematic(mood) ? 'slideshow' : 'switcher';
}

/**
 * Main Street's home is a SALES PAGE, not a catalog. The goods beat shows a
 * SAMPLING — a taste — and points the shopper to the Products page for the full
 * catalog. How many it samples is tuned to the treatment: the marquee loops so a
 * fuller sample reads rich, the procession is full-width rows so it stays short.
 */
export const GOODS_SAMPLE_CAP: Record<GoodsTreatment, number> = {
  marquee: 10,
  procession: 4,
  switcher: 6,
  slideshow: 6,
};

/** Take the home-page sampling for a treatment. Selection still runs off the
 *  TRUE catalog size — this only trims what the home page shows. */
export function sampleForTreatment<T>(products: T[], treatment: GoodsTreatment): T[] {
  return products.slice(0, GOODS_SAMPLE_CAP[treatment]);
}
