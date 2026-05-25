import { z } from 'zod';
import { anthropicClient } from '@/lib/anthropic';
import { getPlaceholderImage } from '@/lib/pexels';

// ─── Output types ─────────────────────────────────────────────────────────────

const GeneratedListingSchema = z.object({
  name: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  short_description: z.string(),
  description: z.string(),
  base_price_cents: z.number().int().positive(),
  pexels_query: z.string(), // search term for Pexels image lookup
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
  if (!match?.[0]) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function generateListings(
  shopName: string,
  nicheSlug: string,
  nicheDisplayName: string,
  nicheBodyMarkdown: string,
  count: number,
): Promise<GeneratedListingWithImage[]> {
  const prompt = `You are helping a maker launch their online store. Generate ${count} realistic placeholder product listings for their shop.

SHOP: ${shopName}
NICHE: ${nicheDisplayName}

NICHE CONTEXT:
${nicheBodyMarkdown}

Generate ${count} products that feel authentic to this niche. Each product should have:
- A specific, evocative name (not generic — not "Candle" but "Black Fig & Vetiver Soy Candle")
- A slug (lowercase, hyphens only, no spaces)
- A short_description (one compelling sentence, under 120 chars)
- A full description (2-3 sentences, maker voice, specific materials and techniques)
- A realistic price in cents (e.g. $24.00 = 2400)
- A pexels_query: a 2-4 word search phrase that would find a great product photo on Pexels for this item

Return ONLY a JSON object — no markdown, no explanation:
{
  "listings": [
    {
      "name": "<product name>",
      "slug": "<url-slug>",
      "short_description": "<one sentence>",
      "description": "<2-3 sentences>",
      "base_price_cents": <integer>,
      "pexels_query": "<search term>"
    }
  ]
}`;

  const response = await anthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const raw = extractJson(text);
  const { listings } = GeneratedListingsSchema.parse(raw);

  // Fetch Pexels images in parallel
  const withImages = await Promise.all(
    listings.map(async (listing) => {
      const image_url = await getPlaceholderImage(nicheSlug, listing.pexels_query);
      return { ...listing, image_url };
    }),
  );

  return withImages;
}
