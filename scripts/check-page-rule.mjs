// Checks the "page records hold settings only" database rule against the real
// database, inside a transaction that is always rolled back (nothing is kept).
// Usage: node scripts/check-page-rule.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(fs.readFileSync(path.join(repo, '.env.local'), 'utf8')
  .split(/\r?\n/).map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].trim()]));
const ref = new URL(env.SUPABASE_URL).hostname.split('.')[0];
const conn = env.SUPABASE_DB_URL ?? `postgres://postgres:${encodeURIComponent(env.SUPABASE_DB_PASSWORD)}@db.${ref}.supabase.co:5432/postgres`;
const c = new pg.Client({ connectionString: conn });
await c.connect();

let failures = 0;
async function expect(label, sql, params, shouldPass) {
  await c.query('savepoint s');
  let ok = true; let msg = '';
  try { await c.query(sql, params); } catch (e) { ok = false; msg = e.message; }
  await c.query('rollback to savepoint s');
  const good = ok === shouldPass;
  if (!good) failures++;
  console.log(`${good ? 'ok  ' : 'FAIL'} ${label}${msg ? ` -> ${msg}` : ''}`);
}

await c.query('begin');
try {
  const page = (sub) => c.query(`select cp.id, cp.layout_tree from content_pages cp join tenants t on t.id = cp.tenant_id where t.subdomain = $1 and cp.deleted_at is null order by cp.updated_at desc limit 1`, [sub]).then((r) => r.rows[0]);
  const salt = await page('saltmarsh-and-lace');
  const cut = await page('cut-pro-lawncare');
  const halfmoon = await page('halfmoon-roofing');

  await expect('settings-only rewrite of Saltmarsh passes', 'update content_pages set layout_tree = $1 where id = $2', [salt.layout_tree, salt.id], true);
  const saltDesign = structuredClone(salt.layout_tree); saltDesign.root.content.design = 'torch';
  await expect('switching Saltmarsh design passes', 'update content_pages set layout_tree = $1 where id = $2', [saltDesign, salt.id], true);
  const saltWords = structuredClone(salt.layout_tree); saltWords.root.content.heading = 'Find me at';
  await expect('adding a heading to Saltmarsh is refused', 'update content_pages set layout_tree = $1 where id = $2', [saltWords, salt.id], false);
  const saltRoot = structuredClone(salt.layout_tree); saltRoot.root.tagline = 'hello';
  await expect('words at the root are refused', 'update content_pages set layout_tree = $1 where id = $2', [saltRoot, salt.id], false);
  const saltMeta = structuredClone(salt.layout_tree); saltMeta.meta.description = 'words';
  await expect('extra meta words are refused', 'update content_pages set layout_tree = $1 where id = $2', [saltMeta, salt.id], false);
  const cutEdit = structuredClone(cut.layout_tree); cutEdit.root.content.hero.headline = 'changed';
  await expect('editing Cut-Pro words is refused', 'update content_pages set layout_tree = $1 where id = $2', [cutEdit, cut.id], false);
  await expect('saving Cut-Pro unchanged passes', 'update content_pages set layout_tree = $1 where id = $2', [cut.layout_tree, cut.id], true);
  await expect('Cut-Pro status/title change still passes', 'update content_pages set title = title where id = $1', [cut.id], true);
  const halfmoonEdit = structuredClone(halfmoon.layout_tree); halfmoonEdit.root.archetypeKey = 'card';
  await expect('changing a setting on an old page that still holds content is refused', 'update content_pages set layout_tree = $1 where id = $2', [halfmoonEdit, halfmoon.id], false);
  await expect('old records still read', `select layout_tree->'root'->'content' from content_pages where id = $1`, [halfmoon.id], true);
  const t = (await c.query(`select tenant_id from content_pages where id = $1`, [salt.id])).rows[0].tenant_id;
  await expect('a new content-bearing page is refused', `insert into content_pages (tenant_id, slug, page_type, title, status, layout_tree) values ($1, '/x-test', 'custom', 'x', 'draft', $2)`, [t, { root: { kind: 'archetype', content: { about: { body: 'hi' } } } }], false);
  await expect('a new settings-only page passes', `insert into content_pages (tenant_id, slug, page_type, title, status, layout_tree) values ($1, '/x-test', 'custom', 'x', 'draft', $2)`, [t, { root: { kind: 'archetype', archetypeKey: 'card', content: { design: 'shoreline' } }, meta: { title: 'x' } }], true);
  const draftCols = (await c.query(`select column_name from information_schema.columns where table_name = 'store_drafts'`)).rows.map((r) => r.column_name);
  console.log('store_drafts columns:', draftCols.join(', '));
  const trig = (await c.query(`select tgname from pg_trigger where tgname like '%settings_only'`)).rows.map((r) => r.tgname);
  console.log('triggers:', trig.join(', '));
} finally {
  await c.query('rollback');
  await c.end();
}
process.exit(failures);
