import { describe, it, expect } from 'vitest';
import { markSectionMade, markSectionKept, setSectionHidden, sectionState } from './section-state';

const base = (): Record<string, unknown> => ({ root: { content: {} } });

describe('section-state', () => {
  it('marks a section made-yours', () => {
    const next = markSectionMade(base(), 'hero');
    expect(sectionState(next, 'hero')).toBe('made');
  });

  it('marks a section kept', () => {
    expect(sectionState(markSectionKept(base(), 'reviews'), 'reviews')).toBe('kept');
  });

  it('marks a section hidden, and un-hiding returns it to unresolved', () => {
    let t = setSectionHidden(base(), 'reviews', true);
    expect(sectionState(t, 'reviews')).toBe('hidden');
    t = setSectionHidden(t, 'reviews', false);
    expect(sectionState(t, 'reviews')).toBe('unresolved');
  });

  it('made-yours wins over kept for the same section', () => {
    let t = markSectionKept(base(), 'hero');
    t = markSectionMade(t, 'hero');
    expect(sectionState(t, 'hero')).toBe('made');
  });

  it('an untouched section is unresolved', () => {
    expect(sectionState(base(), 'goods')).toBe('unresolved');
  });

  it('never mutates its input', () => {
    const input = base();
    markSectionMade(input, 'hero');
    const content = (input['root'] as Record<string, unknown>)['content'] as Record<string, unknown>;
    expect(content['madeYours']).toBeUndefined();
  });
});
