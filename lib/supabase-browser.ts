'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Supabase client for Client Components.
 * Uses the anon key + the caller's session cookie — RLS applies.
 * Safe to call multiple times — @supabase/ssr handles deduplication internally.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
  );
}
