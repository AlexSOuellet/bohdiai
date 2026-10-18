/**
 * Main Street — a swappable HERO variant: SPLIT.
 *
 * Text on a solid skin panel beside a full-bleed media panel. Unlike the Story
 * hero (MomentHero), the words here sit ON the skin's own surface — not over the
 * media — so they read the skin's real colors and fonts. That is what makes Split
 * look like whatever family wears it: Cozy-Split, Rustic-Split, and Modern-Split
 * are the SAME structure with each family's skin poured in. The renderer names no
 * color and no font (the skin system's trick), so this component is family-agnostic.
 *
 * Class-only: every declaration lives in skinVarsCss under .ms-splithero-*. The
 * `data-media-side` attribute swaps text/media order via CSS, so a media-side
 * change is a data attribute change, not JSX reordering.
 *
 * `mediaSide` is the one structural knob: 'right' (default) or 'left' (the
 * mirror). On a phone the two panels stack into one column.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetView } from './schemas';
import type { FamilyWords } from './words';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';

export function SplitHero({
  identity,
  moment,
  words,
  mediaSide = 'right',
}: {
  identity: MainStreetView['identity'];
  moment: MainStreetView['moment'];
  skin: ArchetypeTheme;
  /** The site's words: the nav's page names and labels. */
  words: FamilyWords;
  /** Which side the media sits on. 'right' (default) puts the text first; 'left'
   *  is the mirror. The only structural variation Split carries. */
  mediaSide?: 'left' | 'right';
}) {
  // No target, no button: never a guessed page (a Showcase site has no shop).
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : undefined;
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : undefined;
  return (
    <header data-ms-hero="split" data-media-side={mediaSide} className="ms-splithero">
      <div data-ms-hero-nav className="ms-splithero-nav">
        <Nav identity={identity} words={words} />
      </div>
      <div data-ms-hero-text className="ms-splithero-text">
        <div className="ms-splithero-inner">
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
      </div>
      <div data-ms-hero-media className="ms-splithero-media">
        <Media media={moment.media} />
      </div>
    </header>
  );
}
