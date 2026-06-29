import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CollectionsBeat } from './CollectionsBeat';
import { MAIN_STREET_SKINS } from './skins';
import type { CollectionView, CollectionsSection, CollectionsTreatment } from './collections';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const section: CollectionsSection = { title: 'Collections' };

function makeItems(n: number): CollectionView[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `c-${i}`,
    name: `Collection ${i}`,
    count: i + 1,
    cover: { kind: 'image' as const, url: '/x.webp', alt: `Collection ${i}` },
  }));
}

/** The root class each treatment stamps, so we can assert which one the
 *  dispatcher chose without depending on a band's internals. */
const ROOT_CLASS: Record<CollectionsTreatment, string> = {
  cupboard: '.ms-cup',
  crates: '.ms-crate',
  portals: '.ms-portal',
  chapters: '.ms-chapter',
  lanes: '.ms-lane-band',
  cascade: '.ms-cascade',
};

afterEach(cleanup);

describe('CollectionsBeat', () => {
  it('renders nothing when the shop has no collections', () => {
    const { container } = render(<CollectionsBeat section={section} items={[]} skin={skin} />);
    expect(container.firstChild).toBeNull();
  });

  it('dispatches to each treatment when forced', () => {
    for (const t of Object.keys(ROOT_CLASS) as CollectionsTreatment[]) {
      const { container } = render(<CollectionsBeat section={section} items={makeItems(3)} skin={skin} treatment={t} />);
      expect(container.querySelector(ROOT_CLASS[t])).toBeTruthy();
      cleanup();
    }
  });

  it('falls back to the documented default with no authored or forced treatment', () => {
    const { container } = render(<CollectionsBeat section={section} items={makeItems(3)} skin={skin} />);
    expect(container.querySelector(ROOT_CLASS.cupboard)).toBeTruthy();
  });

  it("honors the section's authored treatment when no override is given", () => {
    const { container } = render(
      <CollectionsBeat section={{ ...section, treatment: 'cascade' }} items={makeItems(3)} skin={skin} />,
    );
    expect(container.querySelector(ROOT_CLASS.cascade)).toBeTruthy();
  });

  it('samples to the home teaser size', () => {
    const { container } = render(<CollectionsBeat section={section} items={makeItems(6)} skin={skin} treatment="cupboard" />);
    expect(container.querySelectorAll('[data-ms-coll-item]').length).toBe(3);
  });
});
