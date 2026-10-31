/**
 * Signing up (Alex, Session 119): the account and the site record are made, then
 * the maker goes straight to Stripe for their plan (Free too, at $0). The account
 * starts unconfirmed; it's confirmed from the email after paying.
 *
 * Someone who left Stripe halfway signs up again with the same email and password
 * and picks up where they left off: the same site record, the plan they pick now,
 * back to Stripe. An email that already has a paid site, or the wrong password,
 * is told the email already has an account.
 *
 * Every outside step is passed in, so the order is tested on its own.
 */
import type { SignupFields } from './request';

export type SignupSite = { tenantId: string; draft: boolean; paid: boolean };

export type SignupDeps = {
  /** A new, unconfirmed account; 'exists' when the email already has one. */
  createUser(email: string, password: string, name: string): Promise<{ ok: true; userId: string } | { ok: false; reason: 'exists' | 'failed' }>;
  /** The account, when this is its password (confirmed or not yet); else null. */
  passwordUser(email: string, password: string): Promise<string | null>;
  /** The sites this account owns. */
  sitesOf(userId: string): Promise<SignupSite[]>;
  /** A new, unpublished site record on the plan, owned by the account. */
  createSite(userId: string, fields: SignupFields): Promise<string>;
  /** Puts a site that hasn't been paid for yet on the plan picked now. */
  setPlan(tenantId: string, fields: SignupFields): Promise<void>;
  /** Removes an account this sign-up made, when the rest failed. */
  removeUser(userId: string): Promise<void>;
  /** Stripe's page for paying for the site's plan. */
  checkout(tenantId: string, fields: SignupFields): Promise<string>;
};

export type SignupResult = { ok: true; url: string } | { ok: false; reason: 'accountExists' | 'failed' };

export async function signUp(fields: SignupFields, password: string, deps: SignupDeps): Promise<SignupResult> {
  const made = await deps.createUser(fields.email, password, fields.makerName);
  if (made.ok) {
    try {
      const tenantId = await deps.createSite(made.userId, fields);
      return { ok: true, url: await deps.checkout(tenantId, fields) };
    } catch (err) {
      // All or nothing: the account this sign-up made goes with it.
      await deps.removeUser(made.userId);
      throw err;
    }
  }
  if (made.reason === 'failed') return { ok: false, reason: 'failed' };

  const userId = await deps.passwordUser(fields.email, password);
  if (userId === null) return { ok: false, reason: 'accountExists' };
  const sites = await deps.sitesOf(userId);
  if (sites.length === 0) {
    const tenantId = await deps.createSite(userId, fields);
    return { ok: true, url: await deps.checkout(tenantId, fields) };
  }
  const waiting = sites.find((s) => s.draft && !s.paid);
  if (waiting === undefined || sites.some((s) => s.paid)) return { ok: false, reason: 'accountExists' };
  await deps.setPlan(waiting.tenantId, fields);
  return { ok: true, url: await deps.checkout(waiting.tenantId, fields) };
}
