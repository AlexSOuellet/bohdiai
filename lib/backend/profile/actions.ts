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
