/**
 * The home screen is built from the site's features (spec §3): each contributor
 * adds tiles and Needs-attention lines. Later plans append to HOME_CONTRIBUTORS
 * (1b catalog counts + products needing attention; 1d the domain problem line).
 */
import { logger } from '@/lib/logger';
import type { FeatureKey } from './features';
import { catalogHome } from './catalog/home';

export type Tile = { label: string; value: string; note?: string };
export type HomeData = { tiles: Tile[]; attention: string[] };
export type HomeContributor = { feature: FeatureKey | null; load: (tenantId: string) => Promise<HomeData> };

export const HOME_CONTRIBUTORS: HomeContributor[] = [catalogHome];

const LOAD_FAILED = 'Part of this page couldn’t load. Refresh to try again.';

export async function collectHome(contributors: readonly HomeContributor[], on: ReadonlySet<FeatureKey>, tenantId: string): Promise<HomeData> {
  const active = contributors.filter((c) => c.feature === null || on.has(c.feature));
  const results = await Promise.all(
    active.map(async (c) => {
      try {
        return await c.load(tenantId);
      } catch (err) {
        logger.error('backend home contributor failed', { feature: c.feature, error: err instanceof Error ? err.message : String(err) });
        return { tiles: [], attention: [LOAD_FAILED] };
      }
    }),
  );
  return { tiles: results.flatMap((r) => r.tiles), attention: [...new Set(results.flatMap((r) => r.attention))] };
}
