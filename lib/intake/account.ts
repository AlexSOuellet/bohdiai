/**
 * The maker's account, made on the intake form (Alex, 2026-10-16): their email and
 * the password they chose. A new email gets a new account, already confirmed (we
 * don't send a confirm link; the "your site is ready" email goes to the same
 * address). An email that already has an account is only accepted with that
 * account's own password; an existing password is never changed here.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';

/** Signs in with an email and password and gives back the account, or null. */
export type CheckPassword = (email: string, password: string) => Promise<string | null>;

export type AccountResult = { ok: true; userId: string; created: boolean } | { ok: false; reason: 'accountExists' | 'failed' };

export async function ensureAccount(admin: SupabaseClient<Database>, checkPassword: CheckPassword, email: string, password: string): Promise<AccountResult> {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error === null && data.user !== null) return { ok: true, userId: data.user.id, created: true };
  const exists = error !== null && (error.code === 'email_exists' || error.status === 422);
  if (!exists) {
    logger.error('intake: account create failed', { error: error?.message });
    return { ok: false, reason: 'failed' };
  }
  const userId = await checkPassword(email, password);
  return userId === null ? { ok: false, reason: 'accountExists' } : { ok: true, userId, created: false };
}

/** Removes an account this send created, when the rest of the send failed. */
export async function removeNewAccount(admin: SupabaseClient<Database>, userId: string): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error !== null) logger.error('intake: could not remove the new account after a failed send', { userId, error: error.message });
}
