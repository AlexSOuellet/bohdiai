import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { resendSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { confirmationEmail } from '@/lib/emails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = resendSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid email.' },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const supabase = supabaseAdmin();
  const { data: row, error } = await supabase
    .from('waitlist')
    .select('id, email, confirmed_at, confirm_token')
    .eq('email', email)
    .maybeSingle();
  if (error) {
    console.error('resend lookup error', error.message);
    return NextResponse.json(
      { ok: false, message: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
  if (!row) {
    return NextResponse.json({ ok: true });
  }
  if (row.confirmed_at) {
    return NextResponse.json({ ok: true });
  }

  const token = row.confirm_token ?? randomUUID();
  if (!row.confirm_token) {
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ confirm_token: token })
      .eq('id', row.id);
    if (updateError) {
      console.error('resend update error', updateError.message);
      return NextResponse.json(
        { ok: false, message: 'Something went wrong. Please try again.' },
        { status: 500 },
      );
    }
  }

  const { subject, html, text } = confirmationEmail(token);
  try {
    await resend().emails.send({ from: fromEmail(), to: email, subject, html, text });
  } catch (err) {
    console.error('resend send error', err);
  }
  return NextResponse.json({ ok: true });
}
