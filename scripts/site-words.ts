/**
 * Fill in sites' words (`site_words`). Nothing is ever written into the code
 * (Alex, 2026-10-14), so a site gets its words from data, never from a design.
 *
 *   Every site of a design, from a words file (key -> text):
 *     npx tsx --env-file=.env.local scripts/site-words.ts load <archetype> <prefix> <words.json>
 *   A new site, copying another site's words for one design:
 *     npx tsx --env-file=.env.local scripts/site-words.ts copy <from-subdomain> <to-subdomain> <prefix>
 *   A new site's starting words for its content file (scripts/build-site.ts), from a site of the same design:
 *     npx tsx --env-file=.env.local scripts/site-words.ts dump <subdomain> <prefix> [<prefix>] > words.json
 *
 * Only spots a site has no word for are written: a word a site already has is
 * never overwritten. Prints what it wrote per site.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

type Db = ReturnType<typeof createClient<Database>>;
type Row = { tenant_id: string; key: string; text: string };

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function existingKeys(db: Db, tenantId: string, prefix: string): Promise<Set<string>> {
  const { data, error } = await db.from('site_words').select('key').eq('tenant_id', tenantId).like('key', `${prefix}.%`);
  if (error !== null) fail(`reading words failed: ${error.message}`);
  return new Set((data ?? []).map((r) => r.key));
}

/** Writes the words a site doesn't have yet; returns how many. */
async function fillIn(db: Db, tenantId: string, prefix: string, words: ReadonlyMap<string, string>): Promise<number> {
  const have = await existingKeys(db, tenantId, prefix);
  const rows: Row[] = [...words].filter(([k]) => !have.has(k)).map(([key, text]) => ({ tenant_id: tenantId, key, text }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from('site_words').insert(rows.slice(i, i + 500));
    if (error !== null) fail(`writing words failed: ${error.message}`);
  }
  return rows.length;
}

async function tenantsOf(db: Db, archetype: string): Promise<{ id: string; subdomain: string }[]> {
  const { data, error } = await db.from('content_pages').select('tenant_id, layout_tree, tenants(subdomain)');
  if (error !== null) fail(`reading pages failed: ${error.message}`);
  const seen = new Map<string, string>();
  for (const page of data ?? []) {
    const tree = page.layout_tree as { root?: { archetypeKey?: unknown } } | null;
    if (tree?.root?.archetypeKey === archetype) seen.set(page.tenant_id, page.tenants?.subdomain ?? page.tenant_id);
  }
  return [...seen].map(([id, subdomain]) => ({ id, subdomain }));
}

async function tenantId(db: Db, subdomain: string): Promise<string> {
  const { data, error } = await db.from('tenants').select('id').eq('subdomain', subdomain).maybeSingle();
  if (error !== null) fail(`finding ${subdomain} failed: ${error.message}`);
  if (data === null) fail(`no site called ${subdomain}`);
  return data.id;
}

async function main(): Promise<void> {
  const [mode, a, b, c] = process.argv.slice(2);
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed (use --env-file=.env.local)');
  const db = createClient<Database>(url, key, { auth: { persistSession: false } });

  if (mode === 'load' && a !== undefined && b !== undefined && c !== undefined) {
    const parsed: unknown = JSON.parse(readFileSync(c, 'utf8'));
    if (parsed === null || typeof parsed !== 'object') fail(`${c} is not a words file`);
    const words = new Map<string, string>();
    for (const [k, v] of Object.entries(parsed)) {
      if (!k.startsWith(`${b}.`) || typeof v !== 'string') fail(`${c}: "${k}" is not a ${b} word`);
      words.set(k, v);
    }
    const sites = await tenantsOf(db, a);
    if (sites.length === 0) fail(`no sites use the ${a} design`);
    for (const s of sites) process.stdout.write(`${s.subdomain}: ${await fillIn(db, s.id, b, words)} words written\n`);
    return;
  }
  if (mode === 'copy' && a !== undefined && b !== undefined && c !== undefined) {
    const from = await tenantId(db, a);
    const { data, error } = await db.from('site_words').select('key, text').eq('tenant_id', from).like('key', `${c}.%`);
    if (error !== null) fail(`reading ${a}'s words failed: ${error.message}`);
    if ((data ?? []).length === 0) fail(`${a} has no ${c} words to copy`);
    const n = await fillIn(db, await tenantId(db, b), c, new Map((data ?? []).map((r) => [r.key, r.text])));
    process.stdout.write(`${b}: ${n} words copied from ${a}\n`);
    return;
  }
  if (mode === 'dump' && a !== undefined && b !== undefined) {
    // A new site's starting words: another site's words for the given prefixes, as a
    // words file to put in the new site's content file and edit there.
    const from = await tenantId(db, a);
    const prefixes = [b, ...(c === undefined ? [] : [c])];
    const out: Record<string, string> = {};
    for (const prefix of prefixes) {
      const { data, error } = await db.from('site_words').select('key, text').eq('tenant_id', from).like('key', `${prefix}.%`).order('key');
      if (error !== null) fail(`reading ${a}'s words failed: ${error.message}`);
      for (const r of data ?? []) out[r.key] = r.text;
    }
    process.stdout.write(`${JSON.stringify(out, null, 2)}
`);
    return;
  }
  fail('usage: site-words.ts load <archetype> <prefix> <words.json> | copy <from-subdomain> <to-subdomain> <prefix> | dump <subdomain> <prefix> [<prefix>]');
}

void main();
