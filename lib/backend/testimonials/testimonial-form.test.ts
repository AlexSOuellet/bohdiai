import { describe, it, expect } from 'vitest';
import { QUOTE_MAX, buildTestimonialRow, checkOrder, testimonialFromRow } from './testimonial-form';

describe('a testimonial', () => {
  it('needs words and a name; the detail is optional and tidied', () => {
    expect(buildTestimonialRow({ id: null, quote: '  So pretty!  ', name: ' Maria  P. ', detail: '' })).toEqual({ ok: true, row: { quote: 'So pretty!', name: 'Maria P.', detail: null } });
    expect(buildTestimonialRow({ id: null, quote: 'x', name: 'Jo', detail: ' Bristol ' })).toEqual({ ok: true, row: { quote: 'x', name: 'Jo', detail: 'Bristol' } });
    expect(buildTestimonialRow({ id: null, quote: ' ', name: 'Jo', detail: '' })).toEqual({ ok: false, error: 'Add what they said.' });
    expect(buildTestimonialRow({ id: null, quote: 'x', name: '', detail: '' }).ok).toBe(false);
  });

  it('keeps to the limits', () => {
    expect(buildTestimonialRow({ id: null, quote: 'x'.repeat(QUOTE_MAX + 1), name: 'Jo', detail: '' }).ok).toBe(false);
    expect(buildTestimonialRow({ id: null, quote: 'x', name: 'J'.repeat(61), detail: '' }).ok).toBe(false);
    expect(buildTestimonialRow({ id: null, quote: 'x', name: 'Jo', detail: 'd'.repeat(61) }).ok).toBe(false);
  });

  it('reads a row and checks a new order', () => {
    expect(testimonialFromRow({ id: 'a', quote: 'q', name: 'n', detail: null })).toEqual({ id: 'a', quote: 'q', name: 'n', detail: '' });
    expect(checkOrder(['b', 'a'], ['a', 'b'])).toBe(true);
    expect(checkOrder(['a', 'a'], ['a', 'b'])).toBe(false);
    expect(checkOrder(['a'], ['a', 'b'])).toBe(false);
    expect(checkOrder(['a', 'c'], ['a', 'b'])).toBe(false);
  });
});
