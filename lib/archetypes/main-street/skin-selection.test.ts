import { describe, it, expect } from 'vitest';
import { moodAlignedSkins } from './skin-selection';
import { MAIN_STREET_SKIN_TAGS } from './skins';
import { MOODS, type MoodKey } from '@/lib/moods';

const ALL_MOODS = Object.keys(MOODS) as MoodKey[];

describe('moodAlignedSkins (the D41 skin gate)', () => {
  it('gives every feeling a real shelf (>=5 skins) and never the whole shelf by accident', () => {
    const total = Object.keys(MAIN_STREET_SKIN_TAGS).length;
    for (const mood of ALL_MOODS) {
      const subset = moodAlignedSkins(mood);
      expect(subset.length).toBeGreaterThanOrEqual(5);
      expect(subset.length).toBeLessThan(total); // a genuine gate, not a pass-through
    }
  });

  it('only returns skins tagged with that feeling (direct membership)', () => {
    for (const mood of ALL_MOODS) {
      for (const key of moodAlignedSkins(mood)) {
        const tag = MAIN_STREET_SKIN_TAGS[key]!;
        expect(tag.moods).toContain(mood);
      }
    }
  });

  it('keeps a dark shop out of playful skins and a modern shop out of cozy ones', () => {
    const dark = moodAlignedSkins('dark');
    expect(dark).toContain('main-street-nightshade');
    expect(dark).not.toContain('main-street-bubblegum'); // playful
    expect(dark).not.toContain('main-street-pantry'); // cozy / playful

    const modern = moodAlignedSkins('modern');
    expect(modern).toContain('main-street-forge'); // industrial, modern
    expect(modern).not.toContain('main-street-ember'); // rustic, cozy
  });

  it('every skin is reachable by at least one feeling (no orphans)', () => {
    const reachable = new Set<string>();
    for (const mood of ALL_MOODS) for (const key of moodAlignedSkins(mood)) reachable.add(key);
    expect(reachable.size).toBe(Object.keys(MAIN_STREET_SKIN_TAGS).length);
  });
});
