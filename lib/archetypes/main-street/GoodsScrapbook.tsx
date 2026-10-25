/**
 * GOODS — the scrapbook (the Vintage family's pieces).
 *
 * An album page: each piece's photo is held by four paper photo-corners, pasted
 * a little crooked and in mixed sizes, with a paper tag on a string carrying its
 * name and price. The page reads as something kept, not a shop grid. Each piece
 * opens its own page.
 *
 * Class-only: the sizes and the turns are nth-child rules, the corners and the
 * tag are drawn in CSS (`.ms-scrap-*`, vintage-styles.ts); colors are skin vars.
 */
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetView } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';
import { priceLabel } from './price-label';
import type { FamilyWords } from './words';

export function GoodsScrapbook({
  goods,
  products,
  skin,
  words,
  viewAll,
}: {
  goods: MainStreetView['goods'];
  products: ProductView[];
  skin: ArchetypeTheme;
  /** The site's words. */
  words: FamilyWords;
  viewAll?: GoodsViewAll | undefined;
}) {
  return (
    <section id="goods" className="ms-scrap-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap">
        <ul className="ms-scrap-page">
          {products.map((p) => (
            <li key={p.slug} className="ms-scrap-item">
              <a href={`/listings/${p.slug}`} data-ms-scrap-piece="" className="ms-scrap-link">
                <span className="ms-scrap-photo">
                  <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} className="ms-piece-photo" />
                  <span className="ms-scrap-corner ms-scrap-corner--tl" aria-hidden="true" />
                  <span className="ms-scrap-corner ms-scrap-corner--tr" aria-hidden="true" />
                  <span className="ms-scrap-corner ms-scrap-corner--bl" aria-hidden="true" />
                  <span className="ms-scrap-corner ms-scrap-corner--br" aria-hidden="true" />
                </span>
                <span className="ms-scrap-tag">
                  <Type as="span" role="cardTitle" className="ms-scrap-name">
                    {p.name}
                  </Type>
                  <Type as="span" role="price" className="ms-scrap-price">
                    {priceLabel(p, words)}
                  </Type>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
