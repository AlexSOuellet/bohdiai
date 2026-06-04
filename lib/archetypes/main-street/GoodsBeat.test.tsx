import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GoodsBeat } from './GoodsBeat';
import { MAIN_STREET_SKINS } from './skins';
import type { ProductView } from '../content';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const goods = { title: 'From the bench' };

function makeProducts(n: number): ProductView[] {
  return Array.from({ length: n }, (_, i) => ({
    slug: `p-${i}`,
    name: `Piece ${i}`,
    price: `$${i + 1}`,
    description: '',
    shortDescription: 'a thing',
    status: 'active' as const,
    media: [{ kind: 'image' as const, url: '/x.webp', alt: `Piece ${i}` }],
    variations: [],
  }));
}

afterEach(cleanup);

describe('GoodsBeat — forced treatment', () => {
  it('marquee renders product cards', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(3)} skin={skin} treatment="marquee" />);
    expect(container.querySelectorAll('[data-ms-card]').length).toBeGreaterThan(0);
  });

  it('procession renders full-width rows', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(3)} skin={skin} treatment="procession" />);
    expect(container.querySelectorAll('.ms-proc-row').length).toBe(3);
  });

  it('switcher renders selectable list rows', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(3)} skin={skin} treatment="switcher" />);
    expect(container.querySelectorAll('[data-ms-switch-row]').length).toBe(3);
  });

  it('slideshow renders crossfade layers and slide tabs', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(3)} skin={skin} treatment="slideshow" />);
    expect(container.querySelectorAll('.ms-slide-layer').length).toBe(3);
    expect(container.querySelectorAll('[role="tab"]').length).toBe(3);
  });
});

describe('GoodsBeat — sampling + the view-all cue', () => {
  it('shows only a sampling of a deep catalog, not all of it', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(40)} skin={skin} treatment="marquee" />);
    // marquee samples 10 then duplicates for the loop → at most 20 cards, far fewer than 40.
    expect(container.querySelectorAll('[data-ms-card]').length).toBeLessThanOrEqual(20);
  });

  it('renders a view-all cue pointing at the shop', () => {
    const { container } = render(
      <GoodsBeat goods={goods} products={makeProducts(3)} skin={skin} treatment="switcher" shopHref="/shop" />,
    );
    const cue = container.querySelector('.ms-viewall') as HTMLAnchorElement | null;
    expect(cue).toBeTruthy();
    expect(cue?.getAttribute('href')).toBe('/shop');
    expect(cue?.textContent).toContain('See the full catalog');
  });

  it('uses the maker-authored view-all label when present', () => {
    const { container } = render(
      <GoodsBeat goods={{ title: 'From the bench', viewAllLabel: 'Shop everything' }} products={makeProducts(3)} skin={skin} treatment="switcher" />,
    );
    expect((container.querySelector('.ms-viewall') as HTMLElement).textContent).toContain('Shop everything');
  });
});

describe('GoodsBeat — selected treatment', () => {
  it('selects the marquee for a deep catalog', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(14)} skin={skin} />);
    expect(container.querySelectorAll('[data-ms-card]').length).toBeGreaterThan(0);
  });

  it('selects the switcher for a small default-mood catalog', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(3)} skin={skin} mood="modern" />);
    expect(container.querySelectorAll('[data-ms-switch-row]').length).toBe(3);
  });

  it('selects the slideshow for a small cinematic-mood catalog', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(3)} skin={skin} mood="cozy" />);
    expect(container.querySelectorAll('.ms-slide-layer').length).toBe(3);
  });
});
