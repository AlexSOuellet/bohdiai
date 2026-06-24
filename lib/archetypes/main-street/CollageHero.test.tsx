import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { CollageHero } from './CollageHero';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const identity = { wordmark: "June's Sourdough", nav: ['Shop', 'About'] };
function shot(subject: string) {
  return {
    prompt: { composition: 'a', subject, environment: 'c', atmosphere: 'd', camera: 'e', lighting: 'f', style: 'g' },
    url: `https://cdn.example.com/${subject}.jpg`,
    alt: subject,
  };
}
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
  collageShots: [shot('one'), shot('two'), shot('three')],
};

afterEach(cleanup);

describe('CollageHero — a cluster of three shots beside the hero text', () => {
  it('renders the hero with the headline, eyebrow, and sub-line', () => {
    const { container } = render(<CollageHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero="collage"]')).toBeTruthy();
    expect(container.querySelector('[data-type="brand"]')!.textContent).toBe(moment.brand);
    expect(container.querySelector('[data-type="eyebrow"]')!.textContent).toBe(moment.eyebrow);
    expect(container.querySelector('[data-ms-hero-sub]')!.textContent).toBe(moment.sub);
  });

  it('renders one collage shot element per authored shot, with its image', () => {
    const { container } = render(<CollageHero identity={identity} moment={moment} skin={skin} />);
    const shots = container.querySelectorAll('[data-ms-collage-shot]');
    expect(shots).toHaveLength(3);
    expect(shots[0]!.querySelector('img')!.getAttribute('src')).toBe('https://cdn.example.com/one.jpg');
  });

  it('renders gracefully when there are no collage shots — text stays, no shot elements, never breaks', () => {
    const { collageShots, ...noShots } = moment;
    void collageShots;
    const { container } = render(<CollageHero identity={identity} moment={noShots} skin={skin} />);
    expect(container.querySelector('[data-ms-hero="collage"]')).toBeTruthy();
    expect(container.querySelector('[data-type="brand"]')!.textContent).toBe(moment.brand);
    expect(container.querySelectorAll('[data-ms-collage-shot]')).toHaveLength(0);
  });

  it('skips a shot whose url has not resolved yet (no broken image)', () => {
    const partial = { ...moment, collageShots: [shot('one'), { prompt: shot('two').prompt, alt: 'two' }, shot('three')] };
    const { container } = render(<CollageHero identity={identity} moment={partial} skin={skin} />);
    expect(container.querySelectorAll('[data-ms-collage-shot]')).toHaveLength(2);
  });

  it('omits the sub-line when none is authored', () => {
    const { sub, ...noSub } = moment;
    void sub;
    const { container } = render(<CollageHero identity={identity} moment={noSub} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-sub]')).toBeNull();
  });

  it('does NOT render the Story fading lines', () => {
    const { container } = render(<CollageHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero-story-line]')).toBeNull();
  });

  it('points the primary CTA at the authored target page', () => {
    const { container } = render(<CollageHero identity={identity} moment={moment} skin={skin} />);
    const ctaLink = Array.from(container.querySelectorAll('a')).find((a) => a.textContent === moment.ctaLabel)!;
    expect(ctaLink.getAttribute('href')).toBe('/shop');
  });

  it('lays the nav out as a horizontal bar', () => {
    const { container } = render(<CollageHero identity={identity} moment={moment} skin={skin} />);
    const navBar = container.querySelector('[data-ms-hero-nav]') as HTMLElement | null;
    expect(navBar).toBeTruthy();
    expect(navBar!.style.display).toBe('flex');
    expect(navBar!.style.justifyContent).toBe('space-between');
  });
});
