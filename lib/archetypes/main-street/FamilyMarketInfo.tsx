/**
 * Main Street — a market's information page (Alex, 2026-10-22), in the family's
 * look with the normal menu: when and where, then what she's bringing, each piece
 * opening its own page. No payment ever (the till is the QR page, FamilyMarket).
 * Every word is the site's own (`words.market`, `words.getDirections`). The catalog
 * grid is the shop page's own (.ms-catalog-*); the rest lives in chrome under .ms-mi-*.
 */
import type { ReactElement } from 'react';
import { fill } from '@/lib/site-words/words';
import type { MarketInfoView } from '../content';
import { Media } from './chrome';
import { Type } from './Type';
import type { FamilyWords } from './words';
import { familyMarketDay } from './from-homes';
import { priceLabel } from './price-label';

function directionsUrl(address: string, town: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([address, town].filter((x) => x !== '').join(', '))}`;
}

export function FamilyMarketInfo({ market, words }: { market: MarketInfoView; words: FamilyWords }): ReactElement {
  const M = words.market;
  const facts = [market.town, market.hours, market.booth === '' ? '' : fill(M.booth, { booth: market.booth })].filter((f) => f !== '');
  const over = market.state === 'after' || market.state === 'canceled';
  return (
    <section data-ms-market-info className="ms-wrap ms-page ms-mi">
      <Type as="p" role="day" className="ms-mi-day">
        {familyMarketDay(market, words)}
      </Type>
      <Type as="h1" role="closeHead" className="ms-mi-name">
        {market.name}
      </Type>
      {facts.length > 0 && (
        <Type as="p" role="body" className="ms-mi-facts">
          {facts.join(M.separator)}
        </Type>
      )}
      {(market.address !== '' || market.url !== '') && (
        <p className="ms-mi-links">
          {market.address !== '' && (
            <Type as="a" role="navLabel" className="ms-ev-directions" href={directionsUrl(market.address, market.town)} target="_blank" rel="noopener noreferrer">
              {words.getDirections}
            </Type>
          )}
          {market.url !== '' && (
            <Type as="a" role="navLabel" className="ms-ev-directions" href={market.url} target="_blank" rel="noopener noreferrer">
              {M.website}
            </Type>
          )}
        </p>
      )}
      {over ? (
        <Type as="p" role="body" className="ms-mi-note">
          {market.state === 'after' ? M.after : M.canceled}
        </Type>
      ) : (
        <div className="ms-mi-bringing">
          <Type as="h2" role="title" className="ms-mi-head">
            {M.bringing}
          </Type>
          {market.pieces.length === 0 ? (
            <Type as="p" role="body" className="ms-mi-note">
              {M.soon}
            </Type>
          ) : (
            <div className="ms-catalog-grid">
              {market.pieces.map((p) => {
                const shot = p.media.find((m) => m.kind === 'image') ?? p.media[0];
                return (
                  <a key={p.slug} href={`/listings/${p.slug}`} className="ms-catalog-card">
                    <div className="ms-catalog-media">
                      <Media media={shot ?? { kind: 'image', alt: p.name }} className="ms-piece-photo" />
                      {priceLabel(p, words) !== '' && (
                        <Type as="span" role="price" className="ms-catalog-price">
                          {priceLabel(p, words)}
                        </Type>
                      )}
                    </div>
                    <Type as="h3" role="cardTitle" className="ms-catalog-name">
                      {p.name}
                    </Type>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
      <p className="ms-mi-back">
        <Type as="a" role="navLabel" href="/events" className="ms-ev-directions">
          {M.allMarkets}
        </Type>
      </p>
    </section>
  );
}
