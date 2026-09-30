import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const KINDS = new Set(['invite', 'recovery']);

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const toError = (origin: string): Response => NextResponse.redirect(new URL('/auth/error?reason=link', origin), 303);

/**
 * GET only shows a button. Email scanners prefetch links, and verifying a
 * one-time token on GET would let them burn it before the person clicks.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  if (tokenHash === null || tokenHash === '' || type === null || !KINDS.has(type)) return toError(url.origin);

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Continue</title></head><body><main><form method="post" action="/auth/confirm"><input type="hidden" name="token_hash" value="${escapeHtml(tokenHash)}"><input type="hidden" name="type" value="${escapeHtml(type)}"><button type="submit">Continue</button></form></main></body></html>`;
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** Verifies the emailed invite/reset token, starts the session, then asks for a password. */
export async function POST(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  // A cross-site form post must not be able to spend a token.
  const from = request.headers.get('origin');
  if (from !== null && from !== origin) return toError(origin);
  let tokenHash: FormDataEntryValue | null = null;
  let type: FormDataEntryValue | null = null;
  try {
    const form = await request.formData();
    tokenHash = form.get('token_hash');
    type = form.get('type');
  } catch {
    return toError(origin);
  }
  if (typeof tokenHash !== 'string' || tokenHash === '' || typeof type !== 'string' || !KINDS.has(type)) return toError(origin);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'invite' | 'recovery' });
  if (error !== null) return toError(origin);
  return NextResponse.redirect(new URL('/manage/set-password', origin), 303);
}
