/**
 * REVIEWS — the rating (the "big star rating" treatment).
 *
 * One enormous five-star row IS the hero, dead-centered, with a drop-shadow that
 * lifts it off the surface. Underneath: the score line ("4.9 out of 5"), a muted
 * customer count ("214 happy customers"), then a small strip of a few short pulled
 * quotes, each with its attribution. Credibility at a glance — the modern default.
 *
 * Skin-agnostic and class-only. There are no photos in this beat, so there are no
 * scrims: every value derives from the skin's own `--ms-*` vars — the stars fill
 * `--ms-accent`, the shadow reads `--ms-shadow`, the count is `--ms-fg-muted`. Type
 * is named roles (eyebrow / goodsHead / body / legal); placement and the shadow all
 * live in `skinVarsCss` under `.ms-rev-rating-*` — never inline.
 *
 * The score + count come from `section.summary` (authored, so the wording stays
 * honest and editable). When a shop has no summary yet, the beat falls back to a
 * plain "5 out of 5" and the item count as the proof, so it always renders.
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import type { ReviewsSection, Testimonial } from './reviews';
import { DEFAULT_COUNTS } from './defaults';

export function ReviewsRating({
  section,
  items,
  skin: _skin,
  viewAll,
}: {
  section: ReviewsSection;
  items: Testimonial[];
  skin: ArchetypeTheme;
  viewAll?: { href: string; label: string } | undefined;
}) {
  const score = section.summary?.score ?? DEFAULT_COUNTS.outOfFive(5);
  const count = section.summary?.count ?? DEFAULT_COUNTS.testimonials(items.length);
  return (
    <section id="reviews" className="ms-rev-section ms-rev-rating">
      <div className="ms-wrap">
        {section.label && (
          <Type as="span" role="eyebrow" className="ms-rev-rating-eyebrow">
            {section.label}
          </Type>
        )}
        <div className="ms-rev-rating-stars" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <svg key={i} className="ms-rev-rating-star" viewBox="0 0 24 24">
              <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 21.2l1.4-6.8L2.2 9l6.9-.7z" />
            </svg>
          ))}
        </div>
        <Type as="p" role="goodsHead" className="ms-rev-rating-score">
          {score}
        </Type>
        <Type as="p" role="legal" className="ms-rev-rating-count">
          {count}
        </Type>
        <div className="ms-rev-rating-quips">
          {items.map((t, i) => (
            <span key={i} data-ms-rev-item="" className="ms-rev-rating-quip">
              <Type as="span" role="body" className="ms-rev-rating-quote">
                {t.quote}
              </Type>
              <Type as="span" role="legal" className="ms-rev-rating-author">
                {t.author}
              </Type>
            </span>
          ))}
        </div>
        {viewAll && (
          <a href={viewAll.href} data-ms-rev-viewall="" className="ms-rev-rating-viewall">
            <Type as="span" role="eyebrow">
              {viewAll.label}
            </Type>
          </a>
        )}
      </div>
    </section>
  );
}
