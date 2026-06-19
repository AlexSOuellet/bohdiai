// Session helpers for server components and route handlers. Read the logged-in
// maker from the RLS-respecting SSR client (session cookie + anon key). The
// session itself is refreshed in proxy.ts on every request.

import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { User } from '@supabase/supabase-js';

/** The current logged-in user, or null if there's no valid session. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}
