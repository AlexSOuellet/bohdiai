/**
 * FORM_LIMITER for server actions, which have no Request object. Same key shape
 * and same fail-closed rule as lib/forms/rate-limit.ts.
 */
import { headers } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { logger } from '@/lib/logger';
import type { FormAllowance, FormName } from '@/lib/forms/rate-limit';

export async function allowAction(action: Extract<FormName, 'signin' | 'reset'>, limiter?: RateLimit): Promise<FormAllowance> {
  try {
    const binding = limiter ?? (await getCloudflareContext({ async: true })).env.FORM_LIMITER;
    if (binding === undefined) throw new Error('FORM_LIMITER binding missing — see "ratelimits" in wrangler.jsonc');
    const ip = (await headers()).get('cf-connecting-ip')?.trim() || 'unknown';
    const { success } = await binding.limit({ key: `${action}:${ip}` });
    return success ? 'allowed' : 'limited';
  } catch (err) {
    logger.error('action rate limiter unavailable', { action, error: err instanceof Error ? err.message : String(err) });
    return 'unavailable';
  }
}

/** Spend one from an arbitrary key (e.g. per-email). Fails closed like allowAction. */
export async function allowKey(key: string, limiter?: RateLimit): Promise<FormAllowance> {
  try {
    const binding = limiter ?? (await getCloudflareContext({ async: true })).env.FORM_LIMITER;
    if (binding === undefined) throw new Error('FORM_LIMITER binding missing — see "ratelimits" in wrangler.jsonc');
    const { success } = await binding.limit({ key });
    return success ? 'allowed' : 'limited';
  } catch (err) {
    logger.error('key rate limiter unavailable', { error: err instanceof Error ? err.message : String(err) });
    return 'unavailable';
  }
}

export const ACTION_LIMITED = 'Too many tries. Please wait a minute and try again.';
export const ACTION_UNAVAILABLE = 'This is unavailable for a moment. Please try again in a few minutes.';
