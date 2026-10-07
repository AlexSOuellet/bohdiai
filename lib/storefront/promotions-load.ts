/** Reads a shop's promotions and its "today", for the storefront (service role) and
 *  the backend (the owner's own client). Empty when Promotions is switched off. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { loadSiteFeatures } from '@/lib/backend/features';
import { shopToday, type Promotion } from './promotions';

type Db = SupabaseClient<Database>;

export const PROMOTION_COLUMNS = 'id, kind, name, code, percent_off, amount_off_cents, starts_on, ends_on, max_uses, uses, active, created_at';

type PromotionRow = {
  id: string;
  kind: string;
  name: string;
  code: string | null;
  percent_off: number | null;
  amount_off_cents: number | null;
  starts_on: string | null;
  ends_on: string | null;
  max_uses: number | null;
  uses: number;
  active: boolean;
};

export function promotionFromRow(r: PromotionRow): Promotion {
  return {
    id: r.id,
    kind: r.kind === 'code' ? 'code' : 'sale',
    name: r.name,
    code: r.code,
    percentOff: r.percent_off,
    amountOffCents: r.amount_off_cents,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
    maxUses: r.max_uses,
    uses: r.uses,
    active: r.active,
  };
}

export async function listPromotions(db: Db, tenantId: string): Promise<Promotion[]> {
  const { data, error } = await db.from('promotions').select(PROMOTION_COLUMNS).eq('tenant_id', tenantId).order('created_at', { ascending: false });
  if (error !== null) throw new Error(`Could not load the promotions: ${error.message}`);
  return (data ?? []).map(promotionFromRow);
}

export async function loadShopPromotions(db: Db, tenantId: string): Promise<{ promos: Promotion[]; today: string }> {
  const [features, tenant] = await Promise.all([
    loadSiteFeatures(db, tenantId),
    db.from('tenants').select('time_zone').eq('id', tenantId).maybeSingle(),
  ]);
  if (tenant.error !== null) throw new Error(`Could not load the shop: ${tenant.error.message}`);
  const today = shopToday(tenant.data?.time_zone ?? null);
  if (!features.has('promotions')) return { promos: [], today };
  return { promos: await listPromotions(db, tenantId), today };
}
