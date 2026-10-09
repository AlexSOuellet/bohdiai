/**
 * Put a demo site back to a clean starting point for a recording (Saltmarsh & Lace
 * demo spec) — Claude's tool, not a user surface. Refuses any site that isn't a
 * demo (the demo_checkout switch), so a real client can never be reset.
 *
 *   npx tsx --env-file=.env.local scripts/demo-reset.ts <site> showcase|lite|full [--media <dir>]
 *
 * <site> names a module in scripts/sites/ (the same one build-card-site.ts uses).
 *   showcase  her gallery from the module's photos, no products, no testimonials,
 *             monthly billing 20 days from renewal, nothing waiting
 *   lite      showcase, then the real upgrade: each photo becomes a product with
 *             "Ask for price", and the Lite switches
 *   full      lite, then the Full switches, the module's CATALOG (prices and words
 *             for her converted pieces, plus new pieces with their own photos) and
 *             its TESTIMONIALS. The demo's normal starting point.
 *
 * --media names the folder holding CATALOG photos not uploaded yet; once uploaded
 * they are reused by file name, so later resets don't need it.
 */
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { slugify, uniqueSlug } from '../lib/catalog/slug';
import type { Database } from '../lib/database.types';
import { applyPlan } from '../lib/backend/plan/apply';
import { galleryToProducts } from '../lib/backend/plan/convert';
import { addDays, todayDay } from '../lib/backend/plan/billing';
import type { CardSiteModule } from './build-card-site';

type CatalogPiece = { photo: string; name: string; short: string; description: string; priceCents: number; onHome?: boolean; isNew?: boolean };
type DemoModule = CardSiteModule & { TESTIMONIALS?: { quote: string; name: string; detail?: string }[]; CATALOG?: CatalogPiece[] };

const MIME: Record<string, string> = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [siteKey, stage, ...rest] = process.argv.slice(2);
  const mediaAt = rest.indexOf('--media');
  const mediaDir = mediaAt >= 0 ? rest[mediaAt + 1] : undefined;
  if (siteKey === undefined || (stage !== 'showcase' && stage !== 'lite' && stage !== 'full')) fail('usage: demo-reset.ts <site> showcase|lite|full');
  const site = (await import(`./sites/${siteKey}.ts`)) as DemoModule;
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('missing SUPABASE url / service key — run with --env-file=.env.local');
  const db = createClient<Database>(url, key);

  const { data: tenant, error } = await db.from('tenants').select('id, time_zone').eq('subdomain', site.SITE.subdomain).is('deleted_at', null).maybeSingle();
  if (error !== null) fail(`site lookup failed: ${error.message}`);
  if (tenant === null) fail(`no site "${site.SITE.subdomain}" — build it first`);
  const { data: demo, error: dErr } = await db.from('tenant_features').select('enabled').eq('tenant_id', tenant.id).eq('feature_key', 'demo_checkout').maybeSingle();
  if (dErr !== null) fail(`demo check failed: ${dErr.message}`);
  if (demo?.enabled !== true) fail(`${site.SITE.subdomain} is not a demo site — refusing to reset it`);
  const tid = tenant.id;
  const step = async (what: string, run: () => PromiseLike<{ error: { message: string } | null }>): Promise<void> => {
    const { error: e } = await run();
    if (e !== null) fail(`${what} failed: ${e.message}`);
  };

  // Showcase: her gallery from the module's photos (their uploads, by file name), no products.
  const { data: uploads, error: uErr } = await db.from('uploads').select('id, file_name').eq('tenant_id', tid).eq('status', 'active');
  if (uErr !== null) fail(`uploads lookup failed: ${uErr.message}`);
  const byFile = new Map((uploads ?? []).map((u) => [u.file_name, u.id]));
  const gallery = site.PHOTOS.map((p, position) => ({ tenant_id: tid, upload_id: byFile.get(p.file) ?? fail(`no uploaded photo ${p.file} — run build-card-site first`), position, caption: p.caption }));
  const { data: listings, error: lErr } = await db.from('listings').select('id').eq('tenant_id', tid);
  if (lErr !== null) fail(`products lookup failed: ${lErr.message}`);
  const ids = (listings ?? []).map((l) => l.id);
  if (ids.length > 0) {
    await step('market pieces', () => db.from('market_listings').delete().in('listing_id', ids));
    await step('orders', () => db.from('orders').delete().eq('tenant_id', tid));
    await step('products', () => db.from('listings').delete().eq('tenant_id', tid));
  }
  await step('testimonials', () => db.from('site_testimonials').delete().eq('tenant_id', tid));
  await step('gallery clear', () => db.from('gallery_items').delete().eq('tenant_id', tid));
  await step('gallery', () => db.from('gallery_items').insert(gallery));
  const showcase = await applyPlan(db, tid, 'showcase');
  if (!showcase.ok) fail(`plan failed: ${showcase.error}`);
  await step('billing', () =>
    db
      .from('tenants')
      .update({ plan_billing: 'monthly', plan_renews_on: addDays(todayDay(tenant.time_zone), 20), plan_next: null, plan_next_billing: null, plan_next_gallery: null, plan_credit_cents: 0 })
      .eq('id', tid),
  );
  process.stdout.write(`showcase: ${gallery.length} photos, no products\n`);
  if (stage === 'showcase') return;

  // Lite: the real upgrade conversion.
  const made = await galleryToProducts(db, tid);
  if (!made.ok) fail(`products failed: ${made.error}`);
  const lite = await applyPlan(db, tid, 'lite');
  if (!lite.ok) fail(`plan failed: ${lite.error}`);
  process.stdout.write(`lite: ${made.added} products, "Ask for price"\n`);
  if (stage === 'lite') return;

  // Full: the Full switches, her priced catalog and her testimonials.
  const full = await applyPlan(db, tid, 'full');
  if (!full.ok) fail(`plan failed: ${full.error}`);
  const catalog = site.CATALOG ?? [];
  if (catalog.length > 0) {
    const bucket = db.storage.from('tenant-media');
    const photoId = async (file: string): Promise<string> => {
      const have = byFile.get(file);
      if (have !== undefined) return have;
      if (mediaDir === undefined) fail(`photo ${file} isn't uploaded yet — pass --media <dir>`);
      const bytes = readFileSync(join(mediaDir, file));
      const mime = MIME[extname(file).toLowerCase()] ?? fail(`unknown type: ${file}`);
      const path = `tenant/${tid}/products/${crypto.randomUUID()}${extname(file).toLowerCase()}`;
      const { error: upErr } = await bucket.upload(path, bytes, { contentType: mime, upsert: false });
      if (upErr !== null) fail(`upload ${file} failed: ${upErr.message}`);
      const { data: up, error: rErr } = await db
        .from('uploads')
        .insert({ tenant_id: tid, storage_bucket: 'tenant-media', storage_path: path, public_url: bucket.getPublicUrl(path).data.publicUrl, file_name: file, mime_type: mime, size_bytes: bytes.length, source: 'imported', status: 'active' })
        .select('id')
        .single();
      if (rErr !== null) fail(`record ${file} failed: ${rErr.message}`);
      byFile.set(file, up.id);
      return up.id;
    };
    const { data: now, error: nErr } = await db.from('listings').select('id, name, slug').eq('tenant_id', tid);
    if (nErr !== null) fail(`products lookup failed: ${nErr.message}`);
    const byName = new Map((now ?? []).map((l) => [l.name, l.id]));
    const slugs = new Set((now ?? []).map((l) => l.slug));
    // The home page holds five; clear it first so the catalog's picks fit.
    await step('home page', () => db.from('listings').update({ on_home: false }).eq('tenant_id', tid));
    const start = Date.now() + 1000;
    for (const [i, piece] of catalog.entries()) {
      const fields = { short_description: piece.short, description: piece.description, base_price_cents: piece.priceCents, on_home: piece.onHome === true, is_new: piece.isNew === true };
      const id = byName.get(piece.name);
      if (id !== undefined) {
        await step(piece.name, () => db.from('listings').update(fields).eq('id', id));
        continue;
      }
      const media = await photoId(piece.photo);
      const slug = uniqueSlug(slugify(piece.name), slugs);
      slugs.add(slug);
      const at = new Date(start + i).toISOString();
      await step(piece.name, () =>
        db.from('listings').insert({ tenant_id: tid, listing_type: 'product', status: 'active', requires_shipping: true, name: piece.name, slug, media_ids: [media], created_at: at, published_at: at, ...fields }),
      );
    }
    process.stdout.write(`full: ${catalog.length} priced products\n`);
  }
  const words = site.TESTIMONIALS ?? [];
  if (words.length > 0) {
    await step('testimonials', () => db.from('site_testimonials').insert(words.map((t, position) => ({ tenant_id: tid, position, quote: t.quote, name: t.name, detail: t.detail ?? null }))));
  }
  process.stdout.write(`full: ${words.length} testimonials\n`);
}

main().catch((err: unknown) => fail(`failed: ${err instanceof Error ? err.message : String(err)}`));
