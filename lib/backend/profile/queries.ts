/** About the maker — read from its homes (Plan-Backends.md), through whichever
 *  client the caller has: the person's own (RLS applies) or the storefront's. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { profileFormFromHomes, type ProfileForm } from './profile-form';

/** The maker's own words in `site_profiles`. */
export const PROFILE_COLUMNS = 'kicker, headline, bio, signature, makes, quote, quote_attribution';

/** Everything a site says about its maker, gathered from each home. */
export async function getProfileForm(db: SupabaseClient<Database>, tenantId: string): Promise<ProfileForm> {
  const [profile, about, marquee, contact, socials] = await Promise.all([
    db.from('site_profiles').select(PROFILE_COLUMNS).eq('tenant_id', tenantId).maybeSingle(),
    db.from('site_sections').select('title').eq('tenant_id', tenantId).eq('section', 'about').maybeSingle(),
    db.from('site_marquees').select('phrases').eq('tenant_id', tenantId).maybeSingle(),
    db.from('site_contacts').select('phone').eq('tenant_id', tenantId).maybeSingle(),
    db.from('site_socials').select('network, url').eq('tenant_id', tenantId).order('position'),
  ]);
  for (const r of [profile, about, marquee, contact, socials]) {
    if (r.error !== null) throw new Error(`Could not load About you: ${r.error.message}`);
  }
  return profileFormFromHomes({
    profile: profile.data,
    aboutTitle: about.data?.title ?? null,
    marquee: marquee.data?.phrases ?? null,
    phone: contact.data?.phone ?? null,
    socials: socials.data ?? [],
  });
}

/** The maker's portrait, as a web address, or null when there is none. */
export async function getPortraitUrl(db: SupabaseClient<Database>, tenantId: string): Promise<string | null> {
  const { data, error } = await db.from('site_profiles').select('uploads(public_url)').eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not load the portrait: ${error.message}`);
  return data?.uploads?.public_url ?? null;
}
