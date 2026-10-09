'use server';

/**
 * Change the site's plan from the backend (Saltmarsh & Lace demo spec, stage two).
 * Only demo sites can do it here: there is no billing yet, so a real site's
 * Upgrade still emails Alex. Re-checks the acting site and its switches on the
 * server, then writes the switches with the service role (owners never write
 * them directly).
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { isSitePlan } from './plan';
import { loadSitePlan } from './queries';
import { moveOf } from './plan-features';
import { applyPlan } from './apply';

export type ChangePlanResult = { ok: true } | { ok: false; error: string };

export async function changePlan(to: unknown): Promise<ChangePlanResult> {
  if (!isSitePlan(to)) return { ok: false, error: 'That isn’t one of the plans.' };
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan') || !on.has('demo_checkout')) return { ok: false, error: 'Plan changes go through Alex for now. Use the email button on Your plan.' };
  const from = await loadSitePlan(await createSupabaseServerClient(), site.tenantId);
  if (from === null) return { ok: false, error: 'This site isn’t on a plan yet.' };
  if (moveOf(from, to) === 'same') return { ok: false, error: 'You’re already on that plan.' };
  const r = await applyPlan(supabaseAdmin(), site.tenantId, to);
  if (!r.ok) {
    logger.error('plan change failed', { tenantId: site.tenantId, from, to, error: r.error });
    return { ok: false, error: 'The plan couldn’t be changed. Try again in a moment.' };
  }
  revalidatePath('/manage', 'layout');
  return { ok: true };
}
