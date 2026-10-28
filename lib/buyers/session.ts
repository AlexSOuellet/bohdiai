import 'server-only';
/**
 * The signed-in buyer on the shop being shown, from the shop's own pass (see
 * pass.ts). Null when no one is signed in, the pass is for another shop or has
 * run out, or the shop's buyer accounts are closed (below Full, or switched off).
 */
import { cookies, headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { BUYER_COOKIE, BUYER_PASS_SECONDS, passSecret, readPass, signPass } from './pass';
import { buyerAccountsOpen, buyerFor, type Buyer } from './accounts';

export function buyerSecret(): string | null {
  return passSecret(process.env['BACKEND_SESSION_SECRET']);
}

/** The shop this request is for (set by the middleware from the real host), or null. */
export async function shopTenantId(): Promise<string | null> {
  return (await headers()).get('x-tenant-id');
}

export async function currentBuyer(tenantId: string): Promise<Buyer | null> {
  const secret = buyerSecret();
  if (secret === null) return null;
  const pass = await readPass((await cookies()).get(BUYER_COOKIE)?.value, tenantId, Math.floor(Date.now() / 1000), secret);
  if (pass === null) return null;
  const db = supabaseAdmin();
  if (!(await buyerAccountsOpen(db, tenantId))) return null;
  return buyerFor(db, tenantId, pass.userId);
}

/** Whether this page is on https (a local dev shop is plain http). */
async function onHttps(): Promise<boolean> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (proto === 'https') return true;
  const host = (h.get('host') ?? '').split(':')[0] ?? '';
  return !(host === 'localhost' || host.endsWith('.localhost'));
}

/** Gives the buyer this shop's pass. */
export async function startBuyerPass(userId: string, tenantId: string, secret: string): Promise<void> {
  const expires = Math.floor(Date.now() / 1000) + BUYER_PASS_SECONDS;
  const value = await signPass({ userId, tenantId, expires }, secret);
  (await cookies()).set(BUYER_COOKIE, value, { httpOnly: true, secure: await onHttps(), sameSite: 'lax', path: '/', maxAge: BUYER_PASS_SECONDS });
}

export async function endBuyerPass(): Promise<void> {
  (await cookies()).set(BUYER_COOKIE, '', { httpOnly: true, secure: await onHttps(), sameSite: 'lax', path: '/', maxAge: 0 });
}

/** The shop's own address for links in its emails: never taken from the request's
 *  Host on a live site, only from the shop's own name (a local dev shop keeps its host). */
export async function shopOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get('host') ?? '';
  const bare = host.split(':')[0] ?? '';
  if (bare.endsWith('.localhost')) return `http://${host}`;
  return `https://${h.get('x-tenant-subdomain') ?? ''}.bohdiai.com`;
}

/** The signed-in buyer's profile for an order being placed, or null. A failure to
 *  read it never stops the order: it is placed as a guest's and the failure logged. */
export async function signedInBuyerProfile(tenantId: string): Promise<string | null> {
  try {
    return (await currentBuyer(tenantId))?.profileId ?? null;
  } catch (err) {
    logger.error('buyer: reading the signed-in buyer for an order failed', { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
