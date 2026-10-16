'use server';

/**
 * Publish: the owner puts their private site live. Re-checks the acting site on the
 * server and writes through the person's own client, so RLS applies. Only a draft
 * goes live; a site that's already live stays as it is. Taking a site private
 * again isn't offered yet (Alex).
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';

export async function publishSite(): Promise<DoneResult> {
  const { site } = await requireActingSite();
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from('tenants').update({ status: 'active' }).eq('id', site.tenantId).eq('status', 'draft').select('id');
  if (error !== null) {
    if (error.code === '42501') return { ok: false, error: 'You don’t have access to publish this site.' };
    logger.error('publish: failed', { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: 'Your site couldn’t be published. Try again in a moment.' };
  }
  if ((data ?? []).length === 0) {
    // Nothing changed: it was live already, or RLS hid the row. Say which.
    const { data: now } = await db.from('tenants').select('status').eq('id', site.tenantId).maybeSingle();
    if (now?.status !== 'active') return { ok: false, error: 'Your site couldn’t be published. Try again in a moment.' };
  }
  revalidatePath('/manage');
  return { ok: true };
}
