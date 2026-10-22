import { describe, it, expect } from 'vitest';
import { asStockKind, effectiveStockKind, isOrderOnly, isProductSoldOut, isStockSoldOut } from './stock';

describe('stock rules (Alex, 2026-10-22)', () => {
  it('sells out a count or a one of a kind at 0, never made to order', () => {
    expect(isStockSoldOut(0)).toBe(true);
    expect(isStockSoldOut(0, 'one_of_a_kind')).toBe(true);
    expect(isStockSoldOut(0, 'made_to_order')).toBe(false);
    expect(isStockSoldOut(null)).toBe(false);
    expect(isStockSoldOut(2, 'count')).toBe(false);
  });

  it('is Order only when made to order has none ready', () => {
    expect(isOrderOnly(0, 'made_to_order')).toBe(true);
    expect(isOrderOnly(1, 'made_to_order')).toBe(false);
    // A blank number is made to order with none counted ready (Alex, 2026-10-22).
    expect(isOrderOnly(null, 'made_to_order')).toBe(true);
    expect(isOrderOnly(null)).toBe(true);
    expect(isOrderOnly(0, 'count')).toBe(false);
    expect(isOrderOnly(0)).toBe(false);
  });

  it('reads an unknown kind as a count, and a blank number as made to order', () => {
    expect(asStockKind('one_of_a_kind')).toBe('one_of_a_kind');
    expect(asStockKind('lots')).toBe('count');
    expect(asStockKind(undefined)).toBe('count');
    expect(effectiveStockKind(null, 'count')).toBe('made_to_order');
    expect(effectiveStockKind(1, 'one_of_a_kind')).toBe('one_of_a_kind');
    expect(effectiveStockKind(3)).toBe('count');
  });

  it('sells out a piece with options only when every choice is sold out', () => {
    expect(isProductSoldOut({ inventoryCount: null, hasOptions: true, combinations: [{ inventoryCount: 0 }, { inventoryCount: 0, stockKind: 'made_to_order' }] })).toBe(false);
    expect(isProductSoldOut({ inventoryCount: null, hasOptions: true, combinations: [{ inventoryCount: 0 }, { inventoryCount: 0, stockKind: 'one_of_a_kind' }] })).toBe(true);
    expect(isProductSoldOut({ inventoryCount: 0, stockKind: 'made_to_order', hasOptions: false, combinations: [] })).toBe(false);
  });
});

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
