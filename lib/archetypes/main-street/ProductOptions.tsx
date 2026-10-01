'use client';

/**
 * The product page's option picker (spec piece 1 §7): one select per option, the
 * chosen combination's price, and a buy button that says Sold out / Not available
 * when it can't be bought. "Add to cart" itself stays unwired until piece 2.
 */
import { useState } from 'react';
import type { CatalogVariation, ProductOffer } from '../content';
import { combinationKey } from '@/lib/catalog/combinations';
import { Type } from './Type';
import { DEFAULT_STRINGS } from './defaults';

export function initialChoices(variations: readonly CatalogVariation[], offers: readonly ProductOffer[]): Record<string, string> {
  const start = offers.find((o) => !o.soldOut) ?? offers[0];
  if (start !== undefined) return { ...start.choices };
  return Object.fromEntries(variations.map((v) => [v.name, v.options[0] ?? '']));
}

export function ProductOptions({
  variations,
  offers,
  fallbackPrice,
}: {
  variations: CatalogVariation[];
  offers: ProductOffer[];
  fallbackPrice: string;
}) {
  const [choices, setChoices] = useState(() => initialChoices(variations, offers));
  const match = offers.find((o) => combinationKey(o.choices) === combinationKey(choices));
  const blocked = match === undefined || match.soldOut;
  const cta = match === undefined ? DEFAULT_STRINGS.productUnavailable : match.soldOut ? DEFAULT_STRINGS.productSoldOut : DEFAULT_STRINGS.productAddToCart;

  return (
    <>
      <Type as="div" role="title" className="ms-product-price">
        {match?.price ?? fallbackPrice}
      </Type>
      {variations.map((v, i) => (
        <div key={v.name} className="ms-product-var">
          <Type as="label" role="eyebrow" className="ms-product-var-lbl" htmlFor={`ms-opt-${i}`}>
            {v.name}
          </Type>
          <select
            id={`ms-opt-${i}`}
            className="ms-product-select"
            value={choices[v.name] ?? ''}
            onChange={(e) => setChoices((c) => ({ ...c, [v.name]: e.target.value }))}
          >
            {v.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="ms-product-buy">
        <Type as="button" role="navLabel" type="button" disabled={blocked} className="ms-product-cta" data-soldout={blocked ? 'true' : 'false'}>
          {cta}
        </Type>
      </div>
    </>
  );
}
