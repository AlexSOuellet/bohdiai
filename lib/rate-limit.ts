import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 20; // TODO: reset to 3 before launch

async function getIp(): Promise<string> {
  const store = await headers();
  const cf = store.get('cf-connecting-ip');
  if (cf !== null) return cf;
  const forwarded = store.get('x-forwarded-for');
  if (forwarded !== null) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return 'unknown';
}

export async function checkGenerationRateLimit(): Promise<void> {
  const ip = await getIp();
  const db = supabaseAdmin();
  const now = new Date();

  const { data, error } = await db
    .from('generation_rate_limits')
    .select('count, window_start')
    .eq('ip', ip)
    .maybeSingle();

  if (error !== null) {
    // Non-fatal: rate limit table error should not block generation
    logger.error('rate-limit: DB read failed', { error: error.message, ip });
    return;
  }

  const windowExpired =
    data === null || now.getTime() - new Date(data.window_start).getTime() > WINDOW_MS;

  if (windowExpired) {
    await db.from('generation_rate_limits').upsert({
      ip,
      count: 1,
      window_start: now.toISOString(),
      updated_at: now.toISOString(),
    });
    return;
  }

  if (data.count >= MAX_PER_WINDOW) {
    logger.warn('rate-limit: generation limit reached', { ip, count: data.count });
    throw new Error(
      `You've created ${MAX_PER_WINDOW} storefronts this hour. Please wait before trying again.`,
    );
  }

  await db
    .from('generation_rate_limits')
    .update({ count: data.count + 1, updated_at: now.toISOString() })
    .eq('ip', ip);
}
