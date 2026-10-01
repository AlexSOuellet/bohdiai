/** What a card shows where the price goes (plan 1b decision 8): the price, "from"
 *  the lowest when combinations differ, or Sold out. One helper for every spot. */
import type { ProductView } from '../content';
import { DEFAULT_COUNTS, DEFAULT_STRINGS } from './defaults';

export function priceLabel(p: Pick<ProductView, 'price' | 'status' | 'priceFrom'>): string {
  if (p.status === 'sold_out') return DEFAULT_STRINGS.productSoldOut;
  return p.priceFrom === true ? DEFAULT_COUNTS.priceFrom(p.price) : p.price;
}
