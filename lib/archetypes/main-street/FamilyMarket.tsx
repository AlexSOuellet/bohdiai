/**
 * Main Street — a market's own page (Market POS), in the family's look: the buyer
 * scans the code at her table and buys one of the pieces she brought. No menu and
 * no footer: nothing leads away while they're buying (Alex, 2026-10-12). One
 * "Visit the shop" link shows only when there's nothing to buy (before, after,
 * canceled) or once they're done. The buying steps are shared with every design
 * (lib/storefront/MarketBuyer.tsx); every word is the site's own (`words.market`).
 * Class-only: the rules live in chrome's stylesheet under `.ms-mk-*`.
 */
import type { ReactElement } from 'react';
import type { MarketShopView, ProductView } from '../content';
import { Type } from './Type';
import type { FamilyWords } from './words';
import { familyMarketDay } from './from-homes';
import { FamilyMarketBuyer } from './FamilyMarketBuyer';

function Pieces({ pieces }: { pieces: ProductView[] }): ReactElement {
  return (
    <ul className="ms-mk-grid">
      {pieces.map((p) => {
        const photo = p.media.find((m) => m.kind === 'image' && m.url !== undefined);
        return (
          <li key={p.slug} className="ms-mk-piece">
            <span className="ms-mk-thumb">
              {/* The owner's own upload, already shrunk at upload. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photo?.url !== undefined && <img src={photo.url} alt={photo.alt === '' ? p.name : photo.alt} loading="lazy" />}
            </span>
            <span className="ms-mk-name">{p.name}</span>
            <span className="ms-mk-fee">{p.salePrice ?? p.price}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function FamilyMarket({ shopName, market, words }: { shopName: string; market: MarketShopView; words: FamilyWords }): ReactElement {
  const M = words.market;
  const day = familyMarketDay({ date: market.date, endDate: market.endDate }, words);
  const where = [market.town, market.booth].filter((x) => x !== '').join(M.separator);
  const toShop = (
    <Type as="a" role="navLabel" href="/shop" className="ms-btn">
      {M.toShop}
    </Type>
  );
  return (
    <>
      <header className="ms-mk-bar">
        <Type as="span" role="wordmark">
          {shopName}
        </Type>
      </header>
      <main id="main" className="ms-wrap ms-mk">
        <Type as="h1" role="closeHead" className="ms-mk-head">
          {market.name}
        </Type>
        <Type as="p" role="body" className="ms-mk-when">
          {day}
          {where !== '' && `${M.separator}${where}`}
        </Type>
        {market.state === 'open' &&
          (market.methods.length === 0 ? (
            <Type as="p" role="body" className="ms-mk-lede">
              {M.noPay}
            </Type>
          ) : (
            <div className="ms-mk-buy">
              <FamilyMarketBuyer marketId={market.marketId} pieces={market.pieces} methods={market.methods} w={M} />
            </div>
          ))}
        {market.state === 'before' && (
          <>
            <Type as="p" role="body" className="ms-mk-lede">
              {M.before}
            </Type>
            {market.pieces.length > 0 ? (
              <Pieces pieces={market.pieces} />
            ) : (
              <Type as="p" role="body" className="ms-mk-lede">
                {M.none}
              </Type>
            )}
            <p className="ms-mk-end">{toShop}</p>
          </>
        )}
        {(market.state === 'after' || market.state === 'canceled') && (
          <div className="ms-mk-end">
            <Type as="p" role="body" className="ms-mk-lede">
              {market.state === 'after' ? M.after : M.canceled}
            </Type>
            {toShop}
          </div>
        )}
      </main>
    </>
  );
}
