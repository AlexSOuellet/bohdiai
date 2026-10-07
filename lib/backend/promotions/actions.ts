'use server';

/**
 * Promotions — add, change, pause or resume, remove. Each action re-checks the
 * acting site and its `promotions` switch on the server and writes through the
 * owner's own client so RLS applies.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { PROMOTION_COLUMNS, promotionFromRow } from '@/lib/storefront/promotions-load';
import type { Promotion } from '@/lib/storefront/promotions';
import { PROMOS_LIMIT, buildPromoRow, type PromoForm } from './promo-form';

const OFF = 'Promotions aren’t switched on for this site.';
export type PromoResult = { ok: true; item: Promotion } | { ok: false; error: string };

async function promoSite(): Promise<string | null> {
  const { site } = await requireActingSite();
  return (await getSiteFeatures(site.tenantId)).has('promotions') ? site.tenantId : null;
}

function done(): void {
  revalidatePath('/manage/promotions');
  revalidatePath('/manage');
}

function saveError(code: string | undefined, row: { code: string | null }): string {
  if (code === '23505') return `You already have the code ${row.code ?? ''}. Pick another.`;
  return 'The promotion couldn’t be saved. Try again in a moment.';
}

export async function addPromotion(form: PromoForm): Promise<PromoResult> {
  const tenantId = await promoSite();
  if (tenantId === null) return { ok: false, error: OFF };
  const built = buildPromoRow(form);
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  const { count, error: countErr } = await db.from('promotions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId);
  if (countErr !== null) {
    logger.error('promotions: count failed', { tenantId, error: countErr.message });
    return { ok: false, error: 'Your promotions couldn’t be checked. Try again in a moment.' };
  }
  if ((count ?? 0) >= PROMOS_LIMIT) return { ok: false, error: `You can keep up to ${PROMOS_LIMIT} promotions. Remove an old one to add another.` };
  const { data, error } = await db.from('promotions').insert({ tenant_id: tenantId, ...built.row }).select(PROMOTION_COLUMNS).single();
  if (error !== null || data === null) {
    logger.error('promotions: add failed', { tenantId, error: error?.message });
    return { ok: false, error: saveError(error?.code, built.row) };
  }
  done();
  return { ok: true, item: promotionFromRow(data) };
}

export async function updatePromotion(id: string, form: PromoForm): Promise<PromoResult> {
  const tenantId = await promoSite();
  if (tenantId === null) return { ok: false, error: OFF };
  const built = buildPromoRow(form);
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from('promotions').update(built.row).eq('tenant_id', tenantId).eq('id', id).select(PROMOTION_COLUMNS).single();
  if (error !== null || data === null) {
    logger.error('promotions: update failed', { tenantId, error: error?.message });
    return { ok: false, error: saveError(error?.code, built.row) };
  }
  done();
  return { ok: true, item: promotionFromRow(data) };
}

export async function setPromotionActive(id: string, active: boolean): Promise<DoneResult> {
  const tenantId = await promoSite();
  if (tenantId === null) return { ok: false, error: OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('promotions').update({ active }).eq('tenant_id', tenantId).eq('id', id);
  if (error !== null) {
    logger.error('promotions: pause failed', { tenantId, error: error.message });
    return { ok: false, error: 'The promotion couldn’t be changed. Try again in a moment.' };
  }
  done();
  return { ok: true };
}

export async function removePromotion(id: string): Promise<DoneResult> {
  const tenantId = await promoSite();
  if (tenantId === null) return { ok: false, error: OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('promotions').delete().eq('tenant_id', tenantId).eq('id', id);
  if (error !== null) {
    logger.error('promotions: remove failed', { tenantId, error: error.message });
    return { ok: false, error: 'The promotion couldn’t be removed. Try again in a moment.' };
  }
  done();
  return { ok: true };
}
