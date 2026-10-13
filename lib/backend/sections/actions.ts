'use server';
/**
 * Section words — save one section's words (Modular Plan step 2). Every site has
 * sections, so there is no switch. Re-checks the acting site on the server,
 * re-validates, and writes through the person's own client so RLS applies.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { buildSectionRow, isSectionKey, type SectionWords } from './sections-form';

export async function saveSection(section: string, form: SectionWords): Promise<DoneResult> {
  const { site } = await requireActingSite();
  if (!isSectionKey(section)) return { ok: false, error: 'That section isn’t one this site has.' };
  const built = buildSectionRow(form);
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_sections').upsert({ tenant_id: site.tenantId, section, ...built.row });
  if (error !== null) {
    if (error.code === '42501') return { ok: false, error: 'You don’t have access to change this site.' };
    logger.error('sections: save failed', { tenantId: site.tenantId, section, code: error.code, error: error.message });
    return { ok: false, error: 'Your changes couldn’t be saved. Try again in a moment.' };
  }
  revalidatePath('/manage/sections');
  revalidatePath('/manage');
  return { ok: true };
}
