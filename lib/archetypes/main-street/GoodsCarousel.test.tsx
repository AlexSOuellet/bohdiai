import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GoodsCarousel } from './GoodsCarousel';
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

describe('GoodsCarousel', () => {
  it('renders one rail item per product, each a link to its listing', () => {
    const { container } = render(<GoodsCarousel goods={goods} products={makeProducts(6)} skin={skin} />);
    const items = container.querySelectorAll('[data-ms-carousel-item]');
    expect(items.length).toBe(6);
    expect((items[0] as HTMLAnchorElement).getAttribute('href')).toBe('/listings/p-0');
  });

  it('shows the name and price for each piece', () => {
    const { container } = render(<GoodsCarousel goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(container.textContent).toContain('Piece 0');
    expect(container.textContent).toContain('$1');
  });

  it('exposes prev/next stepping controls', () => {
    const { container } = render(<GoodsCarousel goods={goods} products={makeProducts(6)} skin={skin} />);
    expect(container.querySelector('[data-ms-carousel-prev]')).toBeTruthy();
    expect(container.querySelector('[data-ms-carousel-next]')).toBeTruthy();
  });

  it('renders text through named type roles', () => {
    const { container } = render(<GoodsCarousel goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('uses classes, not inline style objects, on its rail items (no inline rule)', () => {
    const { container } = render(<GoodsCarousel goods={goods} products={makeProducts(4)} skin={skin} />);
    container.querySelectorAll('[data-ms-carousel-item]').forEach((el) => {
      expect((el as HTMLElement).getAttribute('style')).toBeFalsy();
    });
  });
});
