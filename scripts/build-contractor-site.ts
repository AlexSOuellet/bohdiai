/**
 * Build (or rebuild) a hand-built contractor site — Claude's tool, not a user surface.
 *
 *   npx tsx --env-file=.env.local scripts/build-contractor-site.ts <site> --media <dir> [--contact-email a@b.com] [--draft] [--dry]
 *
 * --draft builds the site hidden: the public gets "not found" until it is
 * switched on (scripts/site-visibility.ts); the run prints the private preview
 * link. A real client's site is ALWAYS built with --draft (Alex, 2026-10-06).
 *
 * <site> names a module in scripts/sites/ exporting SITE + content(media).
 * It creates the tenant if missing (status active), uploads every file in --media to
 * tenant-media under tenant/<id>/site/, validates the content against the contractor
 * schema, and writes the published home page. Re-running replaces the content in place.
 * Every run makes sure Alex's account is an admin of the site (he builds them all).
 * --contact-email sets where estimate requests are emailed (left unchanged if omitted).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ContractorContentSchema } from '../lib/archetypes/contractor/schemas';
import { BrandPaletteSchema } from '../lib/color/brand-palette';
import type { Database, Json } from '../lib/database.types';
import { BUILDER_EMAIL, ensureBuilderAccess } from '../lib/backend/builder-access';
import { previewCode, previewLink } from '../lib/storefront/draft-preview';
import type * as SiteModule from './sites/cut-pro-lawncare';

const MIME: Record<string, string> = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4' };

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main(): Promise<void> {
  const [siteKey, ...rest] = process.argv.slice(2);
  const mediaDir = flag(rest, '--media');
  const contactEmail = flag(rest, '--contact-email');
  const dry = rest.includes('--dry');
  const draft = rest.includes('--draft');
  if (siteKey === undefined || mediaDir === undefined) fail('usage: build-contractor-site.ts <site> --media <dir> [--contact-email x] [--draft] [--dry]');

  const site = (await import(`./sites/${siteKey}.ts`)) as typeof SiteModule;
  if (!BrandPaletteSchema.safeParse(site.SITE.brandPalette).success) fail('site brandPalette is invalid');

  const files = readdirSync(mediaDir).filter((f) => MIME[extname(f).toLowerCase()] !== undefined);
  process.stdout.write(`site: ${site.SITE.businessName} → ${site.SITE.subdomain}.bohdiai.com (${files.length} media files)\n`);

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('missing SUPABASE url / service key — run with --env-file=.env.local');
  const db = createClient(url, key);

  // 1) The tenant — found by subdomain, created active if missing.
  const { data: found, error: fErr } = await db.from('tenants').select('id').eq('subdomain', site.SITE.subdomain).maybeSingle();
  if (fErr !== null) fail(`tenant lookup failed: ${fErr.message}`);
  let tenantId = (found as { id: string } | null)?.id;
  if (dry) {
    const probe = site.content((f) => `https://example.com/${f}`);
    const check = ContractorContentSchema.safeParse(probe);
    if (!check.success) fail(`content invalid: ${check.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    process.stdout.write(`--dry: content valid; tenant ${tenantId ?? '(would be created)'}; would upload ${files.join(', ')}\n`);
    return;
  }
  if (tenantId === undefined) {
    const { data: created, error: cErr } = await db
      .from('tenants')
      .insert({
        subdomain: site.SITE.subdomain,
        business_name: site.SITE.businessName,
        tier: 'basic',
        types: ['doer'],
        status: draft ? 'draft' : 'active',
      })
      .select('id')
      .single();
    if (cErr !== null) fail(`tenant create failed: ${cErr.message}`);
    tenantId = (created as { id: string }).id;
    process.stdout.write(`created tenant ${tenantId}\n`);
  } else {
    process.stdout.write(`tenant exists ${tenantId}\n`);
    if (draft) {
      const { error } = await db.from('tenants').update({ status: 'draft' }).eq('id', tenantId);
      if (error !== null) fail(`draft status update failed: ${error.message}`);
    }
  }
  const access = await ensureBuilderAccess(db as SupabaseClient<Database>, tenantId);
  if (!access.ok) fail(`builder access: ${access.error}`);
  if (access.added) process.stdout.write(`builder login added (${BUILDER_EMAIL})\n`);
  if (contactEmail !== undefined) {
    const { error } = await db.from('tenants').update({ contact_email: contactEmail }).eq('id', tenantId);
    if (error !== null) fail(`contact email update failed: ${error.message}`);
    process.stdout.write(`estimate requests → ${contactEmail}\n`);
  }

  // 2) Media — uploaded under the tenant, replacing same-named files.
  const bucket = db.storage.from('tenant-media');
  const publicUrl = new Map<string, string>();
  for (const f of files) {
    const path = `tenant/${tenantId}/site/${f}`;
    const contentType = MIME[extname(f).toLowerCase()] ?? fail(`unknown media type: ${f}`);
    const { error } = await bucket.upload(path, readFileSync(join(mediaDir, f)), { contentType, upsert: true });
    if (error !== null) fail(`upload ${f} failed: ${error.message}`);
    publicUrl.set(f, bucket.getPublicUrl(path).data.publicUrl);
  }
  process.stdout.write(`uploaded ${files.length} files\n`);

  // 3) Content — every media reference must resolve to an uploaded file.
  const content = site.content((f) => publicUrl.get(f) ?? fail(`content references missing media file: ${f}`));
  const checked = ContractorContentSchema.safeParse(content);
  if (!checked.success) fail(`content invalid: ${checked.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);

  const tree = {
    root: {
      kind: 'archetype',
      archetypeKey: 'contractor',
      lookKey: 'contractor',
      accentOverride: null,
      brandPalette: site.SITE.brandPalette,
      content: checked.data,
    },
    meta: { title: site.SITE.businessName },
  } as unknown as Json;

  // 4) The published home page — replaced in place on re-runs.
  const { data: home, error: hErr } = await db.from('content_pages').select('id').eq('tenant_id', tenantId).eq('slug', '/').maybeSingle();
  if (hErr !== null) fail(`home lookup failed: ${hErr.message}`);
  if (home === null) {
    const { error } = await db.from('content_pages').insert({
      tenant_id: tenantId, slug: '/', page_type: 'home', title: site.SITE.businessName,
      status: 'published', is_system_page: true, is_in_nav: false, layout_tree: tree,
    });
    if (error !== null) fail(`home create failed: ${error.message}`);
  } else {
    const { error } = await db.from('content_pages').update({ layout_tree: tree, title: site.SITE.businessName }).eq('id', (home as { id: string }).id);
    if (error !== null) fail(`home update failed: ${error.message}`);
  }
  process.stdout.write(`done — ${site.SITE.subdomain} is built.\n`);
  if (draft) {
    const code = await previewCode(process.env['BACKEND_SESSION_SECRET'], site.SITE.subdomain);
    if (code === null) fail('BACKEND_SESSION_SECRET missing or short — cannot make the preview link');
    process.stdout.write(`HIDDEN (draft). Private preview link:\n  ${previewLink(site.SITE.subdomain, code)}\n`);
  }
}

main().catch((err: unknown) => fail(`build failed: ${err instanceof Error ? err.message : String(err)}`));
