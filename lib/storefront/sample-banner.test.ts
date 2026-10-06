import { describe, it, expect } from 'vitest';
import { sampleBannerFor } from './sample-banner';
import { SAMPLES, CLIENTS } from '@/lib/site/work';

describe('sampleBannerFor', () => {
  it('names the plan each sample shows and links to the maker plans', () => {
    expect(sampleBannerFor('rustic-rhody')).toEqual({ label: 'Showcase sample', href: 'https://bohdiai.com/makers#plans' });
    expect(sampleBannerFor('classic-loafs')?.label).toBe('Lite sample');
    expect(sampleBannerFor('twilight-to-darkness')?.label).toBe('Full sample');
    expect(sampleBannerFor('paper-and-patina')?.label).toBe('Showcase sample');
    expect(sampleBannerFor('ember-and-pine')?.label).toBe('Showcase sample');
  });

  it('labels the contractor samples and links them to the contractor plans', () => {
    expect(sampleBannerFor('true-coat-painting')).toEqual({ label: 'Contractor Full sample', href: 'https://bohdiai.com/contractors#plans' });
    expect(sampleBannerFor('halfmoon-roofing')).toEqual({ label: 'Contractor Lite sample', href: 'https://bohdiai.com/contractors#plans' });
  });

  it('gives every sample a banner, listed on bohdiai.com or not', () => {
    for (const s of SAMPLES) expect(sampleBannerFor(s.host.replace(/\.bohdiai\.com$/, ''))).not.toBeNull();
  });

  it('never labels a real client’s site, an unlisted site, or the apex', () => {
    for (const c of CLIENTS) expect(sampleBannerFor(c.host.replace(/\.bohdiai\.com$/, ''))).toBeNull();
    expect(sampleBannerFor('aurora-candles')).toBeNull();
    expect(sampleBannerFor(null)).toBeNull();
  });
});
