'use server';

/**
 * Market dates — add, change, remove. Each action re-checks the acting site and
 * its `market_dates` switch on the server and writes through the person's own
 * client so RLS applies.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { DATES_LIMIT, buildDateRow, type MarketDate, type MarketDateForm } from './dates-form';

const DATES_OFF = 'Market dates aren’t switched on for this site.';
const FULL = `You can list up to ${DATES_LIMIT} dates. Remove a past one to add another.`;

export type MarketDateResult = { ok: true; item: MarketDate } | { ok: false; error: string };

async function datesSite(): Promise<string | null> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  return on.has('market_dates') ? site.tenantId : null;
}

function done(): void {
  revalidatePath('/manage/dates');
  revalidatePath('/manage');
}

export async function addMarketDate(form: MarketDateForm): Promise<MarketDateResult> {
  const tenantId = await datesSite();
  if (tenantId === null) return { ok: false, error: DATES_OFF };
  const built = buildDateRow(form);
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  const { data: rows, error: countErr } = await db.from('events').select('id').eq('tenant_id', tenantId);
  if (countErr !== null) {
    logger.error('dates: count failed', { tenantId, error: countErr.message });
    return { ok: false, error: 'Your dates couldn’t be checked. Try again in a moment.' };
  }
  if ((rows ?? []).length >= DATES_LIMIT) return { ok: false, error: FULL };

  const { data: row, error } = await db
    .from('events')
    .insert({ tenant_id: tenantId, ...built.row })
    .select('id')
    .single();
  if (error !== null || row === null) {
    logger.error('dates: add failed', { tenantId, error: error?.message });
    return { ok: false, error: 'The date couldn’t be added. Try again in a moment.' };
  }
  done();
  return { ok: true, item: { id: row.id, date: built.row.event_date, name: built.row.name, town: built.row.location ?? '' } };
}

export async function updateMarketDate(id: string, form: MarketDateForm): Promise<MarketDateResult> {
  const tenantId = await datesSite();
  if (tenantId === null) return { ok: false, error: DATES_OFF };
  const built = buildDateRow(form);
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  const { error } = await db.from('events').update(built.row).eq('tenant_id', tenantId).eq('id', id);
  if (error !== null) {
    logger.error('dates: update failed', { tenantId, error: error.message });
    return { ok: false, error: 'The date couldn’t be saved. Try again in a moment.' };
  }
  done();
  return { ok: true, item: { id, date: built.row.event_date, name: built.row.name, town: built.row.location ?? '' } };
}

export async function removeMarketDate(id: string): Promise<DoneResult> {
  const tenantId = await datesSite();
  if (tenantId === null) return { ok: false, error: DATES_OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('events').delete().eq('tenant_id', tenantId).eq('id', id);
  if (error !== null) {
    logger.error('dates: remove failed', { tenantId, error: error.message });
    return { ok: false, error: 'The date couldn’t be removed. Try again in a moment.' };
  }
  done();
  return { ok: true };
}
