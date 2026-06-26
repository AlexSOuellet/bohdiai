import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GoodsModule } from './GoodsModule';
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

describe('GoodsModule', () => {
  it('renders one module per product, each a link to its listing', () => {
    const { container } = render(<GoodsModule goods={goods} products={makeProducts(6)} skin={skin} />);
    const items = container.querySelectorAll('[data-ms-module-item]');
    expect(items.length).toBe(6);
    expect((items[0] as HTMLAnchorElement).getAttribute('href')).toBe('/listings/p-0');
  });

  it('shows the name, price and a zero-padded index for each piece', () => {
    const { container } = render(<GoodsModule goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(container.textContent).toContain('Piece 0');
    expect(container.textContent).toContain('$1');
    expect(container.textContent).toContain('01');
    expect(container.textContent).toContain('03');
  });

  it('carries the product count on the stage so the composition can adapt', () => {
    const { container } = render(<GoodsModule goods={goods} products={makeProducts(5)} skin={skin} />);
    const stage = container.querySelector('.ms-module-stage') as HTMLElement;
    expect(stage).toBeTruthy();
    expect(stage.getAttribute('data-count')).toBe('5');
  });

  it('renders text through named type roles, never a bare tag', () => {
    const { container } = render(<GoodsModule goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('uses classes, not inline style objects, on its own elements (no inline rule)', () => {
    const { container } = render(<GoodsModule goods={goods} products={makeProducts(4)} skin={skin} />);
    const stage = container.querySelector('.ms-module-stage') as HTMLElement;
    expect(stage.getAttribute('style')).toBeFalsy();
    container.querySelectorAll('[data-ms-module-item]').forEach((el) => {
      expect((el as HTMLElement).getAttribute('style')).toBeFalsy();
    });
  });
});
