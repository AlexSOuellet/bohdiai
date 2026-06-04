import { describe, it, expect } from 'vitest';
import {
  characterFor,
  selectSkin,
  selectStorefront,
  usesArchetypeEngine,
} from './select-storefront';
import { MAIN_STREET_SKIN_TAGS } from '@/lib/archetypes/main-street/skins';

describe('selection', () => {
  it('classifies niches into characters', () => {
    expect(characterFor('leatherworker')).toBe('rugged');
    expect(characterFor('jewelry_maker')).toBe('delicate');
    expect(characterFor('baker')).toBe('homey');
    // unknown niche falls back to homey, never throws
    expect(characterFor('something_new')).toBe('homey');
  });

  it('selectSkin is deterministic and stays within the character', () => {
    for (const mood of ['dark', 'rustic', 'cozy', 'botanical', 'sunset', 'simple', 'modern'] as const) {
      for (const character of ['homey', 'rugged', 'delicate'] as const) {
        const a = selectSkin(character, mood);
        const b = selectSkin(character, mood);
        expect(a).toBe(b); // deterministic
        expect(MAIN_STREET_SKIN_TAGS[a]?.character).toBe(character); // matches character
      }
    }
  });

  it('a rugged niche in a dark mood gets a rugged skin', () => {
    const s = selectStorefront('leatherworker', 'rustic', 12);
    expect(s.archetypeKey).toBe('main-street');
    expect(s.character).toBe('rugged');
    expect(MAIN_STREET_SKIN_TAGS[s.skinKey]?.character).toBe('rugged');
  });

  it('a delicate niche gets a delicate skin', () => {
    const s = selectStorefront('jewelry_maker', 'modern', 8);
    expect(MAIN_STREET_SKIN_TAGS[s.skinKey]?.character).toBe('delicate');
  });

  it('gates which niches use the new engine', () => {
    expect(usesArchetypeEngine('leatherworker')).toBe(true);
    expect(usesArchetypeEngine('candles')).toBe(false); // stays on its existing path
  });
});
