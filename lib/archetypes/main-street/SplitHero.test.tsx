import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SplitHero } from './SplitHero';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const identity = { wordmark: "June's Sourdough", nav: ['Shop', 'About'] };
const moment = {
  media: {
    kind: 'video' as const,
    prompt: {
      composition: 'tight overhead on a cracked loaf',
      subject: 'steam rising slowly off the crust',
      environment: 'a warm kitchen bench',
      atmosphere: 'quiet and unhurried',
      camera: 'locked off, shallow depth',
      lighting: 'soft golden window light',
      style: 'photographic, filmic grain',
    },
    url: '/bread-kling.mp4',
    alt: 'A loaf cooling',
  },
  story: ['It starts the night before', 'Pulled from the oven at first light'],
  eyebrow: 'Baked fresh every morning',
  brand: "June's Sourdough",
  sub: 'Naturally leavened sourdough baked fresh every morning in Rhode Island',
  ctaLabel: 'See the loaves',
  ctaTarget: 'shop' as const,
};

afterEach(cleanup);

describe('SplitHero — a skin-agnostic swappable hero (text panel + media panel)', () => {
  it('renders a split hero with a text panel and a media panel', () => {
    const { container } = render(<SplitHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero="split"]')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero-text]')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero-media]')).toBeTruthy();
  });

  it('renders the headline, eyebrow, and the shared sub-line (the pile ingredient, NOT the Story fading lines)', () => {
    const { container } = render(<SplitHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-type="brand"]')!.textContent).toBe(moment.brand);
    expect(container.querySelector('[data-type="eyebrow"]')!.textContent).toBe(moment.eyebrow);
    expect(container.querySelector('[data-ms-hero-sub]')!.textContent).toBe(moment.sub);
  });

  it('does NOT render the Story fading lines (those belong to the Story hero only)', () => {
    const { container } = render(<SplitHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-story-line]')).toBeNull();
  });

  it('omits the sub-line element when no sub is authored (legacy content)', () => {
    const { sub, ...noSub } = moment;
    void sub;
    const { container } = render(<SplitHero identity={identity} moment={noSub} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-sub]')).toBeNull();
  });

  it('renders the media (a video for a video kind) in the media panel', () => {
    const { container } = render(<SplitHero identity={identity} moment={moment} skin={skin} />);
    const panel = container.querySelector('[data-ms-hero-media]')!;
    expect(panel.querySelector('video')).toBeTruthy();
  });

  it('points the primary CTA at the authored target page', () => {
    const { container } = render(<SplitHero identity={identity} moment={moment} skin={skin} />);
    const cta = container.querySelector('[data-ms-hero-text] a[href]')!;
    // ctaTarget 'shop' resolves to the shop page
    const ctaLink = Array.from(container.querySelectorAll('[data-ms-hero-text] a')).find((a) => a.textContent === moment.ctaLabel)!;
    expect(ctaLink.getAttribute('href')).toBe('/shop');
    expect(cta).toBeTruthy();
  });

  it('falls back to /shop when the primary CTA has no authored target', () => {
    const { ctaTarget, ...noTarget } = moment;
    void ctaTarget;
    const { container } = render(<SplitHero identity={identity} moment={noTarget} skin={skin} />);
    const ctaLink = Array.from(container.querySelectorAll('[data-ms-hero-text] a')).find((a) => a.textContent === moment.ctaLabel)!;
    expect(ctaLink.getAttribute('href')).toBe('/shop');
  });

  it('defaults the media to the right (text panel comes first in the DOM)', () => {
    const { container } = render(<SplitHero identity={identity} moment={moment} skin={skin} />);
    const hero = container.querySelector('[data-ms-hero="split"]')!;
    const panels = hero.querySelectorAll('[data-ms-hero-text], [data-ms-hero-media]');
    expect(panels[0]!.getAttribute('data-ms-hero-text')).not.toBeNull();
    expect(hero.getAttribute('data-media-side')).toBe('right');
  });

  it('puts the media first when mediaSide is left (the mirror variant)', () => {
    const { container } = render(<SplitHero identity={identity} moment={moment} skin={skin} mediaSide="left" />);
    const hero = container.querySelector('[data-ms-hero="split"]')!;
    const panels = hero.querySelectorAll('[data-ms-hero-text], [data-ms-hero-media]');
    expect(panels[0]!.getAttribute('data-ms-hero-media')).not.toBeNull();
    expect(hero.getAttribute('data-media-side')).toBe('left');
  });

  it('renders the nav (the wordmark) inside the hero', () => {
    const { container } = render(<SplitHero identity={identity} moment={moment} skin={skin} />);
    expect(container.textContent).toContain(identity.wordmark);
  });
});
