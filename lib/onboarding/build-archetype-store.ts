/**
 * The build engine — one path that builds the maker's store from an empty maker.
 * Bohdi makes every creative call, now as a DIRECTOR leading a crew (D40): the
 * crew authors the words, the Moment, the skin, and the image prompts, and
 * produces the SAME MainStreetAuthored envelope this engine already consumes (see
 * lib/onboarding/crew/pipeline). This file orchestrates generation and persistence
 * from that envelope; it selects nothing.
 *
 * The only constraint the engine imposes is the global product-photo cap:
 * generate at most MAX_PRODUCT_IMAGES photos for the 'product' media group and
 * recycle them across any extra products. Every 'feature' asset (hero video,
 * portraits) generates freely.
 */
import { supabaseAdmin } from '@/lib/supabase';
import type { MoodKey } from '@/lib/moods';
import { MOODS } from '@/lib/moods';
import { logger } from '@/lib/logger';
import type { ProgressEmitter } from '@/lib/progress';
import { generateMomentVideo, generateMomentStill } from '@/lib/moments/media';
import type { MediaJob } from '@/lib/archetypes/builder';
import { writeArchetypeStorefront } from '@/lib/generation/write-archetype-storefront';
import { withImageDirectives } from '@/lib/onboarding/image-directives';
import { directAndProduce } from '@/lib/onboarding/crew/pipeline';
import { logCrewChoices } from '@/lib/onboarding/crew/log-choices';
import type { CrewBrief } from '@/lib/onboarding/crew/types';
import { dominantBrandColor } from '@/lib/archetypes/main-street/logo-contrast';

export const MAX_PRODUCT_IMAGES = 5;

export interface ArchetypeBuildInput {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  /** Set when the maker picked "Other" and typed what they make. Bohdi builds
   *  from this description alone — no niche file, no DB lookup, nothing saved. */
  nicheDescription?: string | undefined;
  moodKey: MoodKey;
  productCount: number;
  makerName?: string | undefined;
  logoUrl?: string | undefined;
  /** The logo's extracted brand colors (prominence-ordered hex), or empty. Persisted
   *  for render-time contrast; the dominant one bakes the accent (a later task). */
  brandColors?: string[] | undefined;
}

/** The sentinel niche slug an "Other" maker carries — they described their own
 *  craft instead of picking from the list. */
export const OTHER_NICHE_SLUG = 'other';

export interface ArchetypeBuildResult {
  tenantId: string;
  subdomain: string;
}

/**
 * Assign a photo to each of `count` products from the (≤cap) generated `photos`,
 * recycling in order when there are more products than photos.
 */
export function recycleProductPhotos(count: number, photos: string[]): Array<string | null> {
  return Array.from({ length: count }, (_, i) => (photos.length > 0 ? photos[i % photos.length]! : null));
}

/** Apply the engine's enforced image directives (photorealism + name-matched
 *  people) to a job's authored prompt before generation. */
export function prepareJobPrompt(job: MediaJob, makerName?: string): string {
  return withImageDirectives(job.prompt, { isPerson: job.subjectIsPerson, makerName });
}

export async function buildArchetypeStore(
  input: ArchetypeBuildInput,
  onProgress?: ProgressEmitter,
): Promise<ArchetypeBuildResult> {
  const emit = (label: string) => onProgress?.({ type: 'status', step: 'composing-home', label });

  // "Other" makers described their own craft — Bohdi builds from that text alone,
  // with no niche row to look up. List-picked makers ground on their niche file.
  const isOther = input.nicheSlug === OTHER_NICHE_SLUG;
  let nicheDisplayName: string;
  let nicheBody: string;
  let tenantTypes: string[];
  if (isOther) {
    nicheDisplayName = 'maker';
    nicheBody = input.nicheDescription ?? '';
    tenantTypes = ['seller'];
  } else {
    const { data: niche, error } = await supabaseAdmin()
      .from('niches')
      .select('display_name, body_markdown, tenant_type_fit')
      .eq('slug', input.nicheSlug)
      .single();
    if (error || !niche) throw new Error(`Niche not found: ${input.nicheSlug} (${error?.message ?? 'no row'})`);
    nicheDisplayName = niche.display_name;
    nicheBody = niche.body_markdown ?? '';
    tenantTypes = niche.tenant_type_fit ?? ['seller'];
  }

  const mood = MOODS[input.moodKey];
  const brief: CrewBrief = {
    shopName: input.shopName,
    nicheDisplayName,
    nicheBody,
    moodLabel: mood.label,
    moodDescription: mood.description,
    productCount: input.productCount,
    makerName: input.makerName,
    moodKey: input.moodKey,
  };

  logger.info('archetype-build: brief', {
    subdomain: input.subdomain,
    niche: input.nicheSlug,
    mood: input.moodKey,
  });

  emit('Designing your store');
  const { chosen, authored, choices } = await directAndProduce(brief);
  const spec = chosen.spec;

  // Generate every asset the crew prompted. Feature assets generate freely; product
  // photos are capped and recycled. Unique storage path per job so nothing overwrites.
  emit('Generating your photos and video');
  const jobs = spec.mediaJobs(authored);
  const run = (j: MediaJob) => {
    const prompt = prepareJobPrompt(j, input.makerName);
    return j.kind === 'video'
      ? generateMomentVideo(prompt, { subdomain: `${input.subdomain}/${j.id}`, aspect: j.aspect, ...(j.durationSec !== undefined ? { durationSec: j.durationSec } : {}) })
      : generateMomentStill(prompt, { subdomain: `${input.subdomain}/${j.id}`, aspect: j.aspect });
  };

  const feature = jobs.filter((j) => j.group === 'feature');
  const product = jobs.filter((j) => j.group === 'product');

  // Product photos: generate up to the global cap, then recycle across all slots.
  const productJobsForGeneration = product.slice(0, MAX_PRODUCT_IMAGES);

  const [featureUrls, productGenUrls] = await Promise.all([
    Promise.all(feature.map(run)),
    Promise.all(productJobsForGeneration.map(run)),
  ]);

  const generatedPhotos = productGenUrls.filter((u): u is string => typeof u === 'string' && u.length > 0);
  const productPhotoUrls = recycleProductPhotos(product.length, generatedPhotos);

  const urls: Record<string, string | null> = {};
  feature.forEach((j, i) => {
    urls[j.id] = featureUrls[i] ?? null;
  });
  product.forEach((j, i) => {
    urls[j.id] = productPhotoUrls[i] ?? null;
  });

  const withMedia = spec.applyMedia(authored, urls);
  const payload = spec.toPayload(withMedia);

  logger.info('archetype-build: generated', {
    subdomain: input.subdomain,
    archetype: spec.key,
    look: chosen.lookKey,
    features: feature.length,
    productPhotos: generatedPhotos.length,
    productSlots: product.length,
  });

  emit('Publishing your store');
  const accentOverride = dominantBrandColor(input.brandColors ?? []);
  const result = await writeArchetypeStorefront({
    subdomain: input.subdomain,
    shopName: input.shopName,
    primaryNiche: isOther ? null : input.nicheSlug,
    nicheFromList: !isOther,
    nicheDescription: isOther ? (input.nicheDescription ?? '') : null,
    moodKey: input.moodKey,
    tenantTypes,
    archetypeKey: spec.key,
    lookKey: chosen.lookKey,
    mood: input.moodKey,
    catalogSize: input.productCount,
    content: payload.content,
    products: payload.products,
    logoUrl: input.logoUrl,
    brandColors: input.brandColors ?? [],
    accentOverride,
  });

  logger.info('archetype-build: published', { subdomain: result.subdomain, tenantId: result.tenantId, archetype: spec.key, look: chosen.lookKey });

  // Log the crew's look-driving picks now that the tenant exists — keyed by the
  // real tenant id, niche slug, and mood. Fire-and-forget: never blocks or fails
  // the build.
  logCrewChoices({
    tenantId: result.tenantId,
    nicheSlug: input.nicheSlug,
    moodKey: input.moodKey,
    heroKind: choices.heroKind,
    goodsTreatment: choices.goodsTreatment,
    founderTreatment: choices.founderTreatment,
    goodsRoll: choices.goodsRoll,
    founderRoll: choices.founderRoll,
  });

  return result;
}
