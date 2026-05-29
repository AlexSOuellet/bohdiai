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
}

/**
 * Uploads a logo file for a tenant-in-progress (subdomain known, tenant row not
 * yet created), then runs Claude Vision on it to extract the dominant brand
 * colors. Returns both so the caller can stash them in onboarding state.
 */
export async function uploadAndAnalyzeLogo(
  subdomain: string,
  formData: FormData,
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
  // For SVG logos we return an empty brand-colors array — Bohdi just won't have
  // logo-derived palette anchors. The maker can still upload a raster version later.
  const brandColors = ext === 'svg' ? [] : await extractBrandColors(logoUrl);

  return { logoUrl, brandColors };
}

async function extractBrandColors(logoUrl: string): Promise<string[]> {
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
              text: `Identify the dominant brand colors in this logo. Return 2-4 hex codes ordered by visual prominence in the design. Ignore white, transparent, or off-white backgrounds — those are page color, not brand color. Ignore very thin outlines and small accents.

Return ONLY a JSON object, no markdown:
{"colors":["#rrggbb","#rrggbb",...]}`,
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
      return [];
    }
    const parsed = JSON.parse(match[0]) as { colors?: unknown };
    if (!Array.isArray(parsed.colors)) return [];

    const hexRe = /^#[0-9a-fA-F]{6}$/;
    const colors = parsed.colors.filter((c): c is string => typeof c === 'string' && hexRe.test(c));

    logger.info('logo vision: brand colors extracted', {
      latencyMs,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      count: colors.length,
    });
    return colors;
  } catch (err) {
    logger.warn('logo vision: extraction failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
