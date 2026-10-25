/**
 * A site's PayPal connection in its locked home (paypal_connections): only the
 * server's own key reads it. It holds no keys, only her PayPal account ID and what
 * PayPal said about the account.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type { MerchantStatus } from './api';

type Db = SupabaseClient<Database>;

/** What a screen may know about the connection. */
export type PayPalLink = { email: string; ready: boolean; paymentsReceivable: boolean; emailConfirmed: boolean; connectedAt: string };

/** An account can take orders once PayPal says payments can be received and her email is confirmed. */
export function canTakeOrders(s: Pick<MerchantStatus, 'paymentsReceivable' | 'emailConfirmed'>): boolean {
  return s.paymentsReceivable && s.emailConfirmed;
}

export async function paypalLink(db: Db, tenantId: string): Promise<PayPalLink | null> {
  const { data, error } = await db.from('paypal_connections').select('email, payments_receivable, email_confirmed, connected_at').eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the PayPal connection: ${error.message}`);
  if (data === null) return null;
  const status = { paymentsReceivable: data.payments_receivable, emailConfirmed: data.email_confirmed };
  return { email: data.email, ready: canTakeOrders(status), ...status, connectedAt: data.connected_at };
}

/** The PayPal account an online order is paid into, when it can take orders. */
export async function paidInto(db: Db, tenantId: string): Promise<string | null> {
  const { data, error } = await db.from('paypal_connections').select('merchant_id, payments_receivable, email_confirmed').eq('tenant_id', tenantId).maybeSingle();
  if (error !== null) throw new Error(`Could not read the PayPal connection: ${error.message}`);
  if (data === null || !canTakeOrders({ paymentsReceivable: data.payments_receivable, emailConfirmed: data.email_confirmed })) return null;
  return data.merchant_id;
}

export async function saveConnection(db: Db, tenantId: string, status: MerchantStatus): Promise<void> {
  const { error } = await db.from('paypal_connections').upsert({
    tenant_id: tenantId,
    merchant_id: status.merchantId,
    email: status.email.slice(0, 254),
    payments_receivable: status.paymentsReceivable,
    email_confirmed: status.emailConfirmed,
    connected_at: new Date().toISOString(),
  });
  if (error !== null) throw new Error(`Could not save the PayPal connection: ${error.message}`);
}

export async function dropConnection(db: Db, tenantId: string): Promise<void> {
  const { error } = await db.from('paypal_connections').delete().eq('tenant_id', tenantId);
  if (error !== null) throw new Error(`Could not remove the PayPal connection: ${error.message}`);
}
