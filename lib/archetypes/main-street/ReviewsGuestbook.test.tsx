import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ReviewsGuestbook } from './ReviewsGuestbook';
import { MAIN_STREET_SKINS } from './skins';
import type { ReviewsSection, Testimonial } from './reviews';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const section: ReviewsSection = { title: 'Kind words', label: 'Loved by customers', items: [] };

function makeTestimonials(n: number): Testimonial[] {
  return Array.from({ length: n }, (_, i) => ({
    quote: `Quote number ${i} — this is what a happy customer said.`,
    author: `Author ${i}`,
  }));
}

afterEach(cleanup);

describe('ReviewsGuestbook', () => {
  it('renders one slip per testimonial', () => {
    const { container } = render(
      <ReviewsGuestbook section={section} items={makeTestimonials(4)} skin={skin} />,
    );
    expect(container.querySelectorAll('[data-ms-rev-item]').length).toBe(4);
  });

  it('shows every author and quote', () => {
    const { container } = render(
      <ReviewsGuestbook section={section} items={makeTestimonials(4)} skin={skin} />,
    );
    for (let i = 0; i < 4; i++) {
      expect(container.textContent).toContain(`Author ${i}`);
      expect(container.textContent).toContain(`Quote number ${i} —`);
    }
  });

  it('shows the five-star string on every slip', () => {
    const { container } = render(
      <ReviewsGuestbook section={section} items={makeTestimonials(4)} skin={skin} />,
    );
    const slips = container.querySelectorAll('[data-ms-rev-item]');
    expect(slips.length).toBe(4);
    slips.forEach((slip) => {
      expect(slip.textContent).toContain('★★★★★');
    });
  });

  it('renders text through named type roles', () => {
    const { container } = render(
      <ReviewsGuestbook section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    expect(container.querySelectorAll('[data-type]').length).toBeGreaterThan(0);
  });

  it('uses classes, not inline style objects, on its slips', () => {
    const { container } = render(
      <ReviewsGuestbook section={section} items={makeTestimonials(3)} skin={skin} />,
    );
    container.querySelectorAll('[data-ms-rev-item]').forEach((el) => {
      expect((el as HTMLElement).getAttribute('style')).toBeFalsy();
    });
  });
});
