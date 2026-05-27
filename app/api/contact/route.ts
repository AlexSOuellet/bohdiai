import { NextResponse } from 'next/server';
import { contactSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (err) {
    logger.error('contact route fatal', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}

async function handle(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const { tenantId, name, email, message } = parsed.data;
  const db = supabaseAdmin();

  const { data: tenant, error: lookupError } = await db
    .from('tenants')
    .select('business_name, contact_email')
    .eq('id', tenantId)
    .eq('status', 'active')
    .maybeSingle();

  if (lookupError !== null) {
    logger.error('contact: tenant lookup failed', { tenantId, error: lookupError.message });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
  if (tenant === null) {
    return NextResponse.json({ error: 'Shop not found.' }, { status: 404 });
  }
  if (tenant.contact_email === null || tenant.contact_email === '') {
    logger.warn('contact: tenant has no contact_email', { tenantId });
    return NextResponse.json(
      { error: "This shop hasn't set up a contact email yet." },
      { status: 503 },
    );
  }

  // TODO: per-IP rate limit before launch. For now relying on platform-level limits.

  const subject = `New message from ${name} via ${tenant.business_name}`;
  const text = [
    `From: ${name} <${email}>`,
    `Sent via: ${tenant.business_name}`,
    '',
    message,
  ].join('\n');
  const html = `
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    <p><strong>Sent via:</strong> ${escapeHtml(tenant.business_name)}</p>
    <hr />
    <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
  `;

  try {
    const result = await resend().emails.send({
      from: fromEmail(),
      to: tenant.contact_email,
      replyTo: email,
      subject,
      text,
      html,
    });
    if (result.error) {
      logger.error('contact: resend send error', { tenantId, error: result.error.message });
      return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 502 });
    }
  } catch (err) {
    logger.error('contact: resend fatal', { tenantId, error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: 'Failed to send. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
