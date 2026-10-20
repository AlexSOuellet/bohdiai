'use server';

/**
 * Testimonials — add or change, remove, put in order (Full). Each action re-checks
 * the acting site and its `testimonials` switch on the server and writes through the
 * owner's own client so RLS applies.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { DoneResult } from '../catalog/results';
import { TESTIMONIALS_LIMIT, TESTIMONIALS_SHOWN_MAX, buildTestimonialRow, checkOrder, testimonialFromRow, type Testimonial, type TestimonialForm } from './testimonial-form';

const OFF = 'Testimonials aren’t switched on for this site.';
const FAILED = 'That didn’t save. Try again in a moment.';

export type TestimonialResult = { ok: true; item: Testimonial } | { ok: false; error: string };

async function site(): Promise<string | null> {
  const { site: s } = await requireActingSite();
  return (await getSiteFeatures(s.tenantId)).has('testimonials') ? s.tenantId : null;
}

function done(): void {
  revalidatePath('/manage/testimonials');
}

export async function saveTestimonial(form: TestimonialForm): Promise<TestimonialResult> {
  const tenantId = await site();
  if (tenantId === null) return { ok: false, error: OFF };
  const built = buildTestimonialRow(form);
  if (!built.ok) return built;
  const db = await createSupabaseServerClient();
  if (form.id !== null) {
    const { data, error } = await db.from('site_testimonials').update(built.row).eq('id', form.id).eq('tenant_id', tenantId).select('id, quote, name, detail, shown').maybeSingle();
    if (error !== null || data === null) {
      logger.error('testimonials: update failed', { tenantId, error: error?.message ?? 'not found' });
      return { ok: false, error: data === null && error === null ? 'That testimonial no longer exists. Reload the page.' : FAILED };
    }
    done();
    return { ok: true, item: testimonialFromRow(data) };
  }
  const { data: rows, error: countErr } = await db.from('site_testimonials').select('position').eq('tenant_id', tenantId);
  if (countErr !== null) {
    logger.error('testimonials: count failed', { tenantId, error: countErr.message });
    return { ok: false, error: FAILED };
  }
  if ((rows ?? []).length >= TESTIMONIALS_LIMIT) return { ok: false, error: `You can keep up to ${TESTIMONIALS_LIMIT}. Remove one to add another.` };
  const position = Math.max(-1, ...(rows ?? []).map((r) => r.position)) + 1;
  const { data, error } = await db.from('site_testimonials').insert({ tenant_id: tenantId, position, ...built.row }).select('id, quote, name, detail, shown').single();
  if (error !== null || data === null) {
    logger.error('testimonials: add failed', { tenantId, error: error?.message });
    return { ok: false, error: FAILED };
  }
  done();
  return { ok: true, item: testimonialFromRow(data) };
}

/** Tick (or untick) one to show on the site (Market): up to three ticked at once. */
export async function showTestimonial(id: string, shown: boolean): Promise<DoneResult> {
  const tenantId = await site();
  if (tenantId === null) return { ok: false, error: OFF };
  const db = await createSupabaseServerClient();
  if (shown) {
    const { data, error } = await db.from('site_testimonials').select('id').eq('tenant_id', tenantId).eq('shown', true);
    if (error !== null) return { ok: false, error: FAILED };
    if ((data ?? []).filter((r) => r.id !== id).length >= TESTIMONIALS_SHOWN_MAX)
      return { ok: false, error: `Your site shows up to ${TESTIMONIALS_SHOWN_MAX}. Untick one to show this one.` };
  }
  const { error } = await db.from('site_testimonials').update({ shown }).eq('id', id).eq('tenant_id', tenantId);
  if (error !== null) {
    logger.error('testimonials: show failed', { tenantId, error: error.message });
    return { ok: false, error: FAILED };
  }
  done();
  return { ok: true };
}

export async function removeTestimonial(id: string): Promise<DoneResult> {
  const tenantId = await site();
  if (tenantId === null) return { ok: false, error: OFF };
  const db = await createSupabaseServerClient();
  const { error } = await db.from('site_testimonials').delete().eq('id', id).eq('tenant_id', tenantId);
  if (error !== null) {
    logger.error('testimonials: remove failed', { tenantId, error: error.message });
    return { ok: false, error: 'That didn’t remove. Try again in a moment.' };
  }
  done();
  return { ok: true };
}

export async function orderTestimonials(ids: string[]): Promise<DoneResult> {
  const tenantId = await site();
  if (tenantId === null) return { ok: false, error: OFF };
  const db = await createSupabaseServerClient();
  const { data, error } = await db.from('site_testimonials').select('id').eq('tenant_id', tenantId);
  if (error !== null) return { ok: false, error: FAILED };
  if (!checkOrder(ids, (data ?? []).map((r) => r.id))) return { ok: false, error: 'Your list changed. Reload the page and try again.' };
  for (const [position, id] of ids.entries()) {
    const { error: uErr } = await db.from('site_testimonials').update({ position }).eq('id', id).eq('tenant_id', tenantId);
    if (uErr !== null) {
      logger.error('testimonials: order failed', { tenantId, error: uErr.message });
      return { ok: false, error: 'The new order didn’t all save. Reload the page and try again.' };
    }
  }
  done();
  return { ok: true };
}
