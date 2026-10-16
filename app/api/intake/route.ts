import { NextResponse } from 'next/server';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { shrinkImage } from '@/lib/images/shrink';
import { parseIntake } from '@/lib/intake/request';
import { saveIntake } from '@/lib/intake/save';
import { ensureAccount, removeNewAccount } from '@/lib/intake/account';
import { createClient } from '@supabase/supabase-js';
import { getIntakeWords } from '@/lib/intake/queries';
import { composeIntakeEmail } from '@/lib/intake/email';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { FAMILY_KEYS } from '@/lib/archetypes/main-street/families';
import { plansFor } from '@/lib/site/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * bohdiai.com/start: a maker sends what we need to start their site. Saved (photos
 * in the private bucket), then Alex is emailed. The page shows every answer in its
 * own words: `problem` names the spot that says what's wrong, `failed` means it
 * didn't save.
 */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('intake route fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ failed: true }, { status: 500 });
  }
}

/** Signs in with the anon key to check an existing account's password; nothing is kept. */
async function checkPassword(email: string, password: string): Promise<string | null> {
  const url = process.env['SUPABASE_URL'] ?? process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const anon = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  if (url === undefined || anon === undefined) throw new Error('Supabase url / anon key missing');
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return error === null && data.user !== null ? data.user.id : null;
}

async function handle(req: Request) {
  const turnedAway = await formLimitResponse(req, 'intake', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ failed: true }, { status: 400 });
  }

  const parsed = parseIntake(form, { families: FAMILY_KEYS, plans: plansFor('maker').map((p) => p.tier) });
  if (parsed.kind === 'spam') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid') return NextResponse.json({ problem: parsed.problem }, { status: 400 });

  const db = supabaseAdmin();
  // Their account first: a new one, or the one their email already has (with its own password).
  const account = await ensureAccount(db, checkPassword, parsed.fields.email, parsed.password);
  if (!account.ok) {
    if (account.reason === 'accountExists') return NextResponse.json({ problem: { spot: 'accountExists', values: {} } }, { status: 400 });
    return NextResponse.json({ failed: true }, { status: 502 });
  }
  const saved = await saveIntake({ db, shrink: shrinkImage, fields: parsed.fields, pieces: parsed.pieces, portrait: parsed.portrait, userId: account.userId });
  if (!saved.ok) {
    // All or nothing: an account this send made goes with it.
    if (account.created) await removeNewAccount(db, account.userId);
    if (saved.reason === 'photoUnread') return NextResponse.json({ problem: { spot: 'photoUnread', values: {} } }, { status: 400 });
    return NextResponse.json({ failed: true }, { status: 502 });
  }

  // It's saved: a failed email is logged for Alex, and the maker is still told it arrived.
  try {
    const words = await getIntakeWords(db);
    const email = composeIntakeEmail({ id: saved.id, fields: parsed.fields, pieces: parsed.pieces, hasPortrait: parsed.portrait !== null, words });
    const result = await resend().emails.send({
      from: fromEmail(),
      to: SITE_CONTACT_EMAIL,
      replyTo: parsed.fields.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    if (result.error) logger.error('intake: saved, but the email to Alex failed', { id: saved.id, error: result.error.message });
  } catch (err) {
    logger.error('intake: saved, but the email to Alex failed', { id: saved.id, error: err instanceof Error ? err.message : String(err) });
  }

  return NextResponse.json({ ok: true });
}
