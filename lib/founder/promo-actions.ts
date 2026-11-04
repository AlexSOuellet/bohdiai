'use server';

/**
 * What Alex can do about money from the admin: make codes, give a maker a discount
 * directly, make a maker free. Every action checks it's Alex first, and Stripe goes
 * first, so the admin never says something Stripe isn't doing.
 */
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/billing/stripe';
import { currentSubscription } from '@/lib/billing/maker-subscription';
import { applyDiscount, clearDiscount, createPromo, endPromo, normalizeCode, PROMO_CODE_SHAPE, type Audience } from '@/lib/billing/promos';
import { requireFounder } from './access';

export type FormResult = { ok: boolean; message: string };

const MAX_MONTHS = 36;
const MAX_NOTE = 500;
const FAILED = 'That didn’t go through, so nothing changed. Try again, and if it keeps happening, check the Cloudflare logs.';

const field = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value.trim() : '';
};

/** A whole number from min to max; null when it isn't one. */
function whole(text: string, min: number, max: number): number | null {
  const n = Number(text);
  return /^\d+$/.test(text) && n >= min && n <= max ? n : null;
}

/** The discount the form describes: 'free months' or 'percent off', and for how long. */
function readDiscount(form: FormData): { percent: number; months: number | null } | string {
  const monthsText = field(form, 'months');
  const months = monthsText === '' ? null : whole(monthsText, 1, MAX_MONTHS);
  if (monthsText !== '' && months === null) return `Months has to be a whole number from 1 to ${MAX_MONTHS}.`;
  if (field(form, 'kind') === 'free') return months === null ? 'Say how many months free.' : { percent: 100, months };
  const percent = whole(field(form, 'percent'), 1, 99);
  return percent === null ? 'Percent has to be a whole number from 1 to 99.' : { percent, months };
}

function failed(what: string, err: unknown): FormResult {
  logger.error(`admin: ${what} failed`, { error: err instanceof Error ? err.message : String(err) });
  return { ok: false, message: FAILED };
}

export async function createPromoCode(_prev: FormResult | null, form: FormData): Promise<FormResult> {
  await requireFounder();
  const code = normalizeCode(field(form, 'code'));
  if (!PROMO_CODE_SHAPE.test(code)) return { ok: false, message: 'A code is 3 to 30 letters, numbers or dashes.' };
  const discount = readDiscount(form);
  if (typeof discount === 'string') return { ok: false, message: discount };
  const expiresText = field(form, 'expires');
  const expires = expiresText === '' ? null : new Date(`${expiresText}T23:59:59Z`);
  if (expires !== null && (Number.isNaN(expires.getTime()) || expires <= new Date())) return { ok: false, message: 'The last day has to be in the future.' };
  const usesText = field(form, 'maxUses');
  const maxUses = usesText === '' ? null : whole(usesText, 1, 100000);
  if (usesText !== '' && maxUses === null) return { ok: false, message: 'Total uses has to be a whole number.' };
  const audience: Audience = field(form, 'audience') === 'everyone' ? 'everyone' : 'new';
  try {
    await createPromo(stripe(), { code, ...discount, audience, expires: expires?.toISOString() ?? null, maxUses });
  } catch (err) {
    if (err !== null && typeof err === 'object' && 'code' in err && err.code === 'resource_already_exists') return { ok: false, message: `${code} already exists. Pick another code.` };
    return failed('create code', err);
  }
  revalidatePath('/founder/promotions');
  return { ok: true, message: `${code} is ready to use.` };
}

export async function endPromoCode(form: FormData): Promise<void> {
  await requireFounder();
  await endPromo(stripe(), field(form, 'code'));
  revalidatePath('/founder/promotions');
}

export async function giveDiscount(_prev: FormResult | null, form: FormData): Promise<FormResult> {
  await requireFounder();
  const discount = readDiscount(form);
  if (typeof discount === 'string') return { ok: false, message: discount };
  const tenantId = field(form, 'tenantId');
  try {
    const db = supabaseAdmin();
    const sub = await currentSubscription(db, tenantId);
    if (sub === null || sub.unitCents === 0) return { ok: false, message: 'This maker isn’t paying, so there’s nothing to discount.' };
    await applyDiscount(stripe(), db, sub, discount, new Date());
  } catch (err) {
    return failed('give discount', err);
  }
  revalidatePath('/founder', 'layout');
  return { ok: true, message: 'Discount given.' };
}

export async function removeDiscount(_prev: FormResult | null, form: FormData): Promise<FormResult> {
  await requireFounder();
  try {
    const db = supabaseAdmin();
    const sub = await currentSubscription(db, field(form, 'tenantId'));
    if (sub !== null) await clearDiscount(stripe(), db, sub);
  } catch (err) {
    return failed('remove discount', err);
  }
  revalidatePath('/founder', 'layout');
  return { ok: true, message: 'Discount removed. They pay the normal price from their next bill.' };
}

/** Free for good: Stripe stops charging (100% off), and the backend says Free for you. */
export async function makeFree(_prev: FormResult | null, form: FormData): Promise<FormResult> {
  await requireFounder();
  const tenantId = field(form, 'tenantId');
  const note = field(form, 'note').slice(0, MAX_NOTE);
  try {
    const db = supabaseAdmin();
    const sub = await currentSubscription(db, tenantId);
    if (sub !== null && sub.unitCents > 0) await applyDiscount(stripe(), db, sub, { percent: 100, months: null }, new Date());
    const { error } = await db.from('tenants').update({ plan_comp: 'free', plan_comp_note: note === '' ? null : note }).eq('id', tenantId);
    if (error !== null) throw new Error(error.message);
  } catch (err) {
    return failed('make free', err);
  }
  revalidatePath('/founder', 'layout');
  return { ok: true, message: 'This maker is free now.' };
}

export async function endFree(_prev: FormResult | null, form: FormData): Promise<FormResult> {
  await requireFounder();
  const tenantId = field(form, 'tenantId');
  try {
    const db = supabaseAdmin();
    const sub = await currentSubscription(db, tenantId);
    if (sub !== null) await clearDiscount(stripe(), db, sub);
    const { error } = await db.from('tenants').update({ plan_comp: null, plan_comp_note: null }).eq('id', tenantId);
    if (error !== null) throw new Error(error.message);
  } catch (err) {
    return failed('end free', err);
  }
  revalidatePath('/founder', 'layout');
  return { ok: true, message: 'Back to paying normally from their next bill.' };
}
