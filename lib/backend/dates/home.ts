/** Markets' part of the home screen: how many are listed. */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { HomeContributor, HomeData } from '../home';
import { listMarketDates } from './queries';
import type { MarketDate } from './dates-form';

export function datesHomeData(items: readonly MarketDate[]): HomeData {
  return { tiles: [{ label: 'Markets', value: String(items.length), note: 'on your site' }], attention: [] };
}

export const datesHome: HomeContributor = {
  feature: 'market_dates',
  load: async (tenantId) => datesHomeData(await listMarketDates(await createSupabaseServerClient(), tenantId)),
};
