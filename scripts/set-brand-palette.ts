#!/usr/bin/env -S npx tsx
/**
 * Set (or clear) a shop's brand palette — "their colors take over".
 * Claude's tool for hand-built clients; not a user surface.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/set-brand-palette.ts <subdomain> --base "#0B0B0B" --accent "#3DAE3F" [--second "#1F3D22"] [--dry]
 *   npx tsx --env-file=.env.local scripts/set-brand-palette.ts <subdomain> --clear
 *
 * Writes layout_tree.root.brandPalette on the published home envelope (content_pages
 * slug '/') and on the staged draft (store_drafts) if one exists. Prints the derived
 * palette and any adjustments first.
 */
import { createClient } from '@supabase/supabase-js';
import { BrandPaletteSchema, deriveBrandPalette, formatDerivation, type BrandPalette } from '../lib/color/brand-palette';

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const [subdomain, ...rest] = process.argv.slice(2);
if (subdomain === undefined || subdomain.startsWith('-')) {
  fail('usage: set-brand-palette.ts <subdomain> --base "#hex" --accent "#hex" [--second "#hex"] [--dry] | --clear');
}
const dry = rest.includes('--dry');
const clear = rest.includes('--clear');

let palette: BrandPalette | null = null;
if (!clear) {
  const parsed = BrandPaletteSchema.safeParse({
    base: flag(rest, '--base'),
    accent: flag(rest, '--accent'),
    ...(flag(rest, '--second') !== undefined ? { second: flag(rest, '--second') } : {}),
  });
  if (!parsed.success) fail(`invalid colors: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
  palette = parsed.data;
  process.stdout.write(`derived palette:\n${formatDerivation(deriveBrandPalette(palette))}\n\n`);
}

async function main(): Promise<void> {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('missing SUPABASE url / service key — run with --env-file=.env.local');
  const db = createClient(url, key);

  const { data: tenant, error: tErr } = await db.from('tenants').select('id, business_name').eq('subdomain', subdomain).maybeSingle();
  if (tErr !== null) fail(`tenant lookup failed: ${tErr.message}`);
  if (tenant === null) fail(`no tenant with subdomain "${subdomain}"`);
  process.stdout.write(`tenant: ${tenant.business_name} (${tenant.id})\n`);

  function withPalette(tree: unknown): Record<string, unknown> {
    if (tree === null || typeof tree !== 'object' || Array.isArray(tree)) fail('layout_tree is not an object');
    const t = tree as Record<string, unknown>;
    const root = t['root'];
    if (root === null || typeof root !== 'object' || (root as Record<string, unknown>)['kind'] !== 'archetype') {
      fail('envelope root is not an archetype envelope');
    }
    const nextRoot: Record<string, unknown> = { ...(root as Record<string, unknown>) };
    if (palette === null) delete nextRoot['brandPalette'];
    else nextRoot['brandPalette'] = palette;
    return { ...t, root: nextRoot };
  }

  const { data: page, error: pErr } = await db.from('content_pages').select('id, layout_tree').eq('tenant_id', tenant.id).eq('slug', '/').maybeSingle();
  if (pErr !== null) fail(`home page lookup failed: ${pErr.message}`);
  if (page === null) fail('no published home page for this tenant');
  const { data: draft, error: dErr } = await db.from('store_drafts').select('layout_tree').eq('tenant_id', tenant.id).maybeSingle();
  if (dErr !== null) fail(`draft lookup failed: ${dErr.message}`);

  const nextPage = withPalette(page.layout_tree);
  const nextDraft = draft === null ? null : withPalette(draft.layout_tree);

  if (dry) {
    process.stdout.write(`--dry: would ${clear ? 'clear' : 'set'} brandPalette on the home page${nextDraft !== null ? ' and the draft' : ''}.\n`);
    process.exit(0);
  }

  const { error: wErr } = await db.from('content_pages').update({ layout_tree: nextPage }).eq('id', page.id);
  if (wErr !== null) fail(`home page write failed: ${wErr.message}`);
  if (nextDraft !== null) {
    const { error: wdErr } = await db.from('store_drafts').update({ layout_tree: nextDraft }).eq('tenant_id', tenant.id);
    if (wdErr !== null) fail(`draft write failed: ${wdErr.message}`);
  }
  process.stdout.write(`done — brandPalette ${clear ? 'cleared' : 'set'}${nextDraft !== null ? ' (home + draft)' : ' (home)'}.\n`);
}

main().catch((err: unknown) => fail(`set-brand-palette failed: ${err instanceof Error ? err.message : String(err)}`));
