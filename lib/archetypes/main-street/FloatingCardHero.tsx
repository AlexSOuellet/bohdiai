'use client';

/**
 * Main Street — a swappable HERO variant: FLOATING CARD.
 *
 * Full-bleed media with a solid card floating over it. The nav sits over the
 * media (legible via the skin-agnostic --ms-on-media token + a wash); the card
 * holds the text on the skin's OWN surface, so the words stay readable regardless
 * of the media's luminance and still read as whichever family wears the hero.
 * Class-only through .ms-floating-hero/.ms-float-* in skinVarsCss.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';

export function FloatingCardHero({
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
    <header data-ms-hero="floating-card" className="ms-floating-hero">
      <div data-ms-hero-media>
        <Media media={moment.media} />
      </div>
      <div aria-hidden className="ms-float-wash" />
      <nav data-ms-hero-nav className="ms-hero-navbar">
        <Nav identity={identity} />
      </nav>
      <div className="ms-float-cardwrap">
        <div data-ms-hero-card data-ms-hero-text className="ms-float-card">
          <Type as="div" role="eyebrow" className="ms-float-card-eyebrow">
            {moment.eyebrow}
          </Type>
          <div aria-hidden className="ms-float-card-rule" />
          <Type as="h1" role="brand" className="ms-float-card-brand">
            {moment.brand}
          </Type>
          {moment.sub && (
            <Type as="p" role="body" data-ms-hero-sub className="ms-float-card-sub">
              {moment.sub}
            </Type>
          )}
          <div className="ms-float-card-actions">
            <Type as="a" role="navLabel" href={ctaHref} className="ms-float-card-cta">
              {moment.ctaLabel}
            </Type>
            {moment.secondaryCtaLabel && (
              <Type as="a" role="navLabel" href={secondaryHref} className="ms-float-card-cta2">
                {moment.secondaryCtaLabel}
              </Type>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
