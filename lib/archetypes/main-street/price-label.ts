/** What a card shows where the price goes (plan 1b decision 8): the price, "from"
 *  the lowest when combinations differ, Sold out, Sold for a one of a kind, or the
 *  price marked Order only when it's made to order with none ready (Alex,
 *  2026-10-22). One helper for every spot. */
import { fill } from '@/lib/site-words/words';
import type { ProductView } from '../content';
import type { FamilyWords } from './words';

export function priceLabel(p: Pick<ProductView, 'price' | 'status' | 'priceFrom' | 'oneOfAKind' | 'orderOnly'>, w: FamilyWords): string {
  if (p.status === 'sold_out') return p.oneOfAKind === true ? w.productSold : w.productSoldOut;
  const price = p.priceFrom === true ? fill(w.priceFrom, { price: p.price }) : p.price;
  return p.orderOnly === true ? fill(w.productOrderOnly, { price }) : price;
}
