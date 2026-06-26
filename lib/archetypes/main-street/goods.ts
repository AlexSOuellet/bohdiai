/**
 * Main Street — the goods-beat treatments.
 *
 * The goods beat has FIVE bodies, none of them the banned card grid. Four are
 * motion-bearing (marquee / procession / switcher / slideshow); the fifth
 * (module) is deliberately still — a structural composition. Which one a shop
 * wears is BOHDI's choice — he picks it with his
 * look (see the builder's authoring spec), so two shops in one niche can read
 * differently and a tenant can try a different one on later. `selectGoodsTreatment`
 * survives only as a deterministic FALLBACK for content authored before the
 * treatment field existed; catalog size is the only driver (any treatment fits
 * any mood, so mood never picks):
 *
 *  - marquee     — continuous horizontal drift. Wants a deep catalog to feel
 *                  full (twenty things gliding past read rich; four read broke).
 *  - procession  — full-width products that zoom in as you scroll, name beside.
 *                  A mid catalog where each piece deserves its own moment.
 *  - switcher    — one big image, a list of pieces beside it; pointing at a row
 *                  cross-fades the image. Curated, interactive. Small catalogs.
 *  - slideshow   — one product at a time, auto-advancing on a slow cross-fade
 *                  with a gentle drift. Cinematic, hands-off. Small catalogs.
 *  - module      — an asymmetric editorial composition: products as modules on a
 *                  strict grid, index numbers, specs, hairline rules. Still and
 *                  structural — the wow is the composition, not motion. Small/mid.
 *
 * This keeps every Main Street from sharing one shape: the skin changes the
 * world, the treatment changes the bones of the goods beat.
 */

/** The four goods treatments, as a tuple — the single source the schema enum and
 *  the authoring menu both read so they can never drift apart. */
export const GOODS_TREATMENTS = ['marquee', 'procession', 'switcher', 'slideshow', 'module'] as const;
export type GoodsTreatment = (typeof GOODS_TREATMENTS)[number];

/** One-line purpose for each treatment, shown to Bohdi so he picks the one that
 *  fits the shop. Catalog size is a HINT here, never a gate. */
export const GOODS_TREATMENT_MENU: Record<GoodsTreatment, string> = {
  marquee: 'an abundant, continuous horizontal drift of products — reads rich and busy; suits a fuller catalog (small ones are filled by repeating)',
  procession: 'full-width products, one per row, each settling out of a slow zoom as it scrolls in — editorial, each piece gets its moment',
  switcher: 'one big image beside a tight list of pieces; pointing at a row cross-fades the image — curated and interactive',
  slideshow: 'one product at a time, auto-advancing on a slow cross-fade with a gentle drift — cinematic and hands-off',
  module: 'an asymmetric editorial composition — products placed as modules on a strict grid with index numbers, specs, and hairline rules; still and structural, everything visible at once',
};

/** Catalog-size thresholds. A deep catalog loops in the marquee; a mid catalog
 *  walks the procession; a small catalog gets the switcher. */
const DEEP_MIN = 12;
const MID_MIN = 6;

/**
 * Resolve the goods treatment for a shop with no authored pick — the legacy
 * fallback only (new builds carry Bohdi's rolled-and-played treatment). Purely
 * size-based and deterministic; there is NO mood→treatment rule, since any
 * treatment fits any mood.
 *
 * @param productCount how many catalog rows the shop has
 */
export function selectGoodsTreatment(productCount: number): GoodsTreatment {
  if (productCount >= DEEP_MIN) return 'marquee';
  if (productCount >= MID_MIN) return 'procession';
  return 'switcher';
}

/**
 * Main Street's home is a SALES PAGE, not a catalog. The goods beat shows a
 * SAMPLING — a taste — and points the shopper to the Products page for the full
 * catalog. How many it samples is tuned to the treatment: the marquee loops so a
 * fuller sample reads rich, the procession is full-width rows so it stays short.
 */
export const GOODS_SAMPLE_CAP: Record<GoodsTreatment, number> = {
  marquee: 10,
  procession: 5,
  switcher: 6,
  slideshow: 6,
  module: 6,
};

/** Take the home-page sampling for a treatment. Selection still runs off the
 *  TRUE catalog size — this only trims what the home page shows. */
export function sampleForTreatment<T>(products: T[], treatment: GoodsTreatment): T[] {
  return products.slice(0, GOODS_SAMPLE_CAP[treatment]);
}
