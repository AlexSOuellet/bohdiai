import { describe, it, expect } from 'vitest';
import { moodAlignedSkins, MOOD_SKIN_TAGS } from './skin-selection';
import { MAIN_STREET_SKIN_TAGS } from './skins';
import { MOODS, type MoodKey } from '@/lib/moods';

const ALL_MOODS = Object.keys(MOODS) as MoodKey[];

describe('moodAlignedSkins (the D41 skin gate)', () => {
  it('gives every mood a real choice (>=3 skins) and never the whole shelf by accident', () => {
    const total = Object.keys(MAIN_STREET_SKIN_TAGS).length;
    for (const mood of ALL_MOODS) {
      const subset = moodAlignedSkins(mood);
      expect(subset.length).toBeGreaterThanOrEqual(3);
      expect(subset.length).toBeLessThan(total); // a genuine gate, not a pass-through
    }
  });

  it('only returns skins whose tags actually match the mood', () => {
    for (const mood of ALL_MOODS) {
      const wanted = new Set(MOOD_SKIN_TAGS[mood]);
      for (const key of moodAlignedSkins(mood)) {
        const tag = MAIN_STREET_SKIN_TAGS[key]!;
        expect(tag.moods.some((m) => wanted.has(m))).toBe(true);
      }
    }
  });

  it('keeps a dark shop out of bright skins and vice versa', () => {
    const dark = moodAlignedSkins('dark');
    expect(dark).toContain('main-street-nightshade'); // occult, dark
    expect(dark).not.toContain('main-street-bubblegum'); // candy, loud
    expect(dark).not.toContain('main-street-pantry'); // bright, fresh

    const modern = moodAlignedSkins('modern');
    expect(modern).toContain('main-street-forge'); // industrial, modern
    expect(modern).not.toContain('main-street-ember'); // cozy, rustic
  });

  it('every returned key is a real skin', () => {
    for (const mood of ALL_MOODS) {
      for (const key of moodAlignedSkins(mood)) {
        expect(MAIN_STREET_SKIN_TAGS[key]).toBeDefined();
      }
    }
  });
});
