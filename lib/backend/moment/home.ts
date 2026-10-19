/** The headline's part of the home screen: the words at the top of the page, when missing. */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { HomeContributor, HomeData } from '../home';
import { getMoment } from './queries';

export function headlineHomeData(headline: string): HomeData {
  return { tiles: [], attention: headline.trim() === '' ? ['Your page has no headline yet. Add one under Headline.'] : [] };
}

export const headlineHome: HomeContributor = {
  feature: 'headline',
  load: async (tenantId) => headlineHomeData((await getMoment(await createSupabaseServerClient(), tenantId)).headline),
};
