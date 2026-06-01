// Moment media generation — the asset behind a moment brick. Bohdi writes a
// prompt; we generate the video or still and hand back a hosted URL that drops
// into the brick's media slot.
//
// THE PROVIDER SEAM: today this routes to fal. Higgsfield (or any other
// aggregator) becomes a swap inside these two functions — nothing that calls
// them (Bohdi's tool, the renderer) changes. Keep generation behind this module.

import { createFalClient } from '@fal-ai/client';
import { serverEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { withTimeout } from '@/lib/with-timeout';

const BUCKET = 'generated-images';

// Stills return fast; video generation is slow (a Kling clip can take minutes).
export const MOMENT_STILL_TIMEOUT_MS = 90_000;
export const MOMENT_VIDEO_TIMEOUT_MS = 240_000;

// fal model ids. Kling 3.0 Pro text-to-video — confirmed against fal's catalog
// (2026-06): input { prompt, duration: "3".."15", aspect_ratio: 16:9|9:16|1:1 }.
// V3 is the cinematic prompt-driven tier (vs 2.x). Kling versions move and fal
// renames endpoints; swapping this string (or routing to Higgsfield) is the whole
// "change one file" promise of the seam.
export const KLING_VIDEO_MODEL = 'fal-ai/kling-video/v3/pro/text-to-video';
const FLUX_IMAGE_MODEL = 'fal-ai/flux-pro';

// Kling 3.0 accepts whole-second durations from 3 to 15. Default to 6 — a short
// atmospheric loop is plenty for a held moment backdrop. Clamp anything else in.
function klingDuration(durationSec: number | undefined): string {
  const n = Math.round(durationSec ?? 6);
  return String(Math.max(3, Math.min(15, n)));
}

export type MomentAspect = '16:9' | '1:1' | '9:16';

const IMAGE_SIZE: Record<MomentAspect, 'landscape_16_9' | 'square_hd' | 'portrait_16_9'> = {
  '16:9': 'landscape_16_9',
  '1:1': 'square_hd',
  '9:16': 'portrait_16_9',
};

function falClient() {
  return createFalClient({ credentials: serverEnv().FAL_API_KEY });
}

interface StoreOpts {
  storagePath: string;
  contentType: string;
}

/** Download the generated asset and store it; fall back to the provider URL on any failure. */
async function store(sourceUrl: string, { storagePath, contentType }: StoreOpts): Promise<string> {
  const res = await fetch(sourceUrl);
  if (!res.ok) {
    logger.warn('moment media: download failed, using direct URL', { status: res.status });
    return sourceUrl;
  }
  const buffer = await res.arrayBuffer();
  const db = supabaseAdmin();
  const { error } = await db.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error !== null) {
    logger.warn('moment media: storage upload failed, using direct URL', { error: error.message });
    return sourceUrl;
  }
  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(storagePath);
  return urlData.publicUrl;
}

export interface MomentStillOpts {
  subdomain: string;
  aspect?: MomentAspect;
}

/** Generate the held still for a moment from Bohdi's prompt. Returns a hosted URL or null. */
export async function generateMomentStill(
  prompt: string,
  opts: MomentStillOpts,
): Promise<string | null> {
  const start = Date.now();
  const aspect = opts.aspect ?? '16:9';
  try {
    const result = await withTimeout(
      falClient().subscribe(FLUX_IMAGE_MODEL as string, {
        input: {
          prompt,
          image_size: IMAGE_SIZE[aspect],
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          output_format: 'jpeg',
        },
      }),
      MOMENT_STILL_TIMEOUT_MS,
      `moment still (${opts.subdomain})`,
    );
    const output = result.data as { images?: { url?: string }[] };
    const sourceUrl = output.images?.[0]?.url;
    if (sourceUrl === undefined) {
      logger.warn('moment media: no still in response', { latencyMs: Date.now() - start });
      return null;
    }
    logger.info('moment media: still generated', { latencyMs: Date.now() - start });
    return store(sourceUrl, {
      storagePath: `moment-media/${opts.subdomain}/still.jpg`,
      contentType: 'image/jpeg',
    });
  } catch (err) {
    logger.error('moment media: still generation failed', { error: String(err), prompt });
    return null;
  }
}

export interface MomentVideoOpts {
  subdomain: string;
  aspect?: MomentAspect;
  durationSec?: number;
}

/** Generate the held video for a moment from Bohdi's prompt. Returns a hosted URL or null. */
export async function generateMomentVideo(
  prompt: string,
  opts: MomentVideoOpts,
): Promise<string | null> {
  const start = Date.now();
  const aspect = opts.aspect ?? '16:9';
  const duration = klingDuration(opts.durationSec);
  try {
    const result = await withTimeout(
      falClient().subscribe(KLING_VIDEO_MODEL as string, {
        input: {
          prompt,
          duration,
          aspect_ratio: aspect,
        },
      }),
      MOMENT_VIDEO_TIMEOUT_MS,
      `moment video (${opts.subdomain})`,
    );
    const output = result.data as { video?: { url?: string } };
    const sourceUrl = output.video?.url;
    if (sourceUrl === undefined) {
      logger.warn('moment media: no video in response', { latencyMs: Date.now() - start });
      return null;
    }
    logger.info('moment media: video generated', { latencyMs: Date.now() - start });
    return store(sourceUrl, {
      storagePath: `moment-media/${opts.subdomain}/clip.mp4`,
      contentType: 'video/mp4',
    });
  } catch (err) {
    logger.error('moment media: video generation failed', { error: String(err), prompt });
    return null;
  }
}
