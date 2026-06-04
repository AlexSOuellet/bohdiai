/**
 * The build engine — one path that builds ANY archetype's store from an empty
 * maker, with BOHDI making every call. The engine selects nothing: it presents
 * the menu (the archetypes and their looks), Bohdi chooses the archetype + look,
 * authors all the content and the catalog and writes every image/video prompt,
 * and the engine generates from his prompts and publishes. No niche rules, no
 * skin rules, no archetype default, no gate.
 *
 * The only constraint the engine imposes is the global product-photo cap:
 * generate at most MAX_PRODUCT_IMAGES photos for the 'product' media group and
 * recycle them across any extra products. Every 'feature' asset (hero video,
 * portraits, collection shots) generates freely.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { anthropicClient } from '@/lib/anthropic';
import { supabaseAdmin } from '@/lib/supabase';
import { MOODS, type MoodKey } from '@/lib/moods';
import { logger } from '@/lib/logger';
import type { ProgressEmitter } from '@/lib/progress';
import { generateMomentVideo, generateMomentStill } from '@/lib/moments/media';
import { archetypeSpec, archetypeMenu } from '@/lib/archetypes/registry';
import type { ArchetypeBuildSpec, AuthoringBrief, MediaJob } from '@/lib/archetypes/builder';
import { writeArchetypeStorefront } from '@/lib/generation/write-archetype-storefront';

const MODEL = 'claude-sonnet-4-6';
const MAX_TURNS = 10;
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

function buildMenuPrompt(brief: AuthoringBrief, specs: ArchetypeBuildSpec[]): string {
  const menu = specs
    .map((s) => {
      const looks = s.looks.map((l) => `    - ${l.key}: ${l.description}`).join('\n');
      return `- ${s.key} — ${s.menuDescription}\n  looks:\n${looks}`;
    })
    .join('\n\n');

  return `You are Bohdi, the maker's storefront builder. A maker just onboarded with nothing — no copy, no products, no photos. You build their entire store, and every creative decision is yours.

Read the maker. Then CHOOSE the archetype (the shape of the site) and the look (its colors and fonts) that fit this maker best — your judgment, no formula. Call choose_format with your picks. You'll get the exact fields for that archetype. Then author everything — the words, the products, and a vivid generation prompt for every image and video — and call submit_store. The system generates your prompts into real assets.

THE MAKER
- Shop name: ${brief.shopName}
- Niche: ${brief.nicheDisplayName}
${brief.nicheBody.trim().slice(0, 1600)}
- Mood: ${brief.moodLabel}. ${brief.moodDescription}
- Roughly ${brief.productCount > 0 ? brief.productCount : 'a handful of'} products.

THE ARCHETYPES (choose one, and one of its looks):

${menu}

Begin by calling choose_format.`;
}

const CHOOSE_TOOL: Anthropic.Tool = {
  name: 'choose_format',
  description: 'Choose the archetype and the look that fit this maker. Returns the exact fields to author for that archetype.',
  input_schema: {
    type: 'object',
    properties: {
      archetypeKey: { type: 'string', description: 'One of the archetype keys from the menu.' },
      lookKey: { type: 'string', description: 'One of that archetype\'s look keys.' },
    },
    required: ['archetypeKey', 'lookKey'],
  },
};

const SUBMIT_TOOL: Anthropic.Tool = {
  name: 'submit_store',
  description: 'Submit the authored store for the chosen archetype. Returns { ok: true } or { ok: false, issues: [...] } to fix and resubmit.',
  input_schema: {
    type: 'object',
    properties: {
      content: { type: 'object', description: "The archetype's content object (see the fields you were given)." },
      products: { type: 'array', description: 'Separate product catalog, if the archetype uses one (see the fields).', items: { type: 'object' } },
    },
    required: ['content'],
  },
};

interface Chosen {
  spec: ArchetypeBuildSpec;
  lookKey: string;
}

/** Run Bohdi until he chooses a format and submits a valid store. */
async function authorStore(brief: AuthoringBrief): Promise<{ chosen: Chosen; authored: unknown }> {
  const specs = archetypeMenu();
  const system = buildMenuPrompt(brief, specs);
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Build this maker\'s store. Start by calling choose_format.' },
  ];
  let chosen: Chosen | null = null;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const resp = await anthropicClient().messages.create({
      model: MODEL,
      max_tokens: 16000,
      system,
      tools: [CHOOSE_TOOL, SUBMIT_TOOL],
      messages,
    });
    messages.push({ role: 'assistant', content: resp.content });

    const toolUses = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (toolUses.length === 0) {
      if (resp.stop_reason === 'end_turn') throw new Error('Bohdi ended without submitting the store');
      continue;
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      if (tu.name === 'choose_format') {
        const a = tu.input as { archetypeKey?: unknown; lookKey?: unknown };
        const spec = typeof a.archetypeKey === 'string' ? archetypeSpec(a.archetypeKey) : undefined;
        const lookOk = spec && typeof a.lookKey === 'string' && spec.looks.some((l) => l.key === a.lookKey);
        if (!spec || !lookOk) {
          results.push({ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, error: `Unknown archetype or look. Archetypes: ${specs.map((s) => s.key).join(', ')}` }) });
          continue;
        }
        chosen = { spec, lookKey: a.lookKey as string };
        logger.info('archetype-build: format chosen', { archetype: spec.key, look: a.lookKey });
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify({ ok: true, fields: spec.authoringSpec(brief) }) });
      } else if (tu.name === 'submit_store') {
        if (!chosen) {
          results.push({ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, error: 'Call choose_format before submit_store.' }) });
          continue;
        }
        const parsed = chosen.spec.parseSubmission(tu.input);
        if (parsed.ok) {
          logger.info('archetype-build: authored', { archetype: chosen.spec.key, turn: turn + 1 });
          return { chosen, authored: parsed.authored };
        }
        results.push({ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues: parsed.issues.slice(0, 14) }) });
      }
    }
    messages.push({ role: 'user', content: results });
  }
  throw new Error(`Bohdi did not submit a valid store within ${MAX_TURNS} turns`);
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
  const brief: AuthoringBrief = {
    shopName: input.shopName,
    nicheDisplayName: niche.display_name,
    nicheBody: niche.body_markdown ?? '',
    moodLabel: mood.label,
    moodDescription: mood.description,
    productCount: input.productCount,
    makerName: input.makerName,
  };

  emit('Designing your store');
  const { chosen, authored } = await authorStore(brief);
  const spec = chosen.spec;

  // Generate every asset Bohdi prompted. Feature assets generate freely; product
  // photos are capped and recycled. Unique storage path per job so nothing overwrites.
  emit('Generating your photos and video');
  const jobs = spec.mediaJobs(authored);
  const run = (j: MediaJob) =>
    j.kind === 'video'
      ? generateMomentVideo(j.prompt, { subdomain: `${input.subdomain}/${j.id}`, aspect: j.aspect, ...(j.durationSec !== undefined ? { durationSec: j.durationSec } : {}) })
      : generateMomentStill(j.prompt, { subdomain: `${input.subdomain}/${j.id}`, aspect: j.aspect });

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
    content: payload.content,
    products: payload.products,
    logoUrl: input.logoUrl,
  });

  logger.info('archetype-build: published', { subdomain: result.subdomain, tenantId: result.tenantId, archetype: spec.key, look: chosen.lookKey });
  return result;
}
