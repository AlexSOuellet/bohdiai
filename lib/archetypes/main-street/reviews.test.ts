import { describe, it, expect } from 'vitest';
import {
  REVIEWS_TREATMENTS,
  REVIEWS_TREATMENT_MENU,
  DEFAULT_REVIEWS_TREATMENT,
  HOME_REVIEWS_SAMPLE,
  sampleTestimonials,
  seedPreviewReviews,
  type Testimonial,
} from './reviews';

function makeTestimonials(n: number): Testimonial[] {
  return Array.from({ length: n }, (_, i) => ({
    quote: `Testimonial ${i}`,
    author: `Author ${i}`,
  }));
}

describe('reviews registry', () => {
  it('has the four designed treatments', () => {
    expect([...REVIEWS_TREATMENTS]).toEqual(['rating', 'pull-quote', 'guestbook', 'texts']);
  });

  it('carries a one-line menu entry for every treatment', () => {
    for (const t of REVIEWS_TREATMENTS) {
      expect(REVIEWS_TREATMENT_MENU[t]).toBeTruthy();
    }
  });

  it('has a default that is a real treatment', () => {
    expect(REVIEWS_TREATMENTS).toContain(DEFAULT_REVIEWS_TREATMENT);
  });
});

describe('sampleTestimonials', () => {
  it('trims to the home handful, preserving order', () => {
    const sample = sampleTestimonials(makeTestimonials(10));
    expect(sample.length).toBe(HOME_REVIEWS_SAMPLE);
    expect(sample[0]!.quote).toBe('Testimonial 0');
    expect(sample[HOME_REVIEWS_SAMPLE - 1]!.quote).toBe(`Testimonial ${HOME_REVIEWS_SAMPLE - 1}`);
  });

  it('leaves a short set untouched', () => {
    const sample = sampleTestimonials(makeTestimonials(2));
    expect(sample.length).toBe(2);
  });
});

describe('seedPreviewReviews', () => {
  it('returns a renderable section with a treatment-agnostic set of testimonials', () => {
    const seeded = seedPreviewReviews();
    expect(seeded.items.length).toBeGreaterThanOrEqual(3);
    expect(seeded.title).toBeTruthy();
    for (const t of seeded.items) {
      expect(t.quote).toBeTruthy();
      expect(t.author).toBeTruthy();
    }
  });

  it('seeds an aggregate for the Rating treatment', () => {
    const seeded = seedPreviewReviews();
    expect(seeded.summary?.score).toBeTruthy();
    expect(seeded.summary?.count).toBeTruthy();
  });
});
