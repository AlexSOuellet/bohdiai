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

  it('directs Bohdi to use the niche source to understand WHO buys and WHY', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toMatch(/who buys/);
    expect(spec).toMatch(/store-bought|store bought/);
  });
});

describe('Main Street authoringSpec — voice and story arc', () => {
  it('asks the moment story to tell one arc across its lines', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toContain('tell one story');
    expect(spec).toMatch(/builds line to line|not four disconnected/);
  });

  it('directs selling the store emotionally, not the maker process', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toContain('sell the store emotionally');
    expect(spec).toMatch(/no process|process or materials/);
  });

  it('keeps copy at the category level, not a narrow sub-type', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toContain('category level');
    expect(spec).toContain('soy candle maker');
  });

  it('directs the Moment image to be cinematic and carry emotion, not a literal product shot', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toContain('cinematic');
    expect(spec).toMatch(/carry emotion|carry the emotion/);
    expect(spec).toMatch(/not a literal product/);
  });

  it('prefers a held video for the Moment — motion is the signature wow', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toMatch(/prefer a held video/);
    expect(spec).toMatch(/choose a still only/);
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
