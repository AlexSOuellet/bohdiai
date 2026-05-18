import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { waitlistSchema } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { confirmationEmail } from '@/lib/emails';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const { email, type } = parsed.data;
  const supabase = supabaseAdmin();
  const env = serverEnv();

  if (type === 'founder') {
    const { count, error: countError } = await supabase
      .from('waitlist')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'founder');
    if (countError) {
      console.error('founder count error', countError.message);
      return NextResponse.json(
        { ok: false, message: 'Something went wrong. Please try again.' },
        { status: 500 },
      );
    }
    if ((count ?? 0) >= env.FOUNDER_CAP) {
      return NextResponse.json(
        { ok: false, message: 'Founder Beta is full.' },
        { status: 409 },
      );
    }
  }

  const { data: existing, error: lookupError } = await supabase
    .from('waitlist')
    .select('id, email, type, confirmed_at, confirm_token')
    .eq('email', email)
    .maybeSingle();
  if (lookupError) {
    console.error('lookup error', lookupError.message);
    return NextResponse.json(
      { ok: false, message: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;

  if (existing) {
    if (existing.confirmed_at) {
      return NextResponse.json({ ok: true, already: true, type: existing.type });
    }
    const token = existing.confirm_token ?? randomUUID();
    if (!existing.confirm_token) {
      const { error: updateError } = await supabase
        .from('waitlist')
        .update({ confirm_token: token })
        .eq('id', existing.id);
      if (updateError) {
        console.error('update token error', updateError.message);
        return NextResponse.json(
          { ok: false, message: 'Something went wrong. Please try again.' },
          { status: 500 },
        );
      }
    }
    await sendConfirmation(email, token);
    return NextResponse.json({ ok: true, already: false, type: existing.type });
  }

  const token = randomUUID();
  const { error: insertError } = await supabase.from('waitlist').insert({
    email,
    type,
    confirm_token: token,
    ip,
    user_agent: userAgent,
  });
  if (insertError) {
    console.error('insert error', insertError.message);
    return NextResponse.json(
      { ok: false, message: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }

  await sendConfirmation(email, token);
  return NextResponse.json({ ok: true, already: false, type });
}

async function sendConfirmation(email: string, token: string): Promise<void> {
  const { subject, html, text } = confirmationEmail(token);
  try {
    const result = await resend().emails.send({
      from: fromEmail(),
      to: email,
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error('resend error', result.error.message);
    }
  } catch (err) {
    console.error('resend fatal', err);
  }
}
