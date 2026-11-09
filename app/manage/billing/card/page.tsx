import { notFound, redirect } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/billing/stripe';
import { currentSubscription } from '@/lib/billing/maker-subscription';
import { finishCardPage } from '@/lib/billing/card';

export const dynamic = 'force-dynamic';

/** Back from Stripe's card page: the new card becomes the one Stripe charges, then Billing says so. */
export default async function CardDonePage({ searchParams }: PageProps<'/manage/billing/card'>): Promise<never> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('plan')) notFound();
  const raw = (await searchParams)['session'];
  const session = Array.isArray(raw) ? raw[0] : raw;
  let outcome: 'updated' | 'not-updated' = 'not-updated';
  if (session !== undefined && session !== '') {
    try {
      const sub = await currentSubscription(supabaseAdmin(), site.tenantId);
      if (sub !== null && (await finishCardPage(stripe(), session, site.tenantId, sub.stripeId)).ok) outcome = 'updated';
    } catch (err) {
      logger.error('billing: card not saved', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    }
  }
  redirect(`/manage/billing?card=${outcome}`);
}
