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

  it('procession renders a constellation of scattered product cards', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(3)} skin={skin} treatment="procession" />);
    const cards = container.querySelectorAll('[data-ms-const-card]');
    expect(cards.length).toBe(3);
    // each card is a scattered, positioned link to its listing; position:absolute
    // and per-card placement come from CSS classes + CSS custom properties, never
    // hardcoded inline. Assert the class hook + the CSS var that carries position.
    expect((cards[0] as HTMLAnchorElement).getAttribute('href')).toBe('/listings/p-0');
    expect((cards[0] as HTMLElement).className).toContain('ms-const-card');
    expect((cards[0] as HTMLElement).style.getPropertyValue('--ms-const-x')).toBeTruthy();
  });

  it('sizes the constellation stage from its width via a class-only aspect-ratio', () => {
    // A vh stage height decoupled card height (width-driven) from slot spacing
    // (height-driven), so cards collided on some window shapes. Tying the stage
    // height to its width in the class rule (aspect-ratio) keeps the geometry
    // constant at any viewport. Assert the class hook, not an inline style.
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(5)} skin={skin} treatment="procession" />);
    const stage = container.querySelector('.ms-const-stage') as HTMLElement;
    expect(stage).toBeTruthy();
    expect(stage.getAttribute('style')).toBeNull();
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

  it('module renders a structural composition of product modules linking to listings', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(6)} skin={skin} treatment="module" />);
    const items = container.querySelectorAll('[data-ms-module-item]');
    expect(items.length).toBe(6);
    expect((items[0] as HTMLAnchorElement).getAttribute('href')).toBe('/listings/p-0');
  });

  it('table renders products as objects on a surface, each linking to its listing', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(5)} skin={skin} treatment="table" />);
    const items = container.querySelectorAll('[data-ms-table-item]');
    expect(items.length).toBe(5);
    expect((items[0] as HTMLAnchorElement).getAttribute('href')).toBe('/listings/p-0');
  });

  it('index renders a type-led list of rows linking to listings', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(6)} skin={skin} treatment="index" />);
    const rows = container.querySelectorAll('[data-ms-index-row]');
    expect(rows.length).toBe(6);
    expect((rows[0] as HTMLAnchorElement).getAttribute('href')).toBe('/listings/p-0');
  });

  it('lookbook renders alternating spreads, one per product, linking to listings', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(4)} skin={skin} treatment="lookbook" />);
    const rows = container.querySelectorAll('[data-ms-lookbook-row]');
    expect(rows.length).toBe(4);
    expect((rows[0] as HTMLAnchorElement).getAttribute('href')).toBe('/listings/p-0');
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

describe('GoodsBeat — Bohdi-authored treatment', () => {
  it('wears the treatment authored in goods.treatment', () => {
    const { container } = render(
      <GoodsBeat goods={{ title: 'From the bench', treatment: 'slideshow' }} products={makeProducts(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('.ms-slide-layer').length).toBe(3);
  });

  it('an explicit prop overrides the authored treatment (previews)', () => {
    const { container } = render(
      <GoodsBeat goods={{ title: 'From the bench', treatment: 'slideshow' }} products={makeProducts(3)} skin={skin} treatment="switcher" />,
    );
    expect(container.querySelectorAll('[data-ms-switch-row]').length).toBe(3);
  });

  it('renders a prominent bottom view-all CTA', () => {
    const { container } = render(
      <GoodsBeat goods={{ title: 'From the bench', treatment: 'procession' }} products={makeProducts(3)} skin={skin} shopHref="/shop" />,
    );
    const cta = container.querySelector('.ms-viewall-cta') as HTMLAnchorElement | null;
    expect(cta).toBeTruthy();
    expect(cta?.getAttribute('href')).toBe('/shop');
  });

  it('fills a thin marquee so it does not read sparse', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(3)} skin={skin} treatment="marquee" />);
    // 3 products repeated to the floor (10), then doubled for the loop.
    expect(container.querySelectorAll('[data-ms-card]').length).toBeGreaterThanOrEqual(20);
  });
});

describe('GoodsBeat — selected treatment (legacy fallback)', () => {
  it('selects the marquee for a deep catalog', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(14)} skin={skin} />);
    expect(container.querySelectorAll('[data-ms-card]').length).toBeGreaterThan(0);
  });

  it('selects the switcher for a small catalog — purely by size, never mood', () => {
    const { container } = render(<GoodsBeat goods={goods} products={makeProducts(3)} skin={skin} />);
    expect(container.querySelectorAll('[data-ms-switch-row]').length).toBe(3);
  });
});
