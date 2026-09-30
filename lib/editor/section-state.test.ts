import { describe, it, expect } from 'vitest';
import {
  markSectionMade,
  markSectionKept,
  setSectionHidden,
  unmarkSectionMade,
  sectionState,
  readSectionResolutions,
} from './section-state';

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

  it('un-marks a made section back to unresolved (last real product removed)', () => {
    const made = markSectionMade(base(), 'goods');
    expect(sectionState(made, 'goods')).toBe('made');
    expect(sectionState(unmarkSectionMade(made, 'goods'), 'goods')).toBe('unresolved');
  });

  it('never mutates its input', () => {
    const input = base();
    markSectionMade(input, 'hero');
    const content = (input['root'] as Record<string, unknown>)['content'] as Record<string, unknown>;
    expect(content['madeYours']).toBeUndefined();
  });
});

describe('section-state — tolerant of a missing or malformed envelope', () => {
  it('builds root.content from nothing when marking a section', () => {
    const next = markSectionKept({}, 'reviews');
    expect(next).toEqual({ root: { content: { kept: ['reviews'] } } });
    expect(sectionState(next, 'reviews')).toBe('kept');
  });

  it('creates content under a root that lacks it', () => {
    const next = setSectionHidden({ root: { kind: 'archetype' } }, 'marquee', true);
    expect(next).toEqual({ root: { kind: 'archetype', content: { hiddenSections: ['marquee'] } } });
  });

  it('reads every section as unresolved when root or content is missing or not an object', () => {
    expect(sectionState({}, 'hero')).toBe('unresolved');
    expect(sectionState({ root: null }, 'hero')).toBe('unresolved');
    expect(sectionState({ root: 'flat' }, 'hero')).toBe('unresolved');
    expect(sectionState({ root: { content: null } }, 'hero')).toBe('unresolved');
  });

  it('treats a non-array list as empty, both when reading and when writing', () => {
    const t = { root: { content: { madeYours: 'hero', kept: { hero: true } } } };
    expect(sectionState(t, 'hero')).toBe('unresolved');
    expect((markSectionMade(t, 'hero')['root'] as { content: Record<string, unknown> }).content).toEqual({
      madeYours: ['hero'],
      kept: [],
    });
  });

  it('marking the same section twice does not duplicate it', () => {
    const t = markSectionKept(markSectionKept(base(), 'goods'), 'goods');
    expect((t['root'] as { content: { kept: string[] } }).content.kept).toEqual(['goods']);
  });

  it('hidden wins over kept, and made wins over hidden', () => {
    let t = setSectionHidden(markSectionKept(base(), 'reviews'), 'reviews', true);
    expect(sectionState(t, 'reviews')).toBe('hidden');
    t = markSectionMade(t, 'reviews');
    expect(sectionState(t, 'reviews')).toBe('made');
  });
});

describe('readSectionResolutions', () => {
  it('returns the hidden list and the made+kept sections that are not hidden, de-duplicated', () => {
    const out = readSectionResolutions({
      madeYours: ['hero', 'goods', 'reviews'],
      kept: ['goods', 'findUs'],
      hiddenSections: ['reviews', 'marquee'],
    });
    expect(out.hidden).toEqual(['reviews', 'marquee']);
    expect(out.shown).toEqual(['hero', 'goods', 'findUs']);
  });

  it('ignores non-string entries and non-array lists', () => {
    const out = readSectionResolutions({ madeYours: ['hero', 3, null], kept: 'goods', hiddenSections: [{}] });
    expect(out).toEqual({ hidden: [], shown: ['hero'] });
  });

  it('reads nothing from a missing, null, array, or scalar content value', () => {
    for (const c of [undefined, null, ['hero'], 'hero', 42]) {
      expect(readSectionResolutions(c)).toEqual({ hidden: [], shown: [] });
    }
  });
});
