import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ReviewsTexts } from './ReviewsTexts';
import { MAIN_STREET_SKINS } from './skins';
import type { ReviewsSection, Testimonial } from './reviews';

const skin = MAIN_STREET_SKINS['main-street-ember']!;

function makeTestimonials(n: number): Testimonial[] {
  return Array.from({ length: n }, (_, i) => ({
    quote: `Quote number ${i}`,
    author: `Author ${i}`,
  }));
}

const section: ReviewsSection = {
  title: 'What they text us after',
  label: 'Straight from their phones',
  items: makeTestimonials(3),
};

afterEach(cleanup);

describe('ReviewsTexts', () => {
  it('renders one thread per testimonial', () => {
    const { container } = render(
      <ReviewsTexts section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('[data-ms-rev-item]').length).toBe(3);
  });

  it('shows every author and quote', () => {
    const { container } = render(
      <ReviewsTexts section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.textContent).toContain('Author 0');
    expect(container.textContent).toContain('Author 2');
    expect(container.textContent).toContain('Quote number 0');
    expect(container.textContent).toContain('Quote number 2');
  });

  it('renders a location line when one is provided', () => {
    const withLocation: Testimonial[] = [
      { quote: 'A joy to open.', author: 'Dana Reyes', location: 'Providence, RI' },
    ];
    const { container } = render(
      <ReviewsTexts section={section} items={withLocation} skin={skin} />,
    );
    expect(container.textContent).toContain('Providence, RI');
  });

  it('renders text through named type roles', () => {
    const { container } = render(
      <ReviewsTexts section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('uses classes, not inline style objects, on its threads', () => {
    const { container } = render(
      <ReviewsTexts section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    container.querySelectorAll('[data-ms-rev-item]').forEach((el) => {
      expect((el as HTMLElement).getAttribute('style')).toBeFalsy();
    });
  });
});
