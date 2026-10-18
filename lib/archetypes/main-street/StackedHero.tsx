/**
 * Main Street — a swappable HERO variant: STACKED.
 *
 * A horizontal nav bar, a centered text block (eyebrow / headline / sub / CTA),
 * then a full-width media band that fills the rest of the viewport. Like Split,
 * the words sit ON the skin's surface, so the same structure reads as whichever
 * family wears it — the renderer names no color and no font. Stacked is Rustic's
 * default in the family docs; the family's texture-blended band is a SKIN concern
 * (the look layer), not this structure.
 *
 * Class-only: everything through .ms-stackedhero-* classes in skinVarsCss.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetView } from './schemas';
import type { FamilyWords } from './words';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';

export function StackedHero({
  identity,
  moment,
  words,
}: {
  identity: MainStreetView['identity'];
  moment: MainStreetView['moment'];
  skin: ArchetypeTheme;
  /** The site's words: the nav's page names and labels. */
  words: FamilyWords;
}) {
  // No target, no button: never a guessed page (a Showcase site has no shop).
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : undefined;
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : undefined;
  return (
    <header data-ms-hero="stacked" className="ms-stackedhero">
      <div data-ms-hero-nav className="ms-hero-navbar">
        <Nav identity={identity} words={words} />
      </div>
      <div data-ms-hero-text className="ms-stackedhero-stack">
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
        <div className="ms-hero-actions ms-hero-actions--center">
          {ctaHref !== undefined && (
            <Type as="a" role="navLabel" href={ctaHref} className="ms-cta-primary">
              {moment.ctaLabel}
            </Type>
          )}
          {moment.secondaryCtaLabel && secondaryHref !== undefined && (
            <Type as="a" role="navLabel" href={secondaryHref} className="ms-cta-secondary">
              {moment.secondaryCtaLabel}
            </Type>
          )}
        </div>
      </div>
      <div data-ms-hero-media className="ms-stackedhero-media">
        <Media media={moment.media} />
      </div>
    </header>
  );
}
