import { describe, it, expect } from 'vitest';
import { isStockSoldOut, isProductSoldOut } from './stock';

describe('isStockSoldOut', () => {
  it('is sold out only at exactly zero', () => {
    expect(isStockSoldOut(0)).toBe(true);
    expect(isStockSoldOut(3)).toBe(false);
  });
  it('is never sold out when stock is not tracked', () => {
    expect(isStockSoldOut(null)).toBe(false);
  });
});

describe('isProductSoldOut', () => {
  it('uses the product stock when there are no combinations', () => {
    expect(isProductSoldOut({ inventoryCount: 0, hasOptions: false, combinations: [] })).toBe(true);
    expect(isProductSoldOut({ inventoryCount: null, hasOptions: false, combinations: [] })).toBe(false);
  });
  it('is sold out when every available combination is', () => {
    expect(isProductSoldOut({ inventoryCount: null, hasOptions: true, combinations: [{ inventoryCount: 0 }, { inventoryCount: 0 }] })).toBe(true);
    expect(isProductSoldOut({ inventoryCount: null, hasOptions: true, combinations: [{ inventoryCount: 0 }, { inventoryCount: null }] })).toBe(false);
  });
  it('counts a product with options but no available combination as sold out', () => {
    expect(isProductSoldOut({ inventoryCount: 5, hasOptions: true, combinations: [] })).toBe(true);
  });
});
