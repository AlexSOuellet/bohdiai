'use client';

/**
 * The product page's option picker (spec piece 1 §7): one select per option, the
 * chosen combination's price, and a buy button that says Sold out / Not available
 * when it can't be bought. "Add to cart" itself stays unwired until piece 2.
 */
import { useId, useState } from 'react';
import type { CatalogVariation, ProductOffer } from '../content';
import { combinationKey } from '@/lib/catalog/combinations';
import { Type } from './Type';
import { fill } from '@/lib/site-words/words';
import type { FamilyWords } from './words';
import { AddToCartButton } from '@/lib/storefront/CartControls';

export function initialChoices(variations: readonly CatalogVariation[], offers: readonly ProductOffer[]): Record<string, string> {
  const start = offers.find((o) => !o.soldOut) ?? offers[0];
  if (start !== undefined) return { ...start.choices };
  // An option with no choices has nothing to pick, so it gets no entry.
  return Object.fromEntries(variations.flatMap((v) => (v.options[0] === undefined ? [] : [[v.name, v.options[0]]])));
}

/** What a choice reads as in its dropdown, given the other current picks: plain when
 *  that combination can be bought, otherwise marked sold out or not available in
 *  the site's words. */
function choiceLabel(offers: readonly ProductOffer[], choices: Record<string, string>, name: string, value: string, w: FamilyWords): string {
  const key = combinationKey({ ...choices, [name]: value });
  const offer = offers.find((o) => combinationKey(o.choices) === key);
  if (offer === undefined) return fill(w.choiceUnavailable, { value });
  return offer.soldOut ? fill(w.choiceSoldOut, { value }) : value;
}

export function ProductOptions({
  variations,
  offers,
  fallbackPrice,
  words,
  askHref,
  listingId,
}: {
  variations: CatalogVariation[];
  offers: ProductOffer[];
  fallbackPrice: string;
  /** The site's words: the buy button and the choice marks. */
  words: FamilyWords;
  /** Set on a shop that doesn't sell online: the buy button becomes "Ask about this" here. */
  askHref?: string | undefined;
  /** The piece, on a shop that sells online: the chosen combination goes in the cart. */
  listingId?: string | undefined;
}) {
  const [choices, setChoices] = useState(() => initialChoices(variations, offers));
  /** Unique per picker, so two on one page never share select ids. */
  const idBase = useId();
  const match = offers.find((o) => combinationKey(o.choices) === combinationKey(choices));
  const blocked = match === undefined || match.soldOut;
  const cta = match === undefined ? words.productUnavailable : match.soldOut ? words.productSoldOut : words.productAddToCart;

  return (
    <>
      <Type as="div" role="title" className="ms-product-price">
        {match?.price ?? fallbackPrice}
      </Type>
      {/* An option with no choices gets no picker. */}
      {variations
        .filter((v) => v.options.length > 0)
        .map((v, i) => (
          <div key={v.name} className="ms-product-var">
            <Type as="label" role="eyebrow" className="ms-product-var-lbl" htmlFor={`${idBase}-opt-${i}`}>
              {v.name}
            </Type>
            <select
              id={`${idBase}-opt-${i}`}
              className="ms-product-select"
              value={choices[v.name] ?? ''}
              onChange={(e) => setChoices((c) => ({ ...c, [v.name]: e.target.value }))}
            >
              {v.options.map((opt) => (
                <option key={opt} value={opt}>
                  {choiceLabel(offers, choices, v.name, opt, words)}
                </option>
              ))}
            </select>
          </div>
        ))}
      <div className="ms-product-buy">
        {askHref === undefined && listingId !== undefined && !blocked && match?.id !== undefined ? (
          <AddToCartButton key={match.id} listingId={listingId} variantId={match.id} className="ms-product-cta" typeRole="navLabel" addLabel={words.productAddToCart} inCartLabel={words.cart.inCart} fullLabel={words.cart.full} />
        ) : askHref === undefined ? (
          <Type as="button" role="navLabel" type="button" disabled={blocked} className="ms-product-cta" data-soldout={blocked ? 'true' : 'false'}>
            {cta}
          </Type>
        ) : (
          <Type as="a" role="navLabel" href={askHref} className="ms-product-cta" data-soldout="false">
            {words.productAskAbout}
          </Type>
        )}
      </div>
    </>
  );
}
