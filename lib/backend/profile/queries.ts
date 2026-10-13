/** About you — read (card site spec), scoped to the acting site through the person's own client. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { profileFormFromRow, type ProfileForm } from './profile-form';

export const PROFILE_COLUMNS = 'kicker, headline, about_title, bio, signature, makes, quote, quote_attribution, marquee_phrases, phone, facebook_url, instagram_url';

export async function getProfileForm(db: SupabaseClient<Database>, tenantId: string): Promise<ProfileForm> {
  const { data, error } = await db.from('site_profiles').select(PROFILE_COLUMNS).eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not load About you: ${error.message}`);
  return profileFormFromRow(data);
}

/** The maker's portrait, as a web address, or null when there is none. */
export async function getPortraitUrl(db: SupabaseClient<Database>, tenantId: string): Promise<string | null> {
  const { data, error } = await db.from('site_profiles').select('uploads(public_url)').eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not load the portrait: ${error.message}`);
  return data?.uploads?.public_url ?? null;
}
