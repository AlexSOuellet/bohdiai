'use server';

/**
 * Writing a product's description (Alex, 2026-10-28), from the product screen or
 * the Describe it tool. Each written description counts against the site's month
 * (Free 30, paid plans 100); a run that fails isn't counted. The photo is read from
 * the site's own uploads, never from an address the page sends.
 */
import { requireActingSite } from '@/lib/backend/current-site';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import { parseDollars } from '@/lib/backend/catalog/product-form';
import { isFreeSite } from '@/lib/backend/plan/free';
import { DESCRIBE_LIMIT, FACTS_MAX, monthStart, resetsOn, writeDescription, type Description } from './describe';

export type DescribeAsk = { name: string; materials: string[]; facts: string; price: string; photoUploadId: string | null };
export type DescribeDone = { ok: true; text: Description; left: number } | { ok: false; error: string };

const FAILED = 'The description couldn’t be written just now. Try again in a moment.';
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isAsk(v: unknown): v is DescribeAsk {
  if (v === null || typeof v !== 'object') return false;
  const a = v as Record<string, unknown>;
  return (
    typeof a['name'] === 'string' &&
    Array.isArray(a['materials']) &&
    a['materials'].every((m) => typeof m === 'string') &&
    typeof a['facts'] === 'string' &&
    typeof a['price'] === 'string' &&
    (a['photoUploadId'] === null || (typeof a['photoUploadId'] === 'string' && ID.test(a['photoUploadId'])))
  );
}

export async function describePiece(ask: DescribeAsk): Promise<DescribeDone> {
  if (!isAsk(ask)) return { ok: false, error: 'Something about this didn’t look right. Reload the page and try again.' };
  if (ask.name.trim() === '') return { ok: false, error: 'Give the piece a name first.' };
  if (ask.facts.length > FACTS_MAX) return { ok: false, error: `Keep what you add to ${FACTS_MAX} characters or fewer.` };
  const { site } = await requireActingSite();
  const admin = supabaseAdmin();
  const now = new Date();
  try {
    const limit = (await isFreeSite(admin, site.tenantId)) ? DESCRIBE_LIMIT.free : DESCRIBE_LIMIT.paid;
    const runs = await admin.from('description_runs').select('id', { count: 'exact', head: true }).eq('tenant_id', site.tenantId).gte('created_at', monthStart(now));
    if (runs.error !== null) throw new Error(runs.error.message);
    const used = runs.count ?? 0;
    if (used >= limit) return { ok: false, error: `You’ve used this month’s ${limit} descriptions. More on ${resetsOn(now)}.` };

    let photoUrl: string | null = null;
    if (ask.photoUploadId !== null) {
      const photo = await admin.from('uploads').select('public_url').eq('id', ask.photoUploadId).eq('tenant_id', site.tenantId).maybeSingle();
      if (photo.error !== null) throw new Error(photo.error.message);
      photoUrl = photo.data?.public_url ?? null;
    }
    const price = parseDollars(ask.price);
    const done = await writeDescription(anthropicClient(), { name: ask.name, materials: ask.materials, facts: ask.facts, priceCents: price.ok ? price.cents : null, photoUrl });
    if (!done.ok) return done;
    const counted = await admin.from('description_runs').insert({ tenant_id: site.tenantId });
    if (counted.error !== null) logger.error('describe: run not counted', { tenantId: site.tenantId, error: counted.error.message });
    return { ok: true, text: done.text, left: Math.max(0, limit - used - 1) };
  } catch (err) {
    logger.error('describe: failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: FAILED };
  }
}
