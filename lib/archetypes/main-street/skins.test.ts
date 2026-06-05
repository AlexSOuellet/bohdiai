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

  const WORLDS = ['Hearth', 'Workshop', 'Fine', 'Garden', 'Studio', 'Mystic', 'Playroom', 'Press', 'Relic'];

  it('tags every skin with a world and at least one mood', () => {
    for (const key of Object.keys(MAIN_STREET_SKINS)) {
      const tag = MAIN_STREET_SKIN_TAGS[key];
      expect(tag).toBeTruthy();
      expect(WORLDS).toContain(tag!.world);
      expect(tag!.moods.length).toBeGreaterThan(0);
    }
  });

  it('fills every one of the nine maker-worlds', () => {
    const worlds = new Set(Object.values(MAIN_STREET_SKIN_TAGS).map((t) => t.world));
    expect(worlds).toEqual(new Set(WORLDS));
  });

  it('goes deep — every world carries at least three skins', () => {
    const counts = new Map<string, number>();
    for (const tag of Object.values(MAIN_STREET_SKIN_TAGS)) {
      counts.set(tag.world, (counts.get(tag.world) ?? 0) + 1);
    }
    for (const world of WORLDS) {
      expect(counts.get(world) ?? 0).toBeGreaterThanOrEqual(3);
    }
  });

  it('holds the no-cousins line — no two skins share a display face', () => {
    const displays = Object.values(MAIN_STREET_SKINS).map((s) => (s.type as unknown as MainStreetRoles).brand.family);
    expect(new Set(displays).size).toBe(displays.length);
  });
});
