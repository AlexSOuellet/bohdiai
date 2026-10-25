'use server';

/**
 * PayPal from the backend: check the account again (after she confirms her email or
 * finishes PayPal's steps) and disconnect. Each re-checks the acting site and its
 * cart (online orders, Full). Nothing secret ever reaches a screen.
 */
import { revalidatePath } from 'next/cache';
import { requireActingSite } from '@/lib/backend/current-site';
import { getSiteFeatures } from '@/lib/backend/site-features';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { paypalConfig } from '@/lib/paypal/config';
import { merchantStatus, partnerToken } from '@/lib/paypal/api';
import { canTakeOrders, dropConnection, saveConnection } from '@/lib/paypal/connection';
import type { DoneResult } from '../catalog/results';

const OFF = 'Online orders aren’t switched on for this site.';
const NOT_SET_UP = 'PayPal isn’t set up on BohdiAI yet.';

async function cartSite(): Promise<{ tenantId: string } | null> {
  const { site } = await requireActingSite();
  return (await getSiteFeatures(site.tenantId)).has('cart') ? site : null;
}

/** Ask PayPal again how her account stands. */
export async function checkPayPal(): Promise<DoneResult> {
  const site = await cartSite();
  if (site === null) return { ok: false, error: OFF };
  const config = paypalConfig();
  if (config === null) return { ok: false, error: NOT_SET_UP };
  const admin = supabaseAdmin();
  const { data, error } = await admin.from('paypal_connections').select('merchant_id').eq('tenant_id', site.tenantId).maybeSingle();
  if (error !== null) return { ok: false, error: 'Something went wrong. Try again in a moment.' };
  if (data === null) return { ok: false, error: 'Connect your PayPal first.' };
  try {
    const status = await merchantStatus(config, await partnerToken(config), data.merchant_id);
    if (!status.permissionsGranted) {
      // She took BohdiAI's access away in her PayPal: the connection goes too.
      await dropConnection(admin, site.tenantId);
      revalidatePath('/manage/payments');
      return { ok: false, error: 'Your PayPal no longer allows BohdiAI to take payments, so it’s disconnected here. Press Connect PayPal to connect it again.' };
    }
    await saveConnection(admin, site.tenantId, status);
    revalidatePath('/manage/payments');
    return canTakeOrders(status) ? { ok: true } : { ok: false, error: 'PayPal says your account can’t take payments yet. Finish the steps PayPal emailed you, then check again.' };
  } catch (err) {
    logger.error('paypal: check failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'PayPal didn’t answer. Try again in a moment.' };
  }
}

/** Disconnect: the site stops offering PayPal at once. PayPal keeps BohdiAI's
 *  permission on her side until she removes it there (PayPal offers no way for us to). */
export async function disconnectPayPal(): Promise<DoneResult> {
  const site = await cartSite();
  if (site === null) return { ok: false, error: OFF };
  try {
    await dropConnection(supabaseAdmin(), site.tenantId);
  } catch (err) {
    logger.error('paypal: disconnect failed', { tenantId: site.tenantId, error: err instanceof Error ? err.message : String(err) });
    return { ok: false, error: 'Your PayPal couldn’t be disconnected. Try again in a moment.' };
  }
  revalidatePath('/manage/payments');
  return { ok: true };
}
