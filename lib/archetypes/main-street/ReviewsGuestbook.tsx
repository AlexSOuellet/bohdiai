/**
 * REVIEWS — the guestbook (Cozy family).
 *
 * Testimonials as pinned paper slips scattered across a surface, hand-placed and
 * slightly rotated: a warm wall of thank-you notes. Each slip wears a round pin at
 * the top, a five-star line, the quote, and a script-voice name — tactile social
 * proof, never a tidy card grid. A reviews beat shows the maker's curated
 * testimonials; the home shows a HANDFUL (the caller already samples them).
 *
 * Skin-agnostic and class-only: the slip is a surface lighter than the band
 * (`color-mix(in srgb, var(--ms-bg) 86%, white)`, the same paper as the cupboard's
 * slip), and the pin, stars, and name all derive from `var(--ms-accent)` — no
 * literal ever leaves the mockup. Type is named roles; the per-slip rotation and
 * vertical offset are `:nth-child` rules in skinVarsCss under `.ms-rev-book-*`,
 * never inline. On hover a slip lifts and straightens; on mobile the scatter
 * collapses to one upright column.
 *
 * (The mockup's Pinyon name is rendered through the `sig` role, the closest
 * existing script voice; the family's own script font lands with the family layer.)
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import type { ReviewsSection, Testimonial } from './reviews';

export function ReviewsGuestbook({
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
  return (
    <section id="reviews" className="ms-rev-section ms-rev-book">
      <div className="ms-wrap">
        <div className="ms-rev-book-head">
          {section.label && (
            <Type as="span" role="eyebrow" className="ms-rev-book-eyebrow">
              {section.label}
            </Type>
          )}
          <Type as="h2" role="goodsHead" className="ms-rev-book-title">
            {section.title}
          </Type>
        </div>
        <div className="ms-rev-book-scatter">
          {items.map((t, i) => (
            <div key={`${t.author}-${i}`} data-ms-rev-item="" className="ms-rev-book-slip">
              <span className="ms-rev-book-pin" aria-hidden="true" />
              <Type as="span" role="legal" className="ms-rev-book-stars">
                ★★★★★
              </Type>
              <Type as="p" role="body" className="ms-rev-book-quote">
                {t.quote}
              </Type>
              <Type as="span" role="sig" className="ms-rev-book-who">
                {t.author}
              </Type>
            </div>
          ))}
        </div>
        {viewAll && (
          <a href={viewAll.href} className="ms-rev-book-all">
            <Type as="span" role="sig">
              {viewAll.label}
            </Type>
          </a>
        )}
      </div>
    </section>
  );
}
