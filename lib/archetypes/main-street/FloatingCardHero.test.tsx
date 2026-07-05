import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FloatingCardHero } from './FloatingCardHero';
import { MAIN_STREET_SKINS } from './skins';

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

afterEach(cleanup);

describe('FloatingCardHero — a card on the skin surface over full-bleed media', () => {
  it('renders the hero with a media background and a floating card', () => {
    const { container } = render(<FloatingCardHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero="floating-card"]')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero-media]')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero-card]')).toBeTruthy();
  });

  it('renders the headline, eyebrow, and the shared sub-line inside the card', () => {
    const { container } = render(<FloatingCardHero identity={identity} moment={moment} skin={skin} />);
    const card = container.querySelector('[data-ms-hero-card]')!;
    expect(card.querySelector('[data-type="brand"]')!.textContent).toBe(moment.brand);
    expect(card.querySelector('[data-type="eyebrow"]')!.textContent).toBe(moment.eyebrow);
    expect(card.querySelector('[data-ms-hero-sub]')!.textContent).toBe(moment.sub);
  });

  it('renders the media (a video) in the background', () => {
    const { container } = render(<FloatingCardHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-media] video')).toBeTruthy();
  });

  it('omits the sub-line when none is authored', () => {
    const { sub, ...noSub } = moment;
    void sub;
    const { container } = render(<FloatingCardHero identity={identity} moment={noSub} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-sub]')).toBeNull();
  });

  it('does NOT render the Story fading lines', () => {
    const { container } = render(<FloatingCardHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-story-line]')).toBeNull();
  });

  it('points the primary CTA at the authored target page', () => {
    const { container } = render(<FloatingCardHero identity={identity} moment={moment} skin={skin} />);
    const ctaLink = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === moment.ctaLabel)!;
    expect(ctaLink.getAttribute('href')).toBe('/shop');
  });

  it('falls back to /shop when the primary CTA has no authored target', () => {
    const { ctaTarget, ...noTarget } = moment;
    void ctaTarget;
    const { container } = render(<FloatingCardHero identity={identity} moment={noTarget} skin={skin} />);
    const ctaLink = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === moment.ctaLabel)!;
    expect(ctaLink.getAttribute('href')).toBe('/shop');
  });

  it('renders a second CTA when a secondary label and target are authored', () => {
    const withSecondary = { ...moment, secondaryCtaLabel: 'Our story', secondaryCtaTarget: 'about' as const };
    const { container } = render(<FloatingCardHero identity={identity} moment={withSecondary} skin={skin} />);
    const secondary = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === 'Our story')!;
    expect(secondary).toBeTruthy();
    expect(secondary.getAttribute('href')).toBeTruthy();
  });

  it('renders the nav bar as a class-only horizontal row', () => {
    const { container } = render(<FloatingCardHero identity={identity} moment={moment} skin={skin} />);
    const navBar = container.querySelector('[data-ms-hero-nav]') as HTMLElement | null;
    expect(navBar).toBeTruthy();
    expect(navBar!.className).toContain('ms-hero-navbar');
    expect(navBar!.getAttribute('style')).toBeNull();
  });
});
