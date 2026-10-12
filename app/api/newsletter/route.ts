import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { parseSignup, beehiivConfig, subscribe } from '@/lib/newsletter/subscribe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FAILED = 'That didn’t go through. Please try again in a minute.';

/** The checkup's "free tips and tricks" signup. Adds the visitor to Alex's beehiiv list. */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('newsletter route fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: FAILED }, { status: 500 });
  }
}

async function handle(req: Request) {
  const turnedAway = await formLimitResponse(req, 'newsletter', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'That didn’t come through. Please try again.' }, { status: 400 });
  }

  const parsed = parseSignup(body);
  if (parsed.kind === 'spam') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid') return NextResponse.json({ error: parsed.error }, { status: 400 });

  const config = beehiivConfig(process.env);
  if (config === null) {
    logger.error('newsletter: BEEHIIV_API_KEY / BEEHIIV_PUBLICATION_ID not set');
    return NextResponse.json({ error: 'Signups aren’t open yet. Please check back soon.' }, { status: 503 });
  }

  const result = await subscribe(parsed.email, config);
  if (!result.ok) {
    logger.error('newsletter: beehiiv rejected signup', { status: result.status, detail: result.detail });
    return NextResponse.json({ error: FAILED }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
