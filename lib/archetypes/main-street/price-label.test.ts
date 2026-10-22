import { describe, it, expect } from 'vitest';
import { priceLabel } from './price-label';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';

const W = { ...keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX), priceFrom: '<{price}>', productOrderOnly: '{price}|order' };

describe('priceLabel', () => {
  it('is the price', () => {
    expect(priceLabel({ price: '$24', status: 'active' }, W)).toBe('$24');
  });
  it('puts the price in the site\'s "from" word when combinations differ in price', () => {
    expect(priceLabel({ price: '$24', status: 'active', priceFrom: true }, W)).toBe('<$24>');
  });
  it('says the site\'s sold-out word instead of a price', () => {
    expect(priceLabel({ price: '$24', status: 'sold_out', priceFrom: true }, W)).toBe('family.productSoldOut');
  });
  it('says Sold for a one of a kind, and marks made to order with none ready (Alex, 2026-10-22)', () => {
    expect(priceLabel({ price: '$24', status: 'sold_out', oneOfAKind: true }, W)).toBe('family.productSold');
    expect(priceLabel({ price: '$24', status: 'active', orderOnly: true }, W)).toBe('$24|order');
    expect(priceLabel({ price: '$24', status: 'active', priceFrom: true, orderOnly: true }, W)).toBe('<$24>|order');
  });
});
