import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * Returns true if the named flag is enabled globally or the tenant is in its allowlist.
 * In development all flags return true so local work is never gated.
 */
export async function isFeatureEnabled(name: string, tenantId?: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') return true;

  const { data, error } = await supabaseAdmin()
    .from('feature_flags')
    .select('enabled, allowlist')
    .eq('name', name)
    .single();

  if (error !== null) {
    logger.warn('feature flag check failed', { name, error: error.message });
    return false;
  }

  if (data.enabled) return true;
  if (tenantId !== undefined && (data.allowlist as string[]).includes(tenantId)) return true;
  return false;
}
