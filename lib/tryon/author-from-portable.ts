/**
 * Re-express an existing maker's shop in a chosen archetype (try-on). Unlike the
 * onboarding engine, the archetype is FIXED — no choose_format, only
 * submit_store — and Bohdi is seeded with the maker's portable content so he
 * keeps their voice and products instead of inventing a new business.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import type { ArchetypeBuildSpec, AuthoringBrief } from '@/lib/archetypes/builder';
import type { PortableStore } from '@/lib/archetypes/portable';

const MODEL = 'claude-sonnet-4-6';
const MAX_TURNS = 8;

const SUBMIT_TOOL: Anthropic.Tool = {
  name: 'submit_store',
  description: 'Submit the re-expressed store. Returns { ok:true } or { ok:false, issues:[...] } to fix and resubmit.',
  input_schema: {
    type: 'object',
    properties: {
      content: { type: 'object', description: "The archetype's content object." },
      products: { type: 'array', description: 'Separate product catalog, if this archetype uses one.', items: { type: 'object' } },
    },
    required: ['content'],
  },
};

export function portableBlock(p: PortableStore): string {
  const products = p.products
    .map((x) => `  - ${x.name} — ${x.price}${x.description ? ` (${x.description})` : ''}`)
    .join('\n');
  return `YOU ARE RE-EXPRESSING AN EXISTING SHOP IN A NEW LAYOUT — not inventing a new business. Keep this maker's identity, voice, and their exact product names and prices. Do not rename the shop, invent new products, or change prices.

EXISTING SHOP
- Wordmark: ${p.wordmark}
${p.tagline ? `- Tagline / voice: ${p.tagline}\n` : ''}${p.maker.body ? `- Maker story: ${p.maker.body}\n` : ''}- Products (reuse these names and prices exactly):
${products}

Author the new layout's content FROM the above. Where the new layout needs fields the old one lacked (a hero story, a founder line, a close), write them in this maker's voice. For image prompts, describe shots fitting these exact products.`;
}

export async function authorFromPortable<T>(
  spec: ArchetypeBuildSpec<T>,
  brief: AuthoringBrief,
  portable: PortableStore,
): Promise<T> {
  const system = `${spec.authoringSpec(brief)}\n\n${portableBlock(portable)}`;
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Re-express this shop in the new layout. Call submit_store.' },
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

    const toolUses = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (toolUses.length === 0) {
      if (resp.stop_reason === 'end_turn') throw new Error('authorFromPortable: ended without submitting');
      continue;
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const parsed = spec.parseSubmission(tu.input);
      if (parsed.ok) {
        logger.info('tryon: re-expressed', { archetype: spec.key, turn: turn + 1 });
        return parsed.authored;
      }
      results.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        is_error: true,
        content: JSON.stringify({ ok: false, issues: parsed.issues.slice(0, 14) }),
      });
    }
    messages.push({ role: 'user', content: results });
  }
  throw new Error(`authorFromPortable: no valid submission in ${MAX_TURNS} turns`);
}
