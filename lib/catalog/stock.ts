/**
 * Stock rules (plan 1b decision 5; Alex 2026-10-22). Each product, and each option,
 * says how it is stocked (`stock_kind`):
 *   one_of_a_kind  there is just this one; at 0 it is Sold.
 *   count          a number on hand; at 0 it is Sold out.
 *   made_to_order  she makes it when asked; the number is how many are ready. It is
 *                  never sold out: with none ready (0 or blank) it is Order only.
 * A blank number is made to order whatever the kind (how every product worked before
 * the kinds existed).
 */
export type StockKind = 'one_of_a_kind' | 'count' | 'made_to_order';

export const STOCK_KINDS: readonly StockKind[] = ['one_of_a_kind', 'count', 'made_to_order'];

export function asStockKind(v: unknown): StockKind {
  return (STOCK_KINDS as readonly unknown[]).includes(v) ? (v as StockKind) : 'count';
}

/** The kind as it behaves: a blank number is made to order. */
export function effectiveStockKind(count: number | null, kind: StockKind = 'count'): StockKind {
  return count === null ? 'made_to_order' : kind;
}

export function isStockSoldOut(count: number | null, kind: StockKind = 'count'): boolean {
  return count === 0 && kind !== 'made_to_order';
}

/** Made to order with none ready (Alex, 2026-10-22): it can still be ordered, not
 *  taken home. A blank number is made to order with none counted ready, so it is
 *  Order only too. */
export function isOrderOnly(count: number | null, kind: StockKind = 'count'): boolean {
  return effectiveStockKind(count, kind) === 'made_to_order' && (count === null || count === 0);
}

/** A product is sold out when nothing about it can be bought. `combinations` are the
 *  AVAILABLE ones; a product with options and none available can't be bought either. */
export function isProductSoldOut(input: {
  inventoryCount: number | null;
  stockKind?: StockKind | undefined;
  hasOptions: boolean;
  combinations: readonly { inventoryCount: number | null; stockKind?: StockKind | undefined }[];
}): boolean {
  if (!input.hasOptions) return isStockSoldOut(input.inventoryCount, input.stockKind);
  return input.combinations.every((c) => isStockSoldOut(c.inventoryCount, c.stockKind));
}
