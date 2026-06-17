import { describe, it, expect } from 'vitest';
import {
  relativeLuminance, dominantBrandColor, logoTone, readableOn, navContrast,
  applyAccentOverride, isAchromatic, contrastRatio, pickBrandColorForSkin,
} from './logo-contrast';

describe('relativeLuminance', () => {
  it('is ~0 for black and ~1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 2);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 2);
  });
});

describe('dominantBrandColor', () => {
  it('returns the first valid hex, prominence-ordered', () => {
    expect(dominantBrandColor(['#1d7a66', '#e7d8b0'])).toBe('#1d7a66');
  });
  it('skips invalid entries and returns undefined when none valid', () => {
    expect(dominantBrandColor(['nope', '#zzzzzz'])).toBeUndefined();
    expect(dominantBrandColor([])).toBeUndefined();
  });
});

describe('logoTone', () => {
  it('reads a dark dominant ink as dark, a light one as light', () => {
    expect(logoTone(['#1a1a1a'])).toBe('dark');
    expect(logoTone(['#f3ead8'])).toBe('light');
  });
  it('is unknown when there is no usable color', () => {
    expect(logoTone([])).toBe('unknown');
  });
});

describe('readableOn', () => {
  it('puts dark text on a light fill and light text on a dark fill', () => {
    expect(readableOn('#f3ead8')).toBe('#1a1a1a');
    expect(readableOn('#1d3a2e')).toBe('#ffffff');
  });
});

describe('navContrast', () => {
  it('returns null (bare) when the logo tone contrasts the backdrop', () => {
    expect(navContrast('light', 'dark')).toBeNull();
    expect(navContrast('dark', 'light')).toBeNull();
  });
  it('returns null (status quo) when the tone is unknown', () => {
    expect(navContrast('unknown', 'dark')).toBeNull();
  });
  it('returns a light surface for a dark logo on a dark backdrop', () => {
    expect(navContrast('dark', 'dark')).toEqual({ bg: '#F7F5F2', fg: '#1a1a1a' });
  });
  it('returns a dark surface for a light logo on a light backdrop', () => {
    expect(navContrast('light', 'light')).toEqual({ bg: '#1b1b1b', fg: '#F7F5F2' });
  });
});

describe('isAchromatic', () => {
  it('treats pure black as achromatic', () => {
    expect(isAchromatic('#000000')).toBe(true);
  });
  it('treats pure white as achromatic', () => {
    expect(isAchromatic('#ffffff')).toBe(true);
  });
  it('treats mid gray as achromatic', () => {
    expect(isAchromatic('#808080')).toBe(true);
  });
  it('treats dark near-black gray as achromatic', () => {
    expect(isAchromatic('#333333')).toBe(true);
  });
  it('treats a real teal as chromatic', () => {
    expect(isAchromatic('#1d7a66')).toBe(false);
  });
  it('treats a dark forest green as chromatic', () => {
    expect(isAchromatic('#1d3a2e')).toBe(false);
  });
});

describe('contrastRatio', () => {
  it('black vs white is ~21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
  it('same color vs itself is ~1', () => {
    expect(contrastRatio('#1d3a2e', '#1d3a2e')).toBeCloseTo(1, 0);
  });
});

describe('pickBrandColorForSkin', () => {
  it('returns the first valid hex that clears contrast against a light bg', () => {
    expect(pickBrandColorForSkin(['#1d3a2e', '#e7d8b0'], '#ffffff')).toBe('#1d3a2e');
  });

  it('SKIPS the dominant color when it has insufficient contrast and returns the next', () => {
    // The session-40 Rhody Strong case: navy is dominant, gold is next.
    // Against a dark Hearthstone-like bg, navy fails contrast and gold wins.
    expect(pickBrandColorForSkin(['#0b2447', '#d4a017'], '#1c120b')).toBe('#d4a017');
  });

  it('skips achromatic dominant (gray/black/white) and picks the next chromatic that contrasts', () => {
    expect(pickBrandColorForSkin(['#000000', '#1d7a66'], '#ffffff')).toBe('#1d7a66');
    expect(pickBrandColorForSkin(['#808080', '#c8431b'], '#ffffff')).toBe('#c8431b');
  });

  it('skips invalid hex entries and picks the next valid one that contrasts', () => {
    expect(pickBrandColorForSkin(['not-a-color', '#zzzzzz', '#1d3a2e'], '#ffffff')).toBe('#1d3a2e');
  });

  it('returns undefined when NO color clears contrast (skin accent stands)', () => {
    // Pale cream colors against a cream bg — none clears 3:1.
    expect(pickBrandColorForSkin(['#f1e7d2', '#ece0c0'], '#f4f1ea')).toBeUndefined();
  });

  it('returns undefined for an empty list', () => {
    expect(pickBrandColorForSkin([], '#ffffff')).toBeUndefined();
  });

  it('returns undefined when every entry is achromatic', () => {
    expect(pickBrandColorForSkin(['#000000', '#ffffff', '#888888'], '#f4f1ea')).toBeUndefined();
  });
});

describe('applyAccentOverride', () => {
  // Fixture includes palette.bg so contrast guard can be applied.
  const skin = {
    palette: {
      bg: '#ffffff',
      fg: '#111111',
      fgMuted: '#666666',
      accent: '#0a0a0a',
      rule: '#dddddd',
    },
  } as never;

  it('swaps the accent and recomputes readable on-accent text', () => {
    // '#1d3a2e' is chromatic and has high contrast against white — must swap.
    const out = applyAccentOverride(skin, '#1d3a2e');
    expect(out.palette.accent).toBe('#1d3a2e');
    expect(out.palette.onAccent).toBe('#ffffff');
  });

  it('returns the skin untouched (same reference) when there is no override', () => {
    expect(applyAccentOverride(skin, undefined)).toBe(skin);
  });

  it('returns the skin unchanged when the accent is achromatic (gray)', () => {
    expect(applyAccentOverride(skin, '#808080')).toBe(skin);
  });

  it('returns the skin unchanged when the accent is pale and low-contrast on the bg', () => {
    // '#ece0c0' on '#f4f1ea' — chromatic but contrast ratio well below 3.
    const lightSkin = {
      palette: {
        bg: '#f4f1ea',
        fg: '#111111',
        fgMuted: '#666666',
        accent: '#0a0a0a',
        rule: '#dddddd',
      },
    } as never;
    expect(applyAccentOverride(lightSkin, '#ece0c0')).toBe(lightSkin);
  });

  it('swaps a good colored accent that has enough contrast against a cream bg', () => {
    const creamSkin = {
      palette: {
        bg: '#f4f1ea',
        fg: '#111111',
        fgMuted: '#666666',
        accent: '#0a0a0a',
        rule: '#dddddd',
      },
    } as never;
    const out = applyAccentOverride(creamSkin, '#1d3a2e');
    expect(out.palette.accent).toBe('#1d3a2e');
    expect(out.palette.onAccent).toBe('#ffffff');
  });
});
