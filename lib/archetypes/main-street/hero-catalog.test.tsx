import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { resolveHero, HERO_CATALOG, DEFAULT_HERO_VARIANT, type HeroProps } from './hero-catalog';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const props: HeroProps = {
  identity: { wordmark: "June's Sourdough", nav: ['Shop', 'About'] },
  moment: {
    media: {
      kind: 'video',
      prompt: { composition: 'a', subject: 'b', environment: 'c', atmosphere: 'd', camera: 'e', lighting: 'f', style: 'g' },
      url: '/clip.mp4',
      alt: 'a loaf',
    },
    story: ['line one', 'line two'],
    eyebrow: 'Baked fresh',
    brand: "June's Sourdough",
    sub: 'Naturally leavened sourdough baked every morning',
    ctaLabel: 'See the loaves',
    ctaTarget: 'shop',
  },
  skin,
  products: [
    { slug: 'sourdough', name: 'Sourdough', price: '$8', description: 'a good loaf', status: 'active', media: [{ kind: 'image', url: '/s.jpg', alt: 'Sourdough' }], variations: [] },
    { slug: 'rye', name: 'Rye', price: '$9', description: 'a dark loaf', status: 'active', media: [{ kind: 'image', url: '/r.jpg', alt: 'Rye' }], variations: [] },
  ],
};

afterEach(cleanup);

describe('hero catalog — resolves a hero variant key to a component', () => {
  it('resolves "story" to the Story hero (MomentHero front-door surface)', () => {
    const { container } = render(resolveHero('story')(props));
    const hero = container.querySelector('[data-ms-hero]');
    expect(hero).toBeTruthy();
    // Story is not the split structure
    expect(container.querySelector('[data-ms-hero="split"]')).toBeNull();
  });

  it('resolves "split" to the Split hero with media on the right', () => {
    const { container } = render(resolveHero('split')(props));
    const hero = container.querySelector('[data-ms-hero="split"]')!;
    expect(hero).toBeTruthy();
    expect(hero.getAttribute('data-media-side')).toBe('right');
  });

  it('resolves "split-left" to the Split hero with media on the left (the mirror)', () => {
    const { container } = render(resolveHero('split-left')(props));
    const hero = container.querySelector('[data-ms-hero="split"]')!;
    expect(hero.getAttribute('data-media-side')).toBe('left');
  });

  it('falls back to the default hero for an undefined key (the functional floor — a recipe can never resolve to nothing)', () => {
    const { container } = render(resolveHero(undefined)(props));
    expect(container.querySelector('[data-ms-hero]')).toBeTruthy();
    expect(DEFAULT_HERO_VARIANT).toBe('story');
  });

  it('falls back to the default hero for an unknown key (taste is the maker\'s, but a bad key can never break the page)', () => {
    const { container } = render(resolveHero('does-not-exist')(props));
    expect(container.querySelector('[data-ms-hero]')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero="split"]')).toBeNull();
  });

  it('resolves "stacked" to the Stacked hero (text block over a media band)', () => {
    const { container } = render(resolveHero('stacked')(props));
    expect(container.querySelector('[data-ms-hero="stacked"]')).toBeTruthy();
  });

  it('resolves "typographic" to the Typographic hero (no media)', () => {
    const { container } = render(resolveHero('typographic')(props));
    expect(container.querySelector('[data-ms-hero="typographic"]')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero-media]')).toBeNull();
  });

  it('resolves "floating-card" to the Floating card hero', () => {
    const { container } = render(resolveHero('floating-card')(props));
    expect(container.querySelector('[data-ms-hero="floating-card"]')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero-card]')).toBeTruthy();
  });

  it('resolves "editorial-cover" to the Editorial cover hero', () => {
    const { container } = render(resolveHero('editorial-cover')(props));
    expect(container.querySelector('[data-ms-hero="editorial-cover"]')).toBeTruthy();
  });

  it('resolves "carousel" to the Carousel hero with a product item per row', () => {
    const { container } = render(resolveHero('carousel')(props));
    expect(container.querySelector('[data-ms-hero="carousel"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-ms-carousel-item]')).toHaveLength(props.products.length);
  });

  it('resolves "collage" to the Collage hero', () => {
    const { container } = render(resolveHero('collage')(props));
    expect(container.querySelector('[data-ms-hero="collage"]')).toBeTruthy();
  });

  it('every catalog entry renders a hero surface (no dead keys)', () => {
    for (const key of Object.keys(HERO_CATALOG)) {
      const { container, unmount } = render(resolveHero(key)(props));
      expect(container.querySelector('[data-ms-hero]')).toBeTruthy();
      unmount();
    }
  });
});
