/** What a card shows where the price goes (plan 1b decision 8): the price, "from"
 *  the lowest when combinations differ, or Sold out. One helper for every spot. */
import { fill } from '@/lib/site-words/words';
import type { ProductView } from '../content';
import type { FamilyWords } from './words';

export function priceLabel(p: Pick<ProductView, 'price' | 'status' | 'priceFrom'>, w: FamilyWords): string {
  if (p.status === 'sold_out') return w.productSoldOut;
  return p.priceFrom === true ? fill(w.priceFrom, { price: p.price }) : p.price;
}
