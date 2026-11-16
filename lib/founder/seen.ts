/**
 * New-item counts on the admin's tabs (Alex, 2026-11-16): how many messages, reports
 * and feedback responses came in since Alex last opened that tab. Opening a tab marks
 * it seen. Service role only, so call these behind requireFounder.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type Db = SupabaseClient<Database>;

export const SEEN_TABS = ['messages', 'reports', 'feedback'] as const;
export type SeenTab = (typeof SEEN_TABS)[number];
export type NewCounts = Record<SeenTab, number>;

/** Each tab's own list, and where it keeps when each item came in. */
const LISTS: Record<SeenTab, 'support_messages' | 'site_reports' | 'tool_feedback'> = {
  messages: 'support_messages',
  reports: 'site_reports',
  feedback: 'tool_feedback',
};

export async function newCounts(db: Db): Promise<NewCounts> {
  const { data, error } = await db.from('founder_seen').select('tab, seen_at');
  if (error !== null) throw new Error(`Could not read what’s been seen: ${error.message}`);
  const seen = new Map((data ?? []).map((r) => [r.tab, r.seen_at]));
  const counts = await Promise.all(
    SEEN_TABS.map(async (tab) => {
      let q = db.from(LISTS[tab]).select('id', { count: 'exact', head: true });
      const since = seen.get(tab);
      if (since !== undefined) q = q.gt('created_at', since);
      const { count, error: cErr } = await q;
      if (cErr !== null) throw new Error(`Could not count the ${tab}: ${cErr.message}`);
      return [tab, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(counts) as NewCounts;
}

/** Alex opened this tab: everything in it now counts as seen. */
export async function markSeen(db: Db, tab: SeenTab): Promise<void> {
  const { error } = await db
    .from('founder_seen')
    .upsert({ tab, seen_at: new Date().toISOString() }, { onConflict: 'tab' });
  if (error !== null) throw new Error(`Could not mark ${tab} seen: ${error.message}`);
}
