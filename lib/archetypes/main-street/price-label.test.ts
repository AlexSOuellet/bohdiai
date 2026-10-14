import { describe, it, expect } from 'vitest';
import { priceLabel } from './price-label';
import { keyWords } from '@/lib/site-words/words';
import { FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX } from './words';

const W = { ...keyWords(FAMILY_WORD_SPOTS, FAMILY_WORDS_PREFIX), priceFrom: '<{price}>' };

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
});
