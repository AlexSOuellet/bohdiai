import { anthropicClient } from '@/lib/anthropic';
import type { Mood } from '@/lib/moods';
import { DesignTokensSchema, type DesignTokens } from '@/lib/tokens';

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match?.[0]) throw new Error('No JSON object found in AI response');
  return JSON.parse(match[0]);
}

export async function generateTokens(
  nicheBodyMarkdown: string,
  mood: Mood,
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

Generate design tokens that feel authentic to this maker's craft and true to the mood. Use real Google Fonts names for typography (e.g. "Playfair Display", "Inter", "Lora", "DM Sans"). Colors must be valid hex codes.

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

  const response = await anthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const raw = extractJson(text);
  return DesignTokensSchema.parse(raw);
}
