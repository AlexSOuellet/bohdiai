import { describe, it, expect } from 'vitest';
import { readStoredTexture, normaliseTexture, resolveTextureParams } from './texture';

describe('readStoredTexture', () => {
  it('reads a family-default setting with an opacity override', () => {
    expect(readStoredTexture({ mode: 'default', opacity: 0.4 })).toEqual({ mode: 'default', opacity: 0.4 });
  });

  it('reads a family-default setting with no opacity override', () => {
    expect(readStoredTexture({ mode: 'default', opacity: null })).toEqual({ mode: 'default', opacity: null });
    expect(readStoredTexture({ mode: 'default' })).toEqual({ mode: 'default', opacity: null });
  });

  it('reads a no-texture setting and forces its opacity to null', () => {
    expect(readStoredTexture({ mode: 'none', opacity: 0.4 })).toEqual({ mode: 'none', opacity: null });
  });

  it('clamps an out-of-range opacity into 0.05–1', () => {
    expect(readStoredTexture({ mode: 'default', opacity: 0 })).toEqual({ mode: 'default', opacity: 0.05 });
    expect(readStoredTexture({ mode: 'default', opacity: 5 })).toEqual({ mode: 'default', opacity: 1 });
  });

  it('drops a non-finite opacity to null', () => {
    expect(readStoredTexture({ mode: 'default', opacity: 'loud' })).toEqual({ mode: 'default', opacity: null });
    expect(readStoredTexture({ mode: 'default', opacity: Number.NaN })).toEqual({ mode: 'default', opacity: null });
  });

  it('returns null for an unknown mode or a malformed value', () => {
    expect(readStoredTexture({ mode: 'blend', opacity: 0.3 })).toBeNull();
    expect(readStoredTexture({})).toBeNull();
    expect(readStoredTexture(null)).toBeNull();
    expect(readStoredTexture('none')).toBeNull();
    expect(readStoredTexture([])).toBeNull();
  });
});

describe('normaliseTexture', () => {
  it('passes a valid setting through', () => {
    expect(normaliseTexture({ mode: 'none', opacity: null })).toEqual({ mode: 'none', opacity: null });
  });

  it('falls back to the family default for anything malformed', () => {
    expect(normaliseTexture({ mode: 'nope' })).toEqual({ mode: 'default', opacity: null });
    expect(normaliseTexture(undefined)).toEqual({ mode: 'default', opacity: null });
  });
});

describe('resolveTextureParams', () => {
  it('passes editor preview params straight through when present', () => {
    // A saved setting is ignored while the editor is previewing.
    expect(resolveTextureParams('none', undefined, { mode: 'default', opacity: 0.5 })).toEqual({
      previewTexture: 'none',
      previewTextureOpacity: undefined,
    });
    expect(resolveTextureParams('default', 0.6, { mode: 'none', opacity: null })).toEqual({
      previewTexture: 'default',
      previewTextureOpacity: 0.6,
    });
  });

  it('applies a saved no-texture setting on a normal visit', () => {
    expect(resolveTextureParams(undefined, undefined, { mode: 'none', opacity: null })).toEqual({
      previewTexture: 'none',
      previewTextureOpacity: undefined,
    });
  });

  it('applies a saved family-default setting, with and without a dialed strength', () => {
    expect(resolveTextureParams(undefined, undefined, { mode: 'default', opacity: 0.35 })).toEqual({
      previewTexture: 'default',
      previewTextureOpacity: 0.35,
    });
    expect(resolveTextureParams(undefined, undefined, { mode: 'default', opacity: null })).toEqual({
      previewTexture: 'default',
      previewTextureOpacity: undefined,
    });
  });

  it('leaves both params undefined for a store with no saved texture (family default)', () => {
    expect(resolveTextureParams(undefined, undefined, undefined)).toEqual({
      previewTexture: undefined,
      previewTextureOpacity: undefined,
    });
    expect(resolveTextureParams(undefined, undefined, { mode: 'legacy' })).toEqual({
      previewTexture: undefined,
      previewTextureOpacity: undefined,
    });
  });
});
