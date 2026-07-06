import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ReviewsBeat } from './ReviewsBeat';
import { MAIN_STREET_SKINS } from './skins';
import { HOME_REVIEWS_SAMPLE, type ReviewsSection, type ReviewsTreatment, type Testimonial } from './reviews';

const skin = MAIN_STREET_SKINS['main-street-ember']!;

// jsdom has no matchMedia; the pull-quote treatment reads it for reduced-motion.
beforeAll(() => {
  if (typeof window.matchMedia === 'undefined') {
    window.matchMedia = ((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    })) as unknown as typeof window.matchMedia;
  }
});

function makeItems(n: number): Testimonial[] {
  return Array.from({ length: n }, (_, i) => ({ quote: `Testimonial ${i}`, author: `Author ${i}` }));
}

function section(over?: Partial<ReviewsSection>): ReviewsSection {
  return { title: 'Kind words', items: makeItems(3), ...over };
}

/** The root class each treatment stamps, so we can assert which one the dispatcher
 *  chose without depending on a treatment's internals. */
const ROOT_CLASS: Record<ReviewsTreatment, string> = {
  rating: '.ms-rev-rating',
  'pull-quote': '.ms-rev-pq',
  guestbook: '.ms-rev-book',
  texts: '.ms-rev-texts',
};

afterEach(cleanup);

describe('ReviewsBeat', () => {
  it('renders nothing when the shop has no testimonials', () => {
    const { container } = render(<ReviewsBeat section={section({ items: [] })} skin={skin} />);
    expect(container.firstChild).toBeNull();
  });

  it('dispatches to each treatment when forced', () => {
    for (const t of Object.keys(ROOT_CLASS) as ReviewsTreatment[]) {
      const { container } = render(<ReviewsBeat section={section()} skin={skin} treatment={t} />);
      expect(container.querySelector(ROOT_CLASS[t])).toBeTruthy();
      cleanup();
    }
  });

  it('falls back to the documented default (rating) with no authored or forced treatment', () => {
    const { container } = render(<ReviewsBeat section={section()} skin={skin} />);
    expect(container.querySelector(ROOT_CLASS.rating)).toBeTruthy();
  });

  it('renders the treatment the caller passes (the family picks it)', () => {
    const { container } = render(<ReviewsBeat section={section({})} skin={skin} treatment="guestbook" />);
    expect(container.querySelector(ROOT_CLASS.guestbook)).toBeTruthy();
  });

  it('samples to the home handful', () => {
    const { container } = render(
      <ReviewsBeat section={section({ items: makeItems(HOME_REVIEWS_SAMPLE + 4) })} skin={skin} treatment="guestbook" />,
    );
    expect(container.querySelectorAll('[data-ms-rev-item]').length).toBe(HOME_REVIEWS_SAMPLE);
  });
});
