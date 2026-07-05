'use client';

/**
 * Main Street — a swappable HERO variant: TYPOGRAPHIC.
 *
 * No image. The words carry it: a horizontal nav, then a centered column —
 * eyebrow, a large headline, a thin divider rule, the sub-line, and the CTA.
 * Reads the skin's surface and type roles, so the same structure reads as
 * whichever family wears it. Typographic is Luxury's default in the family docs.
 *
 * Class-only via .ms-typohero-* in skinVarsCss.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Nav, linkHref } from './chrome';
import { Type } from './Type';

export function TypographicHero({
  identity,
  moment,
}: {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
}) {
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : '/shop';
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : '/shop';
  return (
    <header data-ms-hero="typographic" className="ms-typohero">
      <div data-ms-hero-nav className="ms-hero-navbar">
        <Nav identity={identity} />
      </div>
      <div data-ms-hero-text className="ms-typohero-stack">
        <Type as="div" role="eyebrow" className="ms-hero-eyebrow">
          {moment.eyebrow}
        </Type>
        <Type as="h1" role="brand" className="ms-hero-brand">
          {moment.brand}
        </Type>
        <div aria-hidden className="ms-hero-rule" />
        {moment.sub && (
          <Type as="p" role="body" data-ms-hero-sub className="ms-hero-sub">
            {moment.sub}
          </Type>
        )}
        <div className="ms-hero-actions ms-hero-actions--center">
          <Type as="a" role="navLabel" href={ctaHref} className="ms-cta-primary">
            {moment.ctaLabel}
          </Type>
          {moment.secondaryCtaLabel && (
            <Type as="a" role="navLabel" href={secondaryHref} className="ms-cta-secondary">
              {moment.secondaryCtaLabel}
            </Type>
          )}
        </div>
      </div>
    </header>
  );
}
