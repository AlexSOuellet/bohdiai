import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { AUTH_LINK_KINDS } from '@/lib/backend/auth-kinds';
import { requestOrigin, isSameOriginPost } from '@/lib/backend/request-origin';

export const dynamic = 'force-dynamic';


/** The link carries a one-time token: never cache it, never leak it in a Referer. */
const PRIVATE_HEADERS = { 'Referrer-Policy': 'same-origin', 'Cache-Control': 'no-store' } as const;

function redirectTo(url: URL): Response {
  const res = NextResponse.redirect(url, 303);
  for (const [k, v] of Object.entries(PRIVATE_HEADERS)) res.headers.set(k, v);
  return res;
}

const toError = (origin: string): Response => redirectTo(new URL('/auth/error?reason=link', origin));

/**
 * GET never spends the token: email scanners prefetch links, and verifying a
 * one-time token on GET would let them burn it before the person clicks. It
 * hands over to the Continue page, whose button POSTs back here.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  if (tokenHash === null || tokenHash === '' || type === null || !AUTH_LINK_KINDS.has(type)) return toError(origin);

  const next = new URL('/auth/continue', origin);
  next.searchParams.set('token_hash', tokenHash);
  next.searchParams.set('type', type);
  return redirectTo(next);
}

/** Verifies the emailed invite/reset token, starts the session, then asks for a password. */
export async function POST(request: Request): Promise<Response> {
  const origin = requestOrigin(request);
  // A cross-site form post must not be able to spend a token.
  if (!isSameOriginPost(request)) return toError(origin);
  let tokenHash: FormDataEntryValue | null = null;
  let type: FormDataEntryValue | null = null;
  try {
    const form = await request.formData();
    tokenHash = form.get('token_hash');
    type = form.get('type');
  } catch {
    return toError(origin);
  }
  if (typeof tokenHash !== 'string' || tokenHash === '' || typeof type !== 'string' || !AUTH_LINK_KINDS.has(type)) return toError(origin);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'invite' | 'recovery' });
  if (error !== null) return toError(origin);
  return redirectTo(new URL('/manage/set-password', origin));
}
