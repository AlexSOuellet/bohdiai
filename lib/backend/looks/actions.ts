'use server';

/**
 * Keep a look from Try on a look (Full). Re-checks the acting site and its try-on
 * switch on the server, and that the mood is one the site can wear.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { canWear, currentLook, keepLook, lookFor } from './looks';

export async function keepThisLook(mood: string): Promise<DoneResult> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('try_on')) return { ok: false, error: 'Trying on looks isn’t part of your plan.' };
  const look = lookFor(mood);
  if (look === null) return { ok: false, error: 'That isn’t one of the looks.' };
  const admin = supabaseAdmin();
  try {
    const current = await currentLook(admin, site.tenantId);
    if (current === null) return { ok: false, error: 'Your site’s design can’t change looks.' };
    if (!canWear(look, current)) return { ok: false, error: 'Scenic shows your own photo behind the page, and your site doesn’t have one yet. Contact support to add one.' };
    await keepLook(admin, site.tenantId, look.mood, look.skin);
  } catch (err) {
    logger.error('looks: keep failed', { tenantId: site.tenantId, mood, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'The look couldn’t be kept. Try again in a moment.' };
  }
  revalidatePath('/manage/looks');
  return { ok: true };
}
