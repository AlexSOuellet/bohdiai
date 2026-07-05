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
import type { MainStreetAuthored } from '@/lib/archetypes/main-street/builder';
import { stampFindUsDates } from '@/lib/archetypes/main-street/findus';
import type { MainStreetContent } from '@/lib/archetypes/main-street/schemas';
import type { ProductView } from '@/lib/archetypes/content';

/**
 * Persist the authored collections as real DB rows and round-robin assign each
 * product to one. The copywriter authors `content.collections.items`; we insert
 * them here so the Collections page has real content on a fresh build. Errors
 * are logged but never fail the build — the store is already published and
 * navigable; a missing collections row just means /collections shows an empty
 * state until the maker adds them by hand.
 */
export async function persistCollections(
  tenantId: string,
  content: MainStreetContent,
  products: ProductView[],
): Promise<void> {
  const items = content.collections?.items ?? [];
  if (items.length === 0) return;
  const db = supabaseAdmin();

  const rows = items.map((c) => ({
    tenant_id: tenantId,
    slug: c.slug,
    name: c.name,
    description: c.description,
    status: 'active' as const,
  }));

  const { data: inserted, error: insertError } = await db
    .from('collections')
    .insert(rows)
    .select('id, slug');

  if (insertError !== null || inserted === null) {
    logger.warn('archetype-build: collections insert failed', {
      tenantId,
      count: rows.length,
      error: insertError?.message,
    });
    return;
  }

  // Round-robin assign each product to a collection so /collections/[slug] has
  // content on the first live view. Products with no slug are skipped silently.
  if (inserted.length === 0 || products.length === 0) return;
  const collectionIds = inserted.map((c) => c.id);
  const assignments = products
    .filter((p) => typeof p.slug === 'string' && p.slug.length > 0)
    .map((p, i) => ({ slug: p.slug, collectionId: collectionIds[i % collectionIds.length]! }));

  await Promise.all(
    assignments.map(({ slug, collectionId }) =>
      db
        .from('listings')
        .update({ primary_collection_id: collectionId })
        .eq('tenant_id', tenantId)
        .eq('slug', slug)
        .then(({ error }) => {
          if (error !== null) {
            logger.warn('archetype-build: primary_collection assignment failed', {
              tenantId,
              slug,
              error: error.message,
            });
          }
        }),
    ),
  );

  logger.info('archetype-build: collections persisted', {
    tenantId,
    collections: inserted.length,
    productsAssigned: assignments.length,
  });
}

/**
 * Stamp real, near-future dates onto the seeded find-us rows at build time. The build
 * knows today's date; the model does not — so code owns the dates the way it owns the
 * shop name (D45). Bohdi authors the venue / hours / kind; this drops each onto a
 * current, plausible date so a freshly-built store shows a populated calendar and
 * "this week" list the maker then keeps up to date. Returns `authored` untouched when
 * the shop has no find-us rows.
 */
export function stampAuthoredFindUs(authored: MainStreetAuthored, today: Date): MainStreetAuthored {
  const findUs = authored.content?.founder?.findUs;
  if (!findUs || findUs.rows.length === 0) return authored;
  return {
    ...authored,
    content: {
      ...authored.content,
      founder: { ...authored.content.founder, findUs: { ...findUs, rows: stampFindUsDates(findUs.rows, today) } },
    },
  };
}

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
  const { chosen, authored: authoredRaw, choices, trajectory } = await directAndProduce(brief);
  const spec = chosen.spec;

  // Stamp real current dates onto the seeded find-us rows before anything renders —
  // the model can't know today; the build does (D45).
  const authored = stampAuthoredFindUs(authoredRaw, new Date());

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
  });

  // Persist the authored collections as real DB rows and assign each product a
  // primary collection so /collections/[slug] has content. Collections are a page
  // like every other — the copywriter authored them; the build makes them real.
  // Fire-and-verify: any error surfaces in Sentry but doesn't fail the build (the
  // tenant is already published and viewable; a missing collection row just means
  // /collections shows the empty state on this build).
  await persistCollections(result.tenantId, payload.content as MainStreetContent, payload.products);

  logger.info('archetype-build: published', { subdomain: result.subdomain, tenantId: result.tenantId, archetype: spec.key, look: chosen.lookKey });

  // Log the crew's look-driving picks now that the tenant exists — keyed by the
  // real tenant id, niche slug, and mood. Fire-and-forget: never blocks or fails
  // the build.
  logCrewChoices({
    tenantId: result.tenantId,
    nicheSlug: input.nicheSlug,
    moodKey: input.moodKey,
    trajectory,
    heroKind: choices.heroKind,
    goodsTreatment: choices.goodsTreatment,
    founderTreatment: choices.founderTreatment,
    goodsRoll: choices.goodsRoll,
    founderRoll: choices.founderRoll,
  });

  return result;
}
