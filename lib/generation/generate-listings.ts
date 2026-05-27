import { z } from 'zod';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { generateProductImage } from '@/lib/fal';

const MAX_PRODUCT_IMAGES = 4;

const GeneratedListingSchema = z.object({
  name: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  short_description: z.string(),
  description: z.string(),
  base_price_cents: z.number().int().positive(),
  image_prompt: z.string(),
  /**
   * Slug of the collection this listing belongs to. The AI picks from the slugs
   * provided in the prompt; null if no collections exist for this shop. The RPC
   * resolves the slug to a collection ID at write time.
   */
  collection_slug: z.string().nullable().default(null),
});

const GeneratedListingsSchema = z.object({
  listings: z.array(GeneratedListingSchema).min(1),
});

export type GeneratedListing = z.infer<typeof GeneratedListingSchema>;

export interface GeneratedListingWithImage extends GeneratedListing {
  image_url: string | null;
}

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (match?.[0] === undefined) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

export async function generateListings(
  shopName: string,
  subdomain: string,
  nicheDisplayName: string,
  nicheBodyMarkdown: string,
  count: number,
  /** Collection slugs to assign products to. Empty array means no collections for this shop. */
  collectionSlugs: string[],
  tenantId?: string,
): Promise<GeneratedListingWithImage[]> {
  const imageCount = Math.min(count, MAX_PRODUCT_IMAGES);

  const collectionGuidance = collectionSlugs.length > 0
    ? `\nCOLLECTIONS\nThis shop has these collections, identified by slug: ${collectionSlugs.map(s => `"${s}"`).join(', ')}.\nFor each product, set "collection_slug" to the slug of the collection it best belongs to. Distribute products across collections sensibly — don't dump them all into one collection unless they truly all belong to the same one.\n`
    : `\nThis shop has no collections. Set "collection_slug" to null for every product.\n`;

  const prompt = `You are helping a maker launch their online store. Generate ${imageCount} realistic placeholder product listings for their shop.

SHOP: ${shopName}
NICHE: ${nicheDisplayName}

NICHE CONTEXT:
${nicheBodyMarkdown}
${collectionGuidance}
Generate ${imageCount} products that feel authentic to this niche. Each product should have:
- A specific, evocative name (not generic — not "Candle" but "Black Fig & Vetiver Soy Candle")
- A slug (lowercase, hyphens only, no spaces)
- A short_description (one compelling sentence, under 120 chars)
- A full description (2-3 sentences, maker voice, specific materials and techniques)
- A realistic price in cents (e.g. $24.00 = 2400)
- An image_prompt: a detailed description for an AI image generator to create a professional product photo (e.g. "Hand-poured soy candle in a matte black jar with a kraft paper label, soft candlelight, dark moody background, close-up product photography")
- A collection_slug per the guidance above (null if no collections, otherwise one of the provided slugs)

Return ONLY a JSON object — no markdown, no explanation:
{
  "listings": [
    {
      "name": "<product name>",
      "slug": "<url-slug>",
      "short_description": "<one sentence>",
      "description": "<2-3 sentences>",
      "base_price_cents": <integer>,
      "image_prompt": "<detailed AI image generation prompt>",
      "collection_slug": <"slug" or null>
    }
  ]
}`;

  const start = Date.now();
  const response = await anthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  const latencyMs = Date.now() - start;

  logger.info('ai: generate-listings', {
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    latencyMs,
    count: imageCount,
    tenantId,
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const raw = extractJson(text);
  const { listings } = GeneratedListingsSchema.parse(raw);

  // Generate images in batches of 2 to avoid fal.ai concurrent request rate limits
  const withImages: GeneratedListingWithImage[] = [];
  for (let i = 0; i < listings.length; i += 2) {
    const batch = listings.slice(i, i + 2);
    const results = await Promise.all(
      batch.map((listing) =>
        generateProductImage(
          listing.name,
          listing.description,
          nicheDisplayName,
          subdomain,
          listing.slug,
        ).then((image_url) => ({ ...listing, image_url })),
      ),
    );
    withImages.push(...results);
  }

  return withImages;
}
