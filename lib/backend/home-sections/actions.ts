'use server';

/**
 * Home page section switches (Alex, 2026-10-27): turn one section of her home page
 * on or off from My site. Re-checks on the server that the section is one her
 * design and plan show, and writes through the owner's own client so RLS applies.
 * The gallery keeps its own rule (it can't be turned on while it's empty).
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import { familyMood, homeSectionsFor, isHomeSection } from '@/lib/storefront/home-sections';
import { setGalleryShown } from '../gallery/actions';
import type { DoneResult } from '../catalog/results';

const NOT_HERE = 'That section isn’t on your home page.';

export async function setHomeSection(section: string, on: boolean): Promise<DoneResult> {
  if (!isHomeSection(section) || typeof on !== 'boolean') return { ok: false, error: NOT_HERE };
  const { site } = await requireActingSite();
  const db = await createSupabaseServerClient();
  const [features, mood] = await Promise.all([getSiteFeatures(site.tenantId), familyMood(db, site.tenantId)]);
  if (!homeSectionsFor(mood, features).includes(section)) return { ok: false, error: NOT_HERE };
  if (section === 'gallery') {
    const r = await setGalleryShown(on);
    if (r.ok) revalidatePath('/manage/site');
    return r;
  }
  const { error } = await db.from('site_added_sections').upsert({ tenant_id: site.tenantId, section, enabled: on });
  if (error !== null) {
    logger.error('home sections: switch failed', { tenantId: site.tenantId, section, error: error.message });
    return { ok: false, error: 'That change couldn’t be saved. Try again in a moment.' };
  }
  revalidatePath('/manage/site');
  return { ok: true };
}
