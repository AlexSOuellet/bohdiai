import { describe, it, expect } from 'vitest';
import { MOODS, MOOD_LIST, isMoodKey, resolvePreviewMood, type MoodKey } from './moods';

describe('MOODS', () => {
  it('has all six canonical feelings', () => {
    const expected: MoodKey[] = [
      'dark',
      'rustic',
      'cozy',
      'modern',
      'elegant',
      'cheerful',
    ];
    for (const k of expected) {
      expect(MOODS[k]).toBeDefined();
      expect(MOODS[k].key).toBe(k);
    }
    expect(MOOD_LIST.length).toBe(expected.length);
  });

  it('has retired the color-as-mood keys (botanical / sunset / simple) and industrial', () => {
    const keys = Object.keys(MOODS);
    expect(keys).not.toContain('botanical');
    expect(keys).not.toContain('sunset');
    expect(keys).not.toContain('simple');
    expect(keys).not.toContain('industrial');
  });

  it('every entry has a non-empty label and a feel-based description (no craft lists)', () => {
    for (const m of Object.values(MOODS)) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      // The old descriptions opened "For makers whose work…" and listed crafts.
      // The new ones describe the feeling, never who it's "for".
      expect(m.description.toLowerCase()).not.toContain('for makers');
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

describe('isMoodKey', () => {
  it('accepts real mood keys and rejects everything else', () => {
    expect(isMoodKey('rustic')).toBe(true);
    expect(isMoodKey('cheerful')).toBe(true);
    expect(isMoodKey('industrial')).toBe(false); // retired
    expect(isMoodKey('nonsense')).toBe(false);
    expect(isMoodKey(undefined)).toBe(false);
    expect(isMoodKey(42)).toBe(false);
  });
});

describe('resolvePreviewMood', () => {
  it('uses a valid preview feeling so the preview reflects it', () => {
    expect(resolvePreviewMood('modern', 'rustic')).toBe('modern');
  });

  it('falls back to the stored feeling when the preview one is unknown', () => {
    expect(resolvePreviewMood('bogus', 'rustic')).toBe('rustic');
  });

  it('falls back to the stored feeling when there is no preview feeling', () => {
    expect(resolvePreviewMood(undefined, 'cozy')).toBe('cozy');
  });

  it('returns undefined when neither is a usable feeling', () => {
    expect(resolvePreviewMood(undefined, undefined)).toBeUndefined();
    expect(resolvePreviewMood('bogus', undefined)).toBeUndefined();
  });
});
