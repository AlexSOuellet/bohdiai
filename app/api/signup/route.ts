import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { parseSignup } from '@/lib/signup/request';
import { signUp } from '@/lib/signup/signup';
import { signupDeps } from '@/lib/signup/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * bohdiai.com/start, the first step (Alex, Session 119): the account and the site
 * record, then `{ url }`, Stripe's page for the plan. The page shows every other
 * answer in its own words: `problem` names the spot that says what's wrong,
 * `failed` means nothing was made.
 */
export async function POST(req: Request): Promise<Response> {
  const turnedAway = await formLimitResponse(req, 'signup', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ failed: true }, { status: 400 });
  }
  const parsed = parseSignup(body);
  if (parsed.kind === 'spam') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid') return NextResponse.json({ problem: parsed.problem }, { status: 400 });

  try {
    const result = await signUp(parsed.fields, parsed.password, signupDeps(supabaseAdmin(), new URL(req.url).origin));
    if (result.ok) return NextResponse.json({ url: result.url });
    if (result.reason === 'accountExists') return NextResponse.json({ problem: { spot: 'accountExists', values: {} } }, { status: 400 });
    return NextResponse.json({ failed: true }, { status: 502 });
  } catch (err) {
    logger.error('signup failed', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ failed: true }, { status: 502 });
  }
}
