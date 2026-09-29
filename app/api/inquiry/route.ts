import { NextResponse } from 'next/server';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { formLimitResponse } from '@/lib/forms/rate-limit';
import { parseInquiry, composeInquiryEmail } from '@/lib/inquiry/request';
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Every failure after validation names the address, so a lost send never loses the person.
const SEND_FAILED = `That didn’t send. Please try again, or email me at ${SITE_CONTACT_EMAIL}.`;

/** bohdiai.com's "tell me about your project" form. Emails Alex; Reply goes to the visitor. */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('inquiry route fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: SEND_FAILED }, { status: 500 });
  }
}

async function handle(req: Request) {
  const turnedAway = await formLimitResponse(req, 'inquiry', (message) => ({ error: message }));
  if (turnedAway !== null) return turnedAway;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'That didn’t come through. Please try again.' }, { status: 400 });
  }

  const parsed = parseInquiry(body);
  if (parsed.kind === 'spam') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid') return NextResponse.json({ error: parsed.error }, { status: 400 });

  const email = composeInquiryEmail(parsed.fields);
  try {
    const result = await resend().emails.send({
      from: fromEmail(),
      to: SITE_CONTACT_EMAIL,
      replyTo: parsed.fields.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    if (result.error) {
      logger.error('inquiry: resend send error', { error: result.error.message });
      return NextResponse.json({ error: SEND_FAILED }, { status: 502 });
    }
  } catch (err) {
    logger.error('inquiry: resend fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: SEND_FAILED }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
