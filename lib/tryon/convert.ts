/**
 * Try-on conversion — re-express a tenant's LIVE store in another archetype and
 * save it as a VERSION on the same tenant. Hand off the maker from the source,
 * re-author in the target, reuse the carry-over media (maker photo, any source
 * product photos) and generate only what the new shape needs, then write a
 * self-contained version envelope. The live store is never touched.
 */
import { supabaseAdmin } from '@/lib/supabase';
import { MOODS, type MoodKey } from '@/lib/moods';
import { logger } from '@/lib/logger';
import { generateMomentVideo, generateMomentStill } from '@/lib/moments/media';
import { archetypeSpec } from '@/lib/archetypes/registry';
import type { AuthoringBrief, MediaJob } from '@/lib/archetypes/builder';
import type { PortableStore } from '@/lib/archetypes/portable';
import { MAX_PRODUCT_IMAGES, recycleProductPhotos } from '@/lib/onboarding/build-archetype-store';
import { authorFromPortable } from './author-from-portable';
import { writeVersion, type VersionEnvelope } from './write-version';

export interface ConvertInput {
  subdomain: string;
  targetArchetypeKey: string;
  label: string;
  /** Optional explicit look; defaults to the target's first look. */
  lookKey?: string | undefined;
}

export interface ConvertResult {
  tenantId: string;
  subdomain: string;
  label: string;
  archetypeKey: string;
  lookKey: string;
}

/**
 * Decide each media job's fate: REUSE a carry-over photo (the maker portrait, or
 * a source product photo) when one exists, otherwise GENERATE it (feature free,
 * product capped). Pure, so it's testable without the generation seam.
 */
export function partitionMedia(
  jobs: MediaJob[],
  portable: PortableStore,
): { reuse: Record<string, string | null>; feature: MediaJob[]; product: MediaJob[] } {
  const reuse: Record<string, string | null> = {};
  const feature: MediaJob[] = [];
  const product: MediaJob[] = [];
  for (const j of jobs) {
    if ((j.id === 'portrait' || j.id === 'maker') && portable.maker.photoUrl) {
      reuse[j.id] = portable.maker.photoUrl;
      continue;
    }
    const pm = j.id.match(/^product:(\d+)$/);
    if (pm) {
      const u = portable.products[Number(pm[1])]?.photoUrl;
      if (u) {
        reuse[j.id] = u;
        continue;
      }
      product.push(j);
      continue;
    }
    if (j.group === 'product') product.push(j);
    else feature.push(j);
  }
  return { reuse, feature, product };
}

export async function convertStore(input: ConvertInput): Promise<ConvertResult> {
  const db = supabaseAdmin();

  // 1. Load the tenant + its live home envelope.
  const { data: tenant, error: te } = await db
    .from('tenants')
    .select('id, primary_niche, mood_key, business_name')
    .eq('subdomain', input.subdomain)
    .single();
  if (te || !tenant) throw new Error(`convert: tenant not found: ${input.subdomain}`);
  const t = tenant as unknown as { id: string; primary_niche: string; mood_key: string; business_name: string };

  const { data: page } = await db
    .from('content_pages')
    .select('layout_tree')
    .eq('tenant_id', t.id)
    .eq('slug', '/')
    .single();
  const root = (page as unknown as { layout_tree: { root?: VersionEnvelope } } | null)?.layout_tree?.root;
  if (!root || root.kind !== 'archetype') throw new Error('convert: live store is not an archetype');

  // 2. Hand off from the source archetype.
  const sourceSpec = archetypeSpec(root.archetypeKey);
  if (!sourceSpec?.handOff) throw new Error(`convert: ${root.archetypeKey} has no handOff`);
  const portable = sourceSpec.handOff(root.content as never);

  // 3. Build the brief from the tenant's niche + mood.
  const { data: niche } = await db
    .from('niches')
    .select('display_name, body_markdown')
    .eq('slug', t.primary_niche)
    .single();
  const n = niche as unknown as { display_name: string; body_markdown: string | null } | null;
  const mood = MOODS[t.mood_key as MoodKey];
  const brief: AuthoringBrief = {
    shopName: portable.shopName,
    nicheDisplayName: n?.display_name ?? t.primary_niche,
    nicheBody: n?.body_markdown ?? '',
    moodLabel: mood?.label ?? t.mood_key,
    moodDescription: mood?.description ?? '',
    productCount: portable.products.length,
  };

  // 4. Re-express in the target archetype.
  const targetSpec = archetypeSpec(input.targetArchetypeKey);
  if (!targetSpec) throw new Error(`convert: unknown target ${input.targetArchetypeKey}`);
  const authored = await authorFromPortable(targetSpec, brief, portable);

  // 5. Media — reuse carry-over photos, generate the rest.
  const jobs = targetSpec.mediaJobs(authored as never);
  const { reuse, feature, product } = partitionMedia(jobs, portable);
  const urls: Record<string, string | null> = { ...reuse };
  const run = (j: MediaJob) =>
    j.kind === 'video'
      ? generateMomentVideo(j.prompt, {
          subdomain: `${input.subdomain}/${input.label}/${j.id}`,
          aspect: j.aspect,
          ...(j.durationSec !== undefined ? { durationSec: j.durationSec } : {}),
        })
      : generateMomentStill(j.prompt, { subdomain: `${input.subdomain}/${input.label}/${j.id}`, aspect: j.aspect });
  const cappedProduct = product.slice(0, MAX_PRODUCT_IMAGES);
  const [featUrls, prodUrls] = await Promise.all([Promise.all(feature.map(run)), Promise.all(cappedProduct.map(run))]);
  feature.forEach((j, i) => {
    urls[j.id] = featUrls[i] ?? null;
  });
  const prodPhotos = prodUrls.filter((u): u is string => typeof u === 'string' && u.length > 0);
  const recycled = recycleProductPhotos(product.length, prodPhotos);
  product.forEach((j, i) => {
    urls[j.id] = recycled[i] ?? null;
  });

  // 6. Fold media in, build a self-contained envelope, write the version.
  const withMedia = targetSpec.applyMedia(authored as never, urls);
  const payload = targetSpec.toPayload(withMedia as never);
  const lookKey =
    input.lookKey && targetSpec.looks.some((l) => l.key === input.lookKey) ? input.lookKey : targetSpec.looks[0]!.key;
  const envelope: VersionEnvelope = {
    kind: 'archetype',
    archetypeKey: targetSpec.key,
    lookKey,
    mood: t.mood_key,
    catalogSize: portable.products.length,
    content: payload.content,
    products: payload.products,
  };
  await writeVersion(t.id, input.label, envelope);
  logger.info('tryon: version written', { subdomain: input.subdomain, label: input.label, archetype: targetSpec.key, lookKey });
  return { tenantId: t.id, subdomain: input.subdomain, label: input.label, archetypeKey: targetSpec.key, lookKey };
}
