import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const KINDS = new Set(['invite', 'recovery']);

/** Verifies an emailed invite/reset token, starts the session, then asks for a password. */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const fail = NextResponse.redirect(new URL('/auth/error?reason=link', url.origin));

  if (tokenHash === null || type === null || !KINDS.has(type)) return fail;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as 'invite' | 'recovery' });
  if (error !== null) return fail;
  return NextResponse.redirect(new URL('/manage/set-password', url.origin));
}
