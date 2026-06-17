'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';

const BUCKET = 'tenant-logos';
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export interface UploadLogoResult {
  logoUrl: string;
  brandColors: string[];
  /** True when the logo image visibly contains the shop name. Null when the
   *  analysis was skipped (SVG) or failed; the renderer treats null as false. */
  logoContainsWordmark: boolean | null;
}

/**
 * Uploads a logo file for a tenant-in-progress (subdomain known, tenant row not
 * yet created), then runs Claude Vision on it to extract the dominant brand
 * colors AND check whether the logo visibly includes the shop name (used to
 * decide whether the typographic wordmark next to the logo doubles up).
 * Returns all three so the caller can stash them in onboarding state.
 */
export async function uploadAndAnalyzeLogo(
  subdomain: string,
  formData: FormData,
  shopName: string,
): Promise<UploadLogoResult> {
  const file = formData.get('logo');
  if (!(file instanceof File)) {
    throw new Error('No logo file provided');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Logo must be under 5MB');
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Logo must be PNG, JPEG, WebP, or SVG');
  }

  const ext = file.type === 'image/svg+xml' ? 'svg'
    : file.type === 'image/png' ? 'png'
    : file.type === 'image/webp' ? 'webp'
    : 'jpg';
  const storagePath = `${subdomain}/logo.${ext}`;

  const db = supabaseAdmin();
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await db.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    logger.error('logo upload failed', { subdomain, error: uploadError.message });
    throw new Error('Could not save your logo. Try again.');
  }

  const { data } = db.storage.from(BUCKET).getPublicUrl(storagePath);
  const logoUrl = data.publicUrl;

  // Vision skips SVG (Claude can't analyze vector files reliably as image URLs).
  // For SVG logos we return an empty brand-colors array AND null for the
  // wordmark detection — Bohdi just won't have logo-derived palette anchors and
  // the renderer falls back to showing both (safe default).
  const analysis = ext === 'svg'
    ? { brandColors: [], logoContainsWordmark: null }
    : await analyzeLogo(logoUrl, shopName);

  return { logoUrl, brandColors: analysis.brandColors, logoContainsWordmark: analysis.logoContainsWordmark };
}

interface LogoAnalysis {
  brandColors: string[];
  /** True when the logo image visibly contains the shop name (or a prominent
   *  wordmark that reads as the name). Null on failure. */
  logoContainsWordmark: boolean | null;
}

async function analyzeLogo(logoUrl: string, shopName: string): Promise<LogoAnalysis> {
  const start = Date.now();
  try {
    const response = await anthropicClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: logoUrl },
            },
            {
              type: 'text',
              text: `Analyze this logo for the shop "${shopName}".

1. Identify the dominant brand colors. Return 2-4 hex codes ordered by visual prominence. Ignore white, transparent, or off-white backgrounds — those are page color, not brand color. Ignore very thin outlines and small accents.

2. Decide whether the logo image visibly INCLUDES the shop name as a prominent readable wordmark. True if a clear text element reads as "${shopName}" or an obvious abbreviation/styling of it (the logo IS or CONTAINS the wordmark). False if the logo is a pure mark/icon with no readable shop name, or text that says something unrelated (a tagline, a year, an emblem letter).

Return ONLY a JSON object, no markdown:
{"colors":["#rrggbb","#rrggbb",...],"containsWordmark":true|false}`,
            },
          ],
        },
      ],
    });
    const latencyMs = Date.now() - start;

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match?.[0] === undefined) {
      logger.warn('logo vision: no JSON in response', { latencyMs });
      return { brandColors: [], logoContainsWordmark: null };
    }
    const parsed = JSON.parse(match[0]) as { colors?: unknown; containsWordmark?: unknown };
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    const colors = Array.isArray(parsed.colors)
      ? parsed.colors.filter((c): c is string => typeof c === 'string' && hexRe.test(c))
      : [];
    const containsWordmark = typeof parsed.containsWordmark === 'boolean' ? parsed.containsWordmark : null;

    logger.info('logo vision: analyzed', {
      latencyMs,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      colorCount: colors.length,
      containsWordmark,
    });
    return { brandColors: colors, logoContainsWordmark: containsWordmark };
  } catch (err) {
    logger.warn('logo vision: extraction failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return { brandColors: [], logoContainsWordmark: null };
  }
}
