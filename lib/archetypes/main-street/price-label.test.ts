import { describe, it, expect } from 'vitest';
import { priceLabel } from './price-label';
import { DEFAULT_COUNTS, DEFAULT_STRINGS } from './defaults';

describe('priceLabel', () => {
  it('is the price', () => {
    expect(priceLabel({ price: '$24', status: 'active' })).toBe('$24');
  });
  it('says "from" when combinations differ in price', () => {
    expect(priceLabel({ price: '$24', status: 'active', priceFrom: true })).toBe(DEFAULT_COUNTS.priceFrom('$24'));
    expect(DEFAULT_COUNTS.priceFrom('$24')).toBe('from $24');
  });
  it('says sold out instead of a price', () => {
    expect(priceLabel({ price: '$24', status: 'sold_out', priceFrom: true })).toBe(DEFAULT_STRINGS.productSoldOut);
  });
});
