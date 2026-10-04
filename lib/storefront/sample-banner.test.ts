import { describe, it, expect } from 'vitest';
import { sampleBannerFor } from './sample-banner';
import { SAMPLES, CLIENTS } from '@/lib/site/work';

describe('sampleBannerFor', () => {
  it('names the plan each sample shows and links to the maker plans', () => {
    expect(sampleBannerFor('rustic-rhody')).toEqual({ label: 'Showcase sample', href: 'https://bohdiai.com/makers#plans' });
    expect(sampleBannerFor('classic-loafs')?.label).toBe('Lite sample');
    expect(sampleBannerFor('twilight-to-darkness')?.label).toBe('Full sample');
  });

  it('gives every listed sample a banner', () => {
    for (const s of SAMPLES) expect(sampleBannerFor(s.host.replace(/\.bohdiai\.com$/, ''))).not.toBeNull();
  });

  it('never labels a real client’s site, an unlisted site, or the apex', () => {
    for (const c of CLIENTS) expect(sampleBannerFor(c.host.replace(/\.bohdiai\.com$/, ''))).toBeNull();
    expect(sampleBannerFor('aurora-candles')).toBeNull();
    expect(sampleBannerFor(null)).toBeNull();
  });
});
