import { describe, expect, it } from 'vitest';
import { buildHeadlineRow } from './headline-form';
import { MOMENT_LIMITS } from './moment-form';

describe('buildHeadlineRow', () => {
  it('keeps the two lines, tidied to one line each', () => {
    expect(buildHeadlineRow({ headline: '  Classic   Loafs ', sub: 'Bread from\na wood oven ' })).toEqual({
      ok: true,
      row: { headline: 'Classic Loafs', sub: 'Bread from a wood oven' },
    });
  });

  it('a blank line under it shows none', () => {
    expect(buildHeadlineRow({ headline: 'Classic Loafs', sub: '   ' })).toEqual({ ok: true, row: { headline: 'Classic Loafs', sub: null } });
  });

  it('needs a headline', () => {
    expect(buildHeadlineRow({ headline: ' ', sub: 'x' })).toEqual({
      ok: false,
      error: 'Add your headline. It’s the big words at the top of your home page.',
    });
  });

  it('names the line that runs long and by how much', () => {
    const long = 'a'.repeat(MOMENT_LIMITS.headline + 1);
    expect(buildHeadlineRow({ headline: long, sub: '' })).toEqual({
      ok: false,
      error: `The headline is ${long.length} characters. Keep it to ${MOMENT_LIMITS.headline}.`,
    });
    const sub = 'b'.repeat(MOMENT_LIMITS.sub + 2);
    expect(buildHeadlineRow({ headline: 'x', sub })).toEqual({
      ok: false,
      error: `The line under the headline is ${sub.length} characters. Keep it to ${MOMENT_LIMITS.sub}.`,
    });
  });
});
