/**
 * Copy an old family sample onto a fresh DRAFT site that keeps its content in
 * the homes (Modular Plan step 3) — Claude's tool, not a user surface.
 *
 *   npx tsx --env-file=.env.local scripts/copy-family-sample.ts <from-subdomain> <to-subdomain>
 *
 * The sample is only read, never changed. The new site gets the same name, look
 * and products, a settings-only page record, and every word in its home: the
 * moment, each section's words, About you, testimonials and dated markets. Its
 * photos and videos become proper uploads that point at the same stored files.
 * Refuses when the new subdomain is taken. Prints the private preview link.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '../lib/database.types';
import { holdsLegacyContent } from '../lib/archetypes/main-street/from-homes';
import { homesFromLegacy } from '../lib/archetypes/main-street/to-homes';
import type { MainStreetView } from '../lib/archetypes/main-street/schemas';
import { BUILDER_EMAIL, ensureBuilderAccess } from '../lib/backend/builder-access';
import { previewCode, previewLink } from '../lib/storefront/draft-preview';

type Db = ReturnType<typeof createClient<Database>>;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const STORAGE_PATH = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;
const MIME_BY_EXT: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/** Record a file already in our storage as an upload of the new site. */
async function recordUpload(db: Db, tenantId: string, url: string, alt: string): Promise<string> {
  const m = STORAGE_PATH.exec(new URL(url).pathname);
  if (m === null || m[1] === undefined || m[2] === undefined) fail(`not one of our stored files: ${url}`);
  const head = await fetch(url, { method: 'HEAD' });
  if (!head.ok) fail(`the stored file can't be reached (${head.status}): ${url}`);
  const ext = (m[2].split('.').pop() ?? '').toLowerCase();
  const mime = head.headers.get('content-type')?.split(';')[0] ?? MIME_BY_EXT[ext] ?? 'application/octet-stream';
  const { data, error } = await db
    .from('uploads')
    .insert({
      tenant_id: tenantId,
      storage_bucket: m[1],
      storage_path: decodeURIComponent(m[2]),
      public_url: url,
      file_name: decodeURIComponent(m[2].split('/').pop() ?? 'file'),
      mime_type: mime,
      size_bytes: Number(head.headers.get('content-length') ?? '0'),
      alt_text: alt === '' ? null : alt,
      source: 'ai_generated',
      status: 'active',
    })
    .select('id')
    .single();
  if (error !== null || data === null) fail(`upload record failed: ${error?.message}`);
  return data.id;
}

async function main(): Promise<void> {
  const [from, to] = process.argv.slice(2);
  if (from === undefined || to === undefined) fail('usage: copy-family-sample.ts <from-subdomain> <to-subdomain>');
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(to)) fail(`not a valid subdomain: ${to}`);
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  const db = createClient<Database>(url, key, { auth: { persistSession: false } });

  // 1) Read the sample.
  const { data: src, error: sErr } = await db
    .from('tenants')
    .select('id, business_name, tier, types, mood_key, currency, time_zone, logo_url, brand_colors, primary_niche')
    .eq('subdomain', from)
    .is('deleted_at', null)
    .maybeSingle();
  if (sErr !== null) fail(`sample lookup failed: ${sErr.message}`);
  if (src === null) fail(`no site at ${from}`);
  const { data: page, error: pErr } = await db.from('content_pages').select('layout_tree').eq('tenant_id', src.id).eq('slug', '/').eq('status', 'published').is('deleted_at', null).maybeSingle();
  if (pErr !== null) fail(`sample page lookup failed: ${pErr.message}`);
  const tree = page?.layout_tree as { root?: Record<string, unknown> } | null | undefined;
  const root = tree?.root;
  if (root === undefined || root['archetypeKey'] !== 'main-street' || !holdsLegacyContent(root['content'])) fail(`${from} isn't an old family sample`);
  const homes = homesFromLegacy(root['content'] as MainStreetView);

  const { data: taken, error: tErr } = await db.from('tenants').select('id').eq('subdomain', to).maybeSingle();
  if (tErr !== null) fail(`subdomain check failed: ${tErr.message}`);
  if (taken !== null) fail(`${to} is taken`);

  // 2) The new site, as a draft.
  const { data: tenant, error: nErr } = await db
    .from('tenants')
    .insert({
      subdomain: to,
      business_name: src.business_name,
      tier: src.tier,
      types: src.types,
      mood_key: src.mood_key,
      currency: src.currency,
      time_zone: src.time_zone,
      logo_url: src.logo_url,
      brand_colors: src.brand_colors,
      primary_niche: src.primary_niche,
      status: 'draft',
    })
    .select('id')
    .single();
  if (nErr !== null || tenant === null) fail(`site create failed: ${nErr?.message}`);
  const tid = tenant.id;
  process.stdout.write(`created draft site ${to}\n`);

  const sellsOnline = (root['content'] as MainStreetView).identity.sellsOnline !== false;
  const features = [
    { tenant_id: tid, feature_key: 'moment', enabled: true },
    { tenant_id: tid, feature_key: 'profile', enabled: true },
    { tenant_id: tid, feature_key: 'testimonials', enabled: homes.testimonials.length > 0 },
    { tenant_id: tid, feature_key: 'market_dates', enabled: homes.markets.length > 0 },
    { tenant_id: tid, feature_key: 'cart', enabled: sellsOnline },
  ];
  const { error: fErr } = await db.from('tenant_features').upsert(features);
  if (fErr !== null) fail(`features failed: ${fErr.message}`);

  // 3) The page record: settings only.
  const settings = Object.fromEntries(Object.entries(root).filter(([k]) => ['kind', 'archetypeKey', 'lookKey', 'mood', 'accentOverride', 'brandPalette', 'texture', 'catalogSize'].includes(k)));
  const { error: cErr } = await db.from('content_pages').insert({
    tenant_id: tid, slug: '/', page_type: 'home', title: src.business_name, status: 'published', is_system_page: true, is_in_nav: false,
    layout_tree: { root: { ...settings, content: {} }, meta: { title: src.business_name } } as unknown as Json,
  });
  if (cErr !== null) fail(`page record failed: ${cErr.message}`);

  // 4) The moment and its media.
  const mediaId = homes.momentMediaUrl === null ? null : await recordUpload(db, tid, homes.momentMediaUrl, (root['content'] as MainStreetView).moment.media.alt);
  const posterId = homes.momentPosterUrl === null ? null : await recordUpload(db, tid, homes.momentPosterUrl, '');
  const { error: mErr } = await db.from('site_moments').insert({ tenant_id: tid, ...homes.moment, media_upload_id: mediaId, poster_upload_id: posterId });
  if (mErr !== null) fail(`moment failed: ${mErr.message}`);
  for (const [position, p] of homes.momentPhotoUrls.entries()) {
    const uploadId = await recordUpload(db, tid, p.url, p.alt);
    const { error } = await db.from('site_moment_photos').insert({ tenant_id: tid, upload_id: uploadId, position });
    if (error !== null) fail(`moment photo failed: ${error.message}`);
  }

  // 5) Section words, About you, testimonials, markets.
  const sectionRows = Object.entries(homes.sections).map(([section, row]) => ({ tenant_id: tid, section, ...row }));
  if (sectionRows.length > 0) {
    const { error } = await db.from('site_sections').insert(sectionRows);
    if (error !== null) fail(`section words failed: ${error.message}`);
  }
  const portraitId = homes.portraitUrl === null ? null : await recordUpload(db, tid, homes.portraitUrl, (root['content'] as MainStreetView).founder.photo.alt);
  const { error: prErr } = await db.from('site_profiles').insert({ tenant_id: tid, ...homes.profile, portrait_upload_id: portraitId });
  if (prErr !== null) fail(`About you failed: ${prErr.message}`);
  if (homes.testimonials.length > 0) {
    const { error } = await db.from('site_testimonials').insert(homes.testimonials.map((t, position) => ({ tenant_id: tid, ...t, position })));
    if (error !== null) fail(`testimonials failed: ${error.message}`);
  }
  if (homes.markets.length > 0) {
    const { error } = await db.from('events').insert(homes.markets.map((m) => ({ tenant_id: tid, name: m.name, event_date: m.date, hours: m.hours, kind: m.kind, status: 'upcoming' })));
    if (error !== null) fail(`markets failed: ${error.message}`);
  }

  // 6) Collections and products, their photos as uploads.
  const { data: cols, error: colErr } = await db.from('collections').select('id, slug, name, description, featured_image_id, is_featured, position, status, is_preview').eq('tenant_id', src.id).is('deleted_at', null);
  if (colErr !== null) fail(`collections read failed: ${colErr.message}`);
  const colIds = new Map<string, string>();
  for (const c of cols ?? []) {
    const { data, error } = await db
      .from('collections')
      .insert({ tenant_id: tid, slug: c.slug, name: c.name, description: c.description, is_featured: c.is_featured, position: c.position, status: c.status, is_preview: c.is_preview })
      .select('id')
      .single();
    if (error !== null || data === null) fail(`collection copy failed: ${error?.message}`);
    colIds.set(c.id, data.id);
  }
  const { data: listings, error: lErr } = await db
    .from('listings')
    .select('id, listing_type, slug, name, short_description, description, base_price_cents, currency, status, inventory_tracked, inventory_count, requires_shipping, requires_scheduling, media_ids, metadata, primary_collection_id, payment_model, is_preview, on_home, is_new, published_at')
    .eq('tenant_id', src.id)
    .is('deleted_at', null);
  if (lErr !== null) fail(`products read failed: ${lErr.message}`);
  const listingIds = new Map<string, string>();
  for (const l of listings ?? []) {
    const meta = (l.metadata ?? {}) as Record<string, unknown>;
    const imageUrl = typeof meta['image_url'] === 'string' ? meta['image_url'] : null;
    if (imageUrl === null && l.media_ids.length > 0) fail(`${l.slug} has uploaded photos; this tool copies sample photos only`);
    const media = imageUrl === null ? [] : [await recordUpload(db, tid, imageUrl, l.name)];
    const { data, error } = await db
      .from('listings')
      .insert({
        tenant_id: tid, listing_type: l.listing_type, slug: l.slug, name: l.name, short_description: l.short_description, description: l.description,
        base_price_cents: l.base_price_cents, currency: l.currency, status: l.status, inventory_tracked: l.inventory_tracked, inventory_count: l.inventory_count,
        requires_shipping: l.requires_shipping, requires_scheduling: l.requires_scheduling, media_ids: media, metadata: {},
        primary_collection_id: l.primary_collection_id === null ? null : colIds.get(l.primary_collection_id) ?? null,
        payment_model: l.payment_model, is_preview: l.is_preview, on_home: l.on_home, is_new: l.is_new, published_at: l.published_at,
      })
      .select('id')
      .single();
    if (error !== null || data === null) fail(`product copy failed (${l.slug}): ${error?.message}`);
    listingIds.set(l.id, data.id);
  }
  const { data: links, error: lkErr } = await db.from('listing_collections').select('listing_id, collection_id, position').eq('tenant_id', src.id);
  if (lkErr !== null) fail(`collection links read failed: ${lkErr.message}`);
  const linkRows = (links ?? []).flatMap((k) => {
    const listing = listingIds.get(k.listing_id);
    const collection = colIds.get(k.collection_id);
    return listing === undefined || collection === undefined ? [] : [{ tenant_id: tid, listing_id: listing, collection_id: collection, position: k.position }];
  });
  if (linkRows.length > 0) {
    const { error } = await db.from('listing_collections').insert(linkRows);
    if (error !== null) fail(`collection links failed: ${error.message}`);
  }

  const access = await ensureBuilderAccess(db, tid);
  if (!access.ok) fail(`admin access failed: ${access.error}`);
  const code = await previewCode(process.env['BACKEND_SESSION_SECRET'], to);
  process.stdout.write(`copied: ${sectionRows.length} section rows, ${homes.testimonials.length} testimonials, ${homes.markets.length} markets, ${listingIds.size} products, ${colIds.size} collections\n`);
  if (homes.undatedMarkets.length > 0) process.stdout.write(`markets with no date, not copied:\n  ${homes.undatedMarkets.join('\n  ')}\n`);
  process.stdout.write(`${BUILDER_EMAIL} is an admin of the new site\n`);
  process.stdout.write(code === null ? 'no preview link: BACKEND_SESSION_SECRET is missing\n' : `preview: ${previewLink(to, code)}\n`);
}

main().catch((err: unknown) => fail(String(err)));
