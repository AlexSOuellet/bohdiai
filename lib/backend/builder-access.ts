/**
 * Alex builds every site by hand, so his account is an admin of each one (Alex,
 * 2026-10-04). The site build scripts call ensureBuilderAccess on every run; it
 * adds the membership when missing and leaves an existing one alone. Never emails.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export const BUILDER_EMAIL = 'alexsouellet@gmail.com';

export type BuilderAccessResult = { ok: true; added: boolean } | { ok: false; error: string };

export async function ensureBuilderAccess(db: SupabaseClient<Database>, tenantId: string, email: string = BUILDER_EMAIL): Promise<BuilderAccessResult> {
  const { data: userId, error: lookupErr } = await db.rpc('auth_user_id_by_email', { p_email: email });
  if (lookupErr !== null) return { ok: false, error: `account lookup failed: ${lookupErr.message}` };
  if (typeof userId !== 'string') return { ok: false, error: `no account for ${email}` };

  const { data: existing, error: readErr } = await db
    .from('tenant_members')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('status', 'active')
    .maybeSingle();
  if (readErr !== null) return { ok: false, error: `membership lookup failed: ${readErr.message}` };
  if (existing !== null) return { ok: true, added: false };

  const { error } = await db.from('tenant_members').insert({ tenant_id: tenantId, user_id: userId, role: 'admin', status: 'active' });
  if (error !== null) return { ok: false, error: `membership add failed: ${error.message}` };
  return { ok: true, added: true };
}
