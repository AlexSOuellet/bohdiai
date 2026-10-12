import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkupLimitResponse } from '@/lib/checkup/limit';
import { sanitizeTranscript } from '@/lib/checkup/transcript';
import { writeUp } from '@/lib/checkup/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FAILED = 'I couldn’t finish your write-up. Tap Try again.';

/** Alex's write-up for a finished maker checkup. */
export async function POST(req: Request) {
  const turnedAway = await checkupLimitResponse(req);
  if (turnedAway !== null) return turnedAway;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: FAILED }, { status: 400 });
  }
  const transcript = sanitizeTranscript(
    body !== null && typeof body === 'object' && 'transcript' in body ? body.transcript : [],
  );
  if (transcript.length < 2) {
    return NextResponse.json({ error: 'There isn’t enough here to write up yet.' }, { status: 400 });
  }

  try {
    return NextResponse.json(await writeUp(transcript));
  } catch (err) {
    logger.error('checkup write-up failed', { turns: transcript.length, error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: FAILED }, { status: 502 });
  }
}
