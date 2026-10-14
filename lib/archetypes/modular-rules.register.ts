/**
 * The register behind the modular-rules test (Modular Plan, step 1.3).
 *
 * Nothing is ever written into the code (Alex, 2026-10-14): every word a site
 * shows is the site's own, in `site_words` or its other homes. The lists below
 * are what's still out of place. They can only shrink: a new offender fails the
 * test, and so does a listed one that's been fixed, so the lists stay honest.
 */

/**
 * Page-record content each design still reads (the keys of its content schema
 * beyond `design`). Shrinks to empty as each piece moves to its own home.
 */
export const PAGE_RECORD_READS: Record<string, readonly string[]> = {
  boutique: [],
  card: [],
  contractor: [
    'business', 'hero', 'services', 'work', 'crew', 'reviews', 'area', 'estimate',
    'proof', 'faq', 'notice', 'banner', 'calendar', 'estimator', 'comparison',
  ],
  'main-street': [
    'shopName', 'identity', 'moment', 'goods', 'collections', 'marquee', 'about', 'founder',
    'reviews', 'close', 'contact',
  ],
};

/**
 * Words typed straight into a design or shop page instead of coming from the
 * site's own words: file → the exact words. Shrinks to empty.
 */
export const TYPED_IN_WORDS: Record<string, readonly string[]> = {
};
