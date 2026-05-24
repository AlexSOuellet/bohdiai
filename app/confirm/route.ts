import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { welcomeEmail } from '@/lib/emails';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const tokenSchema = z.string().uuid();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const site = (() => {
    try {
      return serverEnv().SITE_URL;
    } catch {
      return url.origin;
    }
  })();

  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) {
    return NextResponse.redirect(new URL('/confirm/error?reason=invalid', site));
  }

  const supabase = supabaseAdmin();
  const { data: row, error } = await supabase
    .from('waitlist')
    .select('id, email, type, confirmed_at')
    .eq('confirm_token', parsed.data)
    .maybeSingle();

  if (error) {
    console.error('confirm lookup error', error.message);
    return NextResponse.redirect(new URL('/confirm/error?reason=server', site));
  }

  if (!row) {
    const { data: already } = await supabase
      .from('waitlist')
      .select('id')
      .is('confirm_token', null)
      .not('confirmed_at', 'is', null)
      .limit(1)
      .maybeSingle();
    if (already) {
      return NextResponse.redirect(new URL('/confirmed', site));
    }
    return NextResponse.redirect(new URL('/confirm/error?reason=invalid', site));
  }

  if (row.confirmed_at) {
    return NextResponse.redirect(new URL('/confirmed', site));
  }

  const { error: updateError } = await supabase
    .from('waitlist')
    .update({ confirmed_at: new Date().toISOString(), confirm_token: null })
    .eq('id', row.id);
  if (updateError) {
    console.error('confirm update error', updateError.message);
    return NextResponse.redirect(new URL('/confirm/error?reason=server', site));
  }

  const { subject, html, text } = welcomeEmail(row.type as 'founder' | 'notify');
  try {
    await resend().emails.send({ from: fromEmail(), to: row.email, subject, html, text });
  } catch (err) {
    console.error('welcome send error', err);
  }

  return NextResponse.redirect(new URL('/confirmed', site));
}
