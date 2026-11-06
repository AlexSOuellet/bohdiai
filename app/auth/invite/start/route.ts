import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { requestOrigin, isSameOriginPost } from '@/lib/backend/request-origin';
import { sessionSecret } from '@/lib/backend/session-limits';
import { INVITE_OPEN, readInviteToken } from '@/lib/founder/invite-link';

export const dynamic = 'force-dynamic';

const go = (path: string, origin: string): Response => {
  const res = NextResponse.redirect(new URL(path, origin), 303);
  res.headers.set('Cache-Control', 'no-store');
  return res;
};

/**
 * Opens an invite: signs the maker in, once they've pressed Continue, so they can
 * set a password. Works until they have; after that the link just goes to sign-in.
 * Only a link we signed gets anywhere, and only for an account still marked open.
 */
export async function POST(request: Request): Promise<Response> {
  const origin = requestOrigin(request);
  const broken = go('/auth/error?reason=link', origin);
  // A cross-site form post must not be able to open an invite.
  if (!isSameOriginPost(request)) return broken;
  const secret = sessionSecret(process.env['BACKEND_SESSION_SECRET']);
  if (secret === undefined) return broken;
  let token: FormDataEntryValue | null = null;
  try {
    token = (await request.formData()).get('t');
  } catch {
    return broken;
  }
  if (typeof token !== 'string') return broken;
  const userId = await readInviteToken(secret, token);
  if (userId === null) return broken;

  try {
    const admin = supabaseAdmin().auth.admin;
    const { data, error } = await admin.getUserById(userId);
    if (error !== null) throw new Error(error.message);
    if (data.user.app_metadata[INVITE_OPEN] !== true || data.user.email === undefined) return go('/signin', origin);
    const link = await admin.generateLink({ type: 'recovery', email: data.user.email });
    if (link.error !== null) throw new Error(link.error.message);
    const supabase = await createSupabaseServerClient();
    const { error: verifyErr } = await supabase.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'recovery' });
    if (verifyErr !== null) throw new Error(verifyErr.message);
    return go('/auth/set-password', origin);
  } catch (err) {
    logger.error('invite: could not open', { userId, error: err instanceof Error ? err.message : String(err) });
    return broken;
  }
}
