'use server';

/**
 * Site-owner auth actions (spec §1). No public sign-up. Sign-in and reset are
 * rate-limited (reset per visitor and per email) and fail closed. On the normal
 * path reset answers the same whether or not an email has an account; a failure
 * to send is surfaced to the visitor rather than swallowed. A password is only
 * set from a fresh session that came from an emailed link.
 */
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { requireUser } from '@/lib/auth/session';
import { getUserShops } from '@/lib/auth/membership';
import { allowAction, allowKey, ACTION_LIMITED, ACTION_UNAVAILABLE } from './action-limit';
import { sendAuthLink } from './auth-links';
import { findUserByEmail } from './user-lookup';
import { appOrigin } from './app-url';

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export const RESET_SENT = 'If that email belongs to a site owner, a reset link is on its way. Check your inbox.';
const MIN_PASSWORD = 10;
const BACKEND_HOME = '/manage';

const LINK_AGAIN = 'This link is no longer valid. Use Forgot password on the sign-in page to get a fresh one.';
const SIGN_IN_UNAVAILABLE = 'Sign-in is unavailable for a moment. Please try again in a few minutes.';
/** A password may be set only this long after the emailed link was opened. */
const LINK_SESSION_SECONDS = 15 * 60;
const CLOCK_SKEW_SECONDS = 60;
const LINK_METHODS = new Set(['otp', 'recovery', 'invite', 'magiclink']);

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

async function gate(action: 'signin' | 'reset', email?: string): Promise<ActionResult | null> {
  let allowance = await allowAction(action);
  if (allowance === 'allowed' && email !== undefined) allowance = await allowKey(`${action}-email:${await sha256Hex(email)}`);
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
  if (error !== null) {
    const wrong = error.status === 400 || error.code === 'invalid_credentials';
    return { ok: false, error: wrong ? 'That email and password don’t match.' : SIGN_IN_UNAVAILABLE };
  }
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
  const turned = await gate('reset', email);
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

/** True when the session's own sign-in was an emailed link opened moments ago. */
function fromFreshLink(amr: unknown): boolean {
  if (!Array.isArray(amr)) return false;
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - LINK_SESSION_SECONDS;
  // A timestamp in the future means the units aren't what we think; fail closed.
  const latest = now + CLOCK_SKEW_SECONDS;
  return amr.some(
    (e: unknown) =>
      typeof e === 'object' &&
      e !== null &&
      'method' in e &&
      'timestamp' in e &&
      typeof e.method === 'string' &&
      typeof e.timestamp === 'number' &&
      LINK_METHODS.has(e.method) &&
      e.timestamp >= cutoff &&
      e.timestamp <= latest,
  );
}

export async function setPassword(input: { password: string; confirm: string }): Promise<ActionResult> {
  await requireUser();
  if (input.password.length < MIN_PASSWORD) return { ok: false, error: `Use at least ${MIN_PASSWORD} characters.` };
  if (input.password !== input.confirm) return { ok: false, error: 'The two passwords don’t match.' };
  const supabase = await createSupabaseServerClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError !== null || data === null || !fromFreshLink(data.claims.amr)) return { ok: false, error: LINK_AGAIN };
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error !== null) {
    if (error.name === 'AuthSessionMissingError') return { ok: false, error: LINK_AGAIN };
    return { ok: false, error: `Your password wasn’t saved: ${error.message}` };
  }
  redirect(BACKEND_HOME);
}
