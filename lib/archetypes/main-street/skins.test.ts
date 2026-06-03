import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SKINS, MAIN_STREET_FONT_HREFS, type MainStreetRoles } from './skins';

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

  it('every skin is a three-voice type system (display, body, mono all distinct)', () => {
    for (const skin of Object.values(MAIN_STREET_SKINS)) {
      const t = skin.type as unknown as MainStreetRoles;
      const display = t.brand.family;
      const body = t.body.family;
      const mono = t.eyebrow.family;
      expect(new Set([display, body, mono]).size).toBe(3);
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
});
