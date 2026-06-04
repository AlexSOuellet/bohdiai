import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SKINS, MAIN_STREET_FONT_HREFS, MAIN_STREET_SKIN_TAGS, type MainStreetRoles } from './skins';

describe('MAIN_STREET_SKINS', () => {
  it('ships skin #1 (ember)', () => {
    expect(MAIN_STREET_SKINS['main-street-ember']).toBeTruthy();
  });

  it('every skin carries a second contrast surface with its own readable text', () => {
    for (const skin of Object.values(MAIN_STREET_SKINS)) {
      expect(skin.palette.contrast).toBeTruthy();
      expect(skin.palette.contrast!.bg).toBeTruthy();
      expect(skin.palette.contrast!.fg).toBeTruthy();
      expect(skin.palette.contrast!.fgMuted).toBeTruthy();
    }
  });

  it('every skin has real type fabric: display differs from body, and a distinct label voice', () => {
    // "Fonts are fabric" — a single font is no material. The hard guarantee is a
    // dramatic display face against a clean body face. The label/mono voice is a
    // third voice EITHER by a distinct family OR by an uppercase treatment
    // (the restrained one-serif-plus-one-sans pattern used by delicate skins).
    for (const skin of Object.values(MAIN_STREET_SKINS)) {
      const t = skin.type as unknown as MainStreetRoles;
      const display = t.brand.family;
      const body = t.body.family;
      const label = t.eyebrow.family;
      expect(display).not.toBe(body);
      const distinctLabel = label !== body || t.eyebrow.uppercase === true;
      expect(distinctLabel).toBe(true);
    }
  });

  it('defines every required role', () => {
    const required = [
      'wordmark', 'brand', 'storyline', 'goodsHead', 'title', 'cardTitle', 'quote', 'closeHead',
      'eyebrow', 'navLabel', 'price', 'day', 'sig', 'legal', 'body', 'caption', 'where',
    ];
    for (const skin of Object.values(MAIN_STREET_SKINS)) {
      for (const r of required) expect(skin.type[r]).toBeTruthy();
    }
  });

  it('provides a font href for every skin', () => {
    for (const key of Object.keys(MAIN_STREET_SKINS)) {
      expect(MAIN_STREET_FONT_HREFS[key]).toBeTruthy();
    }
  });

  it('tags every skin with a character and at least one mood', () => {
    for (const key of Object.keys(MAIN_STREET_SKINS)) {
      const tag = MAIN_STREET_SKIN_TAGS[key];
      expect(tag).toBeTruthy();
      expect(['homey', 'rugged', 'delicate']).toContain(tag!.character);
      expect(tag!.moods.length).toBeGreaterThan(0);
    }
  });

  it('spans all three characters on the shelf', () => {
    const characters = new Set(Object.values(MAIN_STREET_SKIN_TAGS).map((t) => t.character));
    expect(characters).toEqual(new Set(['homey', 'rugged', 'delicate']));
  });
});
