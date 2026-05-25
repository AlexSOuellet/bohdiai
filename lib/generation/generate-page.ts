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

const GeneratedPageSchema = z.object({
  blocks: z.array(GeneratedBlockSchema).min(1),
});

export type GeneratedSlot = z.infer<typeof GeneratedSlotSchema>;
export type GeneratedBlock = z.infer<typeof GeneratedBlockSchema>;
export type GeneratedPage = z.infer<typeof GeneratedPageSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (match?.[0] === undefined) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

function buildBlocksContext(): string {
  const lines: string[] = ['AVAILABLE BLOCKS:'];
  for (const block of BLOCKS_MANIFEST) {
    if (block.status !== 'active') continue;
    lines.push(`\nBlock key: "${block.key}"`);
    lines.push(`  Section type: ${block.sectionType}`);
    lines.push(`  Description: ${block.description}`);
    lines.push(`  Mood fit: ${block.moodFit.join(', ')}`);
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
): Promise<GeneratedPage> {
  const blocksContext = buildBlocksContext();

  const prompt = `You are a storefront designer assembling a home page for an artisan maker.

SHOP: ${shopName}
NICHE: ${nicheDisplayName}

NICHE CONTEXT:
${nicheBodyMarkdown}

MOOD: ${mood.label}
${mood.description}

PAGE ASSEMBLY GUIDANCE (follow this structure exactly):
${mood.blockAssemblyHint}

MANDATORY RULES — these override all other guidance:
1. The FIRST block (position 0) MUST be a hero block (sectionType: "hero"). Choose the hero variant that best fits the mood and niche — do not default to "hero-editorial" if a more fitting variant exists.
2. A products block (sectionType: "products") MUST appear in the page. Choose the variant that best fits the mood. This is a commerce storefront — products are non-negotiable.
3. Total blocks: 4 to 6. Do not output fewer than 4 or more than 6.
4. moodFit is a suggestion, not a gate. You may use any block for any mood — the mandatory blocks above override moodFit restrictions.

${blocksContext}

Assemble the home page. For all aiGenerated content fields, write like a gifted copywriter, not a content generator.

COPY RULES:
- Every headline must stop someone mid-scroll. It should be specific, unexpected, and true to this shop — not interchangeable with any other maker.
- Subheadlines say something real and particular. Not "crafted with love" or "made by hand" or "quality you can trust" — those are placeholders, not copy.
- Write like the maker is talking directly to their best customer. Warm, specific, a little surprising. The reader should feel like they already know this shop after one sentence.
- Use the niche vocabulary naturally — the words real practitioners use, not the words a marketer uses to describe them.
- Banned phrases: "crafted with love," "made with passion," "quality you can trust," "handmade with care," "small batch," "artisanal," "curated." Show it, don't label it.

For "href" fields in widgets, use relative paths like "/shop", "/about", "/commissions".

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
  ]
}`;

  const start = Date.now();
  const response = await anthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
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
