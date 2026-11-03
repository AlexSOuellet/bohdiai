'use server';

/**
 * Publish: the owner puts their private site live. Re-checks the acting site on the
 * server and writes through the person's own client, so RLS applies. Only a draft
 * goes live; a site that's already live stays as it is. A live site can be taken
 * offline and put back (Alex, Session 119): visitors see it's temporarily offline.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';

type Move = { from: 'draft' | 'active' | 'offline'; to: 'active' | 'offline'; failed: string; denied: string; what: string };

/** Moves the acting site from one status to the next; already there counts as done. */
async function move(m: Move): Promise<DoneResult> {
  const { site } = await requireActingSite();
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from('tenants').update({ status: m.to }).eq('id', site.tenantId).eq('status', m.from).select('id');
  if (error !== null) {
    if (error.code === '42501') return { ok: false, error: m.denied };
    logger.error(`${m.what}: failed`, { tenantId: site.tenantId, code: error.code, error: error.message });
    return { ok: false, error: m.failed };
  }
  if ((data ?? []).length === 0) {
    // Nothing changed: it was there already, or RLS hid the row. Say which.
    const { data: now } = await db.from('tenants').select('status').eq('id', site.tenantId).maybeSingle();
    if (now?.status !== m.to) return { ok: false, error: m.failed };
  }
  revalidatePath('/manage', 'layout');
  return { ok: true };
}

export async function publishSite(): Promise<DoneResult> {
  return move({ from: 'draft', to: 'active', what: 'publish', denied: 'You don’t have access to publish this site.', failed: 'Your site couldn’t be published. Try again in a moment.' });
}

/** Takes a live site offline: visitors see it's temporarily offline; nothing on it changes. */
export async function takeSiteOffline(): Promise<DoneResult> {
  return move({ from: 'active', to: 'offline', what: 'take offline', denied: 'You don’t have access to take this site offline.', failed: 'Your site couldn’t be taken offline. Try again in a moment.' });
}

/** Puts an offline site back, exactly as it was. */
export async function putSiteOnline(): Promise<DoneResult> {
  return move({ from: 'offline', to: 'active', what: 'put online', denied: 'You don’t have access to put this site back online.', failed: 'Your site couldn’t be put back online. Try again in a moment.' });
}
