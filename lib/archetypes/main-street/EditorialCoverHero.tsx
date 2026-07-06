/**
 * Main Street — a swappable HERO variant: EDITORIAL COVER.
 *
 * A magazine-cover composition: full-bleed media, the brand set as a GIANT
 * masthead, with the coverlines (eyebrow / sub / CTA) anchored at the bottom.
 * The text is painted OVER the media, so it uses the skin-agnostic --ms-on-media
 * near-white plus a scrim (never the skin's own fg, whose luminance can't be
 * trusted over an unknown image) — the same legibility rule as the Story hero.
 * The brand's TYPE still comes from the skin's display role, so each family's
 * cover reads as that family. Editorial cover has no family default; it lives in
 * the catalog for the editor.
 *
 * Class-only through .ms-editorial-hero/.ms-cover-* in skinVarsCss. The brand's
 * scoped [data-type="brand"] rule amplifies its size to masthead scale.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';

export function EditorialCoverHero({
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
    <header data-ms-hero="editorial-cover" className="ms-editorial-hero">
      <div data-ms-hero-media>
        <Media media={moment.media} />
      </div>
      <div aria-hidden className="ms-cover-grad" />
      <div className="ms-cover-inner">
        <nav data-ms-hero-nav className="ms-cover-nav">
          <Nav identity={identity} />
        </nav>
        <div className="ms-cover-masthead">
          <Type as="div" role="eyebrow" className="ms-cover-eyebrow">
            {moment.eyebrow}
          </Type>
          <Type as="h1" role="brand" className="ms-cover-brand">
            {moment.brand}
          </Type>
          <div className="ms-cover-rule" />
        </div>
        <div className="ms-cover-coverlines">
          <div aria-hidden className="ms-cover-tick" />
          {moment.sub && (
            <Type as="p" role="body" data-ms-hero-sub className="ms-cover-sub">
              {moment.sub}
            </Type>
          )}
          <div className="ms-cover-actions">
            <Type as="a" role="navLabel" href={ctaHref} className="ms-cover-cta">
              {moment.ctaLabel}
            </Type>
            {moment.secondaryCtaLabel && (
              <Type as="a" role="navLabel" href={secondaryHref} className="ms-cover-cta2">
                {moment.secondaryCtaLabel}
              </Type>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
