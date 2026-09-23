import { describe, it, expect, vi, beforeEach } from 'vitest';

const error = vi.fn();
vi.mock('@/lib/logger', () => ({ logger: { error, warn: vi.fn(), info: vi.fn() } }));

const { readBrandPalette } = await import('./brand-palette');

describe('readBrandPalette', () => {
  beforeEach(() => error.mockClear());

  it('returns undefined quietly when the envelope has none', () => {
    expect(readBrandPalette({}, 't1')).toBeUndefined();
    expect(error).not.toHaveBeenCalled();
  });

  it('returns the palette when valid', () => {
    expect(readBrandPalette({ brandPalette: { base: '#0b0b0b', accent: '#3dae3f' } }, 't1'))
      .toEqual({ base: '#0b0b0b', accent: '#3dae3f' });
  });

  it('falls back to the mood colors and logs when the stored value is broken', () => {
    expect(readBrandPalette({ brandPalette: { base: 'green' } }, 't1')).toBeUndefined();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('brandPalette'), { tenantId: 't1' });
  });
});
