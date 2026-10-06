/**
 * Build a boutique site (a hand-built maker shop with a catalog) — Claude's tool,
 * not a user surface.
 *
 *   npx tsx --env-file=.env.local scripts/build-boutique-site.ts <site> --media <dir>
 *       [--contact-email a@b.com] [--replace-profile] [--replace-products] [--dry]
 *
 * <site> names a module in scripts/sites/ exporting SITE, PROFILE and BABIES (the
 * pieces). Creates the tenant if missing (status active), writes the published
 * home page (archetype "boutique" with its design), switches About you, the
 * catalog and Market dates on, uploads the logo, and fills About you and the
 * catalog. The owner edits both in the backend after, so a re-run leaves them
 * alone unless --replace-profile / --replace-products says otherwise. Every run
 * makes sure Alex's account is an admin of the site.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '../lib/database.types';
import { buildProfileRow, type ProfileForm } from '../lib/backend/profile/profile-form';
import { BOUTIQUE_DESIGNS, type BoutiqueDesign } from '../lib/archetypes/boutique/design';
import { BUILDER_EMAIL, ensureBuilderAccess } from '../lib/backend/builder-access';

export type BoutiqueSiteModule = {
  SITE: { subdomain: string; businessName: string; design: BoutiqueDesign; logo?: string };
  PROFILE: ProfileForm;
  /** The pieces, in shop order: name, one-line description, the story, photos (first is the main one). */
  BABIES: {
    name: string;
    short: string;
    description: string;
    photos: string[];
    onHome?: boolean;
    priceCents?: number;
  }[];
};

/** The starting price Alex gave for a sample piece with no price of its own. */
const DEFAULT_PRICE_CENTS = 12000;
const HOME_MAX = 5;
const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main(): Promise<void> {
  const [siteKey, ...rest] = process.argv.slice(2);
  const mediaDir = flag(rest, '--media');
  const contactEmail = flag(rest, '--contact-email');
  const replaceProfile = rest.includes('--replace-profile');
  const replaceProducts = rest.includes('--replace-products');
  const dry = rest.includes('--dry');
  if (siteKey === undefined || mediaDir === undefined)
    fail(
      'usage: build-boutique-site.ts <site> --media <dir> [--contact-email x] [--replace-profile] [--replace-products] [--dry]',
    );

  const site = (await import(`./sites/${siteKey}.ts`)) as BoutiqueSiteModule;
  if (!(BOUTIQUE_DESIGNS as readonly string[]).includes(site.SITE.design))
    fail(`unknown design: ${site.SITE.design}`);
  const profile = buildProfileRow(site.PROFILE);
  if (!profile.ok) fail(`profile invalid: ${profile.error}`);
  const files = [
    ...site.BABIES.flatMap((b) => b.photos),
    ...(site.SITE.logo === undefined ? [] : [site.SITE.logo]),
  ];
  for (const f of files) {
    if (MIME[extname(f).toLowerCase()] === undefined) fail(`not a photo: ${f}`);
    if (!existsSync(join(mediaDir, f))) fail(`missing photo: ${join(mediaDir, f)}`);
  }
  if (site.BABIES.filter((b) => b.onHome === true).length > HOME_MAX)
    fail(`at most ${HOME_MAX} home picks`);
  const slugs = site.BABIES.map((b) => slugify(b.name));
  if (new Set(slugs).size !== slugs.length) fail('two pieces share a web address');
  process.stdout.write(
    `site: ${site.SITE.businessName} → ${site.SITE.subdomain}.bohdiai.com (${site.BABIES.length} pieces)\n`,
  );
  if (dry) {
    process.stdout.write('--dry: site module is valid; nothing written.\n');
    return;
  }

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined)
    fail('missing SUPABASE url / service key — run with --env-file=.env.local');
  const db = createClient<Database>(url, key);
  const bucket = db.storage.from('tenant-media');

  // 1) The tenant — found by subdomain, created active if missing.
  const { data: found, error: fErr } = await db
    .from('tenants')
    .select('id')
    .eq('subdomain', site.SITE.subdomain)
    .is('deleted_at', null)
    .maybeSingle();
  if (fErr !== null) fail(`tenant lookup failed: ${fErr.message}`);
  let tenantId = found?.id;
  if (tenantId === undefined) {
    const { data: created, error: cErr } = await db
      .from('tenants')
      .insert({
        subdomain: site.SITE.subdomain,
        business_name: site.SITE.businessName,
        tier: 'basic',
        types: ['seller'],
        status: 'active',
      })
      .select('id')
      .single();
    if (cErr !== null) fail(`tenant create failed: ${cErr.message}`);
    tenantId = created.id;
    process.stdout.write(`created tenant ${tenantId}\n`);
  } else {
    process.stdout.write(`tenant exists ${tenantId}\n`);
  }
  const tid = tenantId;
  const access = await ensureBuilderAccess(db, tid);
  if (!access.ok) fail(`builder access: ${access.error}`);
  if (access.added) process.stdout.write(`builder login added (${BUILDER_EMAIL})\n`);
  if (contactEmail !== undefined) {
    const { error } = await db
      .from('tenants')
      .update({ contact_email: contactEmail })
      .eq('id', tid);
    if (error !== null) fail(`contact email update failed: ${error.message}`);
    process.stdout.write(`contact form → ${contactEmail}\n`);
  }

  /** Upload one file to the shop's public media and record it; returns the uploads id and URL. */
  async function upload(
    file: string,
    folder: string,
    alt: string,
  ): Promise<{ id: string; url: string }> {
    const bytes = readFileSync(join(mediaDir as string, file));
    const mime = MIME[extname(file).toLowerCase()] ?? fail(`unknown type: ${file}`);
    const path = `tenant/${tid}/${folder}/${crypto.randomUUID()}${extname(file).toLowerCase()}`;
    const { error: upErr } = await bucket.upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr !== null) fail(`upload ${file} failed: ${upErr.message}`);
    const publicUrl = bucket.getPublicUrl(path).data.publicUrl;
    const { data: up, error: rErr } = await db
      .from('uploads')
      .insert({
        tenant_id: tid,
        storage_bucket: 'tenant-media',
        storage_path: path,
        public_url: publicUrl,
        file_name: file,
        mime_type: mime,
        size_bytes: bytes.length,
        source: 'imported',
        status: 'active',
        alt_text: alt,
      })
      .select('id')
      .single();
    if (rErr !== null) fail(`record ${file} failed: ${rErr.message}`);
    return { id: up.id, url: publicUrl };
  }

  // 2) Features: About you, the catalog and Market dates on.
  const { error: featErr } = await db.from('tenant_features').upsert([
    { tenant_id: tid, feature_key: 'profile', enabled: true },
    { tenant_id: tid, feature_key: 'catalog', enabled: true },
    { tenant_id: tid, feature_key: 'market_dates', enabled: true },
  ]);
  if (featErr !== null) fail(`features failed: ${featErr.message}`);

  // 3) The published home page — the boutique envelope, replaced in place on re-runs.
  const tree = {
    root: {
      kind: 'archetype',
      archetypeKey: 'boutique',
      lookKey: 'boutique',
      content: { design: site.SITE.design },
    },
    meta: { title: site.SITE.businessName },
  } as unknown as Json;
  const { data: home, error: hErr } = await db
    .from('content_pages')
    .select('id')
    .eq('tenant_id', tid)
    .eq('slug', '/')
    .maybeSingle();
  if (hErr !== null) fail(`home lookup failed: ${hErr.message}`);
  if (home === null) {
    const { error } = await db
      .from('content_pages')
      .insert({
        tenant_id: tid,
        slug: '/',
        page_type: 'home',
        title: site.SITE.businessName,
        status: 'published',
        is_system_page: true,
        is_in_nav: false,
        layout_tree: tree,
      });
    if (error !== null) fail(`home create failed: ${error.message}`);
  } else {
    const { error } = await db
      .from('content_pages')
      .update({ layout_tree: tree, title: site.SITE.businessName, status: 'published' })
      .eq('id', home.id);
    if (error !== null) fail(`home update failed: ${error.message}`);
  }
  process.stdout.write('home page written\n');

  // 4) The logo, when the module has one.
  if (site.SITE.logo !== undefined) {
    const logo = await upload(site.SITE.logo, 'logo', site.SITE.businessName);
    const { error } = await db.from('tenants').update({ logo_url: logo.url }).eq('id', tid);
    if (error !== null) fail(`logo update failed: ${error.message}`);
    process.stdout.write('logo uploaded\n');
  }

  // 5) About you — only when there is none yet, or when asked to replace it.
  const { data: existingProfile, error: pErr } = await db
    .from('site_profiles')
    .select('tenant_id')
    .eq('tenant_id', tid)
    .maybeSingle();
  if (pErr !== null) fail(`profile lookup failed: ${pErr.message}`);
  if (existingProfile === null || replaceProfile) {
    const { error } = await db.from('site_profiles').upsert({ tenant_id: tid, ...profile.row });
    if (error !== null) fail(`profile write failed: ${error.message}`);
    process.stdout.write('About you written\n');
  } else {
    process.stdout.write('About you kept (owner’s version; --replace-profile to overwrite)\n');
  }

  // 6) The catalog — only when empty, or when asked to replace it (old pieces are
  //    soft-deleted, never hard-deleted).
  const { data: existing, error: lErr } = await db
    .from('listings')
    .select('id')
    .eq('tenant_id', tid)
    .is('deleted_at', null);
  if (lErr !== null) fail(`catalog lookup failed: ${lErr.message}`);
  if ((existing ?? []).length > 0 && !replaceProducts) {
    process.stdout.write('catalog kept (owner’s version; --replace-products to overwrite)\n');
  } else {
    if ((existing ?? []).length > 0) {
      const { error } = await db
        .from('listings')
        .update({ deleted_at: new Date().toISOString(), on_home: false })
        .eq('tenant_id', tid)
        .is('deleted_at', null);
      if (error !== null) fail(`catalog clear failed: ${error.message}`);
    }
    for (const [i, b] of site.BABIES.entries()) {
      const media: string[] = [];
      for (const [n, f] of b.photos.entries())
        media.push(
          (await upload(f, 'products', n === 0 ? b.name : `${b.name}, photo ${n + 1}`)).id,
        );
      const { error } = await db.from('listings').insert({
        tenant_id: tid,
        listing_type: 'product',
        slug: slugify(b.name),
        name: b.name,
        short_description: b.short,
        description: b.description,
        base_price_cents: b.priceCents ?? DEFAULT_PRICE_CENTS,
        status: 'active',
        inventory_tracked: true,
        inventory_count: 1,
        media_ids: media,
        requires_shipping: true,
        published_at: new Date(Date.now() + i).toISOString(),
        on_home: b.onHome === true,
      });
      if (error !== null) fail(`piece ${b.name} failed: ${error.message}`);
      process.stdout.write(
        `  ${b.name} (${b.photos.length} photo${b.photos.length === 1 ? '' : 's'})\n`,
      );
    }
    process.stdout.write(`catalog: ${site.BABIES.length} pieces\n`);
  }
  process.stdout.write(`done — https://${site.SITE.subdomain}.bohdiai.com\n`);
}

main().catch((err: unknown) =>
  fail(`build failed: ${err instanceof Error ? err.message : String(err)}`),
);
