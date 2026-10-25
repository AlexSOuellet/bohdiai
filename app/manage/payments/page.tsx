import { notFound } from 'next/navigation';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { loadPaySettings } from '@/lib/market/queries';
import { squareConfig } from '@/lib/square/config';
import { squareLink } from '@/lib/square/connection';
import { PayManager } from './PayManager';
import { SquarePanel } from './SquarePanel';
import { PayPalPanel } from './PayPalPanel';
import { StripePanel } from './StripePanel';
import { paypalConfig } from '@/lib/paypal/config';
import { paypalLink } from '@/lib/paypal/connection';

export const dynamic = 'force-dynamic';

/** What happened on the way back from Square's page, in words. */
const SQUARE_OUTCOME: Record<string, { tone: 'ok' | 'error'; text: string }> = {
  connected: { tone: 'ok', text: 'Your Square is connected.' },
  declined: { tone: 'error', text: 'Square wasn’t connected: you chose not to allow it on Square’s page.' },
  expired: { tone: 'error', text: 'That Connect took too long or was started somewhere else. Press Connect Square again.' },
  failed: { tone: 'error', text: 'Square didn’t finish connecting. Press Connect Square to try again.' },
  'not-set-up': { tone: 'error', text: 'Card payments aren’t set up on BohdiAI yet.' },
};

/** What happened on the way back from PayPal's page, in words. */
const PAYPAL_OUTCOME: Record<string, { tone: 'ok' | 'error'; text: string }> = {
  connected: { tone: 'ok', text: 'Your PayPal is connected. Your checkout takes PayPal and cards now.' },
  'not-ready': { tone: 'error', text: 'Your PayPal is connected, but PayPal says it can’t take payments yet. See below.' },
  declined: { tone: 'error', text: 'PayPal wasn’t connected: BohdiAI wasn’t given permission to take payments on PayPal’s page.' },
  unfinished: { tone: 'error', text: 'PayPal’s sign-up wasn’t finished. Press Connect PayPal to pick up where you left off.' },
  expired: { tone: 'error', text: 'That Connect took too long or was started somewhere else. Press Connect PayPal again.' },
  failed: { tone: 'error', text: 'PayPal didn’t finish connecting. Press Connect PayPal to try again.' },
  'not-set-up': { tone: 'error', text: 'PayPal isn’t set up on BohdiAI yet.' },
};

/** What happened when Connect Stripe was pressed, in words. */
const STRIPE_OUTCOME: Record<string, { tone: 'ok' | 'error'; text: string }> = {
  'not-set-up': { tone: 'error', text: 'Stripe isn’t set up on BohdiAI yet, so it can’t be connected yet.' },
};

export default async function PaymentsPage({ searchParams }: PageProps<'/manage/payments'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  const on = await getSiteFeatures(site.tenantId);
  if (!on.has('market_shop')) notFound();
  const online = on.has('cart');
  const [pay, link, paypal] = await Promise.all([
    loadPaySettings(await createSupabaseServerClient(), site.tenantId),
    squareLink(supabaseAdmin(), site.tenantId),
    online ? paypalLink(supabaseAdmin(), site.tenantId) : Promise.resolve(null),
  ]);
  const params = await searchParams;
  const outcome = params['square'];
  const paypalOutcome = params['paypal'];
  const stripeOutcome = params['stripe'];
  const paypalSettings = paypalConfig();
  return (
    <PayManager initial={pay}>
      <SquarePanel
        link={link}
        ready={squareConfig() !== null}
        outcome={typeof outcome === 'string' ? (SQUARE_OUTCOME[outcome] ?? null) : null}
      />
      {online && <StripePanel outcome={typeof stripeOutcome === 'string' ? (STRIPE_OUTCOME[stripeOutcome] ?? null) : null} />}
      {online && (
        <PayPalPanel
          link={paypal}
          ready={paypalSettings !== null}
          testing={paypalSettings?.sandbox === true}
          outcome={typeof paypalOutcome === 'string' ? (PAYPAL_OUTCOME[paypalOutcome] ?? null) : null}
        />
      )}
    </PayManager>
  );
}
