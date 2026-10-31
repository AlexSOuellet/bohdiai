import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { stripe } from '@/lib/billing/stripe';
import { fixEmail, sendAgain } from '@/lib/signup/after-paid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The check-your-email screen (Alex, Session 119): `{ session }` sends the link
 * again; `{ session, email }` moves the account to that email and sends it there.
 * Answers `{ email }` (where it went), `{ problem }` (a spot in the form's words)
 * or `{ failed }`.
 */
export async function POST(req: Request): Promise<Response> {
  const turnedAway = await formLimitResponse(req, 'signup', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;

  let session = '';
  let email: string | null = null;
  try {
    const body: unknown = await req.json();
    if (body !== null && typeof body === 'object') {
      if ('session' in body && typeof body.session === 'string') session = body.session;
      if ('email' in body && typeof body.email === 'string') email = body.email;
    }
  } catch {
    return NextResponse.json({ failed: true }, { status: 400 });
  }

  try {
    const result = email === null ? await sendAgain(stripe(), supabaseAdmin(), session) : await fixEmail(stripe(), supabaseAdmin(), session, email);
    if (result.ok) return NextResponse.json({ email: result.email });
    if (result.reason === 'email' || result.reason === 'accountExists') return NextResponse.json({ problem: { spot: result.reason, values: {} } }, { status: 400 });
    // Already confirmed, or not a paid sign-up: nothing to send.
    return NextResponse.json({ failed: true }, { status: 409 });
  } catch (err) {
    logger.error('signup: confirmation email again failed', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ failed: true }, { status: 502 });
  }
}
