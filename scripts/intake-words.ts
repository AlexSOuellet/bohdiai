/**
 * Fill in the intake form's words (`intake_words`). Nothing is written into the
 * code, so the form (bohdiai.com/start) gets its words from data.
 *
 *   npx tsx --env-file=.env.local scripts/intake-words.ts load <words.json> [--update]
 *
 * The file maps each spot to its words ("intake.send.button": "Send it to me").
 * Every spot the form has must be in it, and nothing else. Without --update only
 * missing spots are written; with it, changed words are rewritten too.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { wordKeys } from '../lib/site-words/words';
import { INTAKE_WORD_SPOTS, INTAKE_WORDS_PREFIX } from '../lib/intake/words';

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [mode, file, flag] = process.argv.slice(2);
  if (mode !== 'load' || file === undefined) fail('usage: scripts/intake-words.ts load <words.json> [--update]');
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed (use --env-file=.env.local)');

  const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (parsed === null || typeof parsed !== 'object') fail(`${file} is not a words file`);
  const spots = new Set(wordKeys(INTAKE_WORD_SPOTS, INTAKE_WORDS_PREFIX));
  const words = new Map<string, string>();
  for (const [k, v] of Object.entries(parsed)) {
    if (!spots.has(k)) fail(`${file}: "${k}" isn't a spot on the form`);
    if (typeof v !== 'string' || v.trim() === '') fail(`${file}: "${k}" has no words`);
    words.set(k, v);
  }
  const missing = [...spots].filter((k) => !words.has(k));
  if (missing.length > 0) fail(`${file} is missing: ${missing.join(', ')}`);

  const db = createClient<Database>(url, key, { auth: { persistSession: false } });
  const { data, error } = await db.from('intake_words').select('key, text');
  if (error !== null) fail(`reading words failed: ${error.message}`);
  const have = new Map((data ?? []).map((r) => [r.key, r.text]));
  const rows = [...words]
    .filter(([k, t]) => !have.has(k) || (flag === '--update' && have.get(k) !== t))
    .map(([k, t]) => ({ key: k, text: t }));
  if (rows.length > 0) {
    const { error: upErr } = await db.from('intake_words').upsert(rows, { onConflict: 'key' });
    if (upErr !== null) fail(`writing words failed: ${upErr.message}`);
  }
  process.stdout.write(`${rows.length} words written (${spots.size} spots)\n`);
}

void main();
