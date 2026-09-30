'use server';

/**
 * Site-owner auth actions (spec §1). No public sign-up. Sign-in and reset are
 * rate-limited and fail closed; reset never reveals whether an email has an
 * account; a password is only set by someone holding a session from an emailed link.
 */
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { getUserShops } from '@/lib/auth/membership';
import { allowAction, ACTION_LIMITED, ACTION_UNAVAILABLE } from './action-limit';
import { sendAuthLink } from './auth-links';
import { findUserByEmail } from './user-lookup';
import { appOrigin } from './app-url';

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export const RESET_SENT = 'If that email belongs to a site owner, a reset link is on its way. Check your inbox.';
const MIN_PASSWORD = 10;
// Typed routes don't know /manage until its page lands (plan task 14); the cast can go then.
const BACKEND_HOME = '/manage' as Route;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

async function gate(action: 'signin' | 'reset'): Promise<ActionResult | null> {
  const allowance = await allowAction(action);
  if (allowance === 'allowed') return null;
  return { ok: false, error: allowance === 'limited' ? ACTION_LIMITED : ACTION_UNAVAILABLE };
}

export async function signIn(input: { email: string; password: string }): Promise<ActionResult> {
  const email = normalizeEmail(input.email);
  if (email === '') return { ok: false, error: 'Enter your email address.' };
  const turned = await gate('signin');
  if (turned !== null) return turned;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: input.password });
  if (error !== null) return { ok: false, error: 'That email and password don’t match.' };
  redirect(BACKEND_HOME);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/signin');
}

export async function requestPasswordReset(input: { email: string }): Promise<ActionResult> {
  const email = normalizeEmail(input.email);
  if (email === '') return { ok: false, error: 'Enter your email address.' };
  const turned = await gate('reset');
  if (turned !== null) return turned;

  try {
    const user = await findUserByEmail(email);
    const sites = user === null ? [] : await getUserShops(user.id);
    const first = sites[0];
    if (first !== undefined) {
      await sendAuthLink({
        kind: 'recovery',
        email,
        siteName: first.businessName,
        appOrigin: appOrigin(serverEnv().SITE_URL),
        generateLink: async ({ type, email: e }) => {
          const { data, error } = await supabaseAdmin().auth.admin.generateLink({ type, email: e });
          return { data: data?.properties ? { properties: { hashed_token: data.properties.hashed_token } } : null, error };
        },
        send: async (msg) => {
          const { error } = await resend().emails.send({ from: fromEmail(), ...msg });
          return { error: error === null ? null : { message: error.message } };
        },
      });
    }
    return { ok: true, message: RESET_SENT };
  } catch (err) {
    logger.error('password reset failed', { error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'The reset email didn’t send. Please try again in a few minutes.' };
  }
}

export async function setPassword(input: { password: string; confirm: string }): Promise<ActionResult> {
  if (input.password.length < MIN_PASSWORD) return { ok: false, error: `Use at least ${MIN_PASSWORD} characters.` };
  if (input.password !== input.confirm) return { ok: false, error: 'The two passwords don’t match.' };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error !== null) return { ok: false, error: `Your password wasn’t saved: ${error.message}` };
  redirect(BACKEND_HOME);
}
