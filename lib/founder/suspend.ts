/**
 * Suspend a site (go-live step 3, Alex 2026-11-16): for when the whole site is the
 * problem (a scam, things on the can't-be-sold list, someone else's work). One press
 * takes it offline for every visitor and the maker can't put it back (the database
 * refuses: see the tenants_maker_status_moves trigger). Billing pauses while it's
 * suspended (Alex: "i go with pause. no refunds in middle of month though"): Stripe
 * skips the bills that come due and refunds nothing already paid. Unsuspend puts the
 * site back exactly as it was and billing carries on. Runs with the service role.
 */
import type Stripe from 'stripe';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { currentSubscription } from '@/lib/billing/maker-subscription';

type Db = SupabaseClient<Database>;
type Before = 'draft' | 'active' | 'offline';

export type SuspendResult = { ok: true } | { ok: false; error: string };

const isBefore = (s: string): s is Before => s === 'draft' || s === 'active' || s === 'offline';

/** Stripe stops billing the plan (bills that come due are skipped) or starts again. */
async function pauseBilling(db: Db, s: Stripe, tenantId: string, paused: boolean): Promise<void> {
  const sub = await currentSubscription(db, tenantId);
  if (sub === null) return; // A free or hand-built site has nothing to pause.
  await s.subscriptions.update(sub.stripeId, {
    pause_collection: paused ? { behavior: 'void' } : '',
  });
}

export async function suspendSite(
  db: Db,
  s: Stripe,
  tenantId: string,
  reason: string,
): Promise<SuspendResult> {
  const { data, error } = await db
    .from('tenants')
    .select('status')
    .eq('id', tenantId)
    .maybeSingle();
  if (error !== null) return { ok: false, error: `Couldn’t read the site: ${error.message}` };
  if (data === null) return { ok: false, error: 'That site isn’t there any more.' };
  if (data.status === 'suspended') return { ok: false, error: 'That site is already suspended.' };
  if (!isBefore(data.status)) return { ok: false, error: 'That site is closed.' };
  // Stripe first, so the admin never says billing paused when it didn't.
  try {
    await pauseBilling(db, s, tenantId, true);
  } catch (err) {
    return {
      ok: false,
      error: `Stripe didn’t pause the billing, so nothing changed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  const { error: upErr } = await db
    .from('tenants')
    .update({
      status: 'suspended',
      suspended_from: data.status,
      suspended_reason: reason,
      suspended_at: new Date().toISOString(),
    })
    .eq('id', tenantId)
    .eq('status', data.status);
  if (upErr !== null) {
    await pauseBilling(db, s, tenantId, false).catch(() => undefined);
    return { ok: false, error: `Couldn’t suspend the site, so nothing changed: ${upErr.message}` };
  }
  return { ok: true };
}

export async function unsuspendSite(db: Db, s: Stripe, tenantId: string): Promise<SuspendResult> {
  const { data, error } = await db
    .from('tenants')
    .select('status, suspended_from')
    .eq('id', tenantId)
    .maybeSingle();
  if (error !== null) return { ok: false, error: `Couldn’t read the site: ${error.message}` };
  if (data === null) return { ok: false, error: 'That site isn’t there any more.' };
  if (data.status !== 'suspended') return { ok: false, error: 'That site isn’t suspended.' };
  const back: Before =
    data.suspended_from !== null && isBefore(data.suspended_from) ? data.suspended_from : 'offline';
  try {
    await pauseBilling(db, s, tenantId, false);
  } catch (err) {
    return {
      ok: false,
      error: `Stripe didn’t start the billing again, so the site is still suspended: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
  const { error: upErr } = await db
    .from('tenants')
    .update({ status: back, suspended_from: null, suspended_reason: null, suspended_at: null })
    .eq('id', tenantId)
    .eq('status', 'suspended');
  if (upErr !== null) {
    await pauseBilling(db, s, tenantId, true).catch(() => undefined);
    return { ok: false, error: `Couldn’t unsuspend the site: ${upErr.message}` };
  }
  return { ok: true };
}

/** What a suspended maker is told when something they try waits on the suspension. */
export const SUSPENDED_NOTE =
  'Your site is suspended, so this has to wait. Use Contact support to talk to Alex about it.';

/** True while Alex has the site suspended. */
export async function siteSuspended(db: Db, tenantId: string): Promise<boolean> {
  const { data, error } = await db
    .from('tenants')
    .select('status')
    .eq('id', tenantId)
    .maybeSingle();
  if (error !== null) throw new Error(`Couldn’t read the site: ${error.message}`);
  return data?.status === 'suspended';
}
