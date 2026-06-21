'use server';

// Auth server actions for the maker. Sign-up is consumed by onboarding step 1
// (account before build, per the auth plan); sign-in by the /signin page for
// returning makers. They return a result the form renders, rather than throwing.

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export type AuthResult = { ok: true } | { ok: false; error: string };

const MIN_PASSWORD_LENGTH = 8;

export interface Credentials {
  email: string;
  password: string;
}

function validate({ email, password }: Credentials): { email: string } | { error: string } {
  const normalized = email.trim().toLowerCase();
  if (normalized.length === 0) return { error: 'Enter your email address.' };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  return { email: normalized };
}

export async function signUpMaker(credentials: Credentials): Promise<AuthResult> {
  const checked = validate(credentials);
  if ('error' in checked) return { ok: false, error: checked.error };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: checked.email,
    password: credentials.password,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Sign the maker out and send them to the sign-in page. Used by the dashboard. */
export async function signOutMaker(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/signin');
}

export async function signInMaker(credentials: Credentials): Promise<AuthResult> {
  const checked = validate(credentials);
  if ('error' in checked) return { ok: false, error: checked.error };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: checked.email,
    password: credentials.password,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
