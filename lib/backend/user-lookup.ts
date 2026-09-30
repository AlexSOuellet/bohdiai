import { supabaseAdmin } from '@/lib/supabase';

/** The auth user with this email, or null. Service role; server only. */
export async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  const { data, error } = await supabaseAdmin().rpc('auth_user_id_by_email', { p_email: email });
  if (error !== null) throw new Error(`Could not look up the account: ${error.message}`);
  return typeof data === 'string' ? { id: data } : null;
}
