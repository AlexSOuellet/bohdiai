import { describe, it, expect, vi } from 'vitest';

// Structural isolation test: the Graphic Artist must NEVER see the photo-derived
// signals (D41 + D56). Skin pick stays niche + mood; accent override stays logo.
// This test mocks the crew functions themselves so it can capture the exact
// brief each one receives — that's the only way to assert the brief STRUCTURE
// (not just whether the current prompt happens to mention a string).
//
// This lives in its own file because vi.mock is hoisted: mocking the crew
// functions here would break the integration tests in pipeline.test.ts which
// drive the real five stages through a mocked anthropic client.

vi.mock('./director', () => ({ direct: vi.fn() }));
vi.mock('./copywriter', () => ({ writeCopy: vi.fn() }));
vi.mock('./cinematographer', () => ({ shootMoment: vi.fn() }));
vi.mock('./graphic-artist', () => ({ designLook: vi.fn() }));
vi.mock('./directors-cut', () => ({ directorsCut: vi.fn() }));
// The pipeline parses the assembled envelope at the end via the engine schema.
// Stub it so this test focuses only on what each crew member receives.
vi.mock('@/lib/archetypes/main-street/builder', () => ({
  MAIN_STREET_SPEC: {
    parseSubmission: () => ({ ok: true, authored: { content: {}, products: [], productUrls: [] } }),
  },
}));

import { directAndProduce } from './pipeline';
import { direct } from './director';
import { writeCopy } from './copywriter';
import { shootMoment } from './cinematographer';
import { designLook } from './graphic-artist';
import { directorsCut } from './directors-cut';
import type { CrewBrief } from './types';

const trajectory = {
  feeling: 'f', customerWhy: 'w', visualWorld: 'v', momentConcept: 'm',
  register: 'restrained' as const, momentKind: 'video' as const,
};
const copy = {
  shopName: 'Test',
  identity: { wordmark: 'Test', nav: [] },
  moment: { story: ['a', 'b'], eyebrow: 'e', brand: 'Test', ctaLabel: 'c', ctaTarget: 'goods' as const },
  goods: { title: 't', treatment: 'procession' as const },
  founder: { quote: 'q', attribution: 'a', treatment: 'quote' as const },
  close: { label: 'l', headline: 'h', ctaLabel: 'c', ctaTarget: 'contact' as const },
  about: { heading: 'h', story: ['s1', 's2'] },
  contact: { heading: 'h', intro: 'i' },
  products: [],
};
const moment = {
  kind: 'video' as const,
  prompt: { composition: 'c', subject: 's', environment: 'e', atmosphere: 'a', camera: 'cam', lighting: 'l', style: 'st' },
  alt: 'alt',
};
const look = {
  skinKey: 'main-street-ember',
  founderPhoto: { prompt: 'p', alt: 'a' },
  products: [],
};

describe('directAndProduce — photo-derived fields stay out of the Graphic Artist', () => {
  it('threads visionPerPhoto + makerWork to Director, Copywriter, Cinematographer; NOT to Graphic Artist', async () => {
    vi.mocked(direct).mockReset().mockResolvedValue(trajectory);
    vi.mocked(writeCopy).mockReset().mockResolvedValue(copy);
    vi.mocked(shootMoment).mockReset().mockResolvedValue(moment);
    vi.mocked(designLook).mockReset().mockResolvedValue(look);
    vi.mocked(directorsCut).mockReset().mockResolvedValue({ copy, moment, look });

    const brief: CrewBrief = {
      shopName: 'Test',
      nicheDisplayName: 'Woodworker',
      nicheBody: 'A test body.',
      moodLabel: 'Rustic',
      moodDescription: '',
      productCount: 5,
      moodKey: 'rustic',
      visionPerPhoto: [
        { productType: 'turned walnut bowl', suggestedName: 'River Bowl', suggestedShortDescription: 'small bowl', suggestedDescription: 'A small turned walnut bowl.', suggestedPriceCents: 4800 },
        { productType: 'small wooden sign', suggestedName: 'Welcome Plank', suggestedShortDescription: 'small sign', suggestedDescription: 'A small carved sign.', suggestedPriceCents: 3200 },
      ],
      makerWork: 'Turns small bowls and carves small signs from local walnut.',
    };

    await directAndProduce(brief);

    // Director sees makerWork — it shapes the trajectory.
    const directBrief = vi.mocked(direct).mock.calls[0]![0];
    expect(directBrief.makerWork).toMatch(/local walnut/);
    expect(directBrief.visionPerPhoto).toHaveLength(2);

    // Copywriter sees visionPerPhoto — it locks the product names + prices.
    const copyBrief = vi.mocked(writeCopy).mock.calls[0]![0];
    expect(copyBrief.visionPerPhoto).toHaveLength(2);
    expect(copyBrief.makerWork).toMatch(/local walnut/);

    // Cinematographer receives makerWork as its third arg (C3).
    const shootArgs = vi.mocked(shootMoment).mock.calls[0]!;
    expect(shootArgs[2]).toMatch(/local walnut/);

    // STRUCTURAL: Graphic Artist's brief MUST NOT carry photo-derived data.
    // Skin pick stays niche + mood (D41), accent override stays logo (D56).
    const designLookBrief = vi.mocked(designLook).mock.calls[0]![0];
    expect(designLookBrief.makerWork).toBeUndefined();
    expect(designLookBrief.visionPerPhoto).toBeUndefined();
    // But the niche + mood signals it DOES need still come through.
    expect(designLookBrief.moodKey).toBe('rustic');
    expect(designLookBrief.moodLabel).toBe('Rustic');
    expect(designLookBrief.nicheDisplayName).toBe('Woodworker');
  });

  it('passes undefined photo fields all the way through when the maker skipped uploads', async () => {
    vi.mocked(direct).mockReset().mockResolvedValue(trajectory);
    vi.mocked(writeCopy).mockReset().mockResolvedValue(copy);
    vi.mocked(shootMoment).mockReset().mockResolvedValue(moment);
    vi.mocked(designLook).mockReset().mockResolvedValue(look);
    vi.mocked(directorsCut).mockReset().mockResolvedValue({ copy, moment, look });

    const brief: CrewBrief = {
      shopName: 'Test',
      nicheDisplayName: 'Woodworker',
      nicheBody: 'A test body.',
      moodLabel: 'Rustic',
      moodDescription: '',
      productCount: 5,
      moodKey: 'rustic',
      // visionPerPhoto and makerWork omitted — this is the skip path
    };

    await directAndProduce(brief);

    const directBrief = vi.mocked(direct).mock.calls[0]![0] as CrewBrief;
    expect(directBrief.makerWork).toBeUndefined();
    expect(directBrief.visionPerPhoto).toBeUndefined();

    const copyBriefArg = vi.mocked(writeCopy).mock.calls[0]![0] as CrewBrief;
    expect(copyBriefArg.visionPerPhoto).toBeUndefined();

    const shootArgs = vi.mocked(shootMoment).mock.calls[0]!;
    expect(shootArgs[2]).toBeUndefined();

    const designLookBrief = vi.mocked(designLook).mock.calls[0]![0] as CrewBrief;
    expect(designLookBrief.makerWork).toBeUndefined();
    expect(designLookBrief.visionPerPhoto).toBeUndefined();
  });
});
