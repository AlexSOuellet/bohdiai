import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CollectionsChapters } from './CollectionsChapters';
import { MAIN_STREET_SKINS } from './skins';
import type { CollectionView, CollectionsSection } from './collections';

const skin = MAIN_STREET_SKINS['main-street-atelier'] ?? MAIN_STREET_SKINS['main-street-ember']!;
const section: CollectionsSection = { title: 'The Lookbook', label: 'Collections' };

function makeCollections(n: number): CollectionView[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `c-${i}`,
    name: `Collection ${i}`,
    count: i + 1,
    cover: { kind: 'image' as const, url: '/x.webp', alt: `Collection ${i}` },
  }));
}

afterEach(cleanup);

describe('CollectionsChapters', () => {
  it('renders one chapter per collection, each a link to its collection page', () => {
    const { container } = render(
      <CollectionsChapters section={section} items={makeCollections(3)} skin={skin} />,
    );
    const items = container.querySelectorAll('[data-ms-coll-item]');
    expect(items.length).toBe(3);
    items.forEach((el, i) => {
      expect((el as HTMLAnchorElement).getAttribute('href')).toBe(`/collections/c-${i}`);
    });
  });

  it('shows each collection name', () => {
    const { container } = render(
      <CollectionsChapters section={section} items={makeCollections(3)} skin={skin} />,
    );
    expect(container.textContent).toContain('Collection 0');
    expect(container.textContent).toContain('Collection 1');
    expect(container.textContent).toContain('Collection 2');
  });

  it('numbers the chapters with roman numerals — first I, third III', () => {
    const { container } = render(
      <CollectionsChapters section={section} items={makeCollections(3)} skin={skin} />,
    );
    const romans = container.querySelectorAll('.ms-chapter-roman');
    expect(romans[0]?.textContent).toBe('I');
    expect(romans[2]?.textContent).toBe('III');
    expect(container.textContent).toContain('III');
  });

  it('renders text through named type roles', () => {
    const { container } = render(
      <CollectionsChapters section={section} items={makeCollections(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('uses classes, not inline style objects, on its chapters', () => {
    const { container } = render(
      <CollectionsChapters section={section} items={makeCollections(3)} skin={skin} />,
    );
    container.querySelectorAll('[data-ms-coll-item]').forEach((el) => {
      expect((el as HTMLElement).getAttribute('style')).toBeFalsy();
    });
  });
});
