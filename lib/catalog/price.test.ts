import { describe, it, expect } from 'vitest';
import { effectivePriceCents, priceRange } from './price';

describe('effectivePriceCents', () => {
  it('is the product price when there is no combination', () => {
    expect(effectivePriceCents({ basePriceCents: 2400 })).toBe(2400);
  });
  it('is the combination price when it has one', () => {
    expect(effectivePriceCents({ basePriceCents: 2400 }, { priceCents: 3000 })).toBe(3000);
  });
  it('falls back to the product price when the combination price is blank', () => {
    expect(effectivePriceCents({ basePriceCents: 2400 }, { priceCents: null })).toBe(2400);
  });
});

describe('priceRange', () => {
  it('is the product price when there are no combinations', () => {
    expect(priceRange({ basePriceCents: 2400 }, [])).toEqual({ min: 2400, max: 2400 });
  });
  it('spans the combinations, using the product price for blanks', () => {
    expect(priceRange({ basePriceCents: 2400 }, [{ priceCents: 3000 }, { priceCents: null }, { priceCents: 1800 }])).toEqual({ min: 1800, max: 3000 });
  });
});
