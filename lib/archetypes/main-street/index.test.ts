import { describe, it, expect } from 'vitest';
import { mainStreetArchetype } from './index';
import { MAIN_STREET_THEMES } from './themes';

describe('mainStreetArchetype', () => {
  it('has meta, schemas, themes, and arrangements', () => {
    expect(mainStreetArchetype.meta.key).toBe('main-street');
    expect(Object.keys(mainStreetArchetype.themes)).toHaveLength(4);
    expect(Object.keys(mainStreetArchetype.arrangements ?? {})).toEqual([
      'classic',
      'goods-first',
      'story-led',
    ]);
    expect(mainStreetArchetype.defaultArrangement).toBe('classic');
  });

  it('resolveTheme returns the matching theme', () => {
    const key = Object.keys(MAIN_STREET_THEMES)[0]!;
    expect(mainStreetArchetype.resolveTheme({ themeKey: key }).key).toBe(key);
  });

  it('resolveTheme throws on an unknown key', () => {
    expect(() => mainStreetArchetype.resolveTheme({ themeKey: 'nope' })).toThrow();
  });
});
