import { createServerClient } from '@supabase/ssr';
import type { SetAllCookies } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Supabase client for server components and route handlers.
 * Uses the anon key + the caller's session cookie — RLS applies.
 * For admin operations (bypassing RLS) use supabaseAdmin() from supabase.ts.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  // @supabase/ssr 0.5.2 declares the pre-2.5x SupabaseClient generics (Database, SchemaName, Schema),
  // which the installed supabase-js 2.106 reads as (Database, Options, SchemaName): every table and
  // rpc then types as never. Same runtime object; typed here once until ssr is upgraded.
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
  ) as unknown as SupabaseClient<Database>;
}
