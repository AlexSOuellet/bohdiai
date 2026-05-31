import { z } from 'zod';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';

// AI-generated sample collections — groupings the maker can use as a starting
// point to organize their products. Returns an empty array for niches where
// collections don't make sense (single-product makers, services-only doers).
// The maker activates/edits/replaces from the dashboard later.

export const GeneratedCollectionSchema = z.object({
  name: z.string().min(1).max(60),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .min(1)
    .max(80),
  description: z.string().max(280),
});

export const GeneratedCollectionsSchema = z.object({
  /** Empty array means the niche doesn't benefit from collections. */
  collections: z.array(GeneratedCollectionSchema).max(4),
});

export type GeneratedCollection = z.infer<typeof GeneratedCollectionSchema>;

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (match?.[0] === undefined) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

export async function generateCollections(
  shopName: string,
  nicheDisplayName: string,
  nicheBodyMarkdown: string,
  tenantId?: string,
  nicheSlug?: string,
  moodKey?: string,
): Promise<GeneratedCollection[]> {
  const lowControl = nicheSlug === 'leatherworker' && moodKey === 'dark';

  const collectionDescriptionField = lowControl
    ? `- "description": one sentence describing what's in this collection — 280 chars max.`
    : `- "description": one warm sentence describing what's in this collection — 280 chars max. Same voice as the rest of the storefront copy. Avoid the banned phrases ("crafted with love", "made with passion", "artisanal", "curated", etc).`;

  const prompt = `You are helping a maker organize their online store. Decide whether collections (groupings of products) would help this shop, and if so, generate 2–4 sample collections appropriate to the niche.

SHOP: ${shopName}
NICHE: ${nicheDisplayName}

NICHE CONTEXT:
${nicheBodyMarkdown}

WHEN COLLECTIONS HELP
A shop benefits from collections when their products naturally group into a small number of meaningful categories. Examples:
- A candle maker: "Seasonal", "Wellness", "Bestsellers"
- A jeweler: "Engagement", "Everyday Pieces", "Statement"
- A baker: "Bread", "Pastries", "Custom Cakes"
- A woodworker: "Cutting Boards", "Furniture", "Gifts Under $50"

WHEN COLLECTIONS DON'T HELP
- Single-product makers (one signature product, no variation)
- Service providers with no product lines (e.g. a wedding photographer)
- Very small inventory where every product is its own thing (e.g. a one-off vintage seller)

If collections don't fit this shop, return an empty array.

If they do fit, generate 2–4 sample collections. Each collection needs:
- "name": short title (e.g. "Wellness Candles", "Holiday Collection") — 60 chars max
- "slug": url-safe (lowercase, hyphens only)
${collectionDescriptionField}

These are starting points the maker will edit. Don't generate more than makes sense — 2–3 is often perfect; 4 is the cap.

Return ONLY a JSON object — no markdown, no explanation:
{
  "collections": [
    { "name": "...", "slug": "...", "description": "..." }
  ]
}`;

  const start = Date.now();
  const response = await anthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const latencyMs = Date.now() - start;

  logger.info('ai: generate-collections', {
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    latencyMs,
    tenantId,
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const raw = extractJson(text);
  return GeneratedCollectionsSchema.parse(raw).collections;
}
