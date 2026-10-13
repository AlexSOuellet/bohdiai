'use server';

/**
 * About you — save (card site spec). Re-checks the acting site and its `profile`
 * switch on the server, re-validates, and writes through the person's own client
 * so RLS applies.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { storeSitePhoto } from '@/lib/backend/site-photo';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { buildProfileRow, type ProfileForm } from './profile-form';

export async function saveProfile(form: ProfileForm): Promise<DoneResult> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('profile')) return { ok: false, error: 'About you isn’t switched on for this site.' };
  const built = buildProfileRow(form);
  if (!built.ok) return built;

  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_profiles').upsert({ tenant_id: site.tenantId, ...built.row });
  if (error !== null) {
    if (error.code === '42501') return { ok: false, error: 'You don’t have access to change this site.' };
    logger.error('profile: save failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: 'Your changes couldn’t be saved. Try again in a moment.' };
  }
  revalidatePath('/manage/profile');
  revalidatePath('/manage');
  return { ok: true };
}

export type PortraitResult = { ok: true; url: string } | { ok: false; error: string };

/** The maker's portrait: stored as an upload and linked from About you. The old
 *  upload is kept (old photos stay reusable); only the link moves. */
export async function uploadPortrait(formData: FormData): Promise<PortraitResult> {
  const { user, site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('profile')) return { ok: false, error: 'About you isn’t switched on for this site.' };
  const stored = await storeSitePhoto({ tenantId: site.tenantId, userId: user.id, folder: 'portrait', file: formData.get('file') });
  if (!stored.ok) return stored;
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_profiles').upsert({ tenant_id: site.tenantId, portrait_upload_id: stored.uploadId });
  if (error !== null) {
    logger.error('profile: portrait link failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: 'The photo was uploaded but couldn’t be set as your portrait. Try again.' };
  }
  revalidatePath('/manage/profile');
  return { ok: true, url: stored.url };
}

export async function removePortrait(): Promise<DoneResult> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('profile')) return { ok: false, error: 'About you isn’t switched on for this site.' };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_profiles').update({ portrait_upload_id: null }).eq('tenant_id', site.tenantId);
  if (error !== null) {
    logger.error('profile: portrait remove failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: 'The portrait couldn’t be removed. Try again in a moment.' };
  }
  revalidatePath('/manage/profile');
  return { ok: true };
}
