import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CollectionsCrates } from './CollectionsCrates';
import { MAIN_STREET_SKINS } from './skins';
import type { CollectionView } from './collections';

const skin = MAIN_STREET_SKINS['main-street-tannery'] ?? MAIN_STREET_SKINS['main-street-ember']!;
const section = { title: 'By the crate', label: 'Collections' };

function makeCollections(n: number): CollectionView[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `c-${i}`,
    name: `Collection ${i}`,
    count: i + 1,
    cover: { kind: 'image' as const, url: '/x.webp', alt: `Collection ${i}` },
  }));
}

afterEach(cleanup);

describe('CollectionsCrates', () => {
  it('renders one crate per collection, each a link to its collection page', () => {
    const { container } = render(<CollectionsCrates section={section} items={makeCollections(3)} skin={skin} />);
    const items = container.querySelectorAll('[data-ms-coll-item]');
    expect(items.length).toBe(3);
    items.forEach((el, i) => {
      expect((el as HTMLAnchorElement).getAttribute('href')).toBe(`/collections/c-${i}`);
    });
  });

  it('shows each collection name', () => {
    const { container } = render(<CollectionsCrates section={section} items={makeCollections(3)} skin={skin} />);
    expect(container.textContent).toContain('Collection 0');
    expect(container.textContent).toContain('Collection 2');
  });

  it('renders text through named type roles', () => {
    const { container } = render(<CollectionsCrates section={section} items={makeCollections(3)} skin={skin} />);
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('makes the first crate tall and the rest standard', () => {
    const { container } = render(<CollectionsCrates section={section} items={makeCollections(3)} skin={skin} />);
    const items = container.querySelectorAll('[data-ms-coll-item]');
    expect((items[0] as HTMLElement).classList.contains('ms-crate-item--tall')).toBe(true);
    expect((items[1] as HTMLElement).classList.contains('ms-crate-item--tall')).toBe(false);
  });

  it('uses classes, not inline style objects, on its crates', () => {
    const { container } = render(<CollectionsCrates section={section} items={makeCollections(4)} skin={skin} />);
    container.querySelectorAll('[data-ms-coll-item]').forEach((el) => {
      expect((el as HTMLElement).getAttribute('style')).toBeFalsy();
    });
  });
});
