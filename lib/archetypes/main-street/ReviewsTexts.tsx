/**
 * REVIEWS — the texts (the "real message bubbles" treatment).
 *
 * Testimonials shown as the real messages customers sent: a centered head, then a
 * responsive grid of "threads" — one per testimonial. Each thread is the author's
 * name over a single chat bubble carrying the quote, with an optional location line
 * under the name. A footnote closes the beat: "real messages, shared with permission".
 * Authentic and human — the cheerful default.
 *
 * Skin-agnostic and class-only. The mockup leaned on a second purple accent for
 * alternating bubbles; the real engine has ONE accent, so every bubble is the
 * highlighted one — `--ms-accent` background with `--ms-on-accent` text — and any
 * neutral surface (the name, the footnote) reads from the skin's own `--ms-*` vars.
 * No literal color ever leaves the mockup; type is named roles; the bubble's rounded
 * corners, soft shadow and grid all live in `skinVarsCss` under `.ms-rev-texts-*` —
 * never inline.
 *
 * Testimonials carry no timestamps, so — unlike the mockup's placeholder art — this
 * renders exactly one real bubble per person: no fabricated multi-message threads,
 * emoji, or times.
 */
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import type { ReviewsSection, Testimonial } from './reviews';
import { DEFAULT_STRINGS } from './defaults';

export function ReviewsTexts({
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
    <section id="reviews" className="ms-rev-section ms-rev-texts">
      <div className="ms-wrap">
        <div className="ms-rev-texts-head">
          {section.label && (
            <Type as="span" role="eyebrow" className="ms-rev-texts-eyebrow">
              {section.label}
            </Type>
          )}
          <Type as="h2" role="goodsHead" className="ms-rev-texts-title">
            {section.title}
          </Type>
        </div>
        <div className="ms-rev-texts-threads">
          {items.map((t, i) => (
            <div key={i} data-ms-rev-item="" className="ms-rev-texts-thread">
              <Type as="span" role="legal" className="ms-rev-texts-name">
                {t.author}
              </Type>
              {t.location && (
                <Type as="span" role="legal" className="ms-rev-texts-where">
                  {t.location}
                </Type>
              )}
              <Type as="p" role="body" className="ms-rev-texts-bub">
                {t.quote}
              </Type>
            </div>
          ))}
        </div>
        <Type as="p" role="legal" className="ms-rev-texts-foot">
          {DEFAULT_STRINGS.testimonialsTextsAttribution}
        </Type>
        {viewAll && (
          <a href={viewAll.href} data-ms-rev-viewall="" className="ms-rev-texts-viewall">
            <Type as="span" role="eyebrow">
              {viewAll.label}
            </Type>
          </a>
        )}
      </div>
    </section>
  );
}
