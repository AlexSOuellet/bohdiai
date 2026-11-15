import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { anthropicClient } from '@/lib/anthropic';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { writeDescription } from '@/lib/tools/describe';
import { parseTryDescribe } from '@/lib/tools/try-describe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FAILED = 'The description couldn’t be written just now. Please try again in a moment.';

/** Describe it on the share-only try-the-tools page (Alex, 2026-11-15): five a
 *  minute per visitor, nothing stored, the photo sent along and never kept. */
export async function POST(req: Request): Promise<Response> {
  const turnedAway = await formLimitResponse(req, 'describe-try', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'That didn’t come through. Please try again.' }, { status: 400 });
  }
  const parsed = parseTryDescribe(body);
  if (parsed.kind === 'invalid') return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const done = await writeDescription(anthropicClient(), parsed.input);
    if (!done.ok) return NextResponse.json({ error: done.error }, { status: 422 });
    return NextResponse.json({ ok: true, text: done.text });
  } catch (err) {
    logger.error('try describe: write failed', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: FAILED }, { status: 500 });
  }
}
