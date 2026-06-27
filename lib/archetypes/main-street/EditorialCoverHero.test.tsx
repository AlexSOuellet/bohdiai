import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { EditorialCoverHero } from './EditorialCoverHero';
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

describe('EditorialCoverHero — giant masthead, brand-as-hero over media', () => {
  it('renders the hero with full-bleed media and the brand as a masthead', () => {
    const { container } = render(<EditorialCoverHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero="editorial-cover"]')).toBeTruthy();
    expect(container.querySelector('[data-ms-hero-media]')).toBeTruthy();
    expect(container.querySelector('[data-type="brand"]')!.textContent).toBe(moment.brand);
  });

  it('renders the eyebrow and the shared sub-line', () => {
    const { container } = render(<EditorialCoverHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-type="eyebrow"]')!.textContent).toBe(moment.eyebrow);
    expect(container.querySelector('[data-ms-hero-sub]')!.textContent).toBe(moment.sub);
  });

  it('renders the media (a video) in the background', () => {
    const { container } = render(<EditorialCoverHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-media] video')).toBeTruthy();
  });

  it('omits the sub-line when none is authored', () => {
    const { sub, ...noSub } = moment;
    void sub;
    const { container } = render(<EditorialCoverHero identity={identity} moment={noSub} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-sub]')).toBeNull();
  });

  it('does NOT render the Story fading lines', () => {
    const { container } = render(<EditorialCoverHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-story-line]')).toBeNull();
  });

  it('points the primary CTA at the authored target page', () => {
    const { container } = render(<EditorialCoverHero identity={identity} moment={moment} skin={skin} />);
    const ctaLink = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === moment.ctaLabel)!;
    expect(ctaLink.getAttribute('href')).toBe('/shop');
  });

  it('falls back to /shop when the primary CTA has no authored target', () => {
    const { ctaTarget, ...noTarget } = moment;
    void ctaTarget;
    const { container } = render(<EditorialCoverHero identity={identity} moment={noTarget} skin={skin} />);
    const ctaLink = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === moment.ctaLabel)!;
    expect(ctaLink.getAttribute('href')).toBe('/shop');
  });

  it('renders a second CTA when a secondary label and target are authored', () => {
    const withSecondary = { ...moment, secondaryCtaLabel: 'Our story', secondaryCtaTarget: 'about' as const };
    const { container } = render(<EditorialCoverHero identity={identity} moment={withSecondary} skin={skin} />);
    const secondary = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === 'Our story')!;
    expect(secondary).toBeTruthy();
    expect(secondary.getAttribute('href')).toBeTruthy();
  });

  it('amplifies the masthead size in a scoped <style> rule (cover bug regression guard)', () => {
    // The old bug: a font-size set in a <style> rule for [data-type="brand"] was
    // beaten by the skin's INLINE typeRoleCss fontSize (inline > stylesheet), so
    // the masthead never grew — which is why the size used to be forced inline.
    // The Type-component refactor removed inline typeRoleCss entirely (type now
    // comes from --ms-t-* CSS vars + the base [data-type] rule), so a MORE SPECIFIC
    // scoped rule legitimately wins. This guards that the masthead amplification
    // lives in that scoped rule and is never silently dropped. (The literal clamp
    // size isn't DOM-assertable — jsdom drops clamp() from the CSSOM, same as every
    // other fluid size in these heroes — so the visible result is verified on deploy.)
    const { container } = render(<EditorialCoverHero identity={identity} moment={moment} skin={skin} />);
    const styleText = container.querySelector('style')?.textContent ?? '';
    expect(styleText).toMatch(/\.ms-cover-masthead \[data-type="brand"\]\s*\{[^}]*font-size/);
  });

  it('lays the nav out as a horizontal bar', () => {
    const { container } = render(<EditorialCoverHero identity={identity} moment={moment} skin={skin} />);
    const navBar = container.querySelector('[data-ms-hero-nav]') as HTMLElement | null;
    expect(navBar).toBeTruthy();
    expect(navBar!.style.display).toBe('flex');
    expect(navBar!.style.justifyContent).toBe('space-between');
  });
});
