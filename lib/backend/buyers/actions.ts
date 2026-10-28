'use server';

/**
 * Customer accounts (Full): the maker's own switch for customer accounts. Re-checks the acting
 * site and its buyer_accounts feature on the server and writes through the
 * owner's own client so RLS applies.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';

export async function setBuyerAccounts(on: boolean): Promise<DoneResult> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('buyer_accounts')) return { ok: false, error: 'Customer accounts come with the Full plan.' };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('tenants').update({ buyer_accounts_on: on }).eq('id', site.tenantId);
  if (error !== null) {
    logger.error('buyers: switch failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'That didn’t save. Try again in a moment.' };
  }
  // The backend menu shows Customers only while this is on.
  revalidatePath('/manage', 'layout');
  return { ok: true };
}
