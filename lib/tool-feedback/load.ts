/**
 * What people sent from the try-the-tools page, newest first, with how many want
 * each tool idea. Read with the server's own key, so only call this behind
 * requireFounder.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { IDEAS, tally, type IdeaKey } from './feedback';

export type FeedbackEntry = { id: string; message: string; wants: string[]; name: string; email: string; makes: string; sent: string };
export type FeedbackView = { entries: FeedbackEntry[]; counts: ReturnType<typeof tally>; total: number };

const SHOWN = 500;

export async function loadToolFeedback(db: SupabaseClient<Database>): Promise<FeedbackView> {
  const { data, error } = await db.from('tool_feedback').select('id, message, wants, name, email, makes, created_at').order('created_at', { ascending: false }).limit(SHOWN);
  if (error !== null) throw new Error(`Could not read the feedback: ${error.message}`);
  const entries = data.map((r) => ({ id: r.id, message: r.message, wants: r.wants, name: r.name, email: r.email, makes: r.makes, sent: r.created_at }));
  return { entries, counts: tally(entries), total: entries.length };
}

/** An idea's name for a key (an idea since dropped shows its key). */
export function ideaName(key: string): string {
  return IDEAS.find((i) => i.key === (key as IdeaKey))?.name ?? key;
}
