import { describe, it, expect } from 'vitest';
import {
  FEELINGS,
  isKnownSkin,
  skinStyleSheet,
  feelingShelf,
  feelingForSkin,
} from './look-shelf';
import { moodAlignedSkins } from '@/lib/archetypes/main-street/skin-selection';

describe('FEELINGS', () => {
  it('is the seven-feeling lineup in order', () => {
    expect(FEELINGS.map((f) => f.key)).toEqual([
      'dark',
      'rustic',
      'cozy',
      'modern',
      'elegant',
      'cheerful',
      'industrial',
    ]);
  });
});

describe('isKnownSkin', () => {
  it('is true for a real skin and false otherwise', () => {
    expect(isKnownSkin('main-street-ember')).toBe(true);
    expect(isKnownSkin('main-street-not-a-skin')).toBe(false);
    expect(isKnownSkin('')).toBe(false);
  });
});

describe('skinStyleSheet', () => {
  it('lifts the palette and the three real font voices from the skin', () => {
    const sheet = skinStyleSheet('main-street-ember');
    expect(sheet.label).toBe('Ember');
    expect(sheet.palette.bg).toBe('#F4EAD7');
    expect(sheet.palette.accent).toBe('#C8431B');
    expect(sheet.palette.contrastBg).toBe('#1C120B');
    expect(sheet.fonts.display).toContain('Instrument Serif');
    expect(sheet.fonts.body).toContain('Inter');
    expect(sheet.fonts.label).toContain('IBM Plex Mono');
    expect(sheet.fontHref).toContain('fonts.googleapis.com');
    expect(sheet.description.length).toBeGreaterThan(0);
  });

  it('throws on an unknown skin so a typo never renders an empty card', () => {
    expect(() => skinStyleSheet('nope')).toThrow();
  });
});

describe('feelingShelf', () => {
  it('returns every feeling a coherent shelf of full style sheets', () => {
    for (const f of FEELINGS) {
      const shelf = feelingShelf(f.key);
      expect(shelf.length).toBeGreaterThanOrEqual(4);
      // Each sheet matches the gated subset and carries real fonts + colors.
      expect(shelf.map((s) => s.key)).toEqual(moodAlignedSkins(f.key));
      for (const s of shelf) {
        expect(s.palette.bg).toMatch(/^#|rgb/);
        expect(s.fonts.display.length).toBeGreaterThan(0);
        expect(s.fontHref).toContain('fonts.googleapis.com');
      }
    }
  });

  it('never offers a dark skin under a non-dark feeling', () => {
    expect(feelingShelf('cheerful').map((s) => s.key)).not.toContain('main-street-nightshade');
  });
});

describe('feelingForSkin', () => {
  it('finds the feeling a current skin belongs to', () => {
    expect(feelingForSkin('main-street-nightshade')).toBe('dark');
    // Ember is tagged rustic + cozy; the first in lineup order is rustic.
    expect(feelingForSkin('main-street-ember')).toBe('rustic');
  });

  it('returns null for an unknown skin', () => {
    expect(feelingForSkin('main-street-nope')).toBeNull();
  });
});
