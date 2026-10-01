/** Stock rules (plan 1b decision 5): blank = made to order, 0 = sold out. */
export function isStockSoldOut(count: number | null): boolean {
  return count === 0;
}

/** A product is sold out when nothing about it can be bought. `combinations` are the
 *  AVAILABLE ones; a product with options and none available can't be bought either. */
export function isProductSoldOut(input: {
  inventoryCount: number | null;
  hasOptions: boolean;
  combinations: readonly { inventoryCount: number | null }[];
}): boolean {
  if (!input.hasOptions) return isStockSoldOut(input.inventoryCount);
  return input.combinations.every((c) => isStockSoldOut(c.inventoryCount));
}
