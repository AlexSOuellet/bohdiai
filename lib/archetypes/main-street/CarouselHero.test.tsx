import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CarouselHero } from './CarouselHero';
import { MAIN_STREET_SKINS } from './skins';
import type { ProductView } from '../content';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const identity = { wordmark: "June's Sourdough", nav: ['Shop', 'About'] };
const moment = {
  media: {
    kind: 'video' as const,
    prompt: { composition: 'a', subject: 'b', environment: 'c', atmosphere: 'd', camera: 'e', lighting: 'f', style: 'g' },
    url: '/clip.mp4',
    alt: 'a loaf',
  },
  story: ['line one', 'line two'],
  eyebrow: 'Baked fresh',
  brand: "June's Sourdough",
  sub: 'Naturally leavened sourdough baked every morning',
  ctaLabel: 'See the loaves',
  ctaTarget: 'shop' as const,
};

function product(slug: string, name: string): ProductView {
  return { slug, name, price: '$8', description: 'a good loaf', status: 'active', media: [{ kind: 'image', url: `/${slug}.jpg`, alt: name }], variations: [] };
}
const products: ProductView[] = [product('sourdough', 'Sourdough'), product('rye', 'Rye'), product('baguette', 'Baguette')];

afterEach(cleanup);

describe('CarouselHero — a rotating lineup of products', () => {
  it('renders the hero with the headline, eyebrow, and sub-line', () => {
    const { container } = render(<CarouselHero identity={identity} moment={moment} skin={skin} products={products} />);
    expect(container.querySelector('[data-ms-hero="carousel"]')).toBeTruthy();
    expect(container.querySelector('[data-type="brand"]')!.textContent).toBe(moment.brand);
    expect(container.querySelector('[data-type="eyebrow"]')!.textContent).toBe(moment.eyebrow);
    expect(container.querySelector('[data-ms-hero-sub]')!.textContent).toBe(moment.sub);
  });

  it('renders one carousel item per product, in order', () => {
    const { container } = render(<CarouselHero identity={identity} moment={moment} skin={skin} products={products} />);
    const items = container.querySelectorAll('[data-ms-carousel-item]');
    expect(items).toHaveLength(3);
    expect(items[0]!.textContent).toContain('Sourdough');
    expect(items[2]!.textContent).toContain('Baguette');
  });

  it('links each carousel item to its product page', () => {
    const { container } = render(<CarouselHero identity={identity} moment={moment} skin={skin} products={products} />);
    const first = container.querySelector('[data-ms-carousel-item]')!;
    expect(first.getAttribute('href')).toBe('/listings/sourdough');
  });

  it('renders gracefully with no products — text stays, no items, never breaks (functional floor)', () => {
    const { container } = render(<CarouselHero identity={identity} moment={moment} skin={skin} products={[]} />);
    expect(container.querySelector('[data-ms-hero="carousel"]')).toBeTruthy();
    expect(container.querySelector('[data-type="brand"]')!.textContent).toBe(moment.brand);
    expect(container.querySelectorAll('[data-ms-carousel-item]')).toHaveLength(0);
  });

  it('omits the sub-line when none is authored', () => {
    const { sub, ...noSub } = moment;
    void sub;
    const { container } = render(<CarouselHero identity={identity} moment={noSub} skin={skin} products={products} />);
    expect(container.querySelector('[data-ms-hero-sub]')).toBeNull();
  });

  it('does NOT render the Story fading lines', () => {
    const { container } = render(<CarouselHero identity={identity} moment={moment} skin={skin} products={products} />);
    expect(container.querySelector('[data-ms-hero-story-line]')).toBeNull();
  });

  it('points the primary CTA at the authored target page', () => {
    const { container } = render(<CarouselHero identity={identity} moment={moment} skin={skin} products={products} />);
    const ctaLink = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === moment.ctaLabel)!;
    expect(ctaLink.getAttribute('href')).toBe('/shop');
  });

  it('lays the nav out as a horizontal bar', () => {
    const { container } = render(<CarouselHero identity={identity} moment={moment} skin={skin} products={products} />);
    const navBar = container.querySelector('[data-ms-hero-nav]') as HTMLElement | null;
    expect(navBar).toBeTruthy();
    expect(navBar!.style.display).toBe('flex');
    expect(navBar!.style.justifyContent).toBe('space-between');
  });
});
