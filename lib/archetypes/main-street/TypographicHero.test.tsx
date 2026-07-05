import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { TypographicHero } from './TypographicHero';
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

describe('TypographicHero — no image, the words carry it', () => {
  it('renders a typographic hero with the headline and eyebrow', () => {
    const { container } = render(<TypographicHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero="typographic"]')).toBeTruthy();
    expect(container.querySelector('[data-type="brand"]')!.textContent).toBe(moment.brand);
    expect(container.querySelector('[data-type="eyebrow"]')!.textContent).toBe(moment.eyebrow);
  });

  it('renders the shared sub-line', () => {
    const { container } = render(<TypographicHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-sub]')!.textContent).toBe(moment.sub);
  });

  it('renders NO media — the defining trait of the typographic hero (video/stills unused here)', () => {
    const { container } = render(<TypographicHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-media]')).toBeNull();
    expect(container.querySelector('video')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('omits the sub-line when none is authored', () => {
    const { sub, ...noSub } = moment;
    void sub;
    const { container } = render(<TypographicHero identity={identity} moment={noSub} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-sub]')).toBeNull();
  });

  it('does NOT render the Story fading lines', () => {
    const { container } = render(<TypographicHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-story-line]')).toBeNull();
  });

  it('points the primary CTA at the authored target page', () => {
    const { container } = render(<TypographicHero identity={identity} moment={moment} skin={skin} />);
    const ctaLink = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === moment.ctaLabel)!;
    expect(ctaLink.getAttribute('href')).toBe('/shop');
  });

  it('falls back to /shop when the primary CTA has no authored target', () => {
    const { ctaTarget, ...noTarget } = moment;
    void ctaTarget;
    const { container } = render(<TypographicHero identity={identity} moment={noTarget} skin={skin} />);
    const ctaLink = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === moment.ctaLabel)!;
    expect(ctaLink.getAttribute('href')).toBe('/shop');
  });

  it('renders a second CTA when a secondary label and target are authored', () => {
    const withSecondary = { ...moment, secondaryCtaLabel: 'Our story', secondaryCtaTarget: 'about' as const };
    const { container } = render(<TypographicHero identity={identity} moment={withSecondary} skin={skin} />);
    const secondary = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === 'Our story')!;
    expect(secondary).toBeTruthy();
    expect(secondary.getAttribute('href')).toBeTruthy();
  });

  it('renders the nav bar as a class-only horizontal row', () => {
    const { container } = render(<TypographicHero identity={identity} moment={moment} skin={skin} />);
    const navBar = container.querySelector('[data-ms-hero-nav]') as HTMLElement | null;
    expect(navBar).toBeTruthy();
    expect(navBar!.className).toContain('ms-hero-navbar');
    expect(navBar!.getAttribute('style')).toBeNull();
  });
});
