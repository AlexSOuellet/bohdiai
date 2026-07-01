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
}: {
  section: ReviewsSection;
  skin: ArchetypeTheme;
  /** Force a treatment (the ?reviews= preview / tests). When omitted the authored
   *  `section.treatment` wins, then the documented default. */
  treatment?: ReviewsTreatment | undefined;
  viewAll?: { href: string; label: string } | undefined;
}) {
  if (section.items.length === 0) return null;
  const chosen = treatment ?? section.treatment ?? DEFAULT_REVIEWS_TREATMENT;
  const sample = sampleTestimonials(section.items);
  const props = { section, items: sample, skin, viewAll };

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
