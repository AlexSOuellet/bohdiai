import { describe, it, expect } from 'vitest';
import { firstSteps, type StepFacts } from './first-steps';
import type { FeatureKey } from './features';

const fresh: StepFacts = {
  draft: true,
  headline: '',
  bio: '',
  phone: '',
  socials: 0,
  galleryPicks: 0,
  unpriced: 3,
  squareConnected: false,
  onlinePayments: false,
  nextEvent: null,
  collections: 0,
  morePhotos: false,
  promotions: 0,
};

const ready: StepFacts = {
  draft: false,
  headline: 'Rustic pieces for real homes',
  bio: 'I build things from old barn wood.',
  phone: '705 555 0101',
  socials: 1,
  galleryPicks: 5,
  unpriced: 0,
  squareConnected: true,
  onlinePayments: true,
  nextEvent: { id: 'e1', name: 'Harvest Fair', bringing: 4 },
  collections: 2,
  morePhotos: true,
  promotions: 1,
};

const showcaseOn = new Set<FeatureKey>(['gallery_pieces']);
const paidOn = new Set<FeatureKey>(['catalog']);
const keys = (s: ReturnType<typeof firstSteps>): string[] => s?.steps.map((x) => x.key) ?? [];

describe('first steps on Showcase', () => {
  it('gets her site ready: headline, story, gallery, how to reach her, publish', () => {
    const s = firstSteps('showcase', fresh, showcaseOn);
    expect(s?.title).toBe('Get your site ready');
    expect(keys(s)).toEqual(['headline', 'story', 'gallery', 'reach', 'publish']);
    expect(s?.steps.find((x) => x.key === 'publish')?.href).toBe('#bk-publish');
  });

  it('ticks a step off once the thing it asks for exists', () => {
    const s = firstSteps('showcase', { ...fresh, headline: 'Hello' }, showcaseOn);
    expect(s?.steps.find((x) => x.key === 'headline')?.done).toBe(true);
    expect(s?.steps.find((x) => x.key === 'story')?.done).toBe(false);
  });

  it('counts a social page as a way to reach her, and sends her to Socials then', () => {
    const s = firstSteps('showcase', { ...fresh, socials: 1 }, showcaseOn);
    expect(s?.steps.find((x) => x.key === 'reach')).toMatchObject({ done: true, href: '/manage/socials' });
  });

  it('goes away once every step is done', () => {
    expect(firstSteps('showcase', ready, showcaseOn)).toBeNull();
  });
});

describe('first steps on Market', () => {
  it('starts where Showcase ended, with any site step still undone first', () => {
    const s = firstSteps('lite', { ...ready, headline: '', unpriced: 2, squareConnected: false, nextEvent: null }, paidOn);
    expect(s?.title).toBe('Get ready to sell at your events');
    expect(keys(s)).toEqual(['headline', 'prices', 'square', 'event']);
    expect(s?.steps.find((x) => x.key === 'prices')?.label).toBe('Put a price on every piece (2 have none)');
  });

  it('never asks for a gallery pick off Showcase', () => {
    expect(keys(firstSteps('lite', fresh, paidOn))).not.toContain('gallery');
  });

  it('asks what she’s bringing to her next event, and opens that tab', () => {
    const s = firstSteps('lite', { ...ready, nextEvent: { id: 'e1', name: 'Harvest Fair', bringing: 0 } }, paidOn);
    expect(s?.steps.find((x) => x.key === 'bring')).toMatchObject({ label: 'Pick what you’re bringing to Harvest Fair', href: '/manage/markets/e1?tab=bringing', done: false });
  });
});

describe('first steps on Full', () => {
  it('starts her selling online once Market’s steps are done', () => {
    const s = firstSteps('full', { ...ready, onlinePayments: false, collections: 0, morePhotos: false, promotions: 0 }, paidOn);
    expect(s?.title).toBe('Start selling online');
    expect(keys(s)).toEqual(['online', 'collection', 'photos', 'promotion']);
  });

  it('brings any undone Market step along first', () => {
    expect(keys(firstSteps('full', { ...ready, unpriced: 2 }, paidOn))[0]).toBe('prices');
  });

  it('lets any way to get paid online stand for Square, so a PayPal-only maker isn’t nagged', () => {
    expect(keys(firstSteps('full', { ...ready, squareConnected: false, promotions: 0 }, paidOn))).toEqual(['online', 'collection', 'photos', 'promotion']);
  });

  it('goes away once every step is done', () => {
    expect(firstSteps('full', ready, paidOn)).toBeNull();
  });
});
