/** About you's part of the home screen: what's still missing from the page. */
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { HomeContributor, HomeData } from '../home';
import { getProfileForm } from './queries';
import type { ProfileForm } from './profile-form';

export function profileHomeData(p: ProfileForm): HomeData {
  const attention: string[] = [];
  if (p.headline === '') attention.push('Your page has no headline yet. Add one in About you.');
  if (p.bio === '') attention.push('Your page has no story yet. Add a few lines in About you.');
  return { tiles: [], attention };
}

export const profileHome: HomeContributor = {
  feature: 'profile',
  load: async (tenantId) => profileHomeData(await getProfileForm(await createSupabaseServerClient(), tenantId)),
};
