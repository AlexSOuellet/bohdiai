import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkupLimitResponse } from '@/lib/checkup/limit';
import { sanitizeTranscript } from '@/lib/checkup/transcript';
import { nextStep } from '@/lib/checkup/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FAILED = 'I couldn’t come up with the next question. Tap Try again.';

/** The maker checkup's next question for this transcript, or `{ done: true }`. */
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

  try {
    return NextResponse.json(await nextStep(transcript));
  } catch (err) {
    logger.error('checkup next failed', { turns: transcript.length, error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: FAILED }, { status: 502 });
  }
}
