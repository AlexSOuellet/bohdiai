import { describe, it, expect } from 'vitest';
import {
  CART_COOKIE,
  CART_MAX,
  addToCart,
  cartCookieString,
  cartFromCookieHeader,
  parseCart,
  removeFromCart,
  serializeCart,
} from './cart';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('parseCart', () => {
  it('reads ids in order, dropping junk and repeats', () => {
    expect(parseCart(`${id(1)}.nope.${id(2)}.${id(1)}`)).toEqual([id(1), id(2)]);
  });
  it('is empty for nothing or a broken value', () => {
    expect(parseCart(undefined)).toEqual([]);
    expect(parseCart('')).toEqual([]);
    expect(parseCart('%E0%A4%A')).toEqual([]);
  });
  it('holds at most CART_MAX pieces', () => {
    const many = Array.from({ length: CART_MAX + 5 }, (_, i) => id(i)).join('.');
    expect(parseCart(many)).toHaveLength(CART_MAX);
  });
  it('lowercases ids', () => {
    expect(parseCart(id(3).toUpperCase())).toEqual([id(3)]);
  });
});

describe('add and remove', () => {
  it('adds a piece once', () => {
    expect(addToCart([id(1)], id(2))).toEqual([id(1), id(2)]);
    expect(addToCart([id(1)], id(1))).toEqual([id(1)]);
  });
  it('ignores something that is not an id', () => {
    expect(addToCart([], 'drop table')).toEqual([]);
  });
  it('removes a piece', () => {
    expect(removeFromCart([id(1), id(2)], id(1))).toEqual([id(2)]);
  });
  it('stops at the limit', () => {
    const full = Array.from({ length: CART_MAX }, (_, i) => id(i));
    expect(addToCart(full, id(999))).toHaveLength(CART_MAX);
  });
});

describe('cookie strings', () => {
  it('finds the cart among other cookies', () => {
    expect(cartFromCookieHeader(`a=1; ${CART_COOKIE}=${id(1)}.${id(2)}; b=2`)).toEqual([id(1), id(2)]);
    expect(cartFromCookieHeader('a=1')).toEqual([]);
    expect(cartFromCookieHeader(null)).toEqual([]);
  });
  it('writes a lax first-party cookie, and clears it when empty', () => {
    expect(cartCookieString([id(1)], true)).toBe(`${CART_COOKIE}=${id(1)}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`);
    expect(cartCookieString([], false)).toBe(`${CART_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  });
  it('round-trips', () => {
    expect(parseCart(serializeCart([id(1), id(2)]))).toEqual([id(1), id(2)]);
  });
});
