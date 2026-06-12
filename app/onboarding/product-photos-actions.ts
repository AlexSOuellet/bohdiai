'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import type { VisionPerPhoto } from './_components/types';

const BUCKET = 'tenant-logos';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_PHOTOS = 5;
const VISION_TIMEOUT_MS = 60_000;

export interface UploadProductPhotosResult {
  productPhotoUrls: string[];
  visionPerPhoto: VisionPerPhoto[];
  makerWork: string;
}

export async function uploadProductPhotos(
  subdomain: string,
  formData: FormData,
): Promise<UploadProductPhotosResult> {
  const files = formData.getAll('photos').filter((f): f is File => f instanceof File);
  if (files.length === 0) throw new Error('No photo files provided');
  if (files.length > MAX_PHOTOS) throw new Error(`Upload at most 5 photos`);
  for (const f of files) {
    if (f.size > MAX_BYTES) throw new Error('Each photo must be under 10MB');
    if (!ALLOWED_TYPES.includes(f.type)) throw new Error('Photos must be PNG, JPEG, WebP');
  }

  const db = supabaseAdmin();
  const uploaded: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i]!;
    const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
    const storagePath = `${subdomain}/product-${i}.${ext}`;
    const buffer = await f.arrayBuffer();
    const { error } = await db.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: f.type,
      upsert: true,
    });
    if (error) {
      logger.error('product photo upload failed', { subdomain, index: i, error: error.message });
      throw new Error('Could not save your photos. Try again.');
    }
    const { data } = db.storage.from(BUCKET).getPublicUrl(storagePath);
    uploaded.push(data.publicUrl);
  }

  const vision = await readPhotos(uploaded);
  return { productPhotoUrls: uploaded, ...vision };
}

async function readPhotos(urls: string[]): Promise<{ visionPerPhoto: VisionPerPhoto[]; makerWork: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);
    let response;
    try {
      response = await anthropicClient().messages.create(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: [
                ...urls.map((u) => ({ type: 'image' as const, source: { type: 'url' as const, url: u } })),
                {
                  type: 'text' as const,
                  text: `You are looking at ${urls.length} product photo${urls.length === 1 ? '' : 's'} this maker uploaded. For each photo, in upload order, return:
- productType: short noun phrase ("turned walnut bowl", "small wooden sign")
- suggestedName: 2-40 chars, a real product name
- suggestedShortDescription: 4-90 chars
- suggestedDescription: 12+ chars, 2-4 sentences
- suggestedPriceCents: integer cents, your best read of category-appropriate pricing

Also write a makerWork field: 2-3 sentences on what this maker actually makes, written for another AI to read as part of its brief.

Return ONLY a JSON object, no markdown:
{"perPhoto":[{"productType":"...","suggestedName":"...","suggestedShortDescription":"...","suggestedDescription":"...","suggestedPriceCents":4800}, ...],"makerWork":"..."}`,
                },
              ],
            },
          ],
        },
        { signal: controller.signal },
      );
    } finally {
      clearTimeout(timer);
    }
    const latencyMs = Date.now() - start;

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match?.[0]) {
      logger.warn('product photos vision: no JSON', { latencyMs });
      return { visionPerPhoto: [], makerWork: '' };
    }
    const parsed = JSON.parse(match[0]) as { perPhoto?: unknown; makerWork?: unknown };
    if (!Array.isArray(parsed.perPhoto)) return { visionPerPhoto: [], makerWork: '' };

    const visionPerPhoto: VisionPerPhoto[] = [];
    for (const p of parsed.perPhoto) {
      if (typeof p !== 'object' || p === null) continue;
      const r = p as Record<string, unknown>;
      const productType = r['productType'];
      const suggestedName = r['suggestedName'];
      const suggestedShortDescription = r['suggestedShortDescription'];
      const suggestedDescription = r['suggestedDescription'];
      const suggestedPriceCents = r['suggestedPriceCents'];
      if (
        typeof productType === 'string' &&
        typeof suggestedName === 'string' &&
        typeof suggestedShortDescription === 'string' &&
        typeof suggestedDescription === 'string' &&
        typeof suggestedPriceCents === 'number'
      ) {
        visionPerPhoto.push({
          productType,
          suggestedName,
          suggestedShortDescription,
          suggestedDescription,
          suggestedPriceCents: Math.round(suggestedPriceCents),
        });
      }
    }
    if (visionPerPhoto.length !== urls.length) {
      logger.warn('product photos vision: per-photo count mismatch', { expected: urls.length, got: visionPerPhoto.length, latencyMs });
      return { visionPerPhoto: [], makerWork: '' };
    }

    const makerWork = typeof parsed.makerWork === 'string' ? parsed.makerWork : '';
    logger.info('product photos vision: read', {
      latencyMs,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      perPhotoCount: visionPerPhoto.length,
    });
    return { visionPerPhoto, makerWork };
  } catch (err) {
    logger.warn('product photos vision: extraction failed', { error: err instanceof Error ? err.message : String(err) });
    return { visionPerPhoto: [], makerWork: '' };
  }
}
