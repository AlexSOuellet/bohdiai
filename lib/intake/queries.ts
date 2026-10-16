/** The intake form's words — read, with the service role. */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';
import { wordsFrom, type Words } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS, INTAKE_WORDS_PREFIX, type IntakeWordSpots } from './words';

export type IntakeWords = Words<IntakeWordSpots>;

/** Every word the form shows. A spot with no word shows blank and is logged, so a
 *  gap is seen and fixed, never filled with a made-up word. */
export async function getIntakeWords(db: SupabaseClient<Database>): Promise<IntakeWords> {
  const { data, error } = await db.from('intake_words').select('key, text').like('key', `${INTAKE_WORDS_PREFIX}.%`);
  if (error !== null) throw new Error(`Could not load the intake form’s words: ${error.message}`);
  const missing: string[] = [];
  const words = wordsFrom(INTAKE_WORD_SPOTS, INTAKE_WORDS_PREFIX, new Map((data ?? []).map((r) => [r.key, r.text])), missing);
  if (missing.length > 0) logger.warn('intake words: spots with no word', { missing });
  return words;
}
