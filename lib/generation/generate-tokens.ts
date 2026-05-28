import fs from 'node:fs';
import path from 'node:path';
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

interface StyleSheet {
  palette: Array<{ name: string; hex: string }>;
  fonts: Array<{ name: string; category: string }>;
  textures: string[];
}

function loadSheetIfPresent(filename: string): StyleSheet | null {
  // Style sheets live in the repo under content/. Eventually they move to the DB.
  const p = path.join(process.cwd(), 'content', 'style-sheets', filename);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw) as StyleSheet;
  } catch {
    return null;
  }
}

function renderSheet(label: string, sheet: StyleSheet): string {
  const palette = sheet.palette.map((c) => `  ${c.name.padEnd(18)} ${c.hex}`).join('\n');
  const fonts = sheet.fonts.map((f) => `  ${f.name.padEnd(24)} [${f.category}]`).join('\n');
  const textures = sheet.textures.join(', ');
  return `${label}\nPALETTE:\n${palette}\n\nFONTS:\n${fonts}\n\nTEXTURES: ${textures}`;
}

export async function generateTokens(
  nicheBodyMarkdown: string,
  mood: Mood,
  tenantId?: string,
  nicheSlug?: string,
): Promise<DesignTokens> {
  const nicheSheet = nicheSlug ? loadSheetIfPresent(`niche-${nicheSlug}.json`) : null;
  const moodSheet = loadSheetIfPresent(`mood-${mood.key}.json`);

  const sheetsBlock =
    nicheSheet && moodSheet
      ? `\n\n──────────────────────────────────────────────\nRAW MATERIALS — TWO STYLE SHEETS\n──────────────────────────────────────────────\n\n${renderSheet('═══ NICHE STYLE SHEET ═══', nicheSheet)}\n\n${renderSheet('═══ MOOD STYLE SHEET ═══', moodSheet)}\n\nYou decide which hue plays which part. You decide which font plays which part. You decide which textures the design draws on. You may go outside these lists if the design needs it.\n`
      : '';

  const prompt = `You are a brand designer making visual design tokens for an artisan maker's storefront.

NICHE CONTEXT:
${nicheBodyMarkdown}

MOOD: ${mood.label}
${mood.description}
${sheetsBlock}
Return ONLY a JSON object with this exact structure — no markdown, no explanation. Use valid hex codes. Use real Google Font names. Ensure text is readable against its background.

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
    "headingFont": "<Google Font name>",
    "bodyFont": "<Google Font name>",
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
    nicheSheetLoaded: !!nicheSheet,
    moodSheetLoaded: !!moodSheet,
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
  const raw = extractJson(text);
  const tokens = DesignTokensSchema.parse(raw);
  // When both sheets loaded we trust the AI's accent pick — don't shift it for contrast.
  const skipAccent = !!nicheSheet && !!moodSheet;
  return enforceTokenContrast(tokens, { skipAccent });
}
