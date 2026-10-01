import { createServerClient } from '@supabase/ssr';
import type { SetAllCookies } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';

/** Only a same-site path is allowed as `next`: it must start with a single "/" and
 *  not "//" or "/\" (which browsers read as another host). Anything else goes home. */
function safeNext(next: string | null): string {
  if (next === null || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  return next;
}

/**
 * Handles the PKCE code exchange for magic link sign-ins and OAuth flows.
 * Supabase redirects back here with ?code=... after the user clicks their link.
 * We exchange the code for a session, set the session cookie, and redirect on.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const cookieStore = await cookies();
    // No-cache headers the library sends with the session cookies; applied to
    // the redirect below so a CDN never caches a response that starts a session.
    const authHeaders: Record<string, string> = {};

    const supabase = createServerClient<Database>(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: ((cookiesToSet, headers) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options ?? {});
            });
            Object.assign(authHeaders, headers);
          }) satisfies SetAllCookies,
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const res = NextResponse.redirect(`${origin}${next}`);
      Object.entries(authHeaders).forEach(([key, value]) => res.headers.set(key, value));
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
