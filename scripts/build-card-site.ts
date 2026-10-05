/**
 * Build a business card site (card site spec) — Claude's tool, not a user surface.
 *
 *   npx tsx --env-file=.env.local scripts/build-card-site.ts <site> --media <dir>
 *       [--contact-email a@b.com] [--replace-profile] [--replace-gallery] [--dry]
 *
 * <site> names a module in scripts/sites/ exporting SITE, PROFILE and PHOTOS.
 * Creates the tenant if missing (status active), writes the published home page
 * (archetype "card": its design, and its family and skin), switches About you, Gallery and Market dates on and the
 * catalog off, and fills About you and the gallery. The owner edits both after,
 * so a re-run leaves them alone unless --replace-profile / --replace-gallery says
 * otherwise. --contact-email sets where the contact form's messages go. Every run
 * makes sure Alex's account is an admin of the site (he builds them all).
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '../lib/database.types';
import { BrandPaletteSchema, type BrandPalette } from '../lib/color/brand-palette';
import { buildProfileRow, type ProfileForm } from '../lib/backend/profile/profile-form';
import { GALLERY_LIMIT, CAPTION_MAX } from '../lib/backend/gallery/gallery-form';
import { FAMILY_KEYS, FAMILIES, type FamilyKey } from '../lib/archetypes/main-street/families';
import { cardSkinKey } from '../lib/archetypes/card/paint';
import { CARD_DESIGNS, type CardDesign } from '../lib/archetypes/card/design';
import { BUILDER_EMAIL, ensureBuilderAccess } from '../lib/backend/builder-access';

export type CardSiteModule = {
  /** `design` picks the page (pinned prints when left out). Pinned prints paint in
   *  `family` + one of its skins, or the shop's own brand palette. */
  SITE: { subdomain: string; businessName: string; design?: CardDesign; family: FamilyKey; skin: string; brandPalette?: BrandPalette };
  PROFILE: ProfileForm;
  PHOTOS: { file: string; caption: string }[];
};

const MIME: Record<string, string> = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

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
  const replaceProfile = rest.includes('--replace-profile');
  const replaceGallery = rest.includes('--replace-gallery');
  const dry = rest.includes('--dry');
  if (siteKey === undefined || mediaDir === undefined) fail('usage: build-card-site.ts <site> --media <dir> [--contact-email x] [--replace-profile] [--replace-gallery] [--dry]');

  const site = (await import(`./sites/${siteKey}.ts`)) as CardSiteModule;
  if (site.SITE.design !== undefined && !(CARD_DESIGNS as readonly string[]).includes(site.SITE.design)) fail(`unknown design: ${site.SITE.design}`);
  if (!(FAMILY_KEYS as readonly string[]).includes(site.SITE.family)) fail(`unknown family: ${site.SITE.family}`);
  if (cardSkinKey(FAMILIES[site.SITE.family], site.SITE.skin) !== site.SITE.skin) fail(`skin ${site.SITE.skin} isn't one of the ${site.SITE.family} family's skins`);
  if (site.SITE.brandPalette !== undefined && !BrandPaletteSchema.safeParse(site.SITE.brandPalette).success) fail('site brandPalette is invalid');
  const profile = buildProfileRow(site.PROFILE);
  if (!profile.ok) fail(`profile invalid: ${profile.error}`);
  if (site.PHOTOS.length > GALLERY_LIMIT) fail(`at most ${GALLERY_LIMIT} photos (got ${site.PHOTOS.length})`);
  for (const p of site.PHOTOS) {
    if (MIME[extname(p.file).toLowerCase()] === undefined) fail(`not a photo: ${p.file}`);
    if (!existsSync(join(mediaDir, p.file))) fail(`missing photo: ${join(mediaDir, p.file)}`);
    if (p.caption.length > CAPTION_MAX) fail(`caption over ${CAPTION_MAX} characters: ${p.file}`);
  }
  process.stdout.write(`site: ${site.SITE.businessName} → ${site.SITE.subdomain}.bohdiai.com (${site.PHOTOS.length} photos)\n`);
  if (dry) {
    process.stdout.write('--dry: site module is valid; nothing written.\n');
    return;
  }

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('missing SUPABASE url / service key — run with --env-file=.env.local');
  const db = createClient<Database>(url, key);

  // 1) The tenant — found by subdomain, created active if missing.
  const { data: found, error: fErr } = await db.from('tenants').select('id').eq('subdomain', site.SITE.subdomain).is('deleted_at', null).maybeSingle();
  if (fErr !== null) fail(`tenant lookup failed: ${fErr.message}`);
  let tenantId = found?.id;
  if (tenantId === undefined) {
    const { data: created, error: cErr } = await db
      .from('tenants')
      .insert({ subdomain: site.SITE.subdomain, business_name: site.SITE.businessName, tier: 'basic', types: ['seller'], status: 'active' })
      .select('id')
      .single();
    if (cErr !== null) fail(`tenant create failed: ${cErr.message}`);
    tenantId = created.id;
    process.stdout.write(`created tenant ${tenantId}\n`);
  } else {
    process.stdout.write(`tenant exists ${tenantId}\n`);
  }
  const access = await ensureBuilderAccess(db, tenantId);
  if (!access.ok) fail(`builder access: ${access.error}`);
  if (access.added) process.stdout.write(`builder login added (${BUILDER_EMAIL})\n`);
  if (contactEmail !== undefined) {
    const { error } = await db.from('tenants').update({ contact_email: contactEmail }).eq('id', tenantId);
    if (error !== null) fail(`contact email update failed: ${error.message}`);
    process.stdout.write(`contact form → ${contactEmail}\n`);
  }

  // 2) Features: About you, Gallery and Market dates on, the catalog off.
  const { error: featErr } = await db.from('tenant_features').upsert([
    { tenant_id: tenantId, feature_key: 'profile', enabled: true },
    { tenant_id: tenantId, feature_key: 'gallery', enabled: true },
    { tenant_id: tenantId, feature_key: 'market_dates', enabled: true },
    { tenant_id: tenantId, feature_key: 'catalog', enabled: false },
  ]);
  if (featErr !== null) fail(`features failed: ${featErr.message}`);

  // 3) The published home page — the card envelope, replaced in place on re-runs.
  const tree = {
    root: { kind: 'archetype', archetypeKey: 'card', lookKey: site.SITE.skin, mood: site.SITE.family, accentOverride: null, brandPalette: site.SITE.brandPalette ?? null, content: site.SITE.design === undefined ? {} : { design: site.SITE.design } },
    meta: { title: site.SITE.businessName },
  } as unknown as Json;
  const { data: home, error: hErr } = await db.from('content_pages').select('id').eq('tenant_id', tenantId).eq('slug', '/').maybeSingle();
  if (hErr !== null) fail(`home lookup failed: ${hErr.message}`);
  if (home === null) {
    const { error } = await db.from('content_pages').insert({
      tenant_id: tenantId, slug: '/', page_type: 'home', title: site.SITE.businessName,
      status: 'published', is_system_page: true, is_in_nav: false, layout_tree: tree,
    });
    if (error !== null) fail(`home create failed: ${error.message}`);
  } else {
    const { error } = await db.from('content_pages').update({ layout_tree: tree, title: site.SITE.businessName, status: 'published' }).eq('id', home.id);
    if (error !== null) fail(`home update failed: ${error.message}`);
  }
  process.stdout.write('home page written\n');

  // 4) About you — only when there is none yet, or when asked to replace it.
  const { data: existingProfile, error: pErr } = await db.from('site_profiles').select('tenant_id').eq('tenant_id', tenantId).maybeSingle();
  if (pErr !== null) fail(`profile lookup failed: ${pErr.message}`);
  if (existingProfile === null || replaceProfile) {
    const { error } = await db.from('site_profiles').upsert({ tenant_id: tenantId, ...profile.row });
    if (error !== null) fail(`profile write failed: ${error.message}`);
    process.stdout.write('About you written\n');
  } else {
    process.stdout.write('About you kept (owner’s version; --replace-profile to overwrite)\n');
  }

  // 5) The gallery — only when empty, or when asked to replace it.
  const { data: existingItems, error: gErr } = await db.from('gallery_items').select('id').eq('tenant_id', tenantId);
  if (gErr !== null) fail(`gallery lookup failed: ${gErr.message}`);
  if ((existingItems ?? []).length > 0 && !replaceGallery) {
    process.stdout.write('gallery kept (owner’s version; --replace-gallery to overwrite)\n');
  } else {
    if ((existingItems ?? []).length > 0) {
      const { error } = await db.from('gallery_items').delete().eq('tenant_id', tenantId);
      if (error !== null) fail(`gallery clear failed: ${error.message}`);
    }
    const bucket = db.storage.from('tenant-media');
    for (const [position, p] of site.PHOTOS.entries()) {
      const bytes = readFileSync(join(mediaDir, p.file));
      const mime = MIME[extname(p.file).toLowerCase()] ?? fail(`unknown type: ${p.file}`);
      const path = `tenant/${tenantId}/gallery/${crypto.randomUUID()}${extname(p.file).toLowerCase()}`;
      const { error: upErr } = await bucket.upload(path, bytes, { contentType: mime, upsert: false });
      if (upErr !== null) fail(`upload ${p.file} failed: ${upErr.message}`);
      const publicUrl = bucket.getPublicUrl(path).data.publicUrl;
      const { data: up, error: rErr } = await db
        .from('uploads')
        .insert({ tenant_id: tenantId, storage_bucket: 'tenant-media', storage_path: path, public_url: publicUrl, file_name: p.file, mime_type: mime, size_bytes: bytes.length, source: 'imported', status: 'active' })
        .select('id')
        .single();
      if (rErr !== null) fail(`record ${p.file} failed: ${rErr.message}`);
      const caption = p.caption.trim();
      const { error: iErr } = await db.from('gallery_items').insert({ tenant_id: tenantId, upload_id: up.id, position, caption: caption === '' ? null : caption });
      if (iErr !== null) fail(`gallery add ${p.file} failed: ${iErr.message}`);
    }
    process.stdout.write(`gallery: ${site.PHOTOS.length} photos\n`);
  }
  process.stdout.write(`done — https://${site.SITE.subdomain}.bohdiai.com\n`);
}

main().catch((err: unknown) => fail(`build failed: ${err instanceof Error ? err.message : String(err)}`));
