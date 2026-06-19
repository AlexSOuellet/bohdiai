'use client';

// Client-side OAuth start. "Continue with Google" calls this; supabase-js
// redirects the browser to Google, which returns to /auth/callback (the PKCE
// exchange already built) and on to `next`. Password-only otherwise (Alex's
// call) — Google is the one social provider at launch.

import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export async function signInWithGoogle(next = '/'): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
