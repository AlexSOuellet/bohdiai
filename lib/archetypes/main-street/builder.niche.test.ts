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

describe('Main Street authoringSpec — voice and story arc', () => {
  it('asks the moment story to tell one arc across its lines', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toContain('tell one story');
    expect(spec).toMatch(/builds line to line|not four disconnected/);
  });

  it('tells Bohdi to rewrite any line that could appear on any shop', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toMatch(/could (appear|be) on any/);
  });

  it('bans the named AI-tell platitudes', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toContain('crafted with care');
    expect(spec).toContain('every piece tells a story');
  });
});

describe('Main Street authoringSpec — About treatment + find-us', () => {
  it('offers the About treatments including the card and tells Bohdi to pick one', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toMatch(/about treatment/);
    expect(spec).toContain('card');
  });

  it('tells Bohdi find-us is its own section he seeds and the maker can turn off', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toMatch(/find.?us/);
    expect(spec).toMatch(/own section|seed|sample dates/);
  });
});
