import { createFalClient } from '@fal-ai/client';
import { serverEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const BUCKET = 'generated-images';

function falClient() {
  return createFalClient({ credentials: serverEnv().FAL_API_KEY });
}

interface FalImage {
  url: string;
}

interface FalOutput {
  images: FalImage[];
}

async function generateAndStore(
  prompt: string,
  storagePath: string,
  imageSize: 'square_hd' | 'landscape_16_9',
): Promise<string | null> {
  const start = Date.now();

  try {
    const result = await falClient().subscribe('fal-ai/flux-pro' as string, {
      input: {
        prompt,
        image_size: imageSize,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: 'jpeg',
      },
    });

    const latencyMs = Date.now() - start;
    const output = result.data as FalOutput;
    const imageUrl = output.images[0]?.url;

    if (imageUrl === undefined) {
      logger.warn('fal: no image in response', { prompt, latencyMs });
      return null;
    }

    logger.info('fal: image generated', { latencyMs, storagePath });

    const res = await fetch(imageUrl);
    if (!res.ok) {
      logger.warn('fal: download failed, using direct URL', { status: res.status });
      return imageUrl;
    }

    const buffer = await res.arrayBuffer();
    const db = supabaseAdmin();

    const { error } = await db.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (error !== null) {
      logger.warn('fal: storage upload failed, using direct URL', { error: error.message });
      return imageUrl;
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(storagePath);
    return urlData.publicUrl;
  } catch (err) {
    logger.error('fal: generation failed', { error: String(err), prompt });
    return null;
  }
}

interface MoodSignal {
  /** Niche slug for gating (e.g. 'leatherworker'). */
  nicheSlug?: string;
  /** Mood key for gating (e.g. 'dark'). */
  moodKey?: string;
  /** Mood label and description to thread into the image prompt. */
  moodLabel?: string;
  moodDescription?: string;
}

function isLowControl(s?: MoodSignal): boolean {
  return s?.nicheSlug === 'leatherworker' && s?.moodKey === 'dark';
}

export async function generateProductImage(
  productName: string,
  productDescription: string,
  nicheDisplayName: string,
  subdomain: string,
  slug: string,
  moodSignal?: MoodSignal,
): Promise<string | null> {
  const prompt = isLowControl(moodSignal)
    ? `Product photography of ${productName}. ${productDescription}. Mood: ${moodSignal!.moodLabel}. No text.`
    : `Professional product photography: ${productName}. ${productDescription}. Handmade artisan ${nicheDisplayName}. Clean neutral background, soft natural light, high resolution, commercial quality, no text.`;
  return generateAndStore(prompt, `product-images/${subdomain}/${slug}.jpg`, 'square_hd');
}

export async function generateHeroImage(
  nicheDisplayName: string,
  subdomain: string,
  moodSignal?: MoodSignal,
): Promise<string | null> {
  const prompt = isLowControl(moodSignal)
    ? `A ${nicheDisplayName}'s working environment. Mood: ${moodSignal!.moodLabel}. No text, no people, wide landscape composition.`
    : `Editorial lifestyle photography: ${nicheDisplayName} maker's workshop. Close-up details of the materials, tools, and finished work specific to ${nicheDisplayName}. Cinematic wide shot, real working studio environment, rich depth, no text, no people, wide landscape composition.`;
  return generateAndStore(prompt, `hero-images/${subdomain}/hero.jpg`, 'landscape_16_9');
}

export async function generateAboutImage(
  nicheDisplayName: string,
  subdomain: string,
  moodSignal?: MoodSignal,
): Promise<string | null> {
  const prompt = isLowControl(moodSignal)
    ? `Hands at work in a ${nicheDisplayName}'s studio. Mood: ${moodSignal!.moodLabel}. No identifiable faces, no text, vertical portrait composition.`
    : `Editorial documentary photography: hands at work in a ${nicheDisplayName} maker's studio. In-progress detail — tools being used, materials being shaped, the texture of the work itself. Warm natural window light, shallow depth of field, intimate close-mid shot, real studio environment, no identifiable faces, no text, vertical portrait composition.`;
  return generateAndStore(prompt, `about-images/${subdomain}/about.jpg`, 'square_hd');
}
