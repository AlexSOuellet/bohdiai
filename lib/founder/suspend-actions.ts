'use server';

/**
 * Suspend and Unsuspend from a maker's page in the admin (go-live step 3, Alex
 * 2026-11-16). Alex only. The maker is emailed either way, with Alex copied.
 */
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/billing/stripe';
import { sendPlanChange, type PlanChange } from '@/lib/backend/plan/emails';
import { loadFounderSites } from './sites';
import { requireFounder } from './access';
import { suspendSite, unsuspendSite, type SuspendResult } from './suspend';
import type { FormResult } from './promo-actions';

const MAX_REASON = 1000;

const field = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

async function tell(tenantId: string, change: PlanChange): Promise<void> {
  const site = (await loadFounderSites(supabaseAdmin())).find((s) => s.id === tenantId);
  if (site === undefined) return;
  await sendPlanChange({
    siteName: site.name,
    subdomain: site.subdomain,
    makerEmail: site.maker ?? '',
    change,
  });
}

async function run(what: string, work: () => Promise<SuspendResult>): Promise<SuspendResult> {
  try {
    return await work();
  } catch (err) {
    logger.error(`admin: ${what} failed`, {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      ok: false,
      error: 'That didn’t go through, so nothing changed. Try again in a moment.',
    };
  }
}

export async function suspendFromAdmin(
  _prev: FormResult | null,
  form: FormData,
): Promise<FormResult> {
  await requireFounder();
  const tenantId = field(form, 'tenantId');
  const reason = field(form, 'reason').slice(0, MAX_REASON);
  if (reason === '') return { ok: false, message: 'Say why. The maker sees it in their email.' };
  const r = await run('suspend', () => suspendSite(supabaseAdmin(), stripe(), tenantId, reason));
  if (!r.ok) return { ok: false, message: r.error };
  await tell(tenantId, { kind: 'suspended', reason });
  revalidatePath('/founder', 'layout');
  return {
    ok: true,
    message:
      'Suspended. Visitors see it’s offline, billing is paused, and the maker has been emailed why.',
  };
}

export async function unsuspendFromAdmin(
  _prev: FormResult | null,
  form: FormData,
): Promise<FormResult> {
  await requireFounder();
  const tenantId = field(form, 'tenantId');
  const r = await run('unsuspend', () => unsuspendSite(supabaseAdmin(), stripe(), tenantId));
  if (!r.ok) return { ok: false, message: r.error };
  await tell(tenantId, { kind: 'unsuspended' });
  revalidatePath('/founder', 'layout');
  return {
    ok: true,
    message: 'Back as it was. Billing carries on, and the maker has been emailed.',
  };
}
