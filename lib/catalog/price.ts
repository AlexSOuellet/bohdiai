/**
 * The ONE place a price is worked out (spec piece 1 §4: "every price the app shows
 * or charges comes from a single function"). Today: a combination's own price, else
 * the product's. Standard pricing, promos and bundles later change only this file
 * plus additive data.
 */
export type PricedProduct = { basePriceCents: number };

/** A product with no price yet (a Showcase photo just turned into a product, or a
 *  maker who left the price empty) stores this as its base price. It shows "Ask for
 *  price" and can never be bought — the cart and market sales check hasPrice. */
export const NO_PRICE_CENTS = 0;

export function hasPrice(cents: number): boolean {
  return cents > NO_PRICE_CENTS;
}
export type PricedCombination = { priceCents: number | null };

export function effectivePriceCents(product: PricedProduct, combination?: PricedCombination | null): number {
  return combination?.priceCents ?? product.basePriceCents;
}

/** Lowest and highest price a shopper can pay, over the given (available) combinations. */
export function priceRange(product: PricedProduct, combinations: readonly PricedCombination[]): { min: number; max: number } {
  if (combinations.length === 0) return { min: product.basePriceCents, max: product.basePriceCents };
  const prices = combinations.map((c) => effectivePriceCents(product, c));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
