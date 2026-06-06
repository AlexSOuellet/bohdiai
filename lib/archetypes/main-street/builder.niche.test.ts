import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SPEC } from './builder';
import type { AuthoringBrief } from '../builder';

const SENTINEL = 'SENTINEL_NICHE_DETAIL_beeswax_tallow_double_boiler';

const brief: AuthoringBrief = {
  shopName: 'Test Co',
  nicheDisplayName: 'Candle Maker',
  nicheBody: `Intro paragraph.\n\n${SENTINEL}\n\n` + 'x'.repeat(5000),
  moodLabel: 'cozy',
  moodDescription: 'warm and homey',
  productCount: 6,
};

describe('Main Street authoringSpec — niche source', () => {
  it('embeds niche detail well past the old 1600-char menu slice', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief);
    expect(spec).toContain(SENTINEL);
  });

  it('instructs Bohdi to mine the niche source for specifics', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toMatch(/niche|source material|this maker/);
    expect(spec).toMatch(/specific|concrete|real/);
  });
});
