/**
 * The one builder (Modular Plan 4b) — Claude's tool, not a user surface. Builds a
 * NEW site, on any family (or the shoreline / show reel page), from one content
 * file: scripts/sites/<site>.ts exporting SITE (a SiteFile, lib/build/site-plan.ts).
 *
 *   npx tsx --env-file=.env.local scripts/build-site.ts <site | path/to/site.ts> --media <dir> [--live] [--dry]
 *
 * The whole content file is checked first (lib/build/site-plan) and nothing is
 * written unless all of it is right. Then: the site (a private draft unless
 * --live), its plan's switches, the page record (settings only), About you, the
 * opening and section words (families), gallery, collections, products, markets,
 * testimonials and every word the site shows; each photo is uploaded once as the
 * site's own. Refuses a subdomain that's taken: an existing site is changed in its
 * backend, not rebuilt. Alex's account is made an admin of the site. Prints the
 * private preview link.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '../lib/database.types';
import { planSite, type SiteFile, type SitePlanned } from '../lib/build/site-plan';
import { applyPlan } from '../lib/backend/plan/apply';
import { nextRenewal, todayDay } from '../lib/backend/plan/billing';
import { BUILDER_EMAIL, ensureBuilderAccess } from '../lib/backend/builder-access';
import { previewCode, previewLink } from '../lib/storefront/draft-preview';
import { NO_PRICE_CENTS } from '../lib/catalog/price';

type Db = ReturnType<typeof createClient<Database>>;
type Uploaded = { id: string; url: string };

const MIME: Record<string, string> = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.webm': 'video/webm' };

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function check<T>(what: string, run: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await run;
  if (error !== null) fail(`${what} failed: ${error.message}`);
  return data;
}

/** Like check, for a write that returns the new row: no row is a failure too. */
async function created<T>(what: string, run: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<NonNullable<T>> {
  const data = await check(what, run);
  if (data === null || data === undefined) fail(`${what} failed: nothing came back`);
  return data;
}

/** Uploads each photo once, as the site's own, and records it. */
async function uploadAll(db: Db, tenantId: string, mediaDir: string, plan: SitePlanned): Promise<Map<string, Uploaded>> {
  const alts = new Map<string, string>();
  const note = (file: string | undefined, alt: string): void => {
    if (file !== undefined && !alts.has(file)) alts.set(file, alt);
  };
  note(plan.portrait?.file, plan.portrait?.alt ?? '');
  if (plan.scene !== null && 'photo' in plan.scene) note(plan.scene.photo.file, plan.scene.photo.alt);
  note(plan.moment?.media?.file, plan.moment?.media?.alt ?? '');
  note(plan.moment?.poster?.file, plan.moment?.poster?.alt ?? '');
  for (const p of plan.moment?.photos ?? []) note(p.file, p.alt);
  for (const g of plan.gallery) note(g.photo.file, g.photo.alt);
  for (const p of plan.products) for (const ph of p.photos) note(ph.file, ph.alt === '' ? p.name : ph.alt);

  const bucket = db.storage.from('tenant-media');
  const out = new Map<string, Uploaded>();
  for (const [file, alt] of alts) {
    const ext = extname(file).toLowerCase();
    const mime = MIME[ext] ?? fail(`not a photo or video: ${file}`);
    const bytes = readFileSync(join(mediaDir, file));
    const path = `tenant/${tenantId}/site/${crypto.randomUUID()}${ext}`;
    const { error: upErr } = await bucket.upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr !== null) fail(`upload ${file} failed: ${upErr.message}`);
    const url = bucket.getPublicUrl(path).data.publicUrl;
    const row = await created(
      `record ${file}`,
      db
        .from('uploads')
        .insert({ tenant_id: tenantId, storage_bucket: 'tenant-media', storage_path: path, public_url: url, file_name: file, mime_type: mime, size_bytes: bytes.length, alt_text: alt === '' ? null : alt, source: 'imported', status: 'active' })
        .select('id')
        .single(),
    );
    out.set(file, { id: row.id, url });
  }
  return out;
}

async function main(): Promise<void> {
  const [siteKey, ...rest] = process.argv.slice(2);
  const mediaDir = flag(rest, '--media');
  const live = rest.includes('--live');
  const dry = rest.includes('--dry');
  if (siteKey === undefined || mediaDir === undefined) fail('usage: build-site.ts <site> --media <dir> [--live] [--dry]');

  // A site name is scripts/sites/<site>.ts; a path to a .ts file works too (a throwaway test site).
  const modUrl = siteKey.endsWith('.ts') ? pathToFileURL(resolve(siteKey)).href : `./sites/${siteKey}.ts`;
  const mod = (await import(modUrl)) as { SITE?: SiteFile };
  if (mod.SITE === undefined) fail(`${siteKey} has no SITE`);
  const planned = planSite(mod.SITE);
  if (!planned.ok) fail(`the content file isn't right yet:\n  ${planned.errors.join('\n  ')}`);
  const plan = planned.plan;
  for (const file of plan.files) if (!existsSync(join(mediaDir, file))) fail(`missing in ${mediaDir}: ${file}`);
  process.stdout.write(`site: ${plan.businessName} → ${plan.subdomain} (${plan.products.length} pieces, ${plan.files.length} photos, ${plan.words.length} words)\n`);
  if (dry) {
    process.stdout.write('--dry: the content file is right; nothing written.\n');
    return;
  }

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('missing SUPABASE url / service key: run with --env-file=.env.local');
  const db = createClient<Database>(url, key, { auth: { persistSession: false } });

  if (plan.niche !== null) {
    const niche = await check('niche check', db.from('niches').select('slug').eq('slug', plan.niche).maybeSingle());
    if (niche === null) fail(`no niche called ${plan.niche}`);
  }
  const taken = await check('subdomain check', db.from('tenants').select('id').eq('subdomain', plan.subdomain).maybeSingle());
  if (taken !== null) fail(`${plan.subdomain} is taken: an existing site is changed in its backend, not rebuilt`);

  // 1) The site, its plan and its switches.
  const tenant = await created(
    'site create',
    db.from('tenants').insert({ subdomain: plan.subdomain, business_name: plan.businessName, tier: 'basic', types: ['seller'], status: live ? 'active' : 'draft', contact_email: plan.contactEmail, primary_niche: plan.niche }).select('id').single(),
  );
  const tid = tenant.id;
  process.stdout.write(`created ${live ? 'live' : 'draft'} site ${plan.subdomain}\n`);
  const applied = await applyPlan(db, tid, plan.plan);
  if (!applied.ok) fail(`plan failed: ${applied.error}`);
  await check('billing start', db.from('tenants').update({ plan_billing: 'monthly', plan_renews_on: nextRenewal(todayDay(null), 'monthly'), plan_next: null }).eq('id', tid));
  await check('switches', db.from('tenant_features').upsert(plan.features.map((f) => ({ tenant_id: tid, feature_key: f.key, enabled: f.enabled }))));

  // 2) The page record: settings only.
  await check(
    'page record',
    db.from('content_pages').insert({
      tenant_id: tid, slug: '/', page_type: 'home', title: plan.businessName, status: 'published', is_system_page: true, is_in_nav: false,
      layout_tree: { root: plan.pageRoot, meta: { title: plan.businessName } } as unknown as Json,
    }),
  );

  // 3) Photos, then every home that uses them.
  const up = await uploadAll(db, tid, mediaDir, plan);
  const idOf = (file: string): string => up.get(file)?.id ?? fail(`photo not uploaded: ${file}`);
  await check('About you', db.from('site_profiles').insert({ tenant_id: tid, ...plan.profile, portrait_upload_id: plan.portrait === null ? null : idOf(plan.portrait.file) }));
  if (plan.moment !== null) {
    const m = plan.moment;
    await check('the opening', db.from('site_moments').insert({ tenant_id: tid, ...m.row, media_upload_id: m.media === null ? null : idOf(m.media.file), poster_upload_id: m.poster === null ? null : idOf(m.poster.file) }));
    if (m.photos.length > 0) await check('opening photos', db.from('site_moment_photos').insert(m.photos.map((p, position) => ({ tenant_id: tid, upload_id: idOf(p.file), position }))));
  }
  // Scenic: the photo behind the page, a library scene or its own upload.
  if (plan.scene !== null) {
    const scene = plan.scene;
    await check('the photo behind the page', db.from('site_scenes').insert('library' in scene ? { tenant_id: tid, scene_key: scene.library } : { tenant_id: tid, upload_id: idOf(scene.photo.file) }));
  }
  if (plan.sections.length > 0) await check('section words', db.from('site_sections').insert(plan.sections.map((s) => ({ tenant_id: tid, section: s.section, ...s.row }))));
  if (plan.gallery.length > 0) await check('gallery', db.from('gallery_items').insert(plan.gallery.map((g, position) => ({ tenant_id: tid, upload_id: idOf(g.photo.file), caption: g.caption, position }))));

  // 4) Collections and products.
  const colIds = new Map<string, string>();
  for (const [position, c] of plan.collections.entries()) {
    const row = await created(`collection ${c.slug}`, db.from('collections').insert({ tenant_id: tid, slug: c.slug, name: c.name, description: c.description, position, status: 'active', is_featured: false }).select('id').single());
    colIds.set(c.slug, row.id);
  }
  const links: { tenant_id: string; listing_id: string; collection_id: string; position: number }[] = [];
  const placeIn = new Map<string, number>();
  for (const [i, p] of plan.products.entries()) {
    const row = await created(
      `piece ${p.slug}`,
      db
        .from('listings')
        .insert({
          tenant_id: tid, listing_type: 'product', slug: p.slug, name: p.name, short_description: p.short, description: p.description,
          base_price_cents: p.priceCents ?? NO_PRICE_CENTS, status: 'active', inventory_tracked: true, inventory_count: p.stock, requires_shipping: true,
          media_ids: p.photos.map((ph) => idOf(ph.file)), on_home: p.onHome, is_new: p.isNew,
          primary_collection_id: p.collections[0] === undefined ? null : (colIds.get(p.collections[0]) ?? null),
          published_at: new Date(Date.now() + i).toISOString(),
        })
        .select('id')
        .single(),
    );
    for (const slug of p.collections) {
      const position = placeIn.get(slug) ?? 0;
      placeIn.set(slug, position + 1);
      links.push({ tenant_id: tid, listing_id: row.id, collection_id: colIds.get(slug) ?? fail(`no collection ${slug}`), position });
    }
  }
  if (links.length > 0) await check('collection pieces', db.from('listing_collections').insert(links));

  // 5) Markets, testimonials and every word.
  if (plan.markets.length > 0) await check('markets', db.from('events').insert(plan.markets.map((m) => ({ tenant_id: tid, ...m, status: 'upcoming' }))));
  if (plan.testimonials.length > 0) await check('testimonials', db.from('site_testimonials').insert(plan.testimonials.map((t, position) => ({ tenant_id: tid, ...t, position }))));
  for (let i = 0; i < plan.words.length; i += 500) {
    await check('words', db.from('site_words').insert(plan.words.slice(i, i + 500).map((w) => ({ tenant_id: tid, key: w.key, text: w.text }))));
  }

  const access = await ensureBuilderAccess(db, tid);
  if (!access.ok) fail(`admin access failed: ${access.error}`);
  process.stdout.write(
    `built: ${plan.sections.length} section rows, ${plan.collections.length} collections, ${plan.products.length} pieces, ${plan.markets.length} markets, ${plan.testimonials.length} testimonials, ${plan.words.length} words\n${BUILDER_EMAIL} is an admin of the site\n`,
  );
  const code = await previewCode(process.env['BACKEND_SESSION_SECRET'], plan.subdomain);
  process.stdout.write(live ? `live: https://${plan.subdomain}.bohdiai.com\n` : code === null ? 'no preview link: BACKEND_SESSION_SECRET is missing\n' : `preview: ${previewLink(plan.subdomain, code)}\n`);
}

main().catch((err: unknown) => fail(`build failed: ${err instanceof Error ? err.message : String(err)}`));
