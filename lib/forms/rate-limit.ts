import { getCloudflareContext } from '@opennextjs/cloudflare';
import { logger } from '@/lib/logger';

export type FormName = 'estimate' | 'contact' | 'inquiry' | 'waitlist' | 'waitlist-resend' | 'notify-interest';

export type FormAllowance = 'allowed' | 'limited' | 'unavailable';

/**
 * The visitor's address as Cloudflare saw it. Cloudflare sets `cf-connecting-ip`
 * itself and overwrites any value a client sends, so unlike `x-forwarded-for` it
 * can't be forged. Null when the request didn't come through Cloudflare.
 */
export function clientIp(req: Request): string | null {
  const ip = req.headers.get('cf-connecting-ip')?.trim();
  return ip === undefined || ip === '' ? null : ip;
}

/**
 * Spend one of this visitor's submissions of `form` (FORM_LIMITER in
 * wrangler.jsonc: 5 per minute per visitor per form).
 *
 * Fails CLOSED: if the limiter is missing or errors, the answer is
 * 'unavailable', never 'allowed', and the reason is logged. The route tells
 * the visitor to try again or call.
 *
 * `limiter` is for tests; in the app the binding comes from the Worker's env.
 */
export async function allowFormSubmit(req: Request, form: FormName, limiter?: RateLimit): Promise<FormAllowance> {
  try {
    const binding = limiter ?? (await getCloudflareContext({ async: true })).env.FORM_LIMITER;
    if (binding === undefined) throw new Error('FORM_LIMITER binding missing — see "ratelimits" in wrangler.jsonc');
    const { success } = await binding.limit({ key: `${form}:${clientIp(req) ?? 'unknown'}` });
    return success ? 'allowed' : 'limited';
  } catch (err) {
    logger.error('form rate limiter unavailable', { form, error: err instanceof Error ? err.message : String(err) });
    return 'unavailable';
  }
}

const LIMITED_MESSAGE = 'That’s a lot of requests at once. Please wait a minute and try again.';
const UNAVAILABLE_MESSAGE = 'This form can’t send right now. Please try again in a few minutes.';

/**
 * The answer for a turned-away submission (429 limited, 503 limiter down), or
 * null when the visitor may go ahead. `toBody` shapes the message the way this
 * form's page reads its errors (`{ error }` on shop forms, `{ ok, message }` on
 * the waitlist).
 */
export async function formLimitResponse(
  req: Request,
  form: FormName,
  toBody: (message: string) => Record<string, unknown>,
): Promise<Response | null> {
  const allowance = await allowFormSubmit(req, form);
  if (allowance === 'allowed') return null;
  const [message, status] = allowance === 'limited' ? [LIMITED_MESSAGE, 429] : [UNAVAILABLE_MESSAGE, 503];
  return Response.json(toBody(message), { status });
}
