import { describe, it, expect } from 'vitest';
import { QUOTE_MAX, buildTestimonialRow, checkOrder, testimonialFromRow, siteTestimonials } from './testimonial-form';

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
    expect(testimonialFromRow({ id: 'a', quote: 'q', name: 'n', detail: null })).toEqual({ id: 'a', quote: 'q', name: 'n', detail: '', shown: false });
    expect(testimonialFromRow({ id: 'a', quote: 'q', name: 'n', detail: 'd', shown: true }).shown).toBe(true);
    expect(checkOrder(['b', 'a'], ['a', 'b'])).toBe(true);
    expect(checkOrder(['a', 'a'], ['a', 'b'])).toBe(false);
    expect(checkOrder(['a'], ['a', 'b'])).toBe(false);
    expect(checkOrder(['a', 'c'], ['a', 'b'])).toBe(false);
  });
});

describe('what the site shows', () => {
  const t = (id: string, shown = false) => ({ id, quote: id, name: id, detail: '', shown });
  it('shows every one on Full', () => {
    expect(siteTestimonials([t('a'), t('b'), t('c'), t('d')], true).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('on Market shows the ticked ones, up to three, else the first three', () => {
    expect(siteTestimonials([t('a'), t('b'), t('c'), t('d')], false).map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(siteTestimonials([t('a'), t('b', true), t('c'), t('d', true)], false).map((x) => x.id)).toEqual(['b', 'd']);
  });
});
