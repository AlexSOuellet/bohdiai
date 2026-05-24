import { createServerClient } from '@supabase/ssr';
import type { SetAllCookies } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

/**
 * Supabase client for server components and route handlers.
 * Uses the anon key + the caller's session cookie — RLS applies.
 * For admin operations (bypassing RLS) use supabaseAdmin() from supabase.ts.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: ((cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options ?? {});
            });
          } catch {
            // Server Component context — cookies are read-only here.
            // The middleware session refresh already handles cookie updates.
          }
        }) satisfies SetAllCookies,
      },
    },
  );
}
