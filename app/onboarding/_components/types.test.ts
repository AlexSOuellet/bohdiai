import { describe, it, expect } from 'vitest';
import { INITIAL_DATA, type OnboardingData } from './types';

describe('OnboardingData — product photo fields', () => {
  it('initializes productPhotoUrls as an empty array', () => {
    expect(INITIAL_DATA.productPhotoUrls).toEqual([]);
  });

  it('initializes visionPerPhoto as an empty array', () => {
    expect(INITIAL_DATA.visionPerPhoto).toEqual([]);
  });

  it('initializes makerWork as an empty string', () => {
    expect(INITIAL_DATA.makerWork).toBe('');
  });

  it('typechecks the fields', () => {
    const data: OnboardingData = {
      ...INITIAL_DATA,
      productPhotoUrls: ['https://example.com/p1.jpg'],
      visionPerPhoto: [
        {
          productType: 'turned walnut bowl',
          suggestedName: 'River Bowl',
          suggestedShortDescription: 'a small turned walnut bowl',
          suggestedDescription: 'A small turned walnut bowl from local stock.',
          suggestedPriceCents: 4800,
        },
      ],
      makerWork: 'This maker turns small bowls and serving pieces from local hardwood.',
    };
    expect(data.productPhotoUrls).toHaveLength(1);
  });
});
