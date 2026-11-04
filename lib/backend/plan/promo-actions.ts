'use server';

/**
 * A maker enters a promo code on Your plan (Alex, 2026-11-04). The code is held for
 * them before Stripe is told, so two tries at once can't both get it; if Stripe
 * fails it's let go, so they haven't used it up.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { allowKey, ACTION_LIMITED, ACTION_UNAVAILABLE } from '@/lib/backend/action-limit';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/billing/stripe';
import { currentSubscription } from '@/lib/billing/maker-subscription';
import { applyDiscount, checkPromo, claimPromo, discountLabel, discountRunning, normalizeCode, releasePromo, type PromoRefusal } from '@/lib/billing/promos';

export type RedeemResult = { ok: true; message: string } | { ok: false; error: string };

const REFUSALS: Record<PromoRefusal, string> = {
  unknown: 'That code isn’t valid. Check it and try again.',
  used: 'You’ve already used that code.',
  newOnly: 'That code is for new sign-ups.',
};
const FAILED = 'Your code couldn’t be used just now, and it hasn’t been used up. Try again in a moment.';

export async function redeemPromo(raw: unknown): Promise<RedeemResult> {
  const { user, site } = await requireActingSite();
  const code = normalizeCode(typeof raw === 'string' ? raw : '');
  if (code === '') return { ok: false, error: 'Enter your code.' };
  const allowance = await allowKey(`promo:${site.tenantId}`);
  if (allowance !== 'allowed') return { ok: false, error: allowance === 'limited' ? ACTION_LIMITED : ACTION_UNAVAILABLE };

  const db = supabaseAdmin();
  const email = (user.email ?? '').toLowerCase();
  let held = false;
  try {
    const s = stripe();
    const sub = await currentSubscription(db, site.tenantId);
    if (sub === null || sub.unitCents === 0) return { ok: false, error: 'Promo codes are for paid plans.' };
    const now = new Date();
    if (discountRunning(sub, now)) return { ok: false, error: `You already have a discount running (${sub.discountLabel ?? ''}). You can use another code once it ends.` };
    const check = await checkPromo(s, db, { code, email, tenantId: site.tenantId, isNew: false });
    if (!check.ok) return { ok: false, error: REFUSALS[check.why] };
    held = await claimPromo(db, code, site.tenantId, email);
    if (!held) return { ok: false, error: REFUSALS.used };
    await applyDiscount(s, db, sub, check.promo, now, code);
    revalidatePath('/manage/plan');
    return { ok: true, message: `Done: ${discountLabel(check.promo)}.` };
  } catch (err) {
    logger.error('promo code failed', { tenantId: site.tenantId, code, error: err instanceof Error ? err.message : String(err) });
    if (held) await releasePromo(db, code, site.tenantId).catch((e: unknown) => logger.error('promo code not released', { code, error: e instanceof Error ? e.message : String(e) }));
    return { ok: false, error: FAILED };
  }
}
