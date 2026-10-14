import { describe, it, expect } from 'vitest';
import { sampleBannerFor } from './sample-banner';
import { SAMPLES, CLIENTS } from '@/lib/site/work';

describe('sampleBannerFor', () => {
  it('names the plan each sample shows and links to the maker plans', () => {
    expect(sampleBannerFor('rustic-rhody')).toEqual({ plan: 'Showcase', href: 'https://bohdiai.com/makers#plans' });
    expect(sampleBannerFor('classic-loafs')?.plan).toBe('Market');
    expect(sampleBannerFor('twilight-to-darkness')?.plan).toBe('Full');
    expect(sampleBannerFor('paper-and-patina')?.plan).toBe('Showcase');
    expect(sampleBannerFor('ember-and-pine')?.plan).toBe('Showcase');
  });

  it('labels the contractor samples and links them to the contractor plans', () => {
    expect(sampleBannerFor('true-coat-painting')).toEqual({ plan: 'Contractor Full', href: 'https://bohdiai.com/contractors#plans' });
    expect(sampleBannerFor('halfmoon-roofing')).toEqual({ plan: 'Contractor Lead Generation', href: 'https://bohdiai.com/contractors#plans' });
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
