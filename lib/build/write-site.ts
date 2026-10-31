/**
 * Writes a planned site into its site record (the one builder, Modular Plan 4b):
 * its plan's switches, the page record (settings only), About you, the opening,
 * the photo behind the page, section words, gallery, collections, products,
 * markets, testimonials and every word the site shows. Each photo is uploaded
 * once, as the site's own. Alex's account is made an admin of the site.
 *
 * Shared by the hand-run builder (scripts/build-site.ts) and the automatic build
 * after onboarding (lib/build/site-build.ts, Session 119). The photos come from
 * `read`, so it runs on a computer (files) or on Cloudflare (storage) alike.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/database.types';
import type { SitePlanned } from './site-plan';
import { writeProfileHomes } from '@/lib/backend/profile/homes';
import { applyPlan } from '@/lib/backend/plan/apply';
import { ensureBuilderAccess } from '@/lib/backend/builder-access';
import { NO_PRICE_CENTS } from '@/lib/catalog/price';

type Db = SupabaseClient<Database>;
type Uploaded = { id: string; url: string };

const MIME: Record<string, string> = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.webm': 'video/webm' };

/** The bytes of one of the plan's photos, by its file name. */
export type ReadPhoto = (file: string) => Promise<Uint8Array>;

function extOf(file: string): string {
  const dot = file.lastIndexOf('.');
  return dot < 0 ? '' : file.slice(dot).toLowerCase();
}

async function check<T>(what: string, run: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await run;
  if (error !== null) throw new Error(`${what} failed: ${error.message}`);
  return data;
}

/** Like check, for a write that returns the new row: no row is a failure too. */
async function created<T>(what: string, run: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<NonNullable<T>> {
  const data = await check(what, run);
  if (data === null || data === undefined) throw new Error(`${what} failed: nothing came back`);
  return data;
}

/** Uploads each photo once, as the site's own, and records it. */
async function uploadAll(db: Db, tenantId: string, read: ReadPhoto, plan: SitePlanned): Promise<Map<string, Uploaded>> {
  const alts = new Map<string, string>();
  const note = (file: string | undefined, alt: string): void => {
    if (file !== undefined && !alts.has(file)) alts.set(file, alt);
  };
  note(plan.portrait?.file, plan.portrait?.alt ?? '');
  if (plan.scene !== null && 'photo' in plan.scene) {
    note(plan.scene.photo.file, plan.scene.photo.alt);
    note(plan.scene.video?.file, plan.scene.video?.alt ?? '');
  }
  note(plan.moment?.media?.file, plan.moment?.media?.alt ?? '');
  note(plan.moment?.poster?.file, plan.moment?.poster?.alt ?? '');
  for (const p of plan.moment?.photos ?? []) note(p.file, p.alt);
  for (const g of plan.gallery) note(g.photo.file, g.photo.alt);
  for (const p of plan.products) for (const ph of p.photos) note(ph.file, ph.alt === '' ? p.name : ph.alt);

  const bucket = db.storage.from('tenant-media');
  const out = new Map<string, Uploaded>();
  for (const [file, alt] of alts) {
    const ext = extOf(file);
    const mime = MIME[ext];
    if (mime === undefined) throw new Error(`not a photo or video: ${file}`);
    const bytes = await read(file);
    const path = `tenant/${tenantId}/site/${crypto.randomUUID()}${ext}`;
    const { error: upErr } = await bucket.upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr !== null) throw new Error(`upload ${file} failed: ${upErr.message}`);
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

/** Everything the plan holds, into the site record `tid`. */
export async function writeSite(db: Db, tid: string, plan: SitePlanned, read: ReadPhoto): Promise<void> {
  const applied = await applyPlan(db, tid, plan.plan);
  if (!applied.ok) throw new Error(`plan failed: ${applied.error}`);
  await check('switches', db.from('tenant_features').upsert(plan.features.map((f) => ({ tenant_id: tid, feature_key: f.key, enabled: f.enabled }))));

  // The page record: settings only.
  await check(
    'page record',
    db.from('content_pages').insert({
      tenant_id: tid, slug: '/', page_type: 'home', title: plan.businessName, status: 'published', is_system_page: true, is_in_nav: false,
      layout_tree: { root: plan.pageRoot, meta: { title: plan.businessName } } as unknown as Json,
    }),
  );

  // Photos, then every home that uses them.
  const up = await uploadAll(db, tid, read, plan);
  const idOf = (file: string): string => {
    const found = up.get(file);
    if (found === undefined) throw new Error(`photo not uploaded: ${file}`);
    return found.id;
  };
  await writeProfileHomes(db, tid, plan.profile, { portrait_upload_id: plan.portrait === null ? null : idOf(plan.portrait.file) });
  if (plan.moment !== null) {
    const m = plan.moment;
    await check('the opening', db.from('site_moments').insert({ tenant_id: tid, ...m.row, media_upload_id: m.media === null ? null : idOf(m.media.file), poster_upload_id: m.poster === null ? null : idOf(m.poster.file) }));
    if (m.photos.length > 0) await check('opening photos', db.from('site_moment_photos').insert(m.photos.map((p, position) => ({ tenant_id: tid, upload_id: idOf(p.file), position }))));
  }
  // Scenic: the photo behind the page, a library scene or its own upload.
  if (plan.scene !== null) {
    const scene = plan.scene;
    await check('the photo behind the page', db.from('site_scenes').insert('library' in scene ? { tenant_id: tid, scene_key: scene.library } : { tenant_id: tid, upload_id: idOf(scene.photo.file), tone: scene.tone ?? 'light', video_upload_id: scene.video === undefined ? null : idOf(scene.video.file) }));
  }
  if (plan.sections.length > 0) await check('section words', db.from('site_sections').insert(plan.sections.map((s) => ({ tenant_id: tid, section: s.section, ...s.row }))));
  if (plan.gallery.length > 0) await check('gallery', db.from('gallery_items').insert(plan.gallery.map((g, position) => ({ tenant_id: tid, upload_id: idOf(g.photo.file), caption: g.caption, position }))));

  // Collections and products.
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
      const collectionId = colIds.get(slug);
      if (collectionId === undefined) throw new Error(`no collection ${slug}`);
      links.push({ tenant_id: tid, listing_id: row.id, collection_id: collectionId, position });
    }
  }
  if (links.length > 0) await check('collection pieces', db.from('listing_collections').insert(links));

  // Markets, testimonials and every word.
  if (plan.markets.length > 0) await check('markets', db.from('events').insert(plan.markets.map((m) => ({ tenant_id: tid, ...m, status: 'upcoming' }))));
  if (plan.testimonials.length > 0) await check('testimonials', db.from('site_testimonials').insert(plan.testimonials.map((t, position) => ({ tenant_id: tid, ...t, position }))));
  for (let i = 0; i < plan.words.length; i += 500) {
    await check('words', db.from('site_words').insert(plan.words.slice(i, i + 500).map((w) => ({ tenant_id: tid, key: w.key, text: w.text }))));
  }

  const access = await ensureBuilderAccess(db, tid);
  if (!access.ok) throw new Error(`admin access failed: ${access.error}`);
}
