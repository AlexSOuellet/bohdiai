import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { shrinkImage } from '@/lib/images/shrink';
import { parseEstimateForm, composeEstimateEmail } from '@/lib/estimate/request';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Email attachments: shrink phone photos to a size that sends fast and opens anywhere.
const ATTACH_EDGE = 1800;

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('estimate route fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Something went wrong. Please try again, or call us.' }, { status: 500 });
  }
}

async function handle(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'That request didn’t come through. Please try again.' }, { status: 400 });
  }

  const parsed = parseEstimateForm(form);
  if (parsed.kind === 'spam') return NextResponse.json({ ok: true });
  if (parsed.kind === 'invalid') return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { fields, photos } = parsed;

  const { data: tenant, error: lookupError } = await supabaseAdmin()
    .from('tenants')
    .select('business_name, contact_email')
    .eq('id', fields.tenantId)
    .eq('status', 'active')
    .maybeSingle();
  if (lookupError !== null) {
    logger.error('estimate: tenant lookup failed', { tenantId: fields.tenantId, error: lookupError.message });
    return NextResponse.json({ error: 'Something went wrong. Please try again, or call us.' }, { status: 500 });
  }
  if (tenant === null) return NextResponse.json({ error: 'This site isn’t taking requests right now.' }, { status: 404 });
  if (tenant.contact_email === null || tenant.contact_email === '') {
    logger.error('estimate: tenant has no contact_email', { tenantId: fields.tenantId });
    return NextResponse.json({ error: 'Requests can’t be sent right now — please call us instead.' }, { status: 503 });
  }

  const attachments: Array<{ filename: string; content: Buffer }> = [];
  for (const [i, photo] of photos.entries()) {
    try {
      const content = Buffer.from(await shrinkImage(await photo.arrayBuffer(), { maxEdge: ATTACH_EDGE, format: 'jpeg', quality: 80 }));
      attachments.push({ filename: `yard-photo-${i + 1}.jpg`, content });
    } catch (err) {
      logger.warn('estimate: photo processing failed', { tenantId: fields.tenantId, err: String(err) });
      return NextResponse.json({ error: 'One of those photos couldn’t be read. Try a different one.' }, { status: 400 });
    }
  }

  const email = composeEstimateEmail(fields, tenant.business_name, attachments.length);
  try {
    const result = await resend().emails.send({
      from: fromEmail(),
      to: tenant.contact_email,
      ...(fields.email !== undefined ? { replyTo: fields.email } : {}),
      subject: email.subject,
      text: email.text,
      html: email.html,
      attachments,
    });
    if (result.error) {
      logger.error('estimate: resend send error', { tenantId: fields.tenantId, error: result.error.message });
      return NextResponse.json({ error: 'That didn’t send. Please try again, or call us.' }, { status: 502 });
    }
  } catch (err) {
    logger.error('estimate: resend fatal', { tenantId: fields.tenantId, error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'That didn’t send. Please try again, or call us.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
