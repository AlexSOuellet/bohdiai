import { NextResponse } from 'next/server';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { shrinkImage } from '@/lib/images/shrink';
import { parseIntake, type IntakeFields } from '@/lib/intake/request';
import { saveIntake } from '@/lib/intake/save';
import { getIntakeWords } from '@/lib/intake/queries';
import { composeIntakeEmail } from '@/lib/intake/email';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';
import { FAMILY_KEYS } from '@/lib/archetypes/main-street/families';
import { getCurrentUser } from '@/lib/auth/session';
import { onboardingSite } from '@/lib/signup/onboarding';
import { startBuild } from '@/lib/build/start-build';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Onboarding's form (app.bohdiai.com/welcome, Session 119): a signed-in maker
 * sends what we need to start the site they've paid for. Who they are and their
 * plan come from their sign-up, never from the form. Saved (photos in the private
 * bucket) against their site, then Alex is emailed. The page shows every answer in
 * its own words: `problem` names the spot that says what's wrong, `failed` means
 * it didn't save.
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

  const user = await getCurrentUser();
  if (user === null) return NextResponse.json({ failed: true }, { status: 401 });
  const db = supabaseAdmin();
  const site = await onboardingSite(db, user.id);
  // Nothing waiting: already sent, not paid, or a plan with no site.
  if (site === null) return NextResponse.json({ failed: true }, { status: 409 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ failed: true }, { status: 400 });
  }

  const parsed = parseIntake(form, { families: FAMILY_KEYS });
  if (parsed.kind === 'spam') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid') return NextResponse.json({ problem: parsed.problem }, { status: 400 });

  const name = user.user_metadata['name'];
  const fields: IntakeFields = {
    plan: site.plan,
    billing: site.billing,
    makerName: typeof name === 'string' ? name : '',
    businessName: site.businessName,
    email: user.email ?? '',
    ...parsed.content,
  };
  const saved = await saveIntake({ db, shrink: shrinkImage, fields, pieces: parsed.pieces, portrait: parsed.portrait, userId: user.id, tenantId: site.tenantId });
  if (!saved.ok) {
    if (saved.reason === 'photoUnread') return NextResponse.json({ problem: { spot: 'photoUnread', values: {} } }, { status: 400 });
    return NextResponse.json({ failed: true }, { status: 502 });
  }

  // It's saved: the site builds itself. A build that can't start is logged and
  // Alex is emailed below as always, so the form is never lost.
  try {
    await startBuild(saved.id);
  } catch (err) {
    logger.error('intake: saved, but the build didn’t start', { id: saved.id, error: err instanceof Error ? err.message : String(err) });
  }

  // A failed email is logged for Alex, and the maker is still told it arrived.
  try {
    const words = await getIntakeWords(db);
    const email = composeIntakeEmail({ id: saved.id, fields, pieces: parsed.pieces, hasPortrait: parsed.portrait !== null, words });
    const result = await resend().emails.send({
      from: fromEmail(),
      to: SITE_CONTACT_EMAIL,
      replyTo: fields.email,
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
