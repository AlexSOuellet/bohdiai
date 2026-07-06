/**
 * REVIEWS — the beat dispatcher.
 *
 * The reviews beat is a SMALL SHARED POOL of four treatments (rating / pull-quote /
 * guestbook / texts) — a store wears ONE, and families double up (like the four nav
 * registers). Which one renders is a family-level look choice authored as
 * `reviews.treatment` (an explicit override wins for previews); the documented
 * default is the fallback until the family layer wires per-family defaults. The home
 * shows only a HANDFUL of testimonials. Renders nothing when the shop has none.
 */
import type { ArchetypeTheme } from '../types';
import {
  type ReviewsSection,
  type ReviewsTreatment,
  DEFAULT_REVIEWS_TREATMENT,
  sampleTestimonials,
} from './reviews';
import { ReviewsRating } from './ReviewsRating';
import { ReviewsPullQuote } from './ReviewsPullQuote';
import { ReviewsGuestbook } from './ReviewsGuestbook';
import { ReviewsTexts } from './ReviewsTexts';

export function ReviewsBeat({
  section,
  skin,
  treatment,
  viewAll,
  full = false,
}: {
  section: ReviewsSection;
  skin: ArchetypeTheme;
  /** Force a treatment (the ?reviews= preview / tests). When omitted the authored
   *  `section.treatment` wins, then the documented default. */
  treatment?: ReviewsTreatment | undefined;
  viewAll?: { href: string; label: string } | undefined;
  /** The Testimonials page wears the SAME treatment as the home teaser, but with
   *  every review (not the home handful) and no "see all" cue. */
  full?: boolean | undefined;
}) {
  if (section.items.length === 0) return null;
  // The family picks the treatment; the caller passes it in. Fallback covers
  // legacy render paths that don't yet thread one.
  const chosen = treatment ?? DEFAULT_REVIEWS_TREATMENT;
  const shown = full ? section.items : sampleTestimonials(section.items);
  const effectiveViewAll = full ? undefined : viewAll;
  const props = { section, items: shown, skin, viewAll: effectiveViewAll };

  switch (chosen) {
    case 'pull-quote':
      return <ReviewsPullQuote {...props} />;
    case 'guestbook':
      return <ReviewsGuestbook {...props} />;
    case 'texts':
      return <ReviewsTexts {...props} />;
    case 'rating':
    default:
      return <ReviewsRating {...props} />;
  }
}
