/** Opening a tab marks it seen; if that can't be saved the tab still opens (logged). */
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { markSeen, type SeenTab } from './seen';

export async function markSeenQuietly(tab: SeenTab): Promise<void> {
  try {
    await markSeen(supabaseAdmin(), tab);
  } catch (err) {
    logger.error('admin: mark seen failed', {
      tab,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
