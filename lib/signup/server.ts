/**
 * Sign-up's outside steps, for real: Supabase for the account and the site
 * record, Stripe for the page they pay on. Server only (service role).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';
import { applyPlan } from '@/lib/backend/plan/apply';
import { FREE_PLAN } from '@/lib/backend/plan/plan';
import { findUserByEmail } from '@/lib/backend/user-lookup';
import { addShopOwner } from '@/lib/auth/membership';
import { startCheckout } from '@/lib/billing/checkout';
import { billingFor, stripe } from '@/lib/billing/stripe';
import { freeSubdomain } from './subdomain';
import { confirmSite } from './after-paid';
import type { SignupDeps, SignupSite } from './signup';
import type { SignupFields } from './request';

type Db = SupabaseClient<Database>;

const UNIQUE_VIOLATION = '23505';

/** The plan as bohdiai.com/start's address names it (?plan=maker-full). */
export function startPlanId(fields: Pick<SignupFields, 'plan'>): string {
  return `maker-${fields.plan}`;
}

/** Signs in with the anon key to check a password; nothing is kept. An account
 *  that isn't confirmed yet still answers whether the password is right. */
async function passwordUser(email: string, password: string): Promise<string | null> {
  const url = process.env['SUPABASE_URL'] ?? process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const anon = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  if (url === undefined || anon === undefined) throw new Error('Supabase url / anon key missing');
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error === null) return data.user.id;
  if (error.code === 'email_not_confirmed') return (await findUserByEmail(email))?.id ?? null;
  return null;
}

async function sitesOf(db: Db, userId: string): Promise<SignupSite[]> {
  const { data, error } = await db.from('tenant_members').select('tenant_id, tenants(status)').eq('user_id', userId).eq('role', 'admin').eq('status', 'active');
  if (error !== null) throw new Error(`Could not read the account's sites: ${error.message}`);
  const ids = (data ?? []).map((r) => r.tenant_id);
  if (ids.length === 0) return [];
  const { data: subs, error: subErr } = await db.from('subscriptions').select('tenant_id').in('tenant_id', ids);
  if (subErr !== null) throw new Error(`Could not read billing: ${subErr.message}`);
  const paid = new Set((subs ?? []).map((s) => s.tenant_id));
  return (data ?? []).map((r) => ({ tenantId: r.tenant_id, draft: r.tenants?.status === 'draft', paid: paid.has(r.tenant_id) }));
}

async function putOnPlan(db: Db, tenantId: string, fields: SignupFields): Promise<void> {
  const { error } = await db.from('tenants').update({ plan_billing: fields.plan === FREE_PLAN ? null : billingFor(fields.plan, fields.billing) }).eq('id', tenantId);
  if (error !== null) throw new Error(`Could not save the billing choice: ${error.message}`);
  const applied = await applyPlan(db, tenantId, fields.plan);
  if (!applied.ok) throw new Error(`Could not put the site on its plan: ${applied.error}`);
}

/** An unpublished site record, owned by the account, on the plan picked. */
async function createSite(db: Db, userId: string, fields: SignupFields): Promise<string> {
  const isTaken = async (subdomain: string): Promise<boolean> => {
    const { data, error } = await db.from('tenants').select('id').eq('subdomain', subdomain).maybeSingle();
    if (error !== null) throw new Error(`Could not check the web address: ${error.message}`);
    return data !== null;
  };
  // Two sign-ups with the same business name at once: the second tries again.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const subdomain = await freeSubdomain(fields.businessName, isTaken);
    const { data, error } = await db
      .from('tenants')
      .insert({ subdomain, business_name: fields.businessName, tier: 'basic', types: ['seller'], status: 'draft', contact_email: fields.email })
      .select('id')
      .single();
    if (error?.code === UNIQUE_VIOLATION) continue;
    if (error !== null) throw new Error(`Could not make the site record: ${error.message}`);
    try {
      await putOnPlan(db, data.id, fields);
      await addShopOwner(userId, data.id);
      return data.id;
    } catch (err) {
      await db.from('tenants').delete().eq('id', data.id);
      throw err;
    }
  }
  throw new Error('Could not find a free web address');
}

/**
 * Sign-in for an account that isn't confirmed yet (Supabase only says so when the
 * password was right): one that never finished paying goes back to Stripe; one
 * that paid is sent a fresh confirmation link and told to look for it.
 */
export async function unconfirmedSignIn(db: Db, email: string, origin: string): Promise<{ kind: 'pay'; url: string } | { kind: 'confirm' }> {
  const user = await findUserByEmail(email);
  if (user === null) return { kind: 'confirm' };
  const sites = await sitesOf(db, user.id);
  const waiting = sites.find((s) => s.draft && !s.paid);
  const paid = sites.find((s) => s.paid);
  if (paid !== undefined) {
    // Their link may be lost or used up: a fresh one, every time they try.
    await confirmSite(db, paid.tenantId);
    return { kind: 'confirm' };
  }
  if (waiting === undefined) return { kind: 'confirm' };
  const { data, error } = await db.from('tenants').select('plan, plan_billing, business_name, contact_email').eq('id', waiting.tenantId).single();
  if (error !== null) throw new Error(`Could not read the site's plan: ${error.message}`);
  const plan = data.plan;
  if (plan !== FREE_PLAN && plan !== 'showcase' && plan !== 'lite' && plan !== 'full') throw new Error(`site ${waiting.tenantId} has no plan`);
  const fields: SignupFields = { plan, billing: data.plan_billing === 'yearly' ? 'yearly' : 'monthly', makerName: '', businessName: data.business_name, email };
  return { kind: 'pay', url: await signupDeps(db, origin).checkout(waiting.tenantId, fields) };
}

/** The real steps. `origin` is bohdiai.com (or the dev server) for Stripe's way back. */
export function signupDeps(db: Db, origin: string): SignupDeps {
  return {
    async createUser(email, password, name) {
      const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: false, user_metadata: { name } });
      if (error === null) return { ok: true, userId: data.user.id };
      if (error.code === 'email_exists' || error.status === 422) return { ok: false, reason: 'exists' };
      logger.error('signup: account create failed', { error: error.message });
      return { ok: false, reason: 'failed' };
    },
    passwordUser,
    sitesOf: (userId) => sitesOf(db, userId),
    createSite: (userId, fields) => createSite(db, userId, fields),
    setPlan: (tenantId, fields) => putOnPlan(db, tenantId, fields),
    async removeUser(userId) {
      const { error } = await db.auth.admin.deleteUser(userId);
      if (error !== null) logger.error('signup: could not remove the new account after a failed sign-up', { userId, error: error.message });
    },
    checkout: (tenantId, fields) =>
      startCheckout(stripe(), {
        tenantId,
        email: fields.email,
        plan: fields.plan,
        billing: fields.billing,
        paidUrl: `${origin}/start/paid?session={CHECKOUT_SESSION_ID}`,
        backUrl: `${origin}/start?plan=${startPlanId(fields)}&billing=${billingFor(fields.plan, fields.billing)}&back=1`,
      }),
  };
}
