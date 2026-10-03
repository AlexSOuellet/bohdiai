/**
 * Business card — what the page paints, read fresh on every render: the business
 * name, the owner's About you, and their gallery in order. Read with the service
 * role (the storefront has no signed-in owner).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { profileFormFromRow, type ProfileForm } from '@/lib/backend/profile/profile-form';
import { PROFILE_COLUMNS } from '@/lib/backend/profile/queries';
import { listGallery } from '@/lib/backend/gallery/queries';
import { GALLERY_LIMIT, type GalleryItem } from '@/lib/backend/gallery/gallery-form';

export type CardData = { name: string; profile: ProfileForm; photos: GalleryItem[] };

export async function loadCardData(db: SupabaseClient<Database>, tenantId: string): Promise<CardData> {
  const [tenant, profile, photos] = await Promise.all([
    db.from('tenants').select('business_name').eq('id', tenantId).maybeSingle(),
    db.from('site_profiles').select(PROFILE_COLUMNS).eq('tenant_id', tenantId).maybeSingle(),
    listGallery(db, tenantId),
  ]);
  if (tenant.error !== null) throw new Error(`Could not load the site: ${tenant.error.message}`);
  if (tenant.data === null) throw new Error('Could not load the site: no such tenant');
  if (profile.error !== null) throw new Error(`Could not load About you: ${profile.error.message}`);
  return { name: tenant.data.business_name, profile: profileFormFromRow(profile.data), photos: photos.slice(0, GALLERY_LIMIT) };
}

/** The two or three letters in the maker's stamp: first letters of the name's words. */
export function initials(name: string): string {
  const letters = name
    .split(/[\s&+\-–—]+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, '').charAt(0))
    .filter((c) => c !== '');
  return (letters.length === 0 ? name.charAt(0) : letters.slice(0, 3).join('')).toUpperCase();
}

/** The ring of words around the stamp, kept short enough to fit once around. */
export function ringText(name: string, kicker: string): string {
  const full = kicker === '' ? `${name} · ${name} · ` : `${name} · ${kicker} · `;
  return full.length > 34 ? `${name.slice(0, 30)} · ` : full;
}

export function bioParagraphs(bio: string): string[] {
  return bio.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p !== '');
}

/** The marquee's words, from the owner's own data: their tag line, then their
 *  photo captions, each once, in order. Nothing hardcoded. */
export function marqueeWords(kicker: string, captions: readonly string[]): string[] {
  const seen = new Set<string>();
  const words: string[] = [];
  for (const raw of [kicker, ...captions]) {
    const w = raw.trim();
    const key = w.toLowerCase();
    if (w === '' || seen.has(key)) continue;
    seen.add(key);
    words.push(w);
  }
  return words;
}
