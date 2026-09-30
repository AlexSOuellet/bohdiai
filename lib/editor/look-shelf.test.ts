import { describe, it, expect } from 'vitest';
import {
  FEELINGS,
  isKnownSkin,
  skinStyleSheet,
  feelingShelf,
  feelingForSkin,
} from './look-shelf';
import { moodAlignedSkins } from '@/lib/archetypes/main-street/skin-selection';
import { MAIN_STREET_SKINS } from '@/lib/archetypes/main-street/skins';
import type { ArchetypeTheme } from '@/lib/archetypes/types';

describe('FEELINGS', () => {
  it('is the six-feeling lineup in order', () => {
    expect(FEELINGS.map((f) => f.key)).toEqual([
      'dark',
      'rustic',
      'cozy',
      'modern',
      'elegant',
      'cheerful',
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

describe('skinStyleSheet — fallbacks for a sparse skin', () => {
  // A skin that declares the bare minimum: no onAccent, no contrast surface, no
  // description or font href on file, and only some of the three type voices. The
  // sheet must still build a whole card from sensible fallbacks, never undefined.
  const KEY = 'main-street-test-sparse';
  const base = MAIN_STREET_SKINS['main-street-ember']!;

  function withSkin(type: ArchetypeTheme['type'], fn: () => void): void {
    MAIN_STREET_SKINS[KEY] = {
      ...base,
      key: KEY,
      label: 'Sparse',
      palette: { bg: '#fff', fg: '#111', fgMuted: '#555', accent: '#c00', rule: '#ddd' },
      type,
    };
    try {
      fn();
    } finally {
      delete MAIN_STREET_SKINS[KEY];
    }
  }

  const role = (family: string, uppercase?: boolean): ArchetypeTheme['type'][string] => ({
    family,
    size: 16,
    weight: 400,
    lineHeight: 1.4,
    ...(uppercase !== undefined ? { uppercase } : {}),
  });

  it('paints on-accent text in the background colour and leaves the contrast surface null', () => {
    withSkin({ brand: role('Brand Face', true), body: role('Body Face'), navLabel: role('Label Face') }, () => {
      const sheet = skinStyleSheet(KEY);
      expect(sheet.palette.onAccent).toBe('#fff');
      expect(sheet.palette.contrastBg).toBeNull();
      expect(sheet.palette.contrastFg).toBeNull();
      expect(sheet.description).toBe('');
      expect(sheet.fontHref).toBe('');
      expect(sheet.fonts).toEqual({ display: 'Brand Face', displayUppercase: true, body: 'Body Face', label: 'Label Face' });
    });
  });

  it('falls back to the body voice for display and label when those roles are missing', () => {
    withSkin({ body: role('Body Face') }, () => {
      expect(skinStyleSheet(KEY).fonts).toEqual({
        display: 'Body Face',
        displayUppercase: false,
        body: 'Body Face',
        label: 'Body Face',
      });
    });
  });

  it('falls back to generic families when the skin declares no type voices at all', () => {
    withSkin({}, () => {
      expect(skinStyleSheet(KEY).fonts).toEqual({
        display: 'serif',
        displayUppercase: false,
        body: 'sans-serif',
        label: 'monospace',
      });
    });
  });

  it('a skin on the shelf but in no feeling has no current feeling', () => {
    withSkin({}, () => {
      expect(isKnownSkin(KEY)).toBe(true);
      expect(feelingForSkin(KEY)).toBeNull();
    });
  });
});
