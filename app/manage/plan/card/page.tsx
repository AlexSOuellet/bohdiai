import { notFound, redirect } from 'next/navigation';
import type { Route } from 'next';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/billing/stripe';
import { currentSubscription } from '@/lib/billing/maker-subscription';
import { finishCardPage } from '@/lib/billing/card';
import { ONBOARDING_PATH } from '@/lib/signup/onboarding';
import { chargeAndStepUp, freeSite, movedUpError } from '@/lib/backend/plan/free-up';
import { sendPlanChange } from '@/lib/backend/plan/emails';
import { isBilling } from '@/lib/backend/plan/billing';
import { isSitePlan, planOf } from '@/lib/backend/plan/plan';

export const dynamic = 'force-dynamic';

/** Back from Stripe's card page while moving up from Free: the card goes on, Stripe
 *  charges the first period, the site steps up, and the site form opens. */
export default async function FreeCardDonePage({ searchParams }: PageProps<'/manage/plan/card'>): Promise<never> {
  const { user, site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) notFound();
  const raw = (await searchParams)['session'];
  const session = Array.isArray(raw) ? raw[0] : raw;
  let next = '/manage/plan?up=not-done';
  try {
    const db = supabaseAdmin();
    const sub = await currentSubscription(db, site.tenantId);
    if (session !== undefined && session !== '' && sub !== null && (await freeSite(db, site.tenantId)).free) {
      const s = stripe();
      const put = await finishCardPage(s, session, site.tenantId, sub.stripeId);
      if (put.ok && put.then !== null && isSitePlan(put.then.plan) && isBilling(put.then.billing)) {
        const to = put.then.plan;
        const r = await chargeAndStepUp(s, db, { tenantId: site.tenantId, stripeId: sub.stripeId, to, billing: put.then.billing });
        if (r.ok) {
          await sendPlanChange({ siteName: site.businessName, subdomain: site.subdomain, makerEmail: user.email ?? '', change: { kind: 'upgrade', to: planOf(to).name } });
          next = ONBOARDING_PATH;
        } else {
          next = `/manage/plan?up=${'declined' in r ? 'declined' : 'switching'}`;
          if (!('declined' in r)) logger.error('free upgrade: paid but not stepped up', { tenantId: site.tenantId, error: movedUpError(r) });
        }
      }
    }
  } catch (err) {
    logger.error('free upgrade: card return failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
  }
  redirect(next as Route);
}
