'use server';

/**
 * Markets — save one (with its costs, in one go) or remove it. Each action
 * re-checks the acting site and its `market_dates` switch on the server and
 * writes through the owner's own client so RLS applies.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult, SaveResult } from '../catalog/results';
import { COSTS_LIMIT, MARKETS_LIMIT, buildMarketPayload, type MarketForm } from './market-form';
import { saveTakings, takingsRow, type Takings } from '@/lib/tools/event-takings';

const OFF = 'Markets aren’t switched on for this site.';

async function marketsSite(): Promise<string | null> {
  const { site } = await requireActingSite();
  return (await getSiteFeatures(site.tenantId)).has('market_dates') ? site.tenantId : null;
}

function done(): void {
  revalidatePath('/manage/markets');
  revalidatePath('/manage');
}

/** `takings`: Market day's own numbers (Alex, 2026-10-24), kept where there's no
 *  till to count the sales. Checked before anything is written; if they then fail to
 *  save, the event stays saved and the result says so. */
export async function saveMarket(form: MarketForm, takings: Takings | null = null): Promise<SaveResult> {
  const tenantId = await marketsSite();
  if (tenantId === null) return { ok: false, error: OFF };
  const built = buildMarketPayload(form);
  if (!built.ok) return built;
  if (takings !== null) {
    const checked = takingsRow(tenantId, '00000000-0000-0000-0000-000000000000', takings);
    if (!checked.ok) return checked;
  }
  const db = await createSupabaseServerClient();
  // The pieces she brings are saved only on sites with the market shop.
  const shop = (await getSiteFeatures(tenantId)).has('market_shop');
  const { listing_ids: listingIds, stock, ...rest } = built.payload;
  const { data, error } = await db.rpc('save_market', {
    p_tenant_id: tenantId,
    p: shop ? { ...rest, listing_ids: listingIds, stock } : rest,
    ...(form.id === null ? {} : { p_event_id: form.id }),
  });
  if (error !== null || typeof data !== 'string') {
    if (error?.code === 'P0031') return { ok: false, error: `You can keep up to ${MARKETS_LIMIT} markets. Remove an old one to add another.` };
    if (error?.code === 'P0030') return { ok: false, error: `A market holds up to ${COSTS_LIMIT} costs.` };
    if (error?.code === 'P0002') return { ok: false, error: 'This market was removed. Go back to your markets.' };
    logger.error('markets: save failed', { tenantId, error: error?.message });
    return { ok: false, error: 'The market couldn’t be saved. Try again in a moment.' };
  }
  done();
  if (takings !== null && !shop) {
    try {
      const saved = await saveTakings(db, tenantId, data, takings);
      if (!saved.ok) return { ok: true, id: data, warning: 'takings' };
    } catch (err) {
      logger.error('markets: takings save failed', { tenantId, error: err instanceof Error ? err.message : String(err) });
      return { ok: true, id: data, warning: 'takings' };
    }
  }
  return { ok: true, id: data };
}

export async function removeMarket(id: string): Promise<DoneResult> {
  const tenantId = await marketsSite();
  if (tenantId === null) return { ok: false, error: OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('events').delete().eq('tenant_id', tenantId).eq('id', id);
  if (error !== null) {
    logger.error('markets: remove failed', { tenantId, error: error.message });
    return { ok: false, error: 'The market couldn’t be removed. Try again in a moment.' };
  }
  done();
  return { ok: true };
}
