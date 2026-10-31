import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/billing/stripe';
import { claim, letGo, recordCheckout, recordSubscription } from '@/lib/billing/record';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe's notices about makers' plans (Alex, Session 119). Only a notice signed
 * with our secret (STRIPE_WEBHOOK_SECRET) is read; anything else is turned away
 * before the database is touched. Each notice is acted on once (stripe_events);
 * a failure lets it go and answers 500, so Stripe sends it again.
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env['STRIPE_WEBHOOK_SECRET'];
  if (secret === undefined || secret === '') {
    logger.error('stripe webhook: STRIPE_WEBHOOK_SECRET is not set');
    return new Response('not set up', { status: 503 });
  }
  const signature = req.headers.get('stripe-signature');
  if (signature === null) return new Response('no signature', { status: 400 });

  const s = stripe();
  let event: Stripe.Event;
  try {
    event = await s.webhooks.constructEventAsync(await req.text(), signature, secret, undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    return new Response('bad signature', { status: 400 });
  }

  const db = supabaseAdmin();
  if (!(await claim(db, event.id, event.type))) return new Response('already done', { status: 200 });
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        if (event.data.object.mode === 'subscription') await recordCheckout(s, db, event.data.object.id);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await recordSubscription(db, event.data.object);
        break;
      default:
        break;
    }
    return new Response('ok', { status: 200 });
  } catch (err) {
    await letGo(db, event.id);
    logger.error('stripe webhook failed', { id: event.id, type: event.type, error: err instanceof Error ? err.message : String(err) });
    return new Response('failed', { status: 500 });
  }
}
