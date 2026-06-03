import { describe, it, expect } from 'vitest';
import { MAIN_STREET_THEMES } from './themes';

describe('MAIN_STREET_THEMES', () => {
  it('ships four themes', () => {
    expect(Object.keys(MAIN_STREET_THEMES)).toHaveLength(4);
  });

  it('each theme has a complete color pair and the required type roles', () => {
    const roles = [
      'wordmark',
      'tagline',
      'nav',
      'label',
      'heroHead',
      'makerHead',
      'title',
      'body',
      'price',
      'caption',
    ];
    for (const [key, theme] of Object.entries(MAIN_STREET_THEMES)) {
      expect(theme.key, key).toBe(key);
      for (const c of ['bg', 'fg', 'fgMuted', 'accent', 'rule'] as const) {
        expect(theme.palette[c], `${key}.${c}`).toMatch(/^#/);
      }
      for (const r of roles) {
        expect(theme.type[r], `${key}.type.${r}`).toBeTruthy();
      }
      expect(theme.spacing.section).toBeGreaterThan(0);
      expect(theme.motion.reveal.duration).toBeGreaterThan(0);
    }
  });
});
