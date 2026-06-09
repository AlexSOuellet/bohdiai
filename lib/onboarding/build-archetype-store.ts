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

export const MAX_PRODUCT_IMAGES = 5;

export interface ArchetypeBuildInput {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  moodKey: MoodKey;
  productCount: number;
  makerName?: string | undefined;
  logoUrl?: string | undefined;
}

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

  const { data: niche, error } = await supabaseAdmin()
    .from('niches')
    .select('display_name, body_markdown, tenant_type_fit')
    .eq('slug', input.nicheSlug)
    .single();
  if (error || !niche) throw new Error(`Niche not found: ${input.nicheSlug} (${error?.message ?? 'no row'})`);

  const mood = MOODS[input.moodKey];
  const brief: CrewBrief = {
    shopName: input.shopName,
    nicheDisplayName: niche.display_name,
    nicheBody: niche.body_markdown ?? '',
    moodLabel: mood.label,
    moodDescription: mood.description,
    productCount: input.productCount,
    makerName: input.makerName,
    moodKey: input.moodKey,
  };

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
  const toGenerate = product.slice(0, MAX_PRODUCT_IMAGES);

  const [featureUrls, productGenUrls] = await Promise.all([
    Promise.all(feature.map(run)),
    Promise.all(toGenerate.map(run)),
  ]);

  const photos = productGenUrls.filter((u): u is string => typeof u === 'string' && u.length > 0);
  const recycled = recycleProductPhotos(product.length, photos);

  const urls: Record<string, string | null> = {};
  feature.forEach((j, i) => {
    urls[j.id] = featureUrls[i] ?? null;
  });
  product.forEach((j, i) => {
    urls[j.id] = recycled[i] ?? null;
  });

  const withMedia = spec.applyMedia(authored, urls);
  const payload = spec.toPayload(withMedia);

  logger.info('archetype-build: generated', {
    subdomain: input.subdomain,
    archetype: spec.key,
    look: chosen.lookKey,
    features: feature.length,
    productPhotos: photos.length,
    productSlots: product.length,
  });

  emit('Publishing your store');
  const result = await writeArchetypeStorefront({
    subdomain: input.subdomain,
    shopName: input.shopName,
    nicheSlug: input.nicheSlug,
    moodKey: input.moodKey,
    tenantTypes: niche.tenant_type_fit ?? ['seller'],
    archetypeKey: spec.key,
    lookKey: chosen.lookKey,
    mood: input.moodKey,
    catalogSize: input.productCount,
    content: payload.content,
    products: payload.products,
    logoUrl: input.logoUrl,
  });

  logger.info('archetype-build: published', { subdomain: result.subdomain, tenantId: result.tenantId, archetype: spec.key, look: chosen.lookKey });

  // Log the crew's look-driving picks now that the tenant exists — keyed by the
  // real tenant id, niche slug, and mood. Fire-and-forget: never blocks or fails
  // the build.
  logCrewChoices({
    tenantId: result.tenantId,
    nicheSlug: input.nicheSlug,
    moodKey: input.moodKey,
    momentKind: choices.momentKind,
    goodsTreatment: choices.goodsTreatment,
    founderTreatment: choices.founderTreatment,
    goodsRoll: choices.goodsRoll,
    founderRoll: choices.founderRoll,
  });

  return result;
}
