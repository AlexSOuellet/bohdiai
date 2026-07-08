/**
 * POST /api/library/ingest
 *
 * Cowork's upload seam. Cowork generates images via Higgsfield (Nano Banana Pro
 * or Kling 3.0 Turbo), receives a source URL, then posts here with the URL +
 * metadata. This endpoint downloads the binary from Higgsfield, uploads it to
 * the `library` Storage bucket at the enforced path, and inserts a row into
 * `library_assets` with approved=false.
 *
 * Cowork never touches Supabase Storage or the database directly — this endpoint
 * is the single writer. Auth via a bearer token in COWORK_INGEST_TOKEN.
 *
 * Spec: Project-Docs/Image-Library-Spec.md
 * Plan: Project-Docs/Library-Buildout-Plan.md
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { serverEnv } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'library';

const KIND_TO_FILENAME_PART = {
  hero_image: 'hero',
  product_image: 'product',
  portrait_image: 'portrait',
  hero_video: 'hero',
} as const;

const KIND_TO_EXTENSION = {
  hero_image: 'png',
  product_image: 'png',
  portrait_image: 'png',
  hero_video: 'mp4',
} as const;

const KIND_TO_CONTENT_TYPE = {
  hero_image: 'image/png',
  product_image: 'image/png',
  portrait_image: 'image/png',
  hero_video: 'video/mp4',
} as const;

const ingestSchema = z.object({
  nicheSlug: z.string().regex(/^[a-z][a-z0-9_]*$/, 'nicheSlug must be lowercase snake_case'),
  kind: z.enum(['hero_image', 'product_image', 'portrait_image', 'hero_video']),
  scene: z.string().regex(/^[a-z][a-z0-9-]*$/, 'scene must be lowercase kebab-or-plain'),
  sourceUrl: z.string().url(),
  prompt: z.string().min(1),
  generator: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  durationMs: z.number().int().positive().optional(),
});

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('library ingest: fatal', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Ingest failed.' }, { status: 500 });
  }
}

async function handle(req: Request) {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${serverEnv().COWORK_INGEST_TOKEN}`;
  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = ingestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const db = supabaseAdmin();

  const kindPart = KIND_TO_FILENAME_PART[input.kind];
  const nextIndex = await computeNextIndex(input.nicheSlug, input.kind, input.scene);
  const ext = KIND_TO_EXTENSION[input.kind];
  const filename = `${input.nicheSlug}-${kindPart}-${input.scene}-${String(nextIndex).padStart(2, '0')}.${ext}`;
  const storagePath = `${input.nicheSlug}/${filename}`;

  const download = await fetch(input.sourceUrl);
  if (!download.ok) {
    logger.warn('library ingest: source fetch failed', {
      status: download.status,
      sourceUrl: input.sourceUrl,
    });
    return NextResponse.json(
      { error: `Source fetch failed (${download.status}).` },
      { status: 502 },
    );
  }
  const buffer = await download.arrayBuffer();

  const { error: uploadError } = await db.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: KIND_TO_CONTENT_TYPE[input.kind],
    upsert: false,
  });
  if (uploadError !== null) {
    logger.error('library ingest: storage upload failed', {
      storagePath,
      error: uploadError.message,
    });
    return NextResponse.json({ error: 'Storage upload failed.' }, { status: 500 });
  }

  const { data: inserted, error: insertError } = await db
    .from('library_assets')
    .insert({
      niche_slug: input.nicheSlug,
      kind: input.kind,
      scene: input.scene,
      storage_path: storagePath,
      prompt: input.prompt,
      generator: input.generator,
      width: input.width,
      height: input.height,
      duration_ms: input.durationMs ?? null,
    })
    .select('id')
    .single();

  if (insertError !== null || inserted === null) {
    // Compensate — roll back the upload we just made so retries aren't blocked by
    // a stranded file at the reserved path.
    await db.storage.from(BUCKET).remove([storagePath]);
    logger.error('library ingest: row insert failed', {
      storagePath,
      error: insertError?.message,
    });
    return NextResponse.json({ error: 'Row insert failed.' }, { status: 500 });
  }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(storagePath);

  logger.info('library ingest: asset stored', {
    id: inserted.id,
    niche: input.nicheSlug,
    kind: input.kind,
    storagePath,
  });

  return NextResponse.json({
    id: inserted.id,
    storagePath,
    publicUrl: urlData.publicUrl,
    approved: false,
  });
}

async function computeNextIndex(nicheSlug: string, kind: string, scene: string): Promise<number> {
  const db = supabaseAdmin();
  const { count, error } = await db
    .from('library_assets')
    .select('id', { count: 'exact', head: true })
    .eq('niche_slug', nicheSlug)
    .eq('kind', kind)
    .eq('scene', scene);
  if (error !== null) {
    logger.warn('library ingest: index count failed, defaulting to 1', {
      error: error.message,
    });
    return 1;
  }
  return (count ?? 0) + 1;
}
