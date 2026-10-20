'use client';

/**
 * Shoreline's product option picker: one select per option, the chosen
 * combination's price, and (when the shop sells online) "Add to cart" for that
 * combination. A combination that can't be had says so in the site's own words.
 * Class-only (`sl-option*`); the rules live in the shoreline stylesheet.
 */
import { useId, useState, type ReactElement } from 'react';
import type { CatalogVariation, ProductOffer } from '../content';
import { combinationKey } from '@/lib/catalog/combinations';
import { fill } from '@/lib/site-words/words';
import { AddToCartButton } from '@/lib/storefront/CartControls';
import { initialChoices } from '../main-street/ProductOptions';
import type { CardWords } from './words';

type W = CardWords['shoreline'];

export function ShorelineOptions({
  variations,
  offers,
  fallbackPrice,
  listingId,
  W,
}: {
  variations: CatalogVariation[];
  offers: ProductOffer[];
  fallbackPrice: string;
  /** The piece, on a shop that sells online: the chosen combination goes in the cart. */
  listingId?: string | undefined;
  W: W;
}): ReactElement {
  const [choices, setChoices] = useState(() => initialChoices(variations, offers));
  const idBase = useId();
  const match = offers.find((o) => combinationKey(o.choices) === combinationKey(choices));
  const label = (name: string, value: string): string => {
    const offer = offers.find((o) => combinationKey(o.choices) === combinationKey({ ...choices, [name]: value }));
    if (offer === undefined) return fill(W.choiceUnavailable, { value });
    return offer.soldOut ? fill(W.choiceSoldOut, { value }) : value;
  };
  return (
    <div className="sl-options">
      <p className="sl-product-price">{match?.price ?? fallbackPrice}</p>
      {variations
        .filter((v) => v.options.length > 0)
        .map((v, i) => (
          <div key={v.name} className="sl-option">
            <label htmlFor={`${idBase}-opt-${i}`}>{v.name}</label>
            <select id={`${idBase}-opt-${i}`} value={choices[v.name] ?? ''} onChange={(e) => setChoices((c) => ({ ...c, [v.name]: e.target.value }))}>
              {v.options.map((opt) => (
                <option key={opt} value={opt}>
                  {label(v.name, opt)}
                </option>
              ))}
            </select>
          </div>
        ))}
      {listingId !== undefined &&
        (match === undefined || match.soldOut || match.id === undefined ? (
          <p className="sl-option-note">{match === undefined ? W.unavailable : W.soldOut}</p>
        ) : (
          <AddToCartButton key={match.id} listingId={listingId} variantId={match.id} className="sl-btn sl-btn--cart" addLabel={W.cart.add} inCartLabel={W.cart.inCart} fullLabel={W.cart.full} />
        ))}
    </div>
  );
}
