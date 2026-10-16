import { NextResponse } from 'next/server';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { shrinkImage } from '@/lib/images/shrink';
import { parseIntake } from '@/lib/intake/request';
import { saveIntake } from '@/lib/intake/save';
import { getIntakeWords } from '@/lib/intake/queries';
import { composeIntakeEmail } from '@/lib/intake/email';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

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

async function handle(req: Request) {
  const turnedAway = await formLimitResponse(req, 'intake', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ failed: true }, { status: 400 });
  }

  const parsed = parseIntake(form);
  if (parsed.kind === 'spam') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid') return NextResponse.json({ problem: parsed.problem }, { status: 400 });

  const db = supabaseAdmin();
  const saved = await saveIntake({ db, shrink: shrinkImage, fields: parsed.fields, pieces: parsed.pieces, portrait: parsed.portrait });
  if (!saved.ok) {
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
