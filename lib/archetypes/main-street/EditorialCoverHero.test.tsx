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

  it('does NOT set the masthead size in a <style> rule — it must be inline or the skin default overrides it (cover bug regression guard)', () => {
    // The bug: a font-size set in a <style> rule for [data-type="brand"] is beaten
    // by the skin's INLINE typeRoleCss fontSize (inline > stylesheet), so the
    // masthead never grew. The fix sets the masthead scale inline; this guards
    // against anyone moving it back into a stylesheet rule. (The literal clamp size
    // isn't DOM-assertable — jsdom drops clamp() from the CSSOM, same as every
    // other fluid size in these heroes — so the visible result is verified on deploy.)
    const { container } = render(<EditorialCoverHero identity={identity} moment={moment} skin={skin} />);
    const styleText = container.querySelector('style')?.textContent ?? '';
    expect(styleText).not.toMatch(/\[data-type="brand"\]\s*\{[^}]*font-size/);
  });

  it('lays the nav out as a horizontal bar', () => {
    const { container } = render(<EditorialCoverHero identity={identity} moment={moment} skin={skin} />);
    const navBar = container.querySelector('[data-ms-hero-nav]') as HTMLElement | null;
    expect(navBar).toBeTruthy();
    expect(navBar!.style.display).toBe('flex');
    expect(navBar!.style.justifyContent).toBe('space-between');
  });
});
