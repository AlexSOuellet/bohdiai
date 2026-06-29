import { describe, it, expect } from 'vitest';
import {
  COLLECTIONS_TREATMENTS,
  COLLECTIONS_TREATMENT_MENU,
  DEFAULT_COLLECTIONS_TREATMENT,
  HOME_COLLECTIONS_SAMPLE,
  sampleCollections,
  type CollectionView,
} from './collections';

function makeCollections(n: number): CollectionView[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `c-${i}`,
    name: `Collection ${i}`,
    count: i + 1,
    cover: { kind: 'image' as const, url: '/x.webp', alt: `Collection ${i}` },
  }));
}

describe('collections registry', () => {
  it('has the six designed treatments', () => {
    expect([...COLLECTIONS_TREATMENTS]).toEqual(['cupboard', 'crates', 'portals', 'chapters', 'lanes', 'cascade']);
  });

  it('carries a one-line menu entry for every treatment', () => {
    for (const t of COLLECTIONS_TREATMENTS) {
      expect(COLLECTIONS_TREATMENT_MENU[t]).toBeTruthy();
    }
  });

  it('has a default that is a real treatment', () => {
    expect(COLLECTIONS_TREATMENTS).toContain(DEFAULT_COLLECTIONS_TREATMENT);
  });
});

describe('sampleCollections', () => {
  it('trims to the home teaser size, preserving order', () => {
    const sample = sampleCollections(makeCollections(6));
    expect(sample.length).toBe(HOME_COLLECTIONS_SAMPLE);
    expect(sample[0]!.slug).toBe('c-0');
    expect(sample[HOME_COLLECTIONS_SAMPLE - 1]!.slug).toBe(`c-${HOME_COLLECTIONS_SAMPLE - 1}`);
  });

  it('leaves a short set untouched', () => {
    const sample = sampleCollections(makeCollections(2));
    expect(sample.length).toBe(2);
  });
});
