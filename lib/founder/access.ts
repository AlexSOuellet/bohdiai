/**
 * Who may open Alex's admin. It reads every site with the server's own key, so it is
 * locked to named accounts, checked on the signed-in user Supabase vouches for, at
 * the top of every admin page. Anyone else gets "not found": the admin doesn't say
 * it exists. Signed out goes to sign-in.
 */
import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { requireUser } from '@/lib/auth/session';

/** Alex's own account (alexsouellet@gmail.com). */
export const FOUNDER_USER_IDS: readonly string[] = ['00bbd30b-5b61-434c-a112-b2dbf7e31079'];

export function isFounder(userId: string): boolean {
  return FOUNDER_USER_IDS.includes(userId);
}

async function loadFounder(): Promise<User> {
  const user = await requireUser();
  if (!isFounder(user.id)) notFound();
  return user;
}

/** Cached per request, so the layout and the page share one check. */
export const requireFounder: () => Promise<User> = cache(loadFounder);
