import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GoodsTable } from './GoodsTable';
import { MAIN_STREET_SKINS } from './skins';
import type { ProductView } from '../content';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const goods = { title: 'The Collection' };

function makeProducts(n: number): ProductView[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `p-${i}`,
    name: `Piece ${i}`,
    price: `$${i + 1}`,
    description: '',
    shortDescription: 'a small thing',
    status: 'active' as const,
    media: [{ kind: 'image' as const, url: '/x.webp', alt: `Piece ${i}` }],
    variations: [],
  }));
}

afterEach(cleanup);

describe('GoodsTable', () => {
  it('renders one object per product, each a link to its listing', () => {
    const { container } = render(<GoodsTable goods={goods} products={makeProducts(5)} skin={skin} />);
    const items = container.querySelectorAll('[data-ms-table-item]');
    expect(items.length).toBe(5);
    expect((items[0] as HTMLAnchorElement).getAttribute('href')).toBe('/listings/p-0');
  });

  it('shows the name and price for each object', () => {
    const { container } = render(<GoodsTable goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(container.textContent).toContain('Piece 0');
    expect(container.textContent).toContain('$1');
  });

  it('carries the object count on the surface so the arrangement can adapt', () => {
    const { container } = render(<GoodsTable goods={goods} products={makeProducts(4)} skin={skin} />);
    const stage = container.querySelector('.ms-table-stage') as HTMLElement;
    expect(stage).toBeTruthy();
    expect(stage.getAttribute('data-count')).toBe('4');
  });

  it('renders text through named type roles', () => {
    const { container } = render(<GoodsTable goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('uses classes, not inline style objects, on its objects', () => {
    const { container } = render(<GoodsTable goods={goods} products={makeProducts(4)} skin={skin} />);
    container.querySelectorAll('[data-ms-table-item]').forEach((el) => {
      expect((el as HTMLElement).getAttribute('style')).toBeFalsy();
    });
  });
});
