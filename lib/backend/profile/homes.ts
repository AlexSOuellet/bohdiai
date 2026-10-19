/**
 * Write a site's about-the-maker content into its homes (the builders: the one
 * builder, the custom-site builders, the sample converter). Each home is set to
 * exactly what the form says: a piece left empty is cleared from its home.
 * Throws with the failing home's name.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { ProfileHomes } from './profile-form';

export async function writeProfileHomes(db: SupabaseClient<Database>, tenantId: string, h: ProfileHomes, extra: { portrait_upload_id?: string | null } = {}): Promise<void> {
  const fail = (home: string, message: string): never => {
    throw new Error(`${home}: ${message}`);
  };
  const p = await db.from('site_profiles').upsert({ tenant_id: tenantId, ...h.profile, ...extra });
  if (p.error !== null) fail('site_profiles', p.error.message);
  // The about heading's home is the section words; a form without one leaves them as they are.
  if (h.aboutTitle !== null) {
    const a = await db.from('site_sections').upsert({ tenant_id: tenantId, section: 'about', title: h.aboutTitle });
    if (a.error !== null) fail('site_sections about', a.error.message);
  }
  const m = h.marquee === null
    ? await db.from('site_marquees').delete().eq('tenant_id', tenantId)
    : await db.from('site_marquees').upsert({ tenant_id: tenantId, phrases: h.marquee });
  if (m.error !== null) fail('site_marquees', m.error.message);
  const c = h.phone === null
    ? await db.from('site_contacts').delete().eq('tenant_id', tenantId)
    : await db.from('site_contacts').upsert({ tenant_id: tenantId, phone: h.phone });
  if (c.error !== null) fail('site_contacts', c.error.message);
  const d = await db.from('site_socials').delete().eq('tenant_id', tenantId);
  if (d.error !== null) fail('site_socials', d.error.message);
  if (h.socials.length > 0) {
    const s = await db.from('site_socials').insert(h.socials.map((x) => ({ tenant_id: tenantId, ...x })));
    if (s.error !== null) fail('site_socials', s.error.message);
  }
}
