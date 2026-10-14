/**
 * GOODS — the lookbook (big alternating spreads).
 *
 * You scroll down through a few generous spreads: image on one side, the words
 * on the other, then flipped, then back. Each piece gets a full editorial moment
 * — big image, big name, price, a line, a "view" cue. Magazine energy; suits a
 * small, curated sampling where every piece deserves the room. Editorial/luxury.
 *
 * Skin-agnostic and class-only: colors are skin vars, type is named roles, the
 * imagery is graded by the skin's own `.archetype-photo` filter. The alternating
 * layout lives in skinVarsCss under `.ms-lookbook-*`; the flip is a modifier
 * class on every other row — no inline styles.
 */
import { priceLabel } from './price-label';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetView } from './schemas';
import { Media } from './chrome';
import { Type } from './Type';
import { GoodsHead, type GoodsViewAll } from './beats';
import { fill } from '@/lib/site-words/words';
import type { FamilyWords } from './words';

export function GoodsLookbook({
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
    <section id="goods" className="ms-lookbook-section">
      <GoodsHead goods={goods} skin={skin} viewAll={viewAll} />
      <div className="ms-wrap ms-lookbook">
        {products.map((p, i) => (
          <a
            key={p.slug}
            href={`/listings/${p.slug}`}
            data-ms-lookbook-row=""
            className={`ms-lookbook-row${i % 2 === 1 ? ' ms-lookbook-row--flip' : ''}`}
          >
            <div className="ms-lookbook-media">
              <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} />
            </div>
            <div className="ms-lookbook-text">
              <Type as="span" role="eyebrow" className="ms-lookbook-eyebrow">
                {fill(words.numberOf, { n: i + 1 })}
              </Type>
              <Type as="h3" role="title" className="ms-lookbook-name">
                {p.name}
              </Type>
              <Type as="span" role="price" className="ms-lookbook-price">
                {priceLabel(p, words)}
              </Type>
              {p.shortDescription && (
                <Type as="p" role="body" className="ms-lookbook-desc">
                  {p.shortDescription}
                </Type>
              )}
              <Type as="span" role="navLabel" className="ms-lookbook-view">
                {words.fallbackViewPiece} &rarr;
              </Type>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
