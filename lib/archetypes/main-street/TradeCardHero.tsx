/**
 * Main Street — a swappable HERO variant: TRADE CARD (the Vintage family's opening).
 *
 * A Victorian trade card laid on the page: the shop's name inside an ornamental
 * frame (double rule, a scrolled flourish in each corner), the short line above
 * it, a flourish below, the sentence and the buttons. Beside it the opening's
 * photo is pasted in as a die-cut scrap with a scalloped edge, a little turned.
 * The card is the site's own paper and ink (skin vars), so any Vintage skin
 * prints it. Class-only through `.ms-trade-*` (vintage-styles.ts).
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetView } from './schemas';
import type { FamilyWords } from './words';
import { Media, Nav, linkHref } from './chrome';
import { Type } from './Type';
import { CornerFlourish, Flourish } from './Ornament';

export function TradeCardHero({
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
  const ctaHref = moment.ctaTarget ? linkHref(moment.ctaTarget) : '/shop';
  const secondaryHref = moment.secondaryCtaTarget ? linkHref(moment.secondaryCtaTarget) : '/shop';
  const hasPhoto = moment.media.url !== undefined && moment.media.url !== '';
  return (
    <header data-ms-hero="trade-card" className="ms-trade-hero">
      <nav data-ms-hero-nav className="ms-trade-nav">
        <Nav identity={identity} words={words} />
      </nav>
      <div className="ms-wrap ms-trade-stage" data-photo={hasPhoto ? 'true' : 'false'}>
        <div className="ms-trade-card">
          <CornerFlourish className="ms-trade-corner ms-trade-corner--tl" />
          <CornerFlourish className="ms-trade-corner ms-trade-corner--tr" />
          <CornerFlourish className="ms-trade-corner ms-trade-corner--bl" />
          <CornerFlourish className="ms-trade-corner ms-trade-corner--br" />
          <div className="ms-trade-inner">
            {moment.eyebrow && (
              <Type as="div" role="eyebrow" className="ms-trade-eyebrow">
                {moment.eyebrow}
              </Type>
            )}
            <Type as="h1" role="brand" className="ms-trade-brand">
              {moment.brand}
            </Type>
            <Flourish className="ms-trade-flourish" />
            {moment.sub && (
              <Type as="p" role="body" data-ms-hero-sub className="ms-trade-sub">
                {moment.sub}
              </Type>
            )}
            <div className="ms-trade-actions">
              <Type as="a" role="navLabel" href={ctaHref} className="ms-trade-cta">
                {moment.ctaLabel}
              </Type>
              {moment.secondaryCtaLabel && (
                <Type as="a" role="navLabel" href={secondaryHref} className="ms-trade-cta2">
                  {moment.secondaryCtaLabel}
                </Type>
              )}
            </div>
          </div>
        </div>
        {hasPhoto && (
          <div className="ms-trade-scrap" data-ms-hero-media>
            <Media media={moment.media} />
          </div>
        )}
      </div>
    </header>
  );
}
