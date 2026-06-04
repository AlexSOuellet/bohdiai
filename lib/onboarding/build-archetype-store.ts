/**
 * The build engine — one path that builds ANY archetype's store from an empty
 * maker. Selects the archetype + skin, has Bohdi author the content AND invent
 * the product catalog, generates the hero video / portrait / product photos from
 * his prompts, and publishes a real tenant. Archetype-blind: everything specific
 * comes through the archetype's builder + the registry.
 *
 * Product-image cap (global rule, every build, every archetype): generate at
 * most MAX_PRODUCT_IMAGES photos. If the layout wants more product cards, the
 * generated photos are RECYCLED across the extra products (each with its own
 * authored copy). The cap is on PRODUCT photos only — the hero video and the
 * founder portrait generate freely.
 */
import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { anthropicClient } from '@/lib/anthropic';
import { supabaseAdmin } from '@/lib/supabase';
import { MOODS, type MoodKey } from '@/lib/moods';
import { logger } from '@/lib/logger';
import type { ProgressEmitter } from '@/lib/progress';
import { generateMomentVideo, generateMomentStill } from '@/lib/moments/media';
import { archetypeEntry } from '@/lib/archetypes/registry';
import type { AuthoringBrief } from '@/lib/archetypes/builder';
import { selectStorefront } from './select-storefront';
import { writeArchetypeStorefront, type ArchetypeListingRow } from '@/lib/generation/write-archetype-storefront';

const MODEL = 'claude-sonnet-4-6';
const MAX_TURNS = 8;
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

// Products are generic across archetypes — same shape, poured into whatever the
// archetype renders. Bohdi authors them because a new store has no catalog yet.
const ProductSchema = z.object({
  name: z.string().min(2).max(40),
  slug: z.string().min(2).max(48),
  shortDescription: z.string().min(4).max(90),
  description: z.string().min(12).max(300),
  basePriceCents: z.number().int().min(100).max(5_000_00),
  imagePrompt: z.string().min(8).max(400),
});
const ProductsSchema = z.array(ProductSchema).min(3).max(12);
type ProductBriefT = z.infer<typeof ProductSchema>;

function productInstructions(productCount: number): string {
  const target = Math.max(3, Math.min(productCount > 0 ? productCount : 6, 10));
  return `

THE PRODUCTS (author ${target} representative products — this is a brand-new store with no catalog yet, so you create it):
Each product: { name (2-40), slug (2-48, lowercase-hyphen), shortDescription (4-90, one concrete line), description (12-300, a real sentence or two), basePriceCents (integer cents, e.g. 4800 for $48), imagePrompt (8-400, a vivid prompt for a clean product photo on a fitting surface) }.
Make them specific to this maker — real things they would actually sell, at believable prices. No filler.`;
}

const SUBMIT_TOOL: Anthropic.Tool = {
  name: 'submit_store',
  description:
    'Submit the complete store: the archetype content and the product catalog. Returns { ok: true } on success or { ok: false, issues: [...] } with structured validation errors to fix and resubmit.',
  input_schema: {
    type: 'object',
    properties: {
      content: { type: 'object', description: "The archetype's content object." },
      products: {
        type: 'array',
        description: 'The product catalog (see the product spec in the prompt).',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            shortDescription: { type: 'string' },
            description: { type: 'string' },
            basePriceCents: { type: 'number' },
            imagePrompt: { type: 'string' },
          },
          required: ['name', 'slug', 'shortDescription', 'description', 'basePriceCents', 'imagePrompt'],
        },
      },
    },
    required: ['content', 'products'],
  },
};

interface AuthoredStore {
  content: unknown;
  products: ProductBriefT[];
}

/** Run Bohdi until he submits valid content + a valid product catalog. */
async function author(
  builderPrompt: string,
  productCount: number,
  parseContent: (raw: unknown) => { ok: true; content: unknown } | { ok: false; issues: Array<{ path: string; message: string }> },
): Promise<AuthoredStore> {
  const system = builderPrompt + productInstructions(productCount);
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Author this store now. Call submit_store when everything is ready.' },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const resp = await anthropicClient().messages.create({
      model: MODEL,
      max_tokens: 16000,
      system,
      tools: [SUBMIT_TOOL],
      messages,
    });
    messages.push({ role: 'assistant', content: resp.content });

    const toolUse = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (!toolUse) {
      if (resp.stop_reason === 'end_turn') throw new Error('Bohdi ended without submitting the store');
      continue;
    }

    const args = toolUse.input as { content?: unknown; products?: unknown };
    const issues: Array<{ path: string; message: string }> = [];

    const contentParse = parseContent(args.content);
    if (!contentParse.ok) for (const i of contentParse.issues) issues.push({ path: `content.${i.path}`, message: i.message });

    const productsParse = ProductsSchema.safeParse(args.products);
    if (!productsParse.success) {
      for (const i of productsParse.error.issues) issues.push({ path: `products.${i.path.join('.')}`, message: i.message });
    }

    if (issues.length === 0 && contentParse.ok && productsParse.success) {
      logger.info('archetype-build: authored', { products: productsParse.data.length, turn: turn + 1 });
      return { content: contentParse.content, products: productsParse.data };
    }

    messages.push({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ ok: false, issues: issues.slice(0, 14) }), is_error: true }],
    });
  }
  throw new Error(`Bohdi did not submit a valid store within ${MAX_TURNS} turns`);
}

/**
 * Assign a photo to each of `count` products from the (≤5) generated `photos`,
 * recycling in order when there are more products than photos. Returns one URL
 * (or null if no photos generated) per product index.
 */
export function recycleProductPhotos(count: number, photos: string[]): Array<string | null> {
  return Array.from({ length: count }, (_, i) =>
    photos.length > 0 ? photos[i % photos.length]! : null,
  );
}

export async function buildArchetypeStore(
  input: ArchetypeBuildInput,
  onProgress?: ProgressEmitter,
): Promise<ArchetypeBuildResult> {
  const emit = (label: string) => onProgress?.({ type: 'status', step: 'composing-home', label });

  const selection = selectStorefront(input.nicheSlug, input.moodKey, input.productCount);
  const entry = archetypeEntry(selection.archetypeKey);
  if (!entry) throw new Error(`No archetype registered for key "${selection.archetypeKey}"`);

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

  emit('Writing your store');
  const { content: authoredContent, products } = await author(
    entry.builder.buildAuthoringPrompt(brief),
    input.productCount,
    entry.builder.parseContent,
  );

  // Generate everything from Bohdi's prompts: the archetype's media slots (hero
  // video, portrait — uncapped) and the product photos (capped at 5, recycled).
  emit('Filming the moment');
  const jobs = entry.builder.mediaJobs(authoredContent);
  const toGenerate = products.slice(0, MAX_PRODUCT_IMAGES);

  const [mediaResults, productResults] = await Promise.all([
    Promise.all(
      jobs.map((j) =>
        j.kind === 'video'
          ? generateMomentVideo(j.prompt, {
              subdomain: input.subdomain,
              aspect: j.aspect,
              ...(j.durationSec !== undefined ? { durationSec: j.durationSec } : {}),
            })
          : generateMomentStill(j.prompt, { subdomain: input.subdomain, aspect: j.aspect }),
      ),
    ),
    Promise.all(
      toGenerate.map((p) =>
        generateMomentStill(p.imagePrompt, { subdomain: `${input.subdomain}/${p.slug}`, aspect: '1:1' }),
      ),
    ),
  ]);

  const mediaUrls: Record<string, string | null> = {};
  jobs.forEach((j, i) => {
    mediaUrls[j.id] = mediaResults[i] ?? null;
  });
  const content = entry.builder.applyMedia(authoredContent, mediaUrls);

  // Available product photos (the ones that actually generated). Recycle across
  // every product so a 10-item catalog rides on ≤5 unique images.
  const photos = productResults.filter((u): u is string => typeof u === 'string' && u.length > 0);
  const assigned = recycleProductPhotos(products.length, photos);
  const listings: ArchetypeListingRow[] = products.map((p, i) => ({
    slug: p.slug,
    name: p.name,
    short_description: p.shortDescription,
    description: p.description,
    base_price_cents: p.basePriceCents,
    image_url: assigned[i] ?? null,
  }));

  logger.info('archetype-build: generated', {
    subdomain: input.subdomain,
    skinKey: selection.skinKey,
    media: Object.fromEntries(Object.entries(mediaUrls).map(([k, v]) => [k, v ? 'ok' : 'FAILED'])),
    productPhotos: photos.length,
    products: products.length,
  });

  emit('Publishing your store');
  const result = await writeArchetypeStorefront({
    subdomain: input.subdomain,
    shopName: input.shopName,
    nicheSlug: input.nicheSlug,
    moodKey: input.moodKey,
    tenantTypes: niche.tenant_type_fit ?? ['seller'],
    archetypeKey: selection.archetypeKey,
    skinKey: selection.skinKey,
    mood: input.moodKey,
    content,
    listings,
    logoUrl: input.logoUrl,
  });

  logger.info('archetype-build: published', { subdomain: result.subdomain, tenantId: result.tenantId, skinKey: selection.skinKey });
  return result;
}
