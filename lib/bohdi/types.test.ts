import { describe, it, expect } from 'vitest';
import { emptyAccumulator } from './types';

describe('emptyAccumulator', () => {
  it('returns an accumulator with all-null singles and empty arrays', () => {
    const a = emptyAccumulator();
    expect(a.tokens).toBeNull();
    expect(a.homePage).toBeNull();
    expect(a.shopPageCopy).toBeNull();
    expect(a.contactPageCopy).toBeNull();
    expect(a.aboutPageContent).toBeNull();
    expect(a.heroImageUrl).toBeNull();
    expect(a.aboutImageUrl).toBeNull();
    expect(a.styleSheet).toBeNull();
    expect(a.collections).toEqual([]);
    expect(a.listings).toEqual([]);
    expect(a.subscriptions).toEqual([]);
    expect(a.layoutPages).toEqual([]);
  });

  it('returns a fresh object each call (no shared state)', () => {
    const a = emptyAccumulator();
    const b = emptyAccumulator();
    expect(a).not.toBe(b);
    expect(a.collections).not.toBe(b.collections);
    a.collections.push({ name: 'x', slug: 'x', description: 'x' });
    expect(b.collections).toEqual([]);
  });
});
