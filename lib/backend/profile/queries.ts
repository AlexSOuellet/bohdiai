/** About you — read (card site spec), scoped to the acting site through the person's own client. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { profileFormFromRow, type ProfileForm } from './profile-form';

export const PROFILE_COLUMNS = 'kicker, headline, about_title, bio, signature, makes, phone, facebook_url, instagram_url';

export async function getProfileForm(db: SupabaseClient<Database>, tenantId: string): Promise<ProfileForm> {
  const { data, error } = await db.from('site_profiles').select(PROFILE_COLUMNS).eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not load About you: ${error.message}`);
  return profileFormFromRow(data);
}
