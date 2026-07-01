/**
 * Main Street — the reviews (testimonials) beat treatments.
 *
 * Unlike the six-shape Collections band, reviews are a SMALL SHARED POOL of four
 * treatments (like the four nav registers): a store wears ONE, and families double
 * up. A reviews beat shows the maker's social proof — curated testimonials at
 * launch (verified-purchase reviews are Phase 2). The home shows a HANDFUL; the
 * pool grows to a full page + a nav link as a maker accumulates them.
 *
 *  - rating     — one enormous star rating is the hero: five big stars, the score,
 *                 a customer count, and a few short pulled quotes underneath.
 *                 Credibility at a glance. (Modern default.)
 *  - pull-quote — one voice at a time on the whole stage, cycling: a big editorial
 *                 quotation, attribution, generous air. Weighty and quiet.
 *                 (Dark + Luxury default.)
 *  - guestbook  — testimonials as pinned paper slips scattered on a surface,
 *                 hand-placed and slightly rotated: a warm wall of thank-you notes.
 *                 (Cozy + Rustic default.)
 *  - texts      — testimonials as the real messages customers sent: chat bubbles
 *                 with names and timestamps. Authentic and human. (Cheerful default.)
 *
 * The testimonials are AUTHORED content in the envelope (`content.reviews.items`),
 * seeded at build time like the sample find-us dates (D38) and maker-editable — the
 * maker swaps in real ones. No family→default wiring lives in code yet; that arrives
 * with the family layer. Until then the dispatcher falls back to the documented
 * default below.
 */

/** The four reviews treatments, as a tuple — the single source the schema enum and
 *  the authoring menu both read so they can never drift apart. */
export const REVIEWS_TREATMENTS = ['rating', 'pull-quote', 'guestbook', 'texts'] as const;
export type ReviewsTreatment = (typeof REVIEWS_TREATMENTS)[number];

/** One-line purpose for each treatment, shown to Bohdi so he picks the one that
 *  fits the shop. The SHAPE is the idea; the family's own fonts/imagery fill it. */
export const REVIEWS_TREATMENT_MENU: Record<ReviewsTreatment, string> = {
  rating:
    'one enormous star rating is the hero — five big stars, the score, a customer count, and a few short pulled quotes underneath; credibility at a glance',
  'pull-quote':
    'one voice at a time on the whole stage, cycling — a big editorial quotation, attribution, generous air; weighty and quiet',
  guestbook:
    'testimonials as pinned paper slips scattered on a surface, hand-placed and slightly rotated — a warm wall of thank-you notes',
  texts:
    'testimonials as the real messages customers sent — chat bubbles with names and timestamps; authentic and human',
};

/**
 * The documented fallback treatment for a shop with no authored pick and no family
 * wiring yet. NOT a family default (those live in `Family-Style-Sheets.md` and get
 * wired with the family layer) — just a neutral stand-in so the beat always renders.
 */
export const DEFAULT_REVIEWS_TREATMENT: ReviewsTreatment = 'rating';

/** One testimonial as a renderer sees it. Authored content, not projected from a
 *  table — every shown testimonial is a glowing one (a curated wall), so there is
 *  no per-item rating; the guestbook shows five stars, the aggregate lives in
 *  `summary`. `location` is optional (many makers won't have it). */
export interface Testimonial {
  quote: string;
  author: string;
  location?: string | undefined;
}

/** The aggregate the Rating treatment leads with — an authored score + count so the
 *  wording stays honest and the maker can edit it. Absent → the Rating treatment
 *  shows five stars with the item count as the proof. */
export interface ReviewsSummary {
  /** e.g. "4.9 out of 5". */
  score: string;
  /** e.g. "214 happy customers". */
  count: string;
}

/** The reviews SECTION content — the authored heading + cues + the testimonials
 *  themselves. Mirrors the goods/collections section shape so every treatment reads
 *  one contract; the schema's `reviews` field conforms. */
export interface ReviewsSection {
  title: string;
  /** The treatment this shop wears (a family-level look choice). Absent → the
   *  dispatcher falls back to DEFAULT_REVIEWS_TREATMENT. */
  treatment?: ReviewsTreatment | undefined;
  /** Optional eyebrow over the heading. */
  label?: string | undefined;
  /** Label for the "read all reviews" cue → the (future) Reviews page. */
  viewAllLabel?: string | undefined;
  /** The Rating treatment's aggregate; ignored by the other three. */
  summary?: ReviewsSummary | undefined;
  /** The testimonials. Never empty when the beat renders. */
  items: Testimonial[];
}

/** How many testimonials the home beat shows — a HANDFUL, never the full set (the
 *  full list lives on the future Reviews page). Each treatment slices what its shape
 *  wants from this pool; more than this is trimmed here. */
export const HOME_REVIEWS_SAMPLE = 6;

/** Trim the testimonials to the home handful, preserving order. Pure so the
 *  dispatcher and tests share one rule. */
export function sampleTestimonials(items: readonly Testimonial[]): Testimonial[] {
  return items.slice(0, HOME_REVIEWS_SAMPLE);
}

/**
 * Seed plausible sample testimonials for the ?reviews= preview when a store has no
 * authored reviews — the same non-persisting preview model as the collections and
 * marquee seeds. Never written to the store; only the preview renders them.
 */
export function seedPreviewReviews(): ReviewsSection {
  return {
    title: 'Kind words',
    label: 'Loved by customers',
    summary: { score: '4.9 out of 5', count: '214 happy customers' },
    items: [
      { quote: 'The throw is unreal — one candle scents my whole downstairs. I have bought six now.', author: 'Priya N.' },
      { quote: 'Slow, clean burn and the scent is never fake or sharp. Worth every penny.', author: 'Ben & Aline' },
      { quote: 'Gave three as gifts and immediately regretted not keeping them for myself.', author: 'Marcus T.' },
      { quote: 'It arrived wrapped like a gift I would want to give myself. Then I lit it.', author: 'Dana Reyes', location: 'Providence, RI' },
      { quote: 'This is the only candle I will buy now. Full stop.', author: 'Whitney L.', location: 'Portland, OR' },
      { quote: 'The packaging alone made me gasp. Then I lit it, and I am a lifer.', author: 'Sofia M.', location: 'Brooklyn, NY' },
    ],
  };
}
