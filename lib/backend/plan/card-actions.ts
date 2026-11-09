'use server';

/**
 * Update my card (Alex, Session 121): sends the maker to Stripe's own page to put a
 * new card on. The card is typed on Stripe's page, never ours.
 */
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { headersOrigin } from '@/lib/backend/request-origin';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/billing/stripe';
import { currentSubscription } from '@/lib/billing/maker-subscription';
import { startCardPage } from '@/lib/billing/card';

export type CardPageResult = { ok: false; error: string };

export async function updateCard(): Promise<CardPageResult> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) return { ok: false, error: 'This site isn’t on a plan yet.' };
  let url: string;
  try {
    const sub = await currentSubscription(supabaseAdmin(), site.tenantId);
    if (sub === null) return { ok: false, error: 'This site isn’t billed by card. Nothing to update.' };
    const origin = headersOrigin(await headers());
    url = await startCardPage(stripe(), {
      customerId: sub.customerId,
      tenantId: site.tenantId,
      doneUrl: `${origin}/manage/billing/card?session={CHECKOUT_SESSION_ID}`,
      backUrl: `${origin}/manage/billing`,
    });
  } catch (err) {
    logger.error('billing: card page failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'Stripe’s card page couldn’t be opened. Try again in a moment.' };
  }
  redirect(url as Route);
}
