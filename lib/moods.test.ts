import { describe, it, expect } from 'vitest';
import { MOODS, MOOD_LIST, type MoodKey } from './moods';

describe('MOODS', () => {
  it('has all seven canonical moods', () => {
    const expected: MoodKey[] = [
      'dark',
      'rustic',
      'cozy',
      'botanical',
      'sunset',
      'simple',
      'modern',
    ];
    for (const k of expected) {
      expect(MOODS[k]).toBeDefined();
      expect(MOODS[k].key).toBe(k);
    }
  });

  it('every entry has a non-empty label and description', () => {
    for (const m of Object.values(MOODS)) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
    }
  });

  it('every entry key matches its record key', () => {
    for (const [k, v] of Object.entries(MOODS)) {
      expect(v.key).toBe(k);
    }
  });
});

describe('MOOD_LIST', () => {
  it('contains the same number of items as MOODS', () => {
    expect(MOOD_LIST.length).toBe(Object.keys(MOODS).length);
  });

  it('is derived from MOODS values', () => {
    const keys = MOOD_LIST.map((m) => m.key).sort();
    const expected = Object.keys(MOODS).sort();
    expect(keys).toEqual(expected);
  });
});
