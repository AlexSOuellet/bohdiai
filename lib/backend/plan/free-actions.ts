'use server';

/**
 * Upgrade from Free (Alex, Session 121). The card is typed on Stripe's own page, never
 * ours. Once the site is on its paid plan the maker goes straight to the site form.
 */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { requireActingSite } from '@/lib/backend/current-site';
import { siteSuspended, SUSPENDED_NOTE } from '@/lib/founder/suspend';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { headersOrigin } from '@/lib/backend/request-origin';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/billing/stripe';
import { currentSubscription } from '@/lib/billing/maker-subscription';
import { startPayPage } from '@/lib/billing/pay-change';
import { ONBOARDING_PATH } from '@/lib/signup/onboarding';
import { isSitePlan, planOf } from './plan';
import { isBilling } from './billing';
import { freeSite, stepUp } from './free-up';
import { sendPlanChange } from './emails';

export type FreeUpResult = { ok: false; error: string };

const FAILED = 'Your plan couldn’t be changed. Try again in a moment.';

export async function upgradeFromFree(to: unknown, billing: unknown): Promise<FreeUpResult> {
  if (!isSitePlan(to) || !isBilling(billing))
    return { ok: false, error: 'That isn’t one of the plans.' };
  const { user, site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) return { ok: false, error: 'This site isn’t on a plan yet.' };
  const db = supabaseAdmin();
  let next: string;
  try {
    // Nothing is charged while Alex has the site suspended (its billing is paused).
    if (await siteSuspended(db, site.tenantId)) return { ok: false, error: SUSPENDED_NOTE };
    const facts = await freeSite(db, site.tenantId);
    if (!facts.free) return { ok: false, error: 'You’re already on a paid plan.' };
    const tell = (): Promise<void> =>
      sendPlanChange({
        siteName: site.businessName,
        subdomain: site.subdomain,
        makerEmail: user.email ?? '',
        change: { kind: 'upgrade', to: planOf(to).name },
      });
    if (facts.comp) {
      const r = await stepUp(db, site.tenantId, to, billing, null);
      if (!r.ok) return { ok: false, error: FAILED };
      await tell();
      next = ONBOARDING_PATH;
    } else {
      const sub = await currentSubscription(db, site.tenantId);
      if (sub === null)
        return { ok: false, error: 'This account’s plan is changed by Alex. Use Contact support.' };
      // Always paid on Stripe's own page, where the maker picks the card (Alex,
      // 2026-11-16); the move is made on the way back (/manage/plan/paid).
      const origin = headersOrigin(await headers());
      const page = await startPayPage(stripe(), {
        stripeId: sub.stripeId,
        customerId: sub.customerId,
        tenantId: site.tenantId,
        pay: { plan: to, billing, kind: 'free' },
        label: `BohdiAI ${planOf(to).name} plan, your first ${billing === 'yearly' ? 'year' : 'month'}`,
        doneUrl: `${origin}/manage/plan/paid?session={CHECKOUT_SESSION_ID}`,
        backUrl: `${origin}/manage/plan`,
      });
      if (page.kind === 'small') return { ok: false, error: FAILED };
      next = page.url;
    }
  } catch (err) {
    logger.error('free upgrade failed', {
      tenantId: site.tenantId,
      to,
      billing,
      error: err instanceof Error ? err.message : String(err),
    });
    return { ok: false, error: FAILED };
  }
  redirect(next as Route);
}
