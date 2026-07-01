import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ReviewsPullQuote } from './ReviewsPullQuote';
import { MAIN_STREET_SKINS } from './skins';
import type { ReviewsSection, Testimonial } from './reviews';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const section: ReviewsSection = { title: 'Kind words', label: 'In their words', items: [] };

// jsdom leaves matchMedia undefined; stub it so the component's reduced-motion
// guard has a real API to read (defaults to "no preference").
beforeAll(() => {
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

function makeTestimonials(n: number): Testimonial[] {
  return Array.from({ length: n }, (_, i) => ({
    quote: `Quote number ${i} is unmistakable`,
    author: `Author ${i}`,
    location: `City ${i}`,
  }));
}

afterEach(cleanup);

describe('ReviewsPullQuote', () => {
  it('renders one figure per testimonial', () => {
    const { container } = render(
      <ReviewsPullQuote section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('[data-ms-rev-item]').length).toBe(3);
  });

  it('renders every testimonial quote in the DOM (all present, just faded)', () => {
    const { container } = render(
      <ReviewsPullQuote section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.textContent).toContain('Quote number 0 is unmistakable');
    expect(container.textContent).toContain('Quote number 1 is unmistakable');
    expect(container.textContent).toContain('Quote number 2 is unmistakable');
  });

  it('renders one dot per testimonial when there are several', () => {
    const { container } = render(
      <ReviewsPullQuote section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('.ms-rev-pq-dot').length).toBe(3);
  });

  it('renders no dots for a single testimonial', () => {
    const { container } = render(
      <ReviewsPullQuote section={section} items={makeTestimonials(1)} skin={skin} />,
    );
    expect(container.querySelectorAll('.ms-rev-pq-dot').length).toBe(0);
    expect(container.querySelectorAll('[data-ms-rev-item]').length).toBe(1);
  });

  it('renders text through named type roles', () => {
    const { container } = render(
      <ReviewsPullQuote section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('uses classes, not inline style objects, on its figures', () => {
    const { container } = render(
      <ReviewsPullQuote section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    container.querySelectorAll('[data-ms-rev-item]').forEach((el) => {
      expect((el as HTMLElement).getAttribute('style')).toBeFalsy();
    });
  });
});
