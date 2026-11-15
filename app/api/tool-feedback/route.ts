import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { parseFeedback } from '@/lib/tool-feedback/feedback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SEND_FAILED = 'That didn’t send. Please try again in a moment.';

/** The try-the-tools page's feedback form (Alex, 2026-11-15). Saved for Alex's admin. */
export async function POST(req: Request): Promise<Response> {
  const turnedAway = await formLimitResponse(req, 'feedback', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'That didn’t come through. Please try again.' }, { status: 400 });
  }
  const parsed = parseFeedback(body);
  if (parsed.kind === 'spam') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid') return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const { error } = await supabaseAdmin().from('tool_feedback').insert(parsed.row);
    if (error !== null) throw new Error(error.message);
  } catch (err) {
    logger.error('tool feedback: save failed', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: SEND_FAILED }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
