'use server';

/**
 * Getting paid — save how the shop takes money at a market. Re-checks the acting
 * site and its `market_shop` switch on the server and writes through the owner's
 * own client so RLS applies.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { buildPayRow, type PaySettings } from '@/lib/market/pay';

export async function savePaySettings(settings: PaySettings): Promise<DoneResult> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) return { ok: false, error: 'The market shop isn’t switched on for this site.' };
  const built = buildPayRow(settings);
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  const { error } = await db.from('payment_settings').upsert({ tenant_id: site.tenantId, ...built.row });
  if (error !== null) {
    logger.error('payments: save failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'Your payment details couldn’t be saved. Try again in a moment.' };
  }
  revalidatePath('/manage/payments');
  return { ok: true };
}
