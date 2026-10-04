import { describe, it, expect } from 'vitest';
import { MARQUEE_SECONDS, marqueeDatesCss, marqueeDatesSeconds } from './marquee';

const words = ['Handmade in Rhode Island', 'The shop wall', 'Army flag with the green line', 'POW / MIA'];
const dates = ['Sat Oct 17 · Harvest Craft Fair · Wickford', 'Sat Nov 7 · Holiday Makers Market · Bristol'];

describe('marqueeDatesSeconds', () => {
  it('gives a longer dates row a longer loop, in proportion, so the speed matches', () => {
    const one = marqueeDatesSeconds(words, dates);
    const two = marqueeDatesSeconds(words, [...dates, ...dates]);
    expect(two / one).toBeCloseTo(2, 1);
  });

  it('gives fewer big words a longer dates loop, since the big words then move slower', () => {
    expect(marqueeDatesSeconds(words.slice(0, 2), dates)).toBeGreaterThan(marqueeDatesSeconds(words, dates));
  });

  it('never loops faster than ten seconds, and falls back to the big words’ time with no words', () => {
    expect(marqueeDatesSeconds(Array.from({ length: 40 }, () => 'A very long row of big handmade words'), ['Sat Oct 17 · Fair'])).toBe(10);
    expect(marqueeDatesSeconds([], dates)).toBe(MARQUEE_SECONDS);
  });
});

describe('marqueeDatesCss', () => {
  it('writes the dates row’s loop time', () => {
    expect(marqueeDatesCss(42)).toBe('.bc-marquee__row--dates{animation-duration:42s}');
  });
});
