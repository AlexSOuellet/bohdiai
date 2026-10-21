/**
 * A site's Square connection in its locked home (square_connections): only the
 * server's own key reads it, and the keys are unscrambled only here, for a call to
 * Square, never sent to a screen.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { SquareConfig } from './config';
import { renewKeys, type SquareKeys, type SquareLocation } from './api';
import { seal, unseal } from './vault';
import type { CardState } from './pos';

type Db = SupabaseClient<Database>;

/** What a screen may know about the connection: no keys. */
export type SquareLink = { businessName: string; locationId: string | null; locationName: string; connectedAt: string };

export async function squareLink(db: Db, tenantId: string): Promise<SquareLink | null> {
  const { data, error } = await db.from('square_connections').select('business_name, location_id, location_name, connected_at').eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the Square connection: ${error.message}`);
  if (data === null) return null;
  return { businessName: data.business_name, locationId: data.location_id, locationName: data.location_name, connectedAt: data.connected_at };
}

export async function saveConnection(
  db: Db,
  config: SquareConfig,
  tenantId: string,
  keys: SquareKeys,
  business: string,
  location: SquareLocation | null,
): Promise<void> {
  const { error } = await db.from('square_connections').upsert({
    tenant_id: tenantId,
    merchant_id: keys.merchantId,
    business_name: business.slice(0, 255),
    location_id: location?.id ?? null,
    location_name: (location?.name ?? '').slice(0, 255),
    access_token_enc: await seal(keys.accessToken, config.tokenKey),
    refresh_token_enc: await seal(keys.refreshToken, config.tokenKey),
    expires_at: keys.expiresAt,
    connected_at: new Date().toISOString(),
  });
  if (error !== null) throw new Error(`Could not save the Square connection: ${error.message}`);
}

export async function setLocation(db: Db, tenantId: string, location: SquareLocation): Promise<void> {
  const { error } = await db.from('square_connections').update({ location_id: location.id, location_name: location.name.slice(0, 255) }).eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not save the Square location: ${error.message}`);
}

export async function dropConnection(db: Db, tenantId: string): Promise<void> {
  const { error } = await db.from('square_connections').delete().eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not remove the Square connection: ${error.message}`);
}

/** Renew a key this close to running out. */
const RENEW_WITHIN_MS = 7 * 24 * 60 * 60 * 1000;

export type LiveKey = { token: string; merchantId: string; locationId: string | null };

/** A working access key for the site, renewed first when it's within a week of
 *  running out. Null when the site isn't connected. */
export async function liveKey(db: Db, config: SquareConfig, tenantId: string, now: Date = new Date(), fetcher: typeof fetch = fetch): Promise<LiveKey | null> {
  const { data, error } = await db.from('square_connections').select('merchant_id, location_id, access_token_enc, refresh_token_enc, expires_at').eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the Square connection: ${error.message}`);
  if (data === null) return null;
  if (new Date(data.expires_at).getTime() - now.getTime() > RENEW_WITHIN_MS) {
    return { token: await unseal(data.access_token_enc, config.tokenKey), merchantId: data.merchant_id, locationId: data.location_id };
  }
  const keys = await renewKeys(config, await unseal(data.refresh_token_enc, config.tokenKey), fetcher);
  const { error: saveErr } = await db
    .from('square_connections')
    .update({
      access_token_enc: await seal(keys.accessToken, config.tokenKey),
      refresh_token_enc: await seal(keys.refreshToken, config.tokenKey),
      expires_at: keys.expiresAt,
    })
    .eq('tenant_id', tenantId);
  if (saveErr !== null) throw new Error(`Could not save the renewed Square key: ${saveErr.message}`);
  return { token: keys.accessToken, merchantId: data.merchant_id, locationId: data.location_id };
}

/** Whether the market app takes cards: ready when Square is set up on BohdiAI and
 *  this site is connected with a location picked; waiting when it's connected but
 *  no location is picked yet. */
export async function cardState(db: Db, tenantId: string, configured: boolean): Promise<CardState> {
  if (!configured) return 'off';
  const link = await squareLink(db, tenantId);
  if (link === null) return 'off';
  return link.locationId === null ? 'pick-location' : 'ready';
}
