import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GoodsLookbook } from './GoodsLookbook';
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

describe('GoodsLookbook', () => {
  it('renders one spread per product, each a link to its listing', () => {
    const { container } = render(<GoodsLookbook goods={goods} products={makeProducts(4)} skin={skin} />);
    const rows = container.querySelectorAll('[data-ms-lookbook-row]');
    expect(rows.length).toBe(4);
    expect((rows[0] as HTMLAnchorElement).getAttribute('href')).toBe('/listings/p-0');
  });

  it('alternates the layout — every other spread is flipped', () => {
    const { container } = render(<GoodsLookbook goods={goods} products={makeProducts(4)} skin={skin} />);
    const rows = container.querySelectorAll('[data-ms-lookbook-row]');
    // even-indexed (0,2) are normal, odd-indexed (1,3) carry the flip modifier
    expect((rows[1] as HTMLElement).className).toContain('ms-lookbook-row--flip');
    expect((rows[0] as HTMLElement).className).not.toContain('ms-lookbook-row--flip');
  });

  it('shows the name and price for each piece', () => {
    const { container } = render(<GoodsLookbook goods={goods} products={makeProducts(2)} skin={skin} />);
    expect(container.textContent).toContain('Piece 0');
    expect(container.textContent).toContain('$1');
  });

  it('renders text through named type roles', () => {
    const { container } = render(<GoodsLookbook goods={goods} products={makeProducts(2)} skin={skin} />);
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });
});
