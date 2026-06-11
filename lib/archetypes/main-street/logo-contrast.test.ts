import { describe, it, expect } from 'vitest';
import {
  relativeLuminance, dominantBrandColor, logoTone, readableOn, navContrast, applyAccentOverride,
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

describe('applyAccentOverride', () => {
  const skin = { palette: { bg: '#fff', fg: '#111', fgMuted: '#666', accent: '#0a0', rule: '#ddd' } } as never;
  it('swaps the accent and recomputes readable on-accent text', () => {
    const out = applyAccentOverride(skin, '#1d3a2e');
    expect(out.palette.accent).toBe('#1d3a2e');
    expect(out.palette.onAccent).toBe('#ffffff');
  });
  it('returns the skin untouched when there is no override', () => {
    expect(applyAccentOverride(skin, undefined)).toBe(skin);
  });
});
