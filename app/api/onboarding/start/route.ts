// Start a storefront build in the background. Creates a build record, kicks off
// the work WITHOUT waiting for it, and returns the build id immediately. The
// onboarding screen then polls /api/onboarding/builds/[id] for progress + result.
// This decouples the build from the request, so it can run longer than one
// request's time limit.

import type { NextRequest } from 'next/server';
import { checkGenerationRateLimit } from '@/lib/rate-limit';
import { MOODS, type MoodKey } from '@/lib/moods';
import { runStorefront } from '@/lib/onboarding/run-storefront';
import { createBuild, markRunning, completeBuild, failBuild, type BuildInput } from '@/lib/onboarding/build-store';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 300;

function isMoodKey(value: string): value is MoodKey {
  return value in MOODS;
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: BuildInput;
  try {
    body = (await req.json()) as BuildInput;
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  if (typeof body.subdomain !== 'string' || !isMoodKey(body.moodKey)) {
    return new Response('Invalid build input', { status: 400 });
  }

  try {
    await checkGenerationRateLimit();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate limit exceeded';
    return new Response(message, { status: 429 });
  }

  const buildId = await createBuild(body);

  // Fire and forget. We intentionally do NOT await this — the response returns
  // now and the build runs on its own, writing progress to the build record.
  // (Locally this runs to completion; in production it needs a runner that
  // survives past the request — a separate, flagged piece of work.)
  void runBuild(buildId, body);

  return Response.json({ buildId });
}

async function runBuild(buildId: string, input: BuildInput): Promise<void> {
  try {
    await markRunning(buildId, 'Getting set up');
    const result = await runStorefront(
      {
        shopName: input.shopName,
        subdomain: input.subdomain,
        nicheSlug: input.nicheSlug,
        nicheDescription: input.nicheDescription,
        moodKey: input.moodKey as MoodKey,
        productCount: input.productCount ?? 0,
        makerName: input.makerName,
        logoUrl: input.logoUrl,
        brandColors: input.brandColors,
        productPhotoUrls: input.productPhotoUrls,
        visionPerPhoto: input.visionPerPhoto,
        makerWork: input.makerWork,
      },
      (event) => {
        if (event.type === 'status') void updateProgress(buildId, event.label);
      },
    );
    await completeBuild(buildId, result.tenantId);
    logger.info('build: complete', { buildId, subdomain: result.subdomain });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Build failed';
    logger.error('build: failed', { buildId, error: message });
    await failBuild(
      buildId,
      'We hit a problem building your store. Your choices are saved — try again.',
    );
  }
}

// Progress writes are best-effort; a dropped label update must never crash the build.
async function updateProgress(buildId: string, label: string): Promise<void> {
  try {
    const { updateLabel } = await import('@/lib/onboarding/build-store');
    await updateLabel(buildId, label);
  } catch {
    // ignore
  }
}
