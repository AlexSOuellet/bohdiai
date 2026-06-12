import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recycleProductPhotos, assignProductPhotos, prepareJobPrompt, buildArchetypeStore } from './build-archetype-store';
import type { MediaJob } from '@/lib/archetypes/builder';

// Stand-ins for the orchestrator's heavy neighbors, so the wiring test can run
// in memory with no DB, AI, or image calls. Each returns a value we control.
const single = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({ from: () => ({ select: () => ({ eq: () => ({ single }) }) }) }),
}));
const directAndProduce = vi.fn();
vi.mock('@/lib/onboarding/crew/pipeline', () => ({ directAndProduce: (b: unknown) => directAndProduce(b) }));
vi.mock('@/lib/moments/media', () => ({ generateMomentVideo: vi.fn(), generateMomentStill: vi.fn() }));
const writeArchetypeStorefront = vi.fn();
vi.mock('@/lib/generation/write-archetype-storefront', () => ({ writeArchetypeStorefront: (a: unknown) => writeArchetypeStorefront(a) }));
const logCrewChoices = vi.fn();
vi.mock('@/lib/onboarding/crew/log-choices', () => ({ logCrewChoices: (c: unknown) => logCrewChoices(c) }));

describe('prepareJobPrompt', () => {
  const base: MediaJob = { id: 'x', kind: 'still', prompt: 'a wallet on stone', aspect: '1:1', group: 'product' };

  it('adds photorealism to a product image and no person phrase', () => {
    const out = prepareJobPrompt(base, 'Abigail Stone');
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out.toLowerCase()).not.toContain('a woman');
  });

  it('frames a portrait gender-neutrally, never by a guessed gender (D42)', () => {
    const portrait: MediaJob = { ...base, id: 'portrait', prompt: 'the maker at the bench', subjectIsPerson: true };
    const out = prepareJobPrompt(portrait, 'Abigail Stone').toLowerCase();
    expect(out).not.toContain('a woman');
    expect(out).not.toContain('a man');
    expect(out).toContain('hands');
    expect(out).toContain('photorealistic');
  });
});

describe('recycleProductPhotos', () => {
  it('gives each product its own photo when there are enough', () => {
    const photos = ['a', 'b', 'c'];
    expect(recycleProductPhotos(3, photos)).toEqual(['a', 'b', 'c']);
  });

  it('recycles photos in order when products exceed the photo count', () => {
    const photos = ['a', 'b', 'c', 'd', 'e']; // the 5-image cap
    // 10 products, 5 photos → recycle
    expect(recycleProductPhotos(10, photos)).toEqual([
      'a', 'b', 'c', 'd', 'e', 'a', 'b', 'c', 'd', 'e',
    ]);
  });

  it('returns nulls when no photos generated', () => {
    expect(recycleProductPhotos(3, [])).toEqual([null, null, null]);
  });

  it('handles a single surviving photo', () => {
    expect(recycleProductPhotos(4, ['only'])).toEqual(['only', 'only', 'only', 'only']);
  });
});

describe('assignProductPhotos', () => {
  it('matches recycle behavior when no uploads (today\'s behavior)', () => {
    // With zero uploads, every slot uses generated photos in order — same as recycle.
    expect(assignProductPhotos([], ['a', 'b', 'c'], 3)).toEqual(['a', 'b', 'c']);
    expect(assignProductPhotos([], ['a', 'b', 'c'], 6)).toEqual(['a', 'b', 'c', 'a', 'b', 'c']);
    expect(assignProductPhotos([], [], 3)).toEqual([null, null, null]);
  });

  it('uses uploads for the first N slots and generated photos for the rest', () => {
    // 2 uploads + 3 generated for a catalog of 5 — uploads come first, then generated.
    expect(assignProductPhotos(['u1', 'u2'], ['g1', 'g2', 'g3'], 5)).toEqual([
      'u1', 'u2', 'g1', 'g2', 'g3',
    ]);
  });

  it('recycles generated photos when the catalog runs longer than uploads + generated', () => {
    // 1 upload + 2 generated, catalog of 6 → upload, then g1,g2 cycling.
    expect(assignProductPhotos(['u1'], ['g1', 'g2'], 6)).toEqual([
      'u1', 'g1', 'g2', 'g1', 'g2', 'g1',
    ]);
  });

  it('fills all slots from uploads when uploads meet or exceed the slot count', () => {
    expect(assignProductPhotos(['u1', 'u2', 'u3'], [], 3)).toEqual(['u1', 'u2', 'u3']);
    // Even if there are extra uploads beyond the catalog, only the first N are used.
    expect(assignProductPhotos(['u1', 'u2', 'u3', 'u4', 'u5'], [], 3)).toEqual(['u1', 'u2', 'u3']);
  });

  it('returns null for trailing slots when no generated photos and uploads run short', () => {
    expect(assignProductPhotos(['u1'], [], 3)).toEqual(['u1', null, null]);
  });
});

describe('buildArchetypeStore — crew-choice logging seam', () => {
  // A minimal spec whose media step is empty, so no images are generated.
  const fakeSpec = {
    key: 'main-street',
    mediaJobs: () => [],
    applyMedia: (authored: unknown) => authored,
    toPayload: () => ({ content: {}, products: [] }),
  };

  beforeEach(() => {
    single.mockResolvedValue({ data: { display_name: 'Woodworking', body_markdown: 'x', tenant_type_fit: ['seller'] }, error: null });
    directAndProduce.mockResolvedValue({
      chosen: { spec: fakeSpec, lookKey: 'main-street-ember' },
      authored: {},
      choices: { momentKind: 'video', goodsTreatment: 'procession', founderTreatment: 'quote' },
    });
    // The publish step hands back a tenant id we chose — a match proves the
    // orchestrator passed THIS id through to the logger.
    writeArchetypeStorefront.mockResolvedValue({ subdomain: 'wally', tenantId: 'tn_real_123' });
    logCrewChoices.mockClear();
  });

  it('logs the crew picks against the real tenant id, niche, and mood after publishing', async () => {
    await buildArchetypeStore({
      shopName: "Wally's Wood",
      subdomain: 'wally',
      nicheSlug: 'woodworking',
      moodKey: 'rustic',
      productCount: 3,
    });

    expect(logCrewChoices).toHaveBeenCalledTimes(1);
    expect(logCrewChoices).toHaveBeenCalledWith({
      tenantId: 'tn_real_123', // from the publish step, not the input
      nicheSlug: 'woodworking',
      moodKey: 'rustic',
      momentKind: 'video',
      goodsTreatment: 'procession',
      founderTreatment: 'quote',
    });
  });
});

describe('buildArchetypeStore — Other (describe-and-build)', () => {
  // A maker who picks "Other" types what they make; Bohdi builds from that
  // description alone — no niche file, no DB lookup, nothing saved as a niche.
  const fakeSpec = {
    key: 'main-street',
    mediaJobs: () => [],
    applyMedia: (authored: unknown) => authored,
    toPayload: () => ({ content: {}, products: [] }),
  };

  beforeEach(() => {
    single.mockReset();
    directAndProduce.mockReset();
    directAndProduce.mockResolvedValue({
      chosen: { spec: fakeSpec, lookKey: 'main-street-ember' },
      authored: {},
      choices: { momentKind: 'video', goodsTreatment: 'procession', founderTreatment: 'quote' },
    });
    writeArchetypeStorefront.mockReset();
    writeArchetypeStorefront.mockResolvedValue({ subdomain: 'planters', tenantId: 'tn_other_1' });
  });

  it('skips the niches table and feeds the typed description as the niche body', async () => {
    await buildArchetypeStore({
      shopName: 'Set Stone',
      subdomain: 'planters',
      nicheSlug: 'other',
      nicheDescription: 'I make hand-poured concrete planters with pressed botanicals',
      moodKey: 'modern',
      productCount: 3,
    });

    // No niche row exists for Other — the DB lookup must never run.
    expect(single).not.toHaveBeenCalled();
    // The crew receives the maker's own words as the niche material.
    const brief = directAndProduce.mock.calls[0]![0] as { nicheBody: string };
    expect(brief.nicheBody).toBe('I make hand-poured concrete planters with pressed botanicals');
  });

  it('persists as not-from-list with the description and no primary niche', async () => {
    await buildArchetypeStore({
      shopName: 'Set Stone',
      subdomain: 'planters',
      nicheSlug: 'other',
      nicheDescription: 'concrete planters with pressed botanicals',
      moodKey: 'modern',
      productCount: 3,
    });

    const writeArg = writeArchetypeStorefront.mock.calls[0]![0] as {
      nicheFromList: boolean;
      nicheDescription: string | null;
      primaryNiche: string | null;
    };
    expect(writeArg.nicheFromList).toBe(false);
    expect(writeArg.nicheDescription).toBe('concrete planters with pressed botanicals');
    expect(writeArg.primaryNiche).toBeNull();
  });
});
