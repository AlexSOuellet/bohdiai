import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import type { Mood } from '@/lib/moods';
import { DesignTokensSchema, type DesignTokens } from '@/lib/tokens';
import { enforceTokenContrast } from '@/lib/contrast';

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (match?.[0] === undefined) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

export async function generateTokens(
  nicheBodyMarkdown: string,
  mood: Mood,
  tenantId?: string,
): Promise<DesignTokens> {
  const prompt = `You are a brand designer generating visual design tokens for an artisan maker's storefront.

NICHE CONTEXT:
${nicheBodyMarkdown}

MOOD: ${mood.label}
${mood.description}

DIRECTIONAL HINTS:
- Palette: ${mood.tokenHints.palette}
- Typography: ${mood.tokenHints.typography}
- Shape: ${mood.tokenHints.shape}
- Spacing: ${mood.tokenHints.spacing}

Generate design tokens that feel authentic to this maker's craft and unmistakably true to the mood. The DIRECTIONAL HINTS above tell you which color goes on which role (background, text, accent) — follow them precisely. Within those constraints, make strong specific choices: a particular shade of rust rather than generic orange, a specific warm cream rather than plain white, a distinctive ochre rather than generic yellow. Every storefront should feel like a considered brand decision. The mood must be immediately recognizable — a rustic shop should read rustic, a dark-and-stormy shop should read dark and moody. Do not swap colors across roles (e.g. do not put the accent color on the background, do not use the background color as the accent).

Use real Google Fonts names for typography (e.g. "Playfair Display", "Inter", "Lora", "DM Sans", "Fraunces", "Syne", "Cormorant Garamond", "Crimson Pro", "Libre Baskerville", "Work Sans"). Colors must be valid hex codes. Ensure sufficient contrast between text and background (WCAG AA minimum).

Return ONLY a JSON object with this exact structure — no markdown, no explanation:
{
  "colors": {
    "primary": "<hex>",
    "accent": "<hex>",
    "background": "<hex>",
    "surface": "<hex>",
    "text": "<hex>",
    "textMuted": "<hex>",
    "border": "<hex>"
  },
  "typography": {
    "headingFont": "<Google Font name or system stack>",
    "bodyFont": "<Google Font name or system stack>",
    "headingWeight": <400|600|700|800|900>,
    "headingLetterSpacing": "<e.g. -0.02em>",
    "bodyLineHeight": "<e.g. 1.6>",
    "baseSize": "<e.g. 16px>"
  },
  "shape": {
    "borderRadius": "<none|sm|md|lg|full>",
    "cardBorderRadius": "<none|sm|md|lg|full>"
  },
  "spacing": {
    "sectionPadding": "<compact|normal|spacious>",
    "cardGap": "<tight|normal|loose>"
  },
  "layout": {
    "heroStyle": "<full-bleed|contained|split>",
    "productGridCols": <2|3|4>,
    "footerStyle": "<minimal|standard|rich>"
  }
}`;

  const start = Date.now();
  const response = await anthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  const latencyMs = Date.now() - start;

  logger.info('ai: generate-tokens', {
    model: response.model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    latencyMs,
    tenantId,
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const raw = extractJson(text);
  const tokens = DesignTokensSchema.parse(raw);
  return enforceTokenContrast(tokens);
}
