/**
 * Main Street — a swappable HERO variant: PLAYBILL (the Vintage family's opening).
 *
 * A Victorian music-hall bill printed on the page (Alex's references, 2026-10-15):
 * inside a double-ruled border with scrolled corners, the short line set on an
 * arc across the top, the opening's photo in an oval medallion, the shop's name in
 * big display type with a printed shadow, the sentence on a ribbon banner, then a
 * rule of rosettes and the buttons. Everything centered, everything in the skin's
 * ink and paper. Class-only through `.ms-bill-*` (vintage-styles.ts).
 */
import { useId } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetView } from './schemas';
import type { FamilyWords } from './words';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';
import { CornerFlourish, Flourish, Rosette } from './Ornament';
import { BILL_LONGEST_WORD } from './vintage-styles';

/** How long the arched line is, so the stylesheet can set a longer one smaller to fit the arc. */
export function arcLength(text: string): 's' | 'm' | 'l' | 'xl' {
  if (text.length <= 22) return 's';
  if (text.length <= 32) return 'm';
  if (text.length <= 44) return 'l';
  return 'xl';
}

/** The longest word in the business name, in letters (capped at the longest the
 *  styles size for). The name sets so that word always fits whole, never broken
 *  mid-word on a phone. */
export function longestWord(text: string): number {
  const n = Math.max(0, ...text.split(/\s+/).map((w) => w.length));
  return Math.min(n, BILL_LONGEST_WORD);
}

export function PlaybillHero({
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
  const arcId = `ms-bill-arc-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  // No target, no button: never a guessed page (a Showcase site has no shop).
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : undefined;
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : undefined;
  const hasPhoto = moment.media.url !== undefined && moment.media.url !== '';
  return (
    <header data-ms-hero="playbill" className="ms-bill-hero">
      <nav data-ms-hero-nav className="ms-bill-nav">
        <Nav identity={identity} words={words} />
      </nav>
      <div className="ms-wrap">
        <div className="ms-bill-sheet">
          <CornerFlourish className="ms-bill-corner ms-bill-corner--tl" />
          <CornerFlourish className="ms-bill-corner ms-bill-corner--tr" />
          <CornerFlourish className="ms-bill-corner ms-bill-corner--bl" />
          <CornerFlourish className="ms-bill-corner ms-bill-corner--br" />
          {moment.eyebrow && (
            <Type as="div" role="eyebrow" className="ms-bill-kicker" data-length={arcLength(moment.eyebrow)}>
              {moment.eyebrow}
            </Type>
          )}
          {moment.eyebrow && (
            <svg className="ms-bill-arch" data-length={arcLength(moment.eyebrow)} viewBox="0 0 700 120" role="img" aria-label={moment.eyebrow}>
              <path id={arcId} d="M40 112 Q350 -6 660 112" fill="none" />
              <text data-type="eyebrow" className="ms-bill-arch-text">
                <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                  {moment.eyebrow}
                </textPath>
              </text>
            </svg>
          )}
          {hasPhoto && (
            <div className="ms-bill-medallion" data-ms-hero-media>
              <Media media={moment.media} />
            </div>
          )}
          <Type as="h1" role="brand" className="ms-bill-brand" data-word={longestWord(moment.brand)}>
            {moment.brand}
          </Type>
          {moment.sub && (
            <div className="ms-bill-ribbon">
              <Type as="p" role="body" data-ms-hero-sub className="ms-bill-sub">
                {moment.sub}
              </Type>
            </div>
          )}
          <div className="ms-bill-rule" aria-hidden="true">
            <Rosette className="ms-bill-rosette" />
            <Flourish className="ms-bill-flourish" />
            <Rosette className="ms-bill-rosette" />
          </div>
          <div className="ms-bill-actions">
            {ctaHref !== undefined && (
              <Type as="a" role="navLabel" href={ctaHref} className="ms-bill-cta">
                {moment.ctaLabel}
              </Type>
            )}
            {moment.secondaryCtaLabel && secondaryHref !== undefined && (
              <Type as="a" role="navLabel" href={secondaryHref} className="ms-bill-cta2">
                {moment.secondaryCtaLabel}
              </Type>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
