import { describe, it, expect } from 'vitest';
import type { Page } from './layout';
import { checkBandMonotony, scoreSlop, MAX_CONSECUTIVE_BANDS } from './slop-floor';

// Build a home page whose root stack holds the given sequence of node types.
// The monotony check only inspects node.type at the top level, so minimal
// nodes are enough.
function pageFromTopLevel(types: string[]): Page {
  return {
    slug: 'home',
    name: 'Home',
    root: {
      type: 'stack',
      children: types.map((t) => ({ type: t, children: [] })),
    },
  } as unknown as Page;
}

describe('checkBandMonotony', () => {
  it('flags a top-level stack of many consecutive bands (the "stacked" tell)', () => {
    const page = pageFromTopLevel(Array(8).fill('band'));
    const finding = checkBandMonotony(page);
    expect(finding).not.toBeNull();
    expect(finding?.message).toMatch(/8/);
  });

  it('passes when non-band sections break the rhythm', () => {
    const page = pageFromTopLevel(['band', 'split', 'band', 'overlap', 'band', 'grid']);
    expect(checkBandMonotony(page)).toBeNull();
  });

  it('passes a run exactly at the threshold', () => {
    const page = pageFromTopLevel(Array(MAX_CONSECUTIVE_BANDS).fill('band'));
    expect(checkBandMonotony(page)).toBeNull();
  });

  it('flags a run one past the threshold', () => {
    const page = pageFromTopLevel(Array(MAX_CONSECUTIVE_BANDS + 1).fill('band'));
    expect(checkBandMonotony(page)).not.toBeNull();
  });

  it('counts only the longest consecutive run, not the total', () => {
    // 3 bands, break, 3 bands — longest run is 3, under the threshold of 4.
    const page = pageFromTopLevel(['band', 'band', 'band', 'split', 'band', 'band', 'band']);
    expect(checkBandMonotony(page)).toBeNull();
  });

  it('returns null when the root is not a stack', () => {
    const page = {
      slug: 'home',
      name: 'Home',
      root: { type: 'band', children: [] },
    } as unknown as Page;
    expect(checkBandMonotony(page)).toBeNull();
  });
});

describe('scoreSlop', () => {
  it('fails a page that trips a check and lists the finding', () => {
    const report = scoreSlop(pageFromTopLevel(Array(8).fill('band')));
    expect(report.passed).toBe(false);
    expect(report.findings.some((f) => f.check === 'band-stack-monotony')).toBe(true);
  });

  it('passes a page with no slop tells', () => {
    const report = scoreSlop(pageFromTopLevel(['band', 'split', 'band', 'overlap']));
    expect(report.passed).toBe(true);
    expect(report.findings).toHaveLength(0);
  });
});
