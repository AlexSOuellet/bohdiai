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
 * Every reset anchors the timeline to today (tenants.demo_day and demo_week_day).
 * A database job (migrations 20261012000001, 20261014000003) moves the timeline
 * forward by whole weeks, so fairs stay on Saturdays, and today's market to today.
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
import { demoMarketDay } from '../lib/backend/demo-days';
import type { CardSiteModule } from './build-card-site';

type CatalogPiece = { photo: string; extraPhotos?: readonly string[]; name: string; short: string; description: string; priceCents: number; onHome?: boolean; isNew?: boolean };
type DemoModule = CardSiteModule & {
  TESTIMONIALS?: { quote: string; name: string; detail?: string }[];
  CATALOG?: CatalogPiece[];
  FULL_DEMO?: FullDemo;
};
type FullDemo = {
  download: { file: string; name: string; short: string; description: string; priceCents: number; photo: string };
  pay: { venmo: string; cashapp: string; zelle: string };
  sale: { name: string; percentOff: number; startedDaysAgo: number; endsInDays: number };
  code: { name: string; code: string; percentOff: number };
  collections: readonly { name: string; pieces: readonly string[] }[];
  markets: readonly {
    day: number;
    name: string;
    town: string;
    hours: string;
    address: string;
    booth: string;
    costs: readonly (readonly [string, number])[];
    rating?: number;
    goBack?: string;
    review?: string;
    sales?: readonly (readonly [string, string])[];
    bring?: readonly string[];
    holds?: readonly (readonly [string, string, string])[];
  }[];
  orders: readonly { daysAgo: number; name: string; email: string; phone: string; status: string; note: string; pieces: readonly string[]; code?: boolean }[];
};

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
  await step('orders', () => db.from('orders').delete().eq('tenant_id', tid));
  if (ids.length > 0) {
    await step('market pieces', () => db.from('market_listings').delete().in('listing_id', ids));
    await step('products', () => db.from('listings').delete().eq('tenant_id', tid));
  }
  await step('collections', () => db.from('collections').delete().eq('tenant_id', tid));
  await step('promotions', () => db.from('promotions').delete().eq('tenant_id', tid));
  await step('payment details', () => db.from('payment_settings').delete().eq('tenant_id', tid));
  await step('markets', () => db.from('events').delete().eq('tenant_id', tid));
  const dates = site.DATES ?? [];
  if (dates.length > 0) {
    await step('market dates', () => db.from('events').insert(dates.map((d) => ({ tenant_id: tid, name: d.name, event_date: d.date, end_date: d.endDate === '' ? null : d.endDate, location: d.town === '' ? null : d.town }))));
  }
  await step('testimonials', () => db.from('site_testimonials').delete().eq('tenant_id', tid));
  await step('gallery clear', () => db.from('gallery_items').delete().eq('tenant_id', tid));
  await step('gallery', () => db.from('gallery_items').insert(gallery));
  const showcase = await applyPlan(db, tid, 'showcase');
  if (!showcase.ok) fail(`plan failed: ${showcase.error}`);
  await step('billing', () =>
    db
      .from('tenants')
      .update({ plan_billing: 'monthly', plan_renews_on: addDays(todayDay(tenant.time_zone), 20), plan_next: null, plan_next_billing: null, plan_next_gallery: null, plan_credit_cents: 0, demo_day: todayDay(tenant.time_zone), demo_week_day: todayDay(tenant.time_zone) })
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
      const media = [await photoId(piece.photo)];
      for (const extra of piece.extraPhotos ?? []) media.push(await photoId(extra));
      const fields = { short_description: piece.short, description: piece.description, base_price_cents: piece.priceCents, on_home: piece.onHome === true, is_new: piece.isNew === true, media_ids: media };
      const id = byName.get(piece.name);
      if (id !== undefined) {
        await step(piece.name, () => db.from('listings').update(fields).eq('id', id));
        continue;
      }
      const slug = uniqueSlug(slugify(piece.name), slugs);
      slugs.add(slug);
      const at = new Date(start + i).toISOString();
      await step(piece.name, () =>
        db.from('listings').insert({ tenant_id: tid, listing_type: 'product', status: 'active', requires_shipping: true, name: piece.name, slug, created_at: at, published_at: at, ...fields }),
      );
    }
    process.stdout.write(`full: ${catalog.length} priced products\n`);
  }
  const extras = site.FULL_DEMO;
  if (extras !== undefined) await fullDemo(db, tid, tenant.time_zone, extras, photoIdFor(db, tid, byFile, mediaDir), step);
  const words = site.TESTIMONIALS ?? [];
  if (words.length > 0) {
    await step('testimonials', () => db.from('site_testimonials').insert(words.map((t, position) => ({ tenant_id: tid, position, quote: t.quote, name: t.name, detail: t.detail ?? null }))));
  }
  process.stdout.write(`full: ${words.length} testimonials\n`);
}

/** Uploads a photo the first time (from --media), then reuses it by file name. */
function photoIdFor(db: Db, tid: string, byFile: Map<string, string>, mediaDir: string | undefined): (file: string, bucket?: string) => Promise<string> {
  return async (file, bucketName = 'tenant-media') => {
    const have = byFile.get(file);
    if (have !== undefined) return have;
    if (mediaDir === undefined) fail(`file ${file} isn't uploaded yet — pass --media <dir>`);
    const bytes = readFileSync(join(mediaDir, file));
    const mime = file.endsWith('.pdf') ? 'application/pdf' : (MIME[extname(file).toLowerCase()] ?? fail(`unknown type: ${file}`));
    const folder = bucketName === 'tenant-files' ? 'files' : 'products';
    const path = `tenant/${tid}/${folder}/${crypto.randomUUID()}${extname(file).toLowerCase()}`;
    const bucket = db.storage.from(bucketName);
    const { error: upErr } = await bucket.upload(path, bytes, { contentType: mime, upsert: false });
    if (upErr !== null) fail(`upload ${file} failed: ${upErr.message}`);
    const publicUrl = bucketName === 'tenant-files' ? null : bucket.getPublicUrl(path).data.publicUrl;
    const { data: up, error: rErr } = await db
      .from('uploads')
      .insert({ tenant_id: tid, storage_bucket: bucketName, storage_path: path, public_url: publicUrl, file_name: file, mime_type: mime, size_bytes: bytes.length, source: 'imported', status: 'active' })
      .select('id')
      .single();
    if (rErr !== null) fail(`record ${file} failed: ${rErr.message}`);
    byFile.set(file, up.id);
    return up.id;
  };
}

type Db = ReturnType<typeof createClient<Database>>;
type Step = (what: string, run: () => PromiseLike<{ error: { message: string } | null }>) => Promise<void>;

/** Fills in everything else a Full site has, all made up for the demo, dated from today. */
async function fullDemo(db: Db, tid: string, timeZone: string | null, demo: FullDemo, photoId: (file: string, bucket?: string) => Promise<string>, step: Step): Promise<void> {
  const today = todayDay(timeZone);
  const day = (offset: number): string => addDays(today, offset);
  const at = (d: string, hour: number): string => `${d}T${String(hour).padStart(2, '0')}:15:00Z`;

  // A download product: the sealing guide.
  const file = await photoId(demo.download.file, 'tenant-files');
  const cover = await photoId(demo.download.photo);
  const { data: existing } = await db.from('listings').select('slug').eq('tenant_id', tid);
  const slug = uniqueSlug(slugify(demo.download.name), new Set((existing ?? []).map((l) => l.slug)));
  const made = new Date(Date.now() + 5000).toISOString();
  await step('download', () =>
    db.from('listings').insert({ tenant_id: tid, listing_type: 'digital_product', status: 'active', requires_shipping: false, name: demo.download.name, slug, short_description: demo.download.short, description: demo.download.description, base_price_cents: demo.download.priceCents, media_ids: [cover], file_upload_id: file, created_at: made, published_at: made }),
  );

  const { data: pieces, error: pErr } = await db.from('listings').select('id, name, base_price_cents').eq('tenant_id', tid);
  if (pErr !== null) fail(`products lookup failed: ${pErr.message}`);
  const piece = (name: string): { id: string; name: string; base_price_cents: number } => (pieces ?? []).find((p) => p.name === name) ?? fail(`no product named ${name}`);

  // Getting paid, a running sale and a code.
  await step('payment details', () => db.from('payment_settings').upsert({ tenant_id: tid, venmo: demo.pay.venmo, venmo_on: true, cashapp: demo.pay.cashapp, cashapp_on: true, zelle: demo.pay.zelle, zelle_on: true, cash_on: true }));
  await step('sale', () => db.from('promotions').insert({ tenant_id: tid, kind: 'sale', name: demo.sale.name, percent_off: demo.sale.percentOff, starts_on: day(-demo.sale.startedDaysAgo), ends_on: day(demo.sale.endsInDays), active: true }));
  await step('code', () => db.from('promotions').insert({ tenant_id: tid, kind: 'code', name: demo.code.name, code: demo.code.code, percent_off: demo.code.percentOff, active: true }));

  // Collections, in order, each with its pieces in order.
  for (const [position, c] of demo.collections.entries()) {
    const { data: col, error } = await db.from('collections').insert({ tenant_id: tid, name: c.name, slug: slugify(c.name), position, status: 'active' }).select('id').single();
    if (error !== null) fail(`collection ${c.name} failed: ${error.message}`);
    await step(c.name, () => db.from('listing_collections').insert(c.pieces.map((n, i) => ({ tenant_id: tid, listing_id: piece(n).id, collection_id: col.id, position: i }))));
  }

  // Markets: last year, this year, today and coming up, with costs, reviews and sales.
  await step('markets clear', () => db.from('events').delete().eq('tenant_id', tid));
  let orderNumber = 1001;
  const orderRow = (o: { name: string; email: string; phone?: string; status: string; source: string; method?: string; eventId?: string; created: string; note?: string; totalCents: number; subtotalCents: number; discountCents?: number; discountLabel?: string | undefined; paid?: boolean; buyerPaid?: boolean }) => ({
    tenant_id: tid,
    order_number: String(orderNumber++),
    customer_name: o.name,
    customer_email: o.email,
    customer_phone: o.phone === undefined || o.phone === '' ? null : o.phone,
    status: o.status,
    source: o.source,
    payment_method: o.method ?? null,
    event_id: o.eventId ?? null,
    customer_note: o.note === undefined || o.note === '' ? null : o.note,
    subtotal_cents: o.subtotalCents,
    discount_cents: o.discountCents ?? 0,
    discount_label: o.discountLabel ?? null,
    total_cents: o.totalCents,
    created_at: o.created,
    paid_at: o.paid === true ? o.created : null,
    buyer_paid_at: o.buyerPaid === true ? o.created : null,
  });
  const addOrder = async (row: ReturnType<typeof orderRow>, items: { id: string; name: string; cents: number }[]): Promise<void> => {
    const { data: order, error } = await db.from('orders').insert(row).select('id').single();
    if (error !== null) fail(`order failed: ${error.message}`);
    await step('order items', () => db.from('order_items').insert(items.map((it) => ({ order_id: order.id, tenant_id: tid, listing_id: it.id, name_snapshot: it.name, unit_price_cents: it.cents, quantity: 1, subtotal_cents: it.cents }))));
  };
  const buyers = ['Maria', 'Tom', 'Rachel', 'Linda', 'Joe', 'Kate', 'Paul', 'Sue', 'Ben', 'Amy'];
  for (const m of demo.markets) {
    // Fairs land on Saturdays; today's market stays today (lib/backend/demo-days).
    const date = demoMarketDay(today, m.day);
    const { data: ev, error } = await db
      .from('events')
      .insert({ tenant_id: tid, name: m.name, event_date: date, location: m.town, hours: m.hours, address: m.address, booth: m.booth, status: m.day < 0 ? 'completed' : 'upcoming', rating: m.rating ?? null, go_back: m.goBack ?? null, review: m.review ?? null })
      .select('id')
      .single();
    if (error !== null) fail(`market ${m.name} failed: ${error.message}`);
    if (m.costs.length > 0) await step('costs', () => db.from('event_expenses').insert(m.costs.map(([description, amount]) => ({ event_id: ev.id, tenant_id: tid, description, amount_cents: amount }))));
    if (m.bring !== undefined) await step('bringing', () => db.from('market_listings').insert((m.bring ?? []).map((n, position) => ({ event_id: ev.id, listing_id: piece(n).id, tenant_id: tid, position }))));
    for (const [i, [n, method]] of (m.sales ?? []).entries()) {
      const p = piece(n);
      await addOrder(orderRow({ name: buyers[i % buyers.length] ?? 'Buyer', email: 'market-sale@example.com', status: 'paid', source: 'market_mode', method, eventId: ev.id, created: at(date, 14 + i), subtotalCents: p.base_price_cents, totalCents: p.base_price_cents, paid: true }), [{ id: p.id, name: p.name, cents: p.base_price_cents }]);
    }
    for (const [i, [n, method, who]] of (m.holds ?? []).entries()) {
      const p = piece(n);
      await addOrder(orderRow({ name: who, email: `${who.toLowerCase()}@example.com`, status: 'pending', source: 'market_mode', method, eventId: ev.id, created: at(date, 13 + i), subtotalCents: p.base_price_cents, totalCents: p.base_price_cents, buyerPaid: true }), [{ id: p.id, name: p.name, cents: p.base_price_cents }]);
    }
  }

  // Online orders in every state.
  for (const o of demo.orders) {
    const items = o.pieces.map((n) => {
      const p = piece(n);
      return { id: p.id, name: p.name, cents: p.base_price_cents };
    });
    const subtotal = items.reduce((sum, it) => sum + it.cents, 0);
    const off = o.code === true ? Math.round((subtotal * demo.code.percentOff) / 100) : 0;
    const created = at(day(-o.daysAgo), 16);
    await addOrder(
      orderRow({ name: o.name, email: o.email, phone: o.phone, status: o.status, source: 'storefront', created, note: o.note, subtotalCents: subtotal, discountCents: off, discountLabel: o.code === true ? `${demo.code.code} (${demo.code.percentOff}% off)` : undefined, totalCents: subtotal - off, paid: o.status === 'paid' || o.status === 'fulfilled' }),
      items,
    );
  }
  process.stdout.write(`full: download, payments, sale and code, ${demo.collections.length} collections, ${demo.markets.length} markets, ${demo.orders.length} orders\n`);
}

main().catch((err: unknown) => fail(`failed: ${err instanceof Error ? err.message : String(err)}`));
