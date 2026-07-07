import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ReviewsRating } from './ReviewsRating';
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
  title: 'Kind words',
  label: 'Loved by customers',
  summary: { score: '4.9 out of 5', count: '214 happy customers' },
  items: makeTestimonials(3),
};

afterEach(cleanup);

describe('ReviewsRating', () => {
  it('renders exactly five hero stars', () => {
    const { container } = render(
      <ReviewsRating section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('.ms-rev-rating-star').length).toBe(5);
  });

  it('renders one quip per testimonial', () => {
    const { container } = render(
      <ReviewsRating section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('[data-ms-rev-item]').length).toBe(3);
  });

  it('shows the authored score and count', () => {
    const { container } = render(
      <ReviewsRating section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.textContent).toContain('4.9 out of 5');
    expect(container.textContent).toContain('214 happy customers');
  });

  it('shows each quote and author', () => {
    const { container } = render(
      <ReviewsRating section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.textContent).toContain('Quote number 0');
    expect(container.textContent).toContain('Author 2');
  });

  it('renders text through named type roles', () => {
    const { container } = render(
      <ReviewsRating section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('uses classes, not inline style objects, on its quips', () => {
    const { container } = render(
      <ReviewsRating section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    container.querySelectorAll('[data-ms-rev-item]').forEach((el) => {
      expect((el as HTMLElement).getAttribute('style')).toBeFalsy();
    });
  });

  it('falls back to sensible defaults when summary is absent', () => {
    const noSummary: ReviewsSection = {
      title: 'Kind words',
      items: makeTestimonials(4),
    };
    const { container } = render(
      <ReviewsRating section={noSummary} items={makeTestimonials(4)} skin={skin} />,
    );
    // still five stars, still one quip per item
    expect(container.querySelectorAll('.ms-rev-rating-star').length).toBe(5);
    expect(container.querySelectorAll('[data-ms-rev-item]').length).toBe(4);
    // fallback score + count
    expect(container.textContent).toContain('5 out of 5');
    expect(container.textContent).toContain('4 testimonials');
  });
});
