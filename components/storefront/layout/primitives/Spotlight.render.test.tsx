import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { SpotlightNode } from '@/lib/layout';
import { Spotlight } from './Spotlight';

afterEach(() => {
  cleanup();
});

const media = { type: 'image', brief: 'a ring on black', alt: 'a ring', fill: true } as const;

function makeSpotlight(overrides: Partial<SpotlightNode> = {}): SpotlightNode {
  return {
    type: 'spotlight',
    media,
    line: 'Raised from raw silver and stone',
    eyebrow: 'Handmade, one at a time',
    brand: 'Ore and Ash',
    cta: { label: 'See the work', href: '/shop' },
    ...overrides,
  } as SpotlightNode;
}

describe('Spotlight — structure', () => {
  it('renders a full-screen section on pure black', () => {
    const { container } = render(<Spotlight node={makeSpotlight()} ctx={{}} />);
    const section = container.querySelector('[data-node-type="spotlight"]') as HTMLElement;
    expect(section).toBeTruthy();
    expect(section.className).toContain('min-h-screen');
    expect(section.className).toContain('overflow-hidden');
    expect(section.style.background).toBe('rgb(0, 0, 0)');
  });

  it('places the words on the right by default and the left when asked', () => {
    const right = render(<Spotlight node={makeSpotlight()} ctx={{}} />);
    expect(
      (right.container.querySelector('[data-node-type="spotlight"]') as HTMLElement).className,
    ).toContain('justify-end');
    cleanup();
    const left = render(<Spotlight node={makeSpotlight({ contentSide: 'left' })} ctx={{}} />);
    expect(
      (left.container.querySelector('[data-node-type="spotlight"]') as HTMLElement).className,
    ).toContain('justify-start');
  });
});

describe('Spotlight — the rise out of black', () => {
  it('the object rises via a slow linear opacity climb (the signature)', () => {
    const { container } = render(<Spotlight node={makeSpotlight()} ctx={{}} />);
    const rise = container.querySelector('[data-spotlight-rise]') as HTMLElement;
    expect(rise).toBeTruthy();
    expect(rise.style.getPropertyValue('--stage-reveal-duration')).toBe('6s');
    expect(rise.style.animation).toContain('stage-fade');
    expect(rise.style.animation).toContain('linear');
  });

  it('a faint push-in sits underneath as secondary movement', () => {
    const { container } = render(<Spotlight node={makeSpotlight()} ctx={{}} />);
    const zoom = container.querySelector('[data-spotlight-zoom]') as HTMLElement;
    expect(zoom).toBeTruthy();
    expect(zoom.style.animation).toContain('spotlight-push');
  });

  it('holds the media as a fill backdrop', () => {
    const { container } = render(<Spotlight node={makeSpotlight()} ctx={{}} />);
    expect(container.querySelector('[data-image-fill]')).toBeTruthy();
  });
});

describe('Spotlight — the words', () => {
  it('renders the headline, the eyebrow, and the brand in the wordmark role', () => {
    const { getByText } = render(<Spotlight node={makeSpotlight()} ctx={{}} />);
    expect(getByText('Raised from raw silver and stone')).toBeTruthy();
    expect(getByText('Handmade, one at a time')).toBeTruthy();
    const wordmark = getByText('Ore and Ash');
    expect(wordmark.style.fontFamily).toContain('var(--type-wordmark-font)');
  });

  it('renders the CTA with its href', () => {
    const { getByText } = render(<Spotlight node={makeSpotlight()} ctx={{}} />);
    const cta = getByText('See the work') as HTMLAnchorElement;
    expect(cta.getAttribute('href')).toBe('/shop');
  });

  it('the words fade in after the object is lit (delayed reveals)', () => {
    const { container } = render(<Spotlight node={makeSpotlight()} ctx={{}} />);
    const reveals = container.querySelectorAll('[data-stage-reveal]');
    // eyebrow + line + brand + cta
    expect(reveals.length).toBeGreaterThanOrEqual(4);
  });
});
