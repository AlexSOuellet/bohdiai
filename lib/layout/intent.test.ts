import { describe, it, expect } from 'vitest';
import { DensitySchema, IntentSchema } from './intent';

describe('DensitySchema', () => {
  it('accepts each valid value', () => {
    for (const v of ['compact', 'normal', 'generous'] as const) {
      expect(DensitySchema.parse(v)).toBe(v);
    }
  });

  it('rejects unknown values', () => {
    expect(DensitySchema.safeParse('roomy').success).toBe(false);
  });

  it('rejects non-strings', () => {
    expect(DensitySchema.safeParse(1).success).toBe(false);
  });
});

describe('IntentSchema', () => {
  it('accepts an empty object', () => {
    expect(IntentSchema.parse({})).toEqual({});
  });

  it('accepts a fully populated intent', () => {
    const intent = {
      palette: 'warm',
      type: 'hero',
      texture: 'paper',
      density: 'normal' as const,
    };
    expect(IntentSchema.parse(intent)).toEqual(intent);
  });

  it('rejects empty string for palette', () => {
    expect(IntentSchema.safeParse({ palette: '' }).success).toBe(false);
  });

  it('rejects empty string for type', () => {
    expect(IntentSchema.safeParse({ type: '' }).success).toBe(false);
  });

  it('rejects empty string for texture', () => {
    expect(IntentSchema.safeParse({ texture: '' }).success).toBe(false);
  });

  it('rejects unknown density value', () => {
    expect(IntentSchema.safeParse({ density: 'huge' }).success).toBe(false);
  });

  it('rejects unknown keys (strict)', () => {
    expect(IntentSchema.safeParse({ palette: 'warm', extra: 'no' }).success).toBe(false);
  });

  it('rejects non-string palette', () => {
    expect(IntentSchema.safeParse({ palette: 5 }).success).toBe(false);
  });
});
