'use client';

/**
 * Main Street — a swappable HERO variant: COLLAGE.
 *
 * A text column (eyebrow / headline / sub / CTA) beside a cluster of THREE shots.
 * Collage is the one hero whose imagery is its own dedicated stills — generated
 * at build time as `moment.collageShots` (NOT frames of the hero video, NOT the
 * product catalog). Skin-agnostic; class-only. Each shot's position and rotation
 * come from `:nth-child` rules in skinVarsCss — the three shots are structural
 * knobs, not per-tenant values, so they live in CSS.
 *
 * CONTENT GATE / FUNCTIONAL FLOOR: a shot with no resolved url is skipped (no
 * broken image); with no shots at all the cluster doesn't render and the text
 * still stands. Reads the shared "pile" text; does NOT use the Story fading lines
 * or the hero media clip.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Nav, linkHref } from './chrome';
import { Type } from './Type';

const MAX_SHOTS = 3;

export function CollageHero({
  identity,
  moment,
}: {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
}) {
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : '/shop';
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : '/shop';
  const shots = (moment.collageShots ?? []).filter((s) => typeof s.url === 'string' && s.url !== '').slice(0, MAX_SHOTS);
  return (
    <header data-ms-hero="collage" className="ms-collage-hero">
      <div data-ms-hero-nav className="ms-hero-navbar">
        <Nav identity={identity} />
      </div>
      <div className="ms-collage-body">
        <div data-ms-hero-text className="ms-collage-text">
          <Type as="div" role="eyebrow" className="ms-hero-eyebrow">
            {moment.eyebrow}
          </Type>
          <Type as="h1" role="brand" className="ms-hero-brand">
            {moment.brand}
          </Type>
          {moment.sub && (
            <Type as="p" role="body" data-ms-hero-sub className="ms-hero-sub">
              {moment.sub}
            </Type>
          )}
          <div className="ms-hero-actions">
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
        {shots.length > 0 && (
          <div className="ms-collage-cluster" aria-label="A few moments from the shop">
            {shots.map((s, i) => (
              <div key={i} data-ms-collage-shot className="ms-collage-shot">
                <img src={s.url} alt={s.alt} />
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
