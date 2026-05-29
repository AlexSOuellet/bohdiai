import { z } from 'zod';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';

// AI-generated sample subscription products — recurring "X of the Month"
// offerings the maker can offer once they're ready. Returns an empty array for
// niches where subscriptions don't fit (one-time services, low-frequency
// custom work). Each sample is written to the listings table as a preview;
// the storefront shows a "Get Notified" form instead of a purchase CTA, both
// because the recurring-payment plumbing isn't wired yet and because the
// interest list itself is valuable signal for the maker.

const GeneratedSubscriptionSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(1).max(80),
  short_description: z.string().min(1).max(160),
  description: z.string().min(1).max(800),
  base_price_cents: z.number().int().positive(),
  /** Cadence — most subscriptions are monthly; weekly/quarterly are possible. */
  subscription_interval: z.enum(['week', 'month', 'quarter']),
  image_prompt: z.string().min(1),
});

const GeneratedSubscriptionsSchema = z.object({
  /** Empty array means the niche doesn't benefit from subscriptions. */
  subscriptions: z.array(GeneratedSubscriptionSchema).max(2),
});

export type GeneratedSubscription = z.infer<typeof GeneratedSubscriptionSchema>;

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (match?.[0] === undefined) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

export async function generateSubscriptions(
  shopName: string,
  nicheDisplayName: string,
  nicheBodyMarkdown: string,
  tenantId?: string,
  nicheSlug?: string,
  moodKey?: string,
): Promise<GeneratedSubscription[]> {
  const lowControl = nicheSlug === 'leatherworker' && moodKey === 'dark';

  const copyVoiceLine = lowControl ? '' : `\nSame voice as the rest of the storefront copy. Avoid the banned phrases ("crafted with love", "made with passion", "artisanal", "curated", etc).\n`;
  const shortDescLine = lowControl
    ? `- "short_description": one sentence under 160 chars`
    : `- "short_description": one warm sentence under 160 chars — what subscribers get and why`;
  const descLine = lowControl
    ? `- "description": 2–3 sentences — what to expect, how it works`
    : `- "description": 2–3 sentences in the maker's voice — what to expect, how it works, why it's good`;

  const prompt = `You are helping a maker imagine subscription offerings for their shop. Decide whether a recurring "X of the month" subscription would fit this niche, and if so, generate 1–2 sample subscriptions.

SHOP: ${shopName}
NICHE: ${nicheDisplayName}

NICHE CONTEXT:
${nicheBodyMarkdown}

WHEN SUBSCRIPTIONS FIT
Subscriptions only work when the maker can predictably produce a NEW small item on a cadence of weeks or one month — the kind of small consumable or short-cycle item where producing one more each month is realistic. Examples:
- Candle maker → "Candle of the Month" (new scent each month)
- Florist → "Bouquet Subscription" (seasonal arrangement monthly)
- Baker → "Bread of the Week" or "Custom Cake Club"
- Coffee roaster → "Beans of the Month"
- Soap maker → "Soap of the Season" (quarterly)
- Tea blender, jam maker, granola maker, hot sauce maker — anything small-batch and consumable

WHEN SUBSCRIPTIONS DON'T FIT (be strict about this)
- **Anything where a single piece takes more than 1–2 weeks of production time.** Woodworkers, custom furniture makers, ceramicists who throw on the wheel, leather workers, fine jewelers, blacksmiths, glassblowers — production cadence is too slow. You cannot honestly promise "a new dining table every month" or "a hand-thrown vase of the month" because making them well takes longer than that.
- One-time, high-touch services (wedding photographer, custom portrait painter, commission-only work)
- Unpredictable inventory (vintage sellers, estate sale operators — there's no "vintage record of the month")
- Appointment-driven services (tattoo artist, dog groomer, hair stylist)
- High-ticket items where a recurring charge doesn't match the purchase mental model (a $400 cutting board makes no sense as a monthly subscription)

Default to NOT generating subscriptions if there's any doubt. An empty array is the correct answer for the majority of niches. Only generate subscriptions when the niche obviously fits one of the "FIT" patterns above — small consumables, predictable monthly cadence, low per-unit price ($10–$50 range).

If subscriptions don't fit, return an empty array.

If they do fit, generate 1–2 samples (1 is usually enough). Each subscription needs:
- "name": short title (e.g. "Candle of the Month", "Bouquet Subscription")
- "slug": url-safe (lowercase, hyphens only)
${shortDescLine}
${descLine}
- "base_price_cents": realistic per-period price (e.g. $32/mo = 3200)
- "subscription_interval": "week" | "month" | "quarter" (the cadence the subscription ships on)
- "image_prompt": detailed AI image prompt for a hero photo of the subscription concept
${copyVoiceLine}
Return ONLY a JSON object — no markdown, no explanation:
{
  "subscriptions": [
    {
      "name": "...",
      "slug": "...",
      "short_description": "...",
      "description": "...",
      "base_price_cents": <integer>,
      "subscription_interval": "month",
      "image_prompt": "..."
    }
  ]
}`;

  const start = Date.now();
  const response = await anthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const latencyMs = Date.now() - start;

  logger.info('ai: generate-subscriptions', {
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    latencyMs,
    tenantId,
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const raw = extractJson(text);
  return GeneratedSubscriptionsSchema.parse(raw).subscriptions;
}
