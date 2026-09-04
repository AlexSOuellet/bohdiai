/**
 * Main Street — a swappable HERO variant: TYPOGRAPHIC.
 *
 * The words carry it: a horizontal nav, then a centered column — eyebrow, a large
 * headline, a thin divider rule, the sub-line, and the CTA. Reads the skin's surface
 * and type roles, so the same structure reads as whichever family wears it.
 * Typographic is Luxury's default in the family docs.
 *
 * When `moment.media` has a resolved url the hero renders it as a subtle DECORATIVE
 * backdrop behind the type (D73 — Luxury reads the same hero source as the other
 * families, treated quietly rather than as a full image). Stills render as an img,
 * videos render as an autoplay muted loop — both under the same soft surface-color
 * overlay so the type stays clearly readable. No url → no backdrop, clean type-only.
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
  // The backdrop is decorative — an atmospheric layer behind the type. aria-hidden
  // on the container + empty alt so assistive tech doesn't announce it (the type IS
  // the message; the photo/clip is atmosphere).
  const backdropUrl =
    typeof moment.media.url === 'string' && moment.media.url.length > 0 ? moment.media.url : undefined;
  const backdropKind = moment.media.kind === 'video' ? 'video' : 'still';
  return (
    <header data-ms-hero="typographic" className="ms-typohero">
      {backdropUrl && (
        <div data-ms-typohero-backdrop className="ms-typohero-backdrop" aria-hidden="true">
          {backdropKind === 'video' ? (
            <video src={backdropUrl} autoPlay loop muted playsInline />
          ) : (
            <img src={backdropUrl} alt="" />
          )}
        </div>
      )}
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
