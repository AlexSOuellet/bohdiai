'use client';

/**
 * REVIEWS — the pull-quote (Dark + Luxury default treatment).
 *
 * One voice at a time on the whole centered stage, cycling: a big decorative
 * opening quotation mark, an optional eyebrow, then one editorial quotation with
 * its attribution, and clickable dots underneath. The testimonials are stacked
 * absolutely on a relative stage and cross-faded — the active figure wears the
 * `on` class (opacity 1), the rest sit at opacity 0 but stay in the DOM so the
 * whole wall is present, not swapped. Weighty and quiet: generous air, editorial
 * italic quote, a hairline rule between the words and the name.
 *
 * Client behaviour mirrors MomentHero: it auto-advances on a slow interval and
 * respects `prefers-reduced-motion` — a reader who asked for stillness gets the
 * first voice, held, with no auto-cycle. A single testimonial renders statically
 * (no dots, no interval). Skin-agnostic and class-only: every look lives in
 * `ms-rev-pq-*` classes reading the skin's own `--ms-*` vars; the italic
 * amplification of the quote is a scoped `[data-type="goodsHead"]` rule in the
 * skin CSS, never inline. Toggling the `on` class is a className change, not a
 * style attribute.
 */
import { useEffect, useState } from 'react';
import type { ArchetypeTheme } from '../types';
import { Type } from './Type';
import type { ReviewsSection, Testimonial } from './reviews';
import { DEFAULT_COUNTS } from './defaults';

/** How long a voice holds before the stage advances (ms). Slow and deliberate,
 *  in the spirit of the hero's pace — long enough to read the quote once. */
const ROTATE_MS = 4200;

/** SSR-safe reduced-motion check. jsdom leaves `matchMedia` undefined, so guard
 *  both the server (no `window`) and environments without the API. */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ReviewsPullQuote({
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
  const [active, setActive] = useState(0);
  const single = items.length <= 1;

  useEffect(() => {
    // Static when there's nothing to cycle or the reader asked for stillness.
    if (single || prefersReducedMotion()) return undefined;
    const t = setInterval(() => {
      setActive((n) => (n + 1) % items.length);
    }, ROTATE_MS);
    return () => clearInterval(t);
  }, [single, items.length]);

  return (
    <section id="reviews" className="ms-rev-section ms-rev-pq">
      <div className="ms-wrap">
        <Type as="span" role="brand" className="ms-rev-pq-mark" aria-hidden>
          {'“'}
        </Type>
        {section.label && (
          <Type as="span" role="eyebrow" className="ms-rev-pq-eyebrow">
            {section.label}
          </Type>
        )}
        <div className="ms-rev-pq-stage">
          {items.map((t, i) => (
            <figure
              key={i}
              data-ms-rev-item=""
              className={i === active ? 'ms-rev-pq-fig on' : 'ms-rev-pq-fig'}
            >
              <Type as="blockquote" role="goodsHead" className="ms-rev-pq-quote">
                {t.quote}
              </Type>
              <span className="ms-rev-pq-rule" aria-hidden />
              <Type as="figcaption" role="cardTitle" className="ms-rev-pq-who">
                {t.author}
              </Type>
              {t.location && (
                <Type as="span" role="legal" className="ms-rev-pq-where">
                  {t.location}
                </Type>
              )}
            </figure>
          ))}
        </div>
        {!single && (
          <div className="ms-rev-pq-dots">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={DEFAULT_COUNTS.showTestimonial(i + 1)}
                className={i === active ? 'ms-rev-pq-dot on' : 'ms-rev-pq-dot'}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        )}
        {viewAll && (
          <Type as="a" role="sig" href={viewAll.href} className="ms-rev-pq-viewall">
            {viewAll.label}
          </Type>
        )}
      </div>
    </section>
  );
}
