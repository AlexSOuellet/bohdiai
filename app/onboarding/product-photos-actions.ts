'use server';

import type Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import type { VisionPerPhoto } from './_components/types';

const BUCKET = 'tenant-logos';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_PHOTOS = 5;
const VISION_TIMEOUT_MS = 90_000;
const MAX_VISION_ATTEMPTS = 2;

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

// Forced tool use — the SDK guarantees tool_use.input is valid JSON. Free-text
// JSON broke at ~1.8k chars in a real Session 41 build (unescaped quote inside a
// description). Every other crew member in this codebase uses this pattern for
// the same reason — see lib/onboarding/crew/{director,copywriter,...}.ts.
const SUBMIT_PHOTO_READ_TOOL: Anthropic.Tool = {
  name: 'submit_photo_read',
  description: "Submit a structured read of the maker's uploaded product photos.",
  input_schema: {
    type: 'object',
    properties: {
      perPhoto: {
        type: 'array',
        description: 'One entry per photo, in upload order. Must match the input photo count exactly.',
        items: {
          type: 'object',
          properties: {
            productType: { type: 'string', description: 'Short noun phrase like "turned walnut bowl" or "small wooden sign".' },
            suggestedName: { type: 'string', description: 'A real product name, 2-40 chars.' },
            suggestedShortDescription: { type: 'string', description: '4-90 chars.' },
            suggestedDescription: { type: 'string', description: '12+ chars, 2-4 sentences selling the piece.' },
            suggestedPriceCents: { type: 'integer', description: 'Your best read of category-appropriate pricing, in cents (e.g. 4800 = $48).' },
          },
          required: ['productType', 'suggestedName', 'suggestedShortDescription', 'suggestedDescription', 'suggestedPriceCents'],
        },
      },
      makerWork: {
        type: 'string',
        description: '2-3 sentences on what this maker actually makes, written for another AI to read as part of its brief.',
      },
    },
    required: ['perPhoto', 'makerWork'],
  },
};

async function readPhotos(urls: string[]): Promise<{ visionPerPhoto: VisionPerPhoto[]; makerWork: string }> {
  const start = Date.now();
  const userText = `You are looking at ${urls.length} product photo${urls.length === 1 ? '' : 's'} this maker uploaded. Submit a structured read by calling submit_photo_read — exactly ${urls.length} perPhoto entr${urls.length === 1 ? 'y' : 'ies'}, in upload order, plus a 2-3 sentence makerWork summary describing what this maker actually makes.`;

  for (let attempt = 0; attempt < MAX_VISION_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);
      let response: Anthropic.Message;
      try {
        response = await anthropicClient().messages.create(
          {
            model: 'claude-sonnet-4-6',
            max_tokens: 2000,
            tools: [SUBMIT_PHOTO_READ_TOOL],
            tool_choice: { type: 'tool', name: 'submit_photo_read' },
            messages: [
              {
                role: 'user',
                content: [
                  ...urls.map((u) => ({ type: 'image' as const, source: { type: 'url' as const, url: u } })),
                  { type: 'text' as const, text: userText },
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

      const tu = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
      if (!tu) {
        logger.warn('product photos vision: no tool_use block', { attempt, latencyMs });
        continue;
      }

      const input = tu.input as { perPhoto?: unknown; makerWork?: unknown };
      if (!Array.isArray(input.perPhoto)) {
        logger.warn('product photos vision: perPhoto not array', { attempt, latencyMs });
        continue;
      }

      const visionPerPhoto: VisionPerPhoto[] = [];
      for (const p of input.perPhoto) {
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
        logger.warn('product photos vision: per-photo count mismatch', { attempt, expected: urls.length, got: visionPerPhoto.length, latencyMs });
        continue;
      }

      const makerWork = typeof input.makerWork === 'string' ? input.makerWork : '';
      logger.info('product photos vision: read', {
        latencyMs,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        perPhotoCount: visionPerPhoto.length,
        makerWorkLength: makerWork.length,
      });
      return { visionPerPhoto, makerWork };
    } catch (err) {
      logger.warn('product photos vision: extraction failed', { attempt, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return { visionPerPhoto: [], makerWork: '' };
}
