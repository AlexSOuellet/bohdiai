import { z } from 'zod';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import type { Mood } from '@/lib/moods';
import { BLOCKS_MANIFEST } from '@/lib/blocks-manifest.generated';
import { WIDGETS_MANIFEST } from '@/lib/widgets-manifest.generated';

// ─── Output types ─────────────────────────────────────────────────────────────

const GeneratedSlotSchema = z.object({
  widgetKey: z.string(),
  content: z.record(z.string(), z.string()),
});

const GeneratedBlockSchema = z.object({
  blockKey: z.string(),
  position: z.number().int().nonnegative(),
  content: z.record(z.string(), z.string()),
  slots: z.record(z.string(), GeneratedSlotSchema).default({}),
});

const SecondaryPageCopySchema = z.object({
  eyebrow: z.string().min(1).max(40),
  heading: z.string().min(1).max(80),
  subheading: z.string().min(1).max(240),
});

const ContactCopySchema = z.object({
  heading: z.string().min(1).max(80),
  subheading: z.string().min(1).max(280),
  buttonLabel: z.string().min(1).max(40),
});

const GeneratedPageSchema = z.object({
  blocks: z.array(GeneratedBlockSchema).min(1),
  secondaryPages: z.object({
    shop: SecondaryPageCopySchema,
    contact: ContactCopySchema,
  }),
});

export type GeneratedSlot = z.infer<typeof GeneratedSlotSchema>;
export type GeneratedBlock = z.infer<typeof GeneratedBlockSchema>;
export type GeneratedPage = z.infer<typeof GeneratedPageSchema>;
export type GeneratedSecondaryPageCopy = z.infer<typeof SecondaryPageCopySchema>;
export type GeneratedContactCopy = z.infer<typeof ContactCopySchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (match?.[0] === undefined) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = tmp;
  }
  return copy;
}

function buildBlocksContext(): string {
  const lines: string[] = ['AVAILABLE BLOCKS:'];
  // Only show the AI blocks that are (a) active and (b) declare themselves usable
  // on the home page via pageTypes. System-injected blocks (nav, footer) and
  // secondary-page blocks (shop grid, contact form, page intro) are filtered out
  // automatically because they don't include 'home' in their pageTypes.
  const active = BLOCKS_MANIFEST.filter(
    (b) => b.status === 'active' && b.pageTypes.includes('home'),
    // events-list is excluded at onboarding because brand-new tenants have no
    // events. The block returns null when empty, which leaves a dead nav link
    // and an empty home section. Once the dashboard can create events, the
    // maker will add this block themselves.
  ).filter((b) => b.key !== 'events-list');
  // Shuffle hero blocks so position in the list doesn't bias the AI toward one variant.
  const heroBlocks = shuffled(active.filter(b => b.sectionType === 'hero'));
  const productBlocks = shuffled(active.filter(b => b.sectionType === 'products'));
  const otherBlocks = active.filter(b => b.sectionType !== 'hero' && b.sectionType !== 'products');
  const orderedBlocks = [...heroBlocks, ...productBlocks, ...otherBlocks];
  for (const block of orderedBlocks) {
    lines.push(`\nBlock key: "${block.key}"`);
    lines.push(`  Section type: ${block.sectionType}`);
    lines.push(`  Description: ${block.description}`);
    lines.push(`  Content fields (aiGenerated=true):`);
    for (const field of block.contentSchema) {
      if (!field.aiGenerated) continue;
      const limit = field.maxLength ? ` (max ${field.maxLength} chars)` : '';
      lines.push(`    - "${field.key}" (${field.type})${limit}: ${field.label}`);
    }
    if (block.slots.length > 0) {
      lines.push(`  Widget slots:`);
      for (const slot of block.slots) {
        lines.push(`    - "${slot.key}" accepts: [${slot.accepts.join(', ')}]${slot.required ? ' (required)' : ''}`);
      }
    }
  }

  lines.push('\nAVAILABLE WIDGETS:');
  for (const widget of WIDGETS_MANIFEST) {
    if (widget.status !== 'active') continue;
    lines.push(`\nWidget key: "${widget.key}"`);
    lines.push(`  Description: ${widget.description}`);
    lines.push(`  Content fields (aiGenerated=true):`);
    for (const field of widget.contentSchema) {
      if (!field.aiGenerated) continue;
      const limit = field.maxLength ? ` (max ${field.maxLength} chars)` : '';
      lines.push(`    - "${field.key}" (${field.type})${limit}: ${field.label}`);
    }
  }

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function generatePage(
  shopName: string,
  nicheDisplayName: string,
  nicheBodyMarkdown: string,
  mood: Mood,
  tenantId?: string,
  nicheSlug?: string,
): Promise<GeneratedPage> {
  const blocksContext = buildBlocksContext();

  // Gated test: leatherworker × dark gets a stripped, low-control prompt.
  // Everything else keeps the current prescriptive behavior.
  const lowControl = nicheSlug === 'leatherworker' && mood.key === 'dark';

  const moodSection = `MOOD: ${mood.label}\n${mood.description}\n`;

  const rulesSection = lowControl
    ? ''
    : `\nMANDATORY RULES — these override all other guidance:\n1. The FIRST block (position 0) MUST be a hero block (sectionType: "hero"). All hero variants are equally valid for any shop — read each block's structural description and make a genuine choice based on this specific shop's niche and personality. Do NOT default to whichever hero appears first in the list.\n2. A products block (sectionType: "products") MUST appear in the page.\n3. Total blocks: 4 to 6. Do not output fewer than 4 or more than 6.\n`;

  const copyRules = lowControl
    ? ''
    : `\nAssemble the home page. For all aiGenerated content fields, write like a gifted copywriter, not a content generator.\n\nCOPY RULES:\n- Every headline must stop someone mid-scroll. It should be specific, unexpected, and true to this shop — not interchangeable with any other maker.\n- Subheadlines say something real and particular. Not "crafted with love" or "made by hand" or "quality you can trust" — those are placeholders, not copy.\n- Write like the maker is talking directly to their best customer. Warm, specific, a little surprising. The reader should feel like they already know this shop after one sentence.\n- Use the niche vocabulary naturally — the words real practitioners use, not the words a marketer uses to describe them.\n- Banned phrases: "crafted with love," "made with passion," "quality you can trust," "handmade with care," "small batch," "artisanal," "curated." Show it, don't label it.`;

  const secondaryPagesSection = lowControl
    ? `\nSECONDARY PAGES\nThe storefront has two automatically-built secondary pages: a /shop page (full product listing) and a /contact page (contact form). Write the headings for them.\n\nFor /shop, write:\n- "eyebrow": uppercase label, MAX 40 characters\n- "heading": page title, MAX 80 characters\n- "subheading": MAX 240 characters\n\nFor /contact, write:\n- "heading": page title, MAX 80 characters\n- "subheading": MAX 280 characters\n- "buttonLabel": short button text, MAX 40 characters\n`
    : `\nSECONDARY PAGES\nThe storefront has two automatically-built secondary pages: a /shop page (full product listing) and a /contact page (contact form). You must also write the headings for these pages so they match the home page voice.\n\nFor /shop, write:\n- "eyebrow": uppercase label, MAX 40 characters (e.g. "All Work", "The Shop", "Collection")\n- "heading": page title, MAX 80 characters (e.g. "Everything in the studio", "The full range")\n- "subheading": one or two warm sentences inviting the visitor to browse. MAX 240 characters total — be tight, not chatty. Same voice and specificity as the home page copy. Avoid the banned phrases.\n\nFor /contact, write:\n- "heading": page title, MAX 80 characters (e.g. "Get in touch", "Drop us a line", "Say hello")\n- "subheading": one warm, inviting sentence about what kinds of messages this maker welcomes (commissions, questions, hellos). MAX 280 characters — keep it to one sentence; do not write a paragraph. Same voice. Avoid the banned phrases.\n- "buttonLabel": short button text, MAX 40 characters (e.g. "Send Message", "Reach Out", "Say Hello")\n`;

  const prompt = `You are a storefront designer assembling a home page for an artisan maker.

SHOP: ${shopName}
NICHE: ${nicheDisplayName}

NICHE CONTEXT:
${nicheBodyMarkdown}

${moodSection}${rulesSection}
${blocksContext}
${copyRules}

For "href" fields in widgets, you may use any of these page routes: "/shop" (full product grid), "/contact" (contact form), or anchor links that scroll on the home page ("/#products", "/#about", "/#collections", "/#events"). Do NOT link to pages that don't exist ("/commissions", "/booking", "/services").
${secondaryPagesSection}
Return ONLY a JSON object — no markdown, no explanation:
{
  "blocks": [
    {
      "blockKey": "<block key from the list above>",
      "position": <0-based integer>,
      "content": {
        "<fieldKey>": "<value>"
      },
      "slots": {
        "<slotKey>": {
          "widgetKey": "<widget key>",
          "content": {
            "<fieldKey>": "<value>"
          }
        }
      }
    }
  ],
  "secondaryPages": {
    "shop": { "eyebrow": "...", "heading": "...", "subheading": "..." },
    "contact": { "heading": "...", "subheading": "...", "buttonLabel": "..." }
  }
}`;

  const start = Date.now();
  const response = await anthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2560,
    messages: [{ role: 'user', content: prompt }],
  });
  const latencyMs = Date.now() - start;

  logger.info('ai: generate-page', {
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    latencyMs,
    tenantId,
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const raw = extractJson(text);
  return GeneratedPageSchema.parse(raw);
}
