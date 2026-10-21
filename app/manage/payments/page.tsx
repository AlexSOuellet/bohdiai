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

export const dynamic = 'force-dynamic';

/** What happened on the way back from Square's page, in words. */
const SQUARE_OUTCOME: Record<string, { tone: 'ok' | 'error'; text: string }> = {
  connected: { tone: 'ok', text: 'Your Square is connected.' },
  declined: { tone: 'error', text: 'Square wasn’t connected: you chose not to allow it on Square’s page.' },
  expired: { tone: 'error', text: 'That Connect took too long or was started somewhere else. Press Connect Square again.' },
  failed: { tone: 'error', text: 'Square didn’t finish connecting. Press Connect Square to try again.' },
  'not-set-up': { tone: 'error', text: 'Card payments aren’t set up on BohdiAI yet.' },
};

export default async function PaymentsPage({ searchParams }: PageProps<'/manage/payments'>): Promise<React.ReactElement> {
  const { site } = await requireActingSite();
  if (!(await getSiteFeatures(site.tenantId)).has('market_shop')) notFound();
  const [pay, link] = await Promise.all([loadPaySettings(await createSupabaseServerClient(), site.tenantId), squareLink(supabaseAdmin(), site.tenantId)]);
  const outcome = (await searchParams)['square'];
  return (
    <PayManager initial={pay}>
      <SquarePanel
        link={link}
        ready={squareConfig() !== null}
        outcome={typeof outcome === 'string' ? (SQUARE_OUTCOME[outcome] ?? null) : null}
      />
    </PayManager>
  );
}
