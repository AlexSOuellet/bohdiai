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

  it('renders a subtle backdrop img when moment.media.kind is "still" and a url is present (D73 — Luxury reads moment.media as backdrop)', () => {
    const stillMoment = { ...moment, media: { ...moment.media, kind: 'still' as const, url: '/hero.jpg' } };
    const { container } = render(<TypographicHero identity={identity} moment={stillMoment} skin={skin} />);
    const backdrop = container.querySelector('[data-ms-typohero-backdrop]');
    expect(backdrop).toBeTruthy();
    const img = backdrop!.querySelector('img');
    expect(img).toBeTruthy();
    expect(img!.getAttribute('src')).toBe('/hero.jpg');
  });

  it('renders a subtle backdrop video when moment.media.kind is "video" and a url is present — autoplay muted loop (D73)', () => {
    const videoMoment = { ...moment, media: { ...moment.media, kind: 'video' as const, url: '/clip.mp4' } };
    const { container } = render(<TypographicHero identity={identity} moment={videoMoment} skin={skin} />);
    const backdrop = container.querySelector('[data-ms-typohero-backdrop]');
    expect(backdrop).toBeTruthy();
    const video = backdrop!.querySelector('video') as HTMLVideoElement | null;
    expect(video).toBeTruthy();
    expect(video!.getAttribute('src')).toBe('/clip.mp4');
    // React sets these as JS properties on HTMLMediaElement, not HTML attributes,
    // so hasAttribute() lies about them. Read the properties directly.
    expect(video!.autoplay).toBe(true);
    expect(video!.loop).toBe(true);
    expect(video!.muted).toBe(true);
    expect(video!.playsInline).toBe(true);
  });

  it('renders NO backdrop when moment.media has no url (still or video)', () => {
    const noUrlStill = { ...moment, media: { ...moment.media, kind: 'still' as const, url: undefined } };
    const noUrlVideo = { ...moment, media: { ...moment.media, kind: 'video' as const, url: undefined } };
    for (const m of [noUrlStill, noUrlVideo]) {
      const { container } = render(<TypographicHero identity={identity} moment={m} skin={skin} />);
      expect(container.querySelector('[data-ms-typohero-backdrop]')).toBeNull();
      cleanup();
    }
  });

  it('the backdrop is decorative (empty alt / aria-hidden) — the type is the message, the photo is atmosphere', () => {
    const stillMoment = { ...moment, media: { ...moment.media, kind: 'still' as const, url: '/hero.jpg', alt: 'a loaf' } };
    const { container } = render(<TypographicHero identity={identity} moment={stillMoment} skin={skin} />);
    const backdrop = container.querySelector('[data-ms-typohero-backdrop]') as HTMLElement | null;
    expect(backdrop!.getAttribute('aria-hidden')).toBe('true');
    const img = backdrop!.querySelector('img');
    expect(img!.getAttribute('alt')).toBe('');
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
