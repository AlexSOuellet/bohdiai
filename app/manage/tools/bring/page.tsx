import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { loadPieceResults, type PieceResult } from '@/lib/backend/markets/piece-sales';
import { logger } from '@/lib/logger';
import { BringTool } from '../_components/BringTool';
import type { PastMarket } from '@/lib/tools/bring';

export const dynamic = 'force-dynamic';

/** What to bring (Alex, 2026-10-28): Market and Full, where the market app counts what sold. */
export default async function Page(): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) notFound();
  const db = await createSupabaseServerClient();
  let results: PieceResult[];
  let markets: PastMarket[] = [];
  try {
    results = await loadPieceResults(db, site.tenantId, null);
    const ids = [...new Set(results.map((r) => r.eventId))];
    if (ids.length > 0) {
      const { data, error } = await db.from('events').select('id, name, event_date').eq('tenant_id', site.tenantId).in('id', ids);
      if (error !== null) throw new Error(error.message);
      markets = (data ?? []).map((e) => ({ id: e.id, name: e.name, date: e.event_date }));
    }
  } catch (err) {
    logger.error('tools: what to bring failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return <p className="bk-error">How your markets sold couldn’t load. Refresh to try again.</p>;
  }
  return <BringTool markets={markets} results={results} />;
}
