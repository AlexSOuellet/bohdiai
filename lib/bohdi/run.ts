// Bohdi's agent loop. Takes a brief, runs the model in a tool-use loop, and
// returns the result after Bohdi calls finalize.

import type Anthropic from '@anthropic-ai/sdk';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { BOHDI_SYSTEM_PROMPT } from './system-prompt';
import { BOHDI_TOOLS, dispatchTool, type HandlerContext } from './tools';
import { emptyAccumulator, type BohdiBrief, type BohdiResult } from './types';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;
const MAX_TURNS = 80; // safety cap — a normal job should fit well under this

export async function runBohdi(brief: BohdiBrief): Promise<BohdiResult> {
  const accumulator = emptyAccumulator();
  const done = { value: false, result: null as { tenantId: string; subdomain: string } | null };
  const tenantIdRef = { value: null as string | null };
  const ctx: HandlerContext = { brief, accumulator, done, tenantIdRef };

  const logoLine = brief.logoUrl !== undefined && brief.logoUrl !== ''
    ? `\n- Maker uploaded a logo at: ${brief.logoUrl}`
    : '';
  const brandColorsLine = brief.brandColors !== undefined && brief.brandColors.length > 0
    ? `\n- Brand colors extracted from the logo (locked identity — honor these in your palette while respecting the mood): ${brief.brandColors.join(', ')}`
    : '';

  const initialUserMessage = `BRIEF
- Shop name: ${brief.shopName}
- Subdomain: ${brief.subdomain}
- Niche slug: ${brief.nicheSlug}
- Mood key: ${brief.moodKey}
- Product count to generate: ${brief.productCount}${logoLine}${brandColorsLine}

Begin. Read the niche and mood first, then design the storefront end-to-end. Deliberate every meaningful choice. Log every decision. Finalize when complete.`;

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: initialUserMessage }];

  const start = Date.now();
  let turns = 0;

  // Cache the static infrastructure — system prompt and tools list — so that
  // every turn after the first reads them at ~10% of normal input cost. The
  // cache TTL is 5 minutes; Bohdi's run fits well inside that.
  const cachedSystem: Anthropic.TextBlockParam[] = [
    {
      type: 'text',
      text: BOHDI_SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
  ];
  // Add cache_control to the last tool to mark the end of the cacheable tools block.
  const cachedTools = BOHDI_TOOLS.map((t, i) =>
    i === BOHDI_TOOLS.length - 1 ? { ...t, cache_control: { type: 'ephemeral' as const } } : t,
  ) as unknown as Anthropic.Tool[];

  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalCacheWrite = 0;

  while (!done.value && turns < MAX_TURNS) {
    turns++;
    const response = await anthropicClient().messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: cachedSystem,
      tools: cachedTools,
      messages,
    });

    const usage = response.usage as Anthropic.Usage & {
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    totalInput += usage.input_tokens;
    totalOutput += usage.output_tokens;
    totalCacheRead += usage.cache_read_input_tokens ?? 0;
    totalCacheWrite += usage.cache_creation_input_tokens ?? 0;

    logger.info('bohdi: turn', {
      turn: turns,
      stop_reason: response.stop_reason,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      // Bohdi finished talking but didn't call a tool. If finalize hasn't been
      // called, that's an early stop — bail with what we have.
      if (!done.value) {
        logger.warn('bohdi: ended without finalize', { turns });
        throw new Error('Bohdi stopped before finalize');
      }
      break;
    }

    if (response.stop_reason !== 'tool_use') {
      logger.warn('bohdi: unexpected stop_reason', { stop_reason: response.stop_reason });
      break;
    }

    // Run every tool_use block in the response in order.
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      const toolName = block.name;
      try {
        const result = await dispatchTool(toolName, block.input, ctx);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
        logger.info('bohdi: tool', { tool: toolName, ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: `Error: ${message}`,
          is_error: true,
        });
        logger.warn('bohdi: tool error', { tool: toolName, error: message });
      }
      if (done.value) break; // finalize was called — stop running more tools this turn
    }

    messages.push({ role: 'user', content: toolResults });

    if (done.value) break;
  }

  if (!done.value || !done.result) {
    throw new Error(`Bohdi did not finalize within ${turns} turns`);
  }

  const totalMs = Date.now() - start;
  // Sonnet 4.6 pricing: $3 / Mtok input, $15 / Mtok output, $0.30 / Mtok cache-read, $3.75 / Mtok cache-write.
  const inputCost = (totalInput / 1_000_000) * 3;
  const outputCost = (totalOutput / 1_000_000) * 15;
  const cacheReadCost = (totalCacheRead / 1_000_000) * 0.3;
  const cacheWriteCost = (totalCacheWrite / 1_000_000) * 3.75;
  const totalCost = inputCost + outputCost + cacheReadCost + cacheWriteCost;
  logger.info('bohdi: complete', {
    tenantId: done.result.tenantId,
    subdomain: done.result.subdomain,
    turns,
    totalMs,
    totalInput,
    totalOutput,
    totalCacheRead,
    totalCacheWrite,
    costUsd: totalCost.toFixed(4),
  });

  return done.result;
}
