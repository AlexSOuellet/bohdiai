'use server';
/**
 * Buyer accounts on a shop (Full): create an account, sign in, sign out, reset a
 * forgotten password, and Reorder. The shop always comes from the host (the
 * middleware's x-tenant-id), never from the form. Every message is the shop's
 * own words. Sign-in and reset are rate-limited per visitor and per email and
 * fail closed, like the owners' sign-in. Reset answers the same whether or not
 * an email has an account.
 *
 * The password is checked by the shared sign-in system, whose session is ended
 * at once: the shop keeps only its own pass (pass.ts).
 */
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { supabaseAdmin } from '@/lib/supabase';
import { resend, fromEmail } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { fill } from '@/lib/site-words/words';
import { loadShopWords } from '@/lib/storefront/metadata';
import { allowAction, allowKey } from '@/lib/backend/action-limit';
import { findUserByEmail } from '@/lib/backend/user-lookup';
import { CART_COOKIE, CART_MAX_AGE, addToCart, parseCart, serializeCart } from '@/lib/storefront/cart';
import { buyerAccountsOpen, ensureBuyer, loadBuyerOrder } from './accounts';
import { buyerSecret, currentBuyer, endBuyerPass, shopOrigin, shopTenantId, startBuyerPass } from './session';
import { buyerResetEmail, buyerResetLink } from './reset-email';
import { MIN_BUYER_PASSWORD } from './limits';

export type BuyerResult = { ok: true; message?: string } | { ok: false; error: string };

/** The shop's own pages are served under /storefront, so typed routes don't know them by their public path. */
const ACCOUNT_HOME = '/account' as Route;
const CART = '/cart' as Route;

type Errors = Awaited<ReturnType<typeof loadShopWords>>['account']['errors'];

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** A sign-in client that never keeps a session anywhere. */
function passwordChecker() {
  return createClient<Database>(process.env['NEXT_PUBLIC_SUPABASE_URL']!, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Ends the shared system's session the moment the shop has what it needs. */
async function endSharedSession(accessToken: string): Promise<void> {
  const { error } = await supabaseAdmin().auth.admin.signOut(accessToken, 'local');
  if (error !== null) logger.error('buyer: ending the shared session failed', { error: error.message });
}

type Ready = { tenantId: string; secret: string; errors: Errors };

/** The shop, its secret and its error words, or the error to show. */
async function ready(action: 'signin' | 'reset', email?: string): Promise<Ready | { error: string }> {
  const tenantId = await shopTenantId();
  if (tenantId === null) return { error: '' };
  const errors = (await loadShopWords(tenantId)).account.errors;
  const secret = buyerSecret();
  if (secret === null) {
    logger.error('buyer: BACKEND_SESSION_SECRET is missing or short; buyer sign-in is closed');
    return { error: errors.unavailable };
  }
  if (!(await buyerAccountsOpen(supabaseAdmin(), tenantId))) return { error: errors.unavailable };
  let allowance = await allowAction(action);
  if (allowance === 'allowed' && email !== undefined) allowance = await allowKey(`buyer-${action}-email:${await sha256Hex(email)}`);
  if (allowance !== 'allowed') return { error: allowance === 'limited' ? errors.limited : errors.unavailable };
  return { tenantId, secret, errors };
}

export async function signUpBuyer(input: { name: string; email: string; password: string }): Promise<BuyerResult> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim().slice(0, 120);
  const shop = await ready('signin', email === '' ? undefined : email);
  if ('error' in shop) return { ok: false, error: shop.error };
  const { tenantId, secret, errors } = shop;
  if (email === '' || !email.includes('@')) return { ok: false, error: errors.email };
  if (input.password.length < MIN_BUYER_PASSWORD) return { ok: false, error: fill(errors.short, { n: MIN_BUYER_PASSWORD }) };

  try {
    const { data, error } = await supabaseAdmin().auth.admin.createUser({ email, password: input.password, email_confirm: true });
    if (error !== null) {
      if (error.code === 'email_exists' || error.code === 'user_already_exists' || error.status === 422) return { ok: false, error: errors.exists };
      if (error.code === 'weak_password') return { ok: false, error: fill(errors.short, { n: MIN_BUYER_PASSWORD }) };
      logger.error('buyer: create account failed', { error: error.message });
      return { ok: false, error: errors.failed };
    }
    const buyer = await ensureBuyer(supabaseAdmin(), tenantId, data.user.id, name);
    if (buyer === null) return { ok: false, error: errors.failed };
    await startBuyerPass(buyer.userId, tenantId, secret);
  } catch (err) {
    logger.error('buyer: create account failed', { error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: errors.failed };
  }
  redirect(ACCOUNT_HOME);
}

export async function signInBuyer(input: { email: string; password: string }): Promise<BuyerResult> {
  const email = normalizeEmail(input.email);
  const shop = await ready('signin', email === '' ? undefined : email);
  if ('error' in shop) return { ok: false, error: shop.error };
  const { tenantId, secret, errors } = shop;
  if (email === '') return { ok: false, error: errors.email };
  if (input.password === '') return { ok: false, error: errors.password };

  try {
    const { data, error } = await passwordChecker().auth.signInWithPassword({ email, password: input.password });
    if (error !== null) {
      const wrong = error.status === 400 || error.code === 'invalid_credentials';
      logger.warn('buyer: sign-in refused', { code: error.code ?? '', status: error.status ?? 0 });
      if (!wrong) logger.error('buyer: sign-in failed', { error: error.message });
      return { ok: false, error: wrong ? errors.wrong : errors.unavailable };
    }
    await endSharedSession(data.session.access_token);
    const buyer = await ensureBuyer(supabaseAdmin(), tenantId, data.user.id, '');
    if (buyer === null) {
      logger.warn('buyer: sign-in refused, not an active member of this shop', { tenantId });
      return { ok: false, error: errors.wrong };
    }
    await startBuyerPass(buyer.userId, tenantId, secret);
  } catch (err) {
    logger.error('buyer: sign-in failed', { error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: errors.unavailable };
  }
  redirect(ACCOUNT_HOME);
}

export async function signOutBuyer(): Promise<void> {
  await endBuyerPass();
  redirect(ACCOUNT_HOME);
}

export async function requestBuyerReset(input: { email: string }): Promise<BuyerResult> {
  const email = normalizeEmail(input.email);
  const shop = await ready('reset', email === '' ? undefined : email);
  if ('error' in shop) return { ok: false, error: shop.error };
  const { tenantId, errors } = shop;
  if (email === '') return { ok: false, error: errors.email };

  const words = await loadShopWords(tenantId);
  try {
    const user = await findUserByEmail(email);
    if (user !== null) {
      const admin = supabaseAdmin();
      const { data: tenant, error: tenantError } = await admin.from('tenants').select('business_name').eq('id', tenantId).single();
      if (tenantError !== null) throw new Error(`shop lookup failed: ${tenantError.message}`);
      const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email });
      if (error !== null || data.properties === undefined) throw new Error(`Could not create the reset link: ${error?.message ?? 'no link'}`);
      const link = buyerResetLink(await shopOrigin(), data.properties.hashed_token);
      const mail = buyerResetEmail(words.account.email, tenant.business_name, link);
      const { error: sendError } = await resend().emails.send({ from: fromEmail(), to: email, ...mail });
      if (sendError !== null) throw new Error(`Could not send the email: ${sendError.message}`);
    }
    return { ok: true, message: words.account.forgot.sent };
  } catch (err) {
    logger.error('buyer: password reset failed', { error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: errors.failed };
  }
}

/** Sets a new password from the emailed link's token, then signs the buyer in here. */
export async function resetBuyerPassword(input: { tokenHash: string; password: string; confirm: string }): Promise<BuyerResult> {
  const shop = await ready('reset');
  if ('error' in shop) return { ok: false, error: shop.error };
  const { tenantId, secret, errors } = shop;
  if (input.password.length < MIN_BUYER_PASSWORD) return { ok: false, error: fill(errors.short, { n: MIN_BUYER_PASSWORD }) };
  if (input.password !== input.confirm) return { ok: false, error: errors.mismatch };
  if (input.tokenHash === '') return { ok: false, error: errors.expired };

  try {
    const checker = passwordChecker();
    const { data, error } = await checker.auth.verifyOtp({ token_hash: input.tokenHash, type: 'recovery' });
    if (error !== null || data.session === null || data.user === null) return { ok: false, error: errors.expired };
    const { error: updateError } = await checker.auth.updateUser({ password: input.password });
    await endSharedSession(data.session.access_token);
    if (updateError !== null) {
      if (updateError.code === 'weak_password') return { ok: false, error: fill(errors.short, { n: MIN_BUYER_PASSWORD }) };
      logger.error('buyer: new password failed', { error: updateError.message });
      return { ok: false, error: errors.failed };
    }
    const buyer = await ensureBuyer(supabaseAdmin(), tenantId, data.user.id, '');
    if (buyer === null) return { ok: false, error: errors.failed };
    await startBuyerPass(buyer.userId, tenantId, secret);
  } catch (err) {
    logger.error('buyer: new password failed', { error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: errors.failed };
  }
  redirect(ACCOUNT_HOME);
}

/** Puts a paid order's pieces back in the cart (the cart re-checks each one) and opens it. */
export async function reorderBuyerOrder(input: { number: string }): Promise<BuyerResult> {
  const tenantId = await shopTenantId();
  if (tenantId === null) return { ok: false, error: '' };
  const words = (await loadShopWords(tenantId)).account;
  const buyer = await currentBuyer(tenantId);
  if (buyer === null) return { ok: false, error: words.errors.expired };
  const order = await loadBuyerOrder(supabaseAdmin(), tenantId, buyer.profileId, input.number);
  if (order === null || !order.paid) return { ok: false, error: words.order.reorderNone };
  const entries = order.lines.flatMap((l) => (l.entry === null ? [] : [l.entry]));
  if (entries.length === 0) return { ok: false, error: words.order.reorderNone };

  const jar = await cookies();
  const cart = entries.reduce((ids, entry) => addToCart(ids, entry), parseCart(jar.get(CART_COOKIE)?.value));
  // The same cookie the shop's own cart buttons write (readable by the nav's count).
  jar.set(CART_COOKIE, serializeCart(cart), { path: '/', maxAge: CART_MAX_AGE, sameSite: 'lax', secure: (await shopOrigin()).startsWith('https:') });
  redirect(CART);
}
