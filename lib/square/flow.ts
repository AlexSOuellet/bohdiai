import 'server-only';
/**
 * The two round trips through Square, checked end to end on the server:
 *
 * Connect: the backend sends the maker to Square's page with a signed note naming
 * the site, the person and a one-time code also kept in a cookie on their browser.
 * Coming back, all three must match, so nobody can connect their Square to someone
 * else's site, or finish a Connect that someone else started.
 *
 * A card sale: the market app sends Square the total with a signed note of the
 * pieces. Coming back, the note must be untouched and for this site, and Square
 * itself must say the payment completed for exactly that total at the maker's
 * location, before the sale is recorded. Each Square sale is recorded once.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { appOrigin } from '@/lib/backend/app-url';
import type { SquareConfig } from './config';
import { businessName, findSale, openLocations, swapCode } from './api';
import { liveKey, saveConnection } from './connection';
import { CARD_SALE_PURPOSE, saleMatches, type CardSaleLine, type CardSaleNote } from './pos';
import { tablePrice } from '@/lib/backend/markets/table-price';
import { logger } from '@/lib/logger';
import { readNote } from './vault';

export const CONNECT_PURPOSE = 'square-connect';
export const CONNECT_COOKIE = 'bohdi_square_connect';
export const CONNECT_MINUTES = 15;

export type ConnectNote = { tenantId: string; userId: string; nonce: string; expires: number };

export function connectReturnUrl(siteUrl: string): string {
  return `${appOrigin(siteUrl)}/api/square/oauth`;
}

export function cardReturnUrl(siteUrl: string): string {
  return `${appOrigin(siteUrl)}/api/square/pos`;
}

function isConnectNote(v: unknown): v is ConnectNote {
  if (typeof v !== 'object' || v === null) return false;
  const n = v as Record<string, unknown>;
  return typeof n['tenantId'] === 'string' && typeof n['userId'] === 'string' && typeof n['nonce'] === 'string' && typeof n['expires'] === 'number';
}

/** The Connect note back, when it's untouched, unexpired, and matches this browser and person. */
export async function checkConnectNote(config: SquareConfig, state: string, cookieNonce: string | undefined, userId: string, now: number): Promise<ConnectNote | null> {
  const note = await readNote(CONNECT_PURPOSE, state, config.tokenKey);
  if (!isConnectNote(note)) return null;
  if (note.expires < now || note.userId !== userId || cookieNonce === undefined || cookieNonce !== note.nonce) return null;
  return note;
}

/** Swap Square's code for keys and keep them, with the business name and its
 *  location (the only one, or none yet when there are several to choose from). */
export async function finishConnect(db: SupabaseClient<Database>, config: SquareConfig, tenantId: string, code: string, fetcher: typeof fetch = fetch): Promise<void> {
  const keys = await swapCode(config, code, fetcher);
  const [name, locations] = await Promise.all([businessName(config, keys.accessToken, keys.merchantId, fetcher), openLocations(config, keys.accessToken, fetcher)]);
  await saveConnection(db, config, tenantId, keys, name, locations.length === 1 ? (locations[0] ?? null) : null);
}

function isCardNote(v: unknown): v is CardSaleNote {
  if (typeof v !== 'object' || v === null) return false;
  const n = v as Record<string, unknown>;
  return (
    typeof n['tenantId'] === 'string' &&
    typeof n['eventId'] === 'string' &&
    typeof n['nonce'] === 'string' &&
    typeof n['totalCents'] === 'number' &&
    typeof n['expires'] === 'number' &&
    Array.isArray(n['lines']) &&
    (n['lines'] as unknown[]).every((l) => {
      if (typeof l !== 'object' || l === null) return false;
      const x = l as Record<string, unknown>;
      return typeof x['listingId'] === 'string' && (x['variantId'] === null || typeof x['variantId'] === 'string') && Number.isInteger(x['quantity']);
    })
  );
}

/** The card sale's note back, when it's untouched and unexpired. It names the site:
 *  only the server can sign one, so it is the proof of whose sale this is. */
export async function readCardNote(config: SquareConfig, state: string, now: number): Promise<CardSaleNote | null> {
  const note = await readNote(CARD_SALE_PURPOSE, state, config.tokenKey);
  if (!isCardNote(note) || note.expires < now) return null;
  return note;
}

export type CardCheck = { ok: true; paymentIds: string[] } | { ok: false; reason: 'not-connected' | 'not-found' | 'mismatch' | 'already-recorded' };

/** Whether this hand-off to Square was already recorded (a return opened twice). */
export async function alreadyRecorded(admin: SupabaseClient<Database>, tenantId: string, saleNonce: string, orderId: string | null): Promise<boolean> {
  const byNonce = await admin.from('payments').select('id').eq('tenant_id', tenantId).eq('processor', 'square').eq('metadata->>sale_nonce', saleNonce).limit(1);
  if (byNonce.error !== null) throw new Error(`Could not check the payment: ${byNonce.error.message}`);
  if ((byNonce.data ?? []).length > 0) return true;
  if (orderId === null) return false;
  const byOrder = await admin.from('payments').select('id').eq('processor', 'square').eq('external_payment_id', orderId).limit(1);
  if (byOrder.error !== null) throw new Error(`Could not check the payment: ${byOrder.error.message}`);
  return (byOrder.data ?? []).length > 0;
}

/** Square's own word on a card sale, before anything is recorded. */
export async function confirmCardSale(
  admin: SupabaseClient<Database>,
  config: SquareConfig,
  tenantId: string,
  saleNonce: string,
  orderId: string,
  totalCents: number,
  fetcher: typeof fetch = fetch,
): Promise<CardCheck> {
  const key = await liveKey(admin, config, tenantId, new Date(), fetcher);
  if (key === null) return { ok: false, reason: 'not-connected' };
  if (await alreadyRecorded(admin, tenantId, saleNonce, orderId)) return { ok: false, reason: 'already-recorded' };
  const sale = await findSale(config, key.token, orderId, fetcher);
  if (sale === null) return { ok: false, reason: 'not-found' };
  if (!saleMatches(sale, { totalCents, locationId: key.locationId })) return { ok: false, reason: 'mismatch' };
  return { ok: true, paymentIds: sale.payments.filter((p) => p.type === 'CARD').map((p) => p.id) };
}

/** One payment row per order the card sale made (a sale of several pieces makes one
 *  order each), all naming the one Square sale, so it can be looked up in Square.
 *  The first row's ID is the Square order's own, which the database keeps unique.
 *  A sale taken with no signal has no Square ID yet: it's saved as waiting. */
export async function savePayments(
  admin: SupabaseClient<Database>,
  tenantId: string,
  saleNonce: string,
  orderId: string | null,
  paymentIds: string[],
  orderNumbers: string[],
  status: 'succeeded' | 'pending',
): Promise<void> {
  const { data: orders, error } = await admin.from('orders').select('id, order_number, total_cents').eq('tenant_id', tenantId).in('order_number', orderNumbers);
  if (error !== null) throw new Error(`Could not read the orders: ${error.message}`);
  const byNumber = new Map((orders ?? []).map((o) => [o.order_number, o]));
  const rows = orderNumbers.flatMap((n, i) => {
    const o = byNumber.get(n);
    if (o === undefined) return [];
    return [
      {
        order_id: o.id,
        tenant_id: tenantId,
        processor: 'square' as const,
        external_payment_id: orderId === null ? null : i === 0 ? orderId : `${orderId}/${i}`,
        payment_type: 'charge' as const,
        status,
        amount_cents: o.total_cents,
        payment_method_type: 'card',
        metadata: { sale_nonce: saleNonce, square_order_id: orderId, square_payment_ids: paymentIds },
        processed_at: status === 'succeeded' ? new Date().toISOString() : null,
      },
    ];
  });
  if (rows.length === 0) return;
  const { error: insErr } = await admin.from('payments').insert(rows);
  if (insErr !== null) throw new Error(`Could not save the card payment: ${insErr.message}`);
}

/** Record a confirmed card sale, line by line, at the table's prices. Stops at the
 *  first line that can't be recorded (sold online meanwhile, or the market closed)
 *  and says so; the lines before it stay recorded. */
export async function recordCardSale(
  admin: SupabaseClient<Database>,
  tenantId: string,
  eventId: string,
  lines: readonly CardSaleLine[],
): Promise<{ ok: boolean; orderNumbers: string[] }> {
  const orderNumbers: string[] = [];
  for (const line of lines) {
    const price = await tablePrice(admin, tenantId, line.listingId, line.variantId);
    if ('error' in price) return { ok: false, orderNumbers };
    const { data, error } = await admin.rpc('market_record_card_sale', {
      p_tenant_id: tenantId,
      p_event_id: eventId,
      p_listing_id: line.listingId,
      p_price_cents: price.cents,
      p_quantity: line.quantity,
      ...(line.variantId === null ? {} : { p_variant_id: line.variantId }),
    });
    if (error !== null) {
      logger.error('square: card sale line not recorded', { tenantId, eventId, code: error.code, error: error.message });
      return { ok: false, orderNumbers };
    }
    orderNumbers.push(data);
  }
  return { ok: true, orderNumbers };
}
