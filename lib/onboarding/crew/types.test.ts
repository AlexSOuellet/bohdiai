import { describe, it, expect } from 'vitest';
import type { CrewBrief } from './types';
import type { VisionPerPhoto } from '@/app/onboarding/_components/types';

describe('CrewBrief — Vision fields', () => {
  it('accepts visionPerPhoto and makerWork as optional fields', () => {
    const photos: VisionPerPhoto[] = [
      { productType: 'turned walnut bowl', suggestedName: 'River Bowl', suggestedShortDescription: 'a small bowl', suggestedDescription: 'A small turned walnut bowl.', suggestedPriceCents: 4800 },
    ];
    const brief: CrewBrief = {
      shopName: 'Test',
      nicheDisplayName: 'Woodworker',
      nicheBody: '',
      moodLabel: 'Rustic',
      moodDescription: '',
      productCount: 5,
      moodKey: 'rustic',
      visionPerPhoto: photos,
      makerWork: 'Turns small bowls.',
    };
    expect(brief.visionPerPhoto).toHaveLength(1);
    expect(brief.makerWork).toBe('Turns small bowls.');
  });
});
