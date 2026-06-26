import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GoodsIndex } from './GoodsIndex';
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

describe('GoodsIndex', () => {
  it('renders one row per product, each a link to its listing', () => {
    const { container } = render(<GoodsIndex goods={goods} products={makeProducts(6)} skin={skin} />);
    const rows = container.querySelectorAll('[data-ms-index-row]');
    expect(rows.length).toBe(6);
    expect((rows[0] as HTMLAnchorElement).getAttribute('href')).toBe('/listings/p-0');
  });

  it('shows a zero-padded index, name and price per row', () => {
    const { container } = render(<GoodsIndex goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(container.textContent).toContain('01');
    expect(container.textContent).toContain('Piece 0');
    expect(container.textContent).toContain('$1');
  });

  it('carries a hover thumbnail image per row (the photo that flicks in)', () => {
    const { container } = render(<GoodsIndex goods={goods} products={makeProducts(4)} skin={skin} />);
    expect(container.querySelectorAll('.ms-index-thumb').length).toBe(4);
  });

  it('renders text through named type roles', () => {
    const { container } = render(<GoodsIndex goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('uses classes, not inline style objects, on its rows', () => {
    const { container } = render(<GoodsIndex goods={goods} products={makeProducts(3)} skin={skin} />);
    container.querySelectorAll('[data-ms-index-row]').forEach((el) => {
      expect((el as HTMLElement).getAttribute('style')).toBeFalsy();
    });
  });
});
