'use server';

/**
 * Square from the backend: pick the location card sales go to, disconnect, and
 * start a card sale in the market app. Each re-checks the acting site and its
 * market shop. The keys never leave the server; a screen only learns the business
 * and location names.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { squareConfig } from '@/lib/square/config';
import { cancelKeys, openLocations, type SquareLocation } from '@/lib/square/api';
import { dropConnection, liveKey, setLocation } from '@/lib/square/connection';
import { cardReturnUrl } from '@/lib/square/flow';
import { CARD_SALE_MINUTES, CARD_SALE_PURPOSE, squareHandOff, type CardSaleLine, type CardSaleNote, type SquareHandOff } from '@/lib/square/pos';
import { signNote } from '@/lib/square/vault';
import { tablePrice } from '../markets/table-price';
import type { DoneResult } from '../catalog/results';

const NOT_SET_UP = 'Card payments aren’t set up on BohdiAI yet.';
const NOT_CONNECTED = 'Connect your Square on Getting paid first.';

async function marketSite(): Promise<{ tenantId: string; subdomain: string; businessName: string } | null> {
  const { site } = await requireActingSite();
  return (await getSiteFeatures(site.tenantId)).has('market_shop') ? site : null;
}

/** The business's locations, so the maker can pick where card sales go. */
export async function squareLocations(): Promise<{ ok: true; locations: SquareLocation[] } | { ok: false; error: string }> {
  const site = await marketSite();
  if (site === null) return { ok: false, error: 'The market shop isn’t switched on for this site.' };
  const config = squareConfig();
  if (config === null) return { ok: false, error: NOT_SET_UP };
  try {
    const key = await liveKey(supabaseAdmin(), config, site.tenantId);
    if (key === null) return { ok: false, error: NOT_CONNECTED };
    return { ok: true, locations: await openLocations(config, key.token) };
  } catch (err) {
    logger.error('square: locations failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'Square didn’t answer. Try again in a moment.' };
  }
}

export async function chooseSquareLocation(locationId: string): Promise<DoneResult> {
  const r = await squareLocations();
  if (!r.ok) return r;
  const location = r.locations.find((l) => l.id === locationId);
  if (location === undefined) return { ok: false, error: 'That location isn’t open in your Square.' };
  const site = await marketSite();
  if (site === null) return { ok: false, error: 'The market shop isn’t switched on for this site.' };
  try {
    await setLocation(supabaseAdmin(), site.tenantId, location);
  } catch (err) {
    logger.error('square: location save failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'The location couldn’t be saved. Try again in a moment.' };
  }
  revalidatePath('/manage/payments');
  return { ok: true };
}

/** Disconnect: Square cancels every key BohdiAI holds for the business, then our copy
 *  is erased. If Square can't be reached, nothing is erased, so the maker can try
 *  again rather than be left thinking a live key was cancelled. */
export async function disconnectSquare(): Promise<DoneResult> {
  const site = await marketSite();
  if (site === null) return { ok: false, error: 'The market shop isn’t switched on for this site.' };
  const config = squareConfig();
  if (config === null) return { ok: false, error: NOT_SET_UP };
  const admin = supabaseAdmin();
  const { data, error } = await admin.from('square_connections').select('merchant_id').eq('tenant_id', site.tenantId).maybeSingle();
  if (error !== null) {
    logger.error('square: disconnect read failed', { tenantId: site.tenantId, error: error.message });
    return { ok: false, error: 'Your Square couldn’t be disconnected. Try again in a moment.' };
  }
  if (data === null) return { ok: true };
  try {
    await cancelKeys(config, data.merchant_id);
    await dropConnection(admin, site.tenantId);
  } catch (err) {
    logger.error('square: disconnect failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'Square didn’t answer, so your Square is still connected. Try again in a moment.' };
  }
  revalidatePath('/manage/payments');
  return { ok: true };
}

/** Start a card sale: work out the total on the server (the same prices the sale is
 *  recorded at) and hand back the links that open the Square app with it. */
export async function startCardSale(eventId: string, lines: readonly CardSaleLine[]): Promise<{ ok: true; handOff: SquareHandOff } | { ok: false; error: string }> {
  const site = await marketSite();
  if (site === null) return { ok: false, error: 'The market shop isn’t switched on for this site.' };
  if (lines.length === 0) return { ok: false, error: 'Tap the pieces they’re taking first.' };
  if (lines.length > 50 || lines.some((l) => !Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 99)) return { ok: false, error: 'Pick how many, from 1 to 99.' };
  const config = squareConfig();
  if (config === null) return { ok: false, error: NOT_SET_UP };
  const { data: link, error } = await supabaseAdmin().from('square_connections').select('location_id').eq('tenant_id', site.tenantId).maybeSingle();
  if (error !== null) return { ok: false, error: 'Something went wrong. Try again in a moment.' };
  if (link === null) return { ok: false, error: NOT_CONNECTED };
  if (link.location_id === null) return { ok: false, error: 'Pick which Square location card sales go to, on Getting paid.' };

  const db = await createSupabaseServerClient();
  const { data: market } = await db.from('events').select('name').eq('id', eventId).eq('tenant_id', site.tenantId).maybeSingle();
  if (market === null) return { ok: false, error: 'That market isn’t on your site any more.' };
  let totalCents = 0;
  for (const line of lines) {
    const price = await tablePrice(db, site.tenantId, line.listingId, line.variantId);
    if ('error' in price) return { ok: false, error: price.error };
    totalCents += price.cents * line.quantity;
  }
  if (totalCents < 100) return { ok: false, error: 'Square takes cards for $1.00 or more.' };

  const note: CardSaleNote = {
    tenantId: site.tenantId,
    eventId,
    nonce: crypto.randomUUID(),
    lines: lines.map((l) => ({ listingId: l.listingId, variantId: l.variantId, quantity: l.quantity })),
    totalCents,
    expires: Date.now() + CARD_SALE_MINUTES * 60 * 1000,
  };
  const siteUrl = serverEnv().SITE_URL;
  const back = `/manage/markets/${eventId}/day`;
  return {
    ok: true,
    handOff: squareHandOff({
      applicationId: config.applicationId,
      callbackUrl: cardReturnUrl(siteUrl),
      totalCents,
      note: `${site.businessName} · ${market.name}`.slice(0, 500),
      locationId: link.location_id,
      state: await signNote(CARD_SALE_PURPOSE, note, config.tokenKey),
      fallbackUrl: `${new URL(cardReturnUrl(siteUrl)).origin}${back}?card=no-app`,
    }),
  };
}
