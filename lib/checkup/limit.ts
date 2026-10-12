import { getCloudflareContext } from '@opennextjs/cloudflare';
import { logger } from '@/lib/logger';
import { clientIp, type FormAllowance } from '@/lib/forms/rate-limit';

/**
 * CHECKUP_LIMITER (wrangler.jsonc: 30 a minute per visitor). Every request
 * spends real model time, so like the form limiter it fails CLOSED.
 */
export async function allowCheckup(req: Request, limiter?: RateLimit): Promise<FormAllowance> {
  try {
    const binding = limiter ?? (await getCloudflareContext({ async: true })).env.CHECKUP_LIMITER;
    if (binding === undefined) throw new Error('CHECKUP_LIMITER binding missing — see "ratelimits" in wrangler.jsonc');
    const { success } = await binding.limit({ key: `checkup:${clientIp(req) ?? 'unknown'}` });
    return success ? 'allowed' : 'limited';
  } catch (err) {
    logger.error('checkup rate limiter unavailable', { error: err instanceof Error ? err.message : String(err) });
    return 'unavailable';
  }
}

/** The turned-away response, or null when the visitor may go ahead. */
export async function checkupLimitResponse(req: Request, limiter?: RateLimit): Promise<Response | null> {
  const allowance = await allowCheckup(req, limiter);
  if (allowance === 'allowed') return null;
  return allowance === 'limited'
    ? Response.json({ error: 'That’s a lot at once. Give it a minute, then tap Try again.' }, { status: 429 })
    : Response.json({ error: 'This isn’t working right now. Please try again in a few minutes.' }, { status: 503 });
}
