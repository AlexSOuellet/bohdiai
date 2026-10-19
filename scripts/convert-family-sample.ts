/**
 * Move an old family sample onto the homes, in place (Modular Plan step 3) —
 * Claude's tool, not a user surface. Replaces the copy tool: no copies, the site
 * itself is converted (Alex, 2026-10-16).
 *
 *   npx tsx --env-file=.env.local scripts/convert-family-sample.ts <subdomain> [--plan showcase|lite|full]
 *
 * Every word in the old page record goes to its home: the moment, each section's
 * words, About you, testimonials and dated markets. Photos and videos that were
 * bare web addresses become proper uploads pointing at the same stored files. The
 * page record is then cut down to settings only, so the site reads only from the
 * homes. With --plan the site is put on that plan (its switches set). Refuses a
 * site that isn't an old family sample, or that already has content in a home.
 */
import { writeProfileHomes } from '../lib/backend/profile/homes';
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '../lib/database.types';
import { holdsLegacyContent } from '../lib/archetypes/main-street/from-homes';
import { homesFromLegacy } from '../lib/archetypes/main-street/to-homes';
import type { MainStreetView } from '../lib/archetypes/main-street/schemas';
import { applyPlan } from '../lib/backend/plan/apply';
import { isSitePlan } from '../lib/backend/plan/plan';

type Db = ReturnType<typeof createClient<Database>>;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const STORAGE_PATH = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;
const MIME_BY_EXT: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/** Record a file already in our storage as an upload of the site. A file that
 *  already has a record is reused: the site's own, or one a deleted site held. */
async function recordUpload(db: Db, tenantId: string, url: string, alt: string): Promise<string> {
  const m = STORAGE_PATH.exec(new URL(url).pathname);
  if (m === null || m[1] === undefined || m[2] === undefined) fail(`not one of our stored files: ${url}`);
  const { data: had, error: hadErr } = await db.from('uploads').select('id, tenant_id, tenants(deleted_at)').eq('storage_path', decodeURIComponent(m[2])).maybeSingle();
  if (hadErr !== null) fail(`upload lookup failed: ${hadErr.message}`);
  if (had !== null) {
    if (had.tenant_id === tenantId) return had.id;
    const owner = had.tenants as { deleted_at: string | null } | null;
    if (had.tenant_id !== null && owner?.deleted_at === null) fail(`${url} belongs to another live site`);
    const { error } = await db.from('uploads').update({ tenant_id: tenantId }).eq('id', had.id);
    if (error !== null) fail(`taking over the upload record failed: ${error.message}`);
    return had.id;
  }
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
  const [sub, ...rest] = process.argv.slice(2);
  const plan = flag(rest, '--plan');
  if (sub === undefined) fail('usage: convert-family-sample.ts <subdomain> [--plan showcase|lite|full]');
  if (plan !== undefined && !isSitePlan(plan)) fail(`unknown plan "${plan}"`);
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  const db = createClient<Database>(url, key, { auth: { persistSession: false } });

  // 1) The site and its old page record.
  const { data: site, error: sErr } = await db.from('tenants').select('id, business_name').eq('subdomain', sub).is('deleted_at', null).maybeSingle();
  if (sErr !== null) fail(`site lookup failed: ${sErr.message}`);
  if (site === null) fail(`no site at ${sub}`);
  const tid = site.id;
  const { data: page, error: pErr } = await db.from('content_pages').select('id, layout_tree').eq('tenant_id', tid).eq('slug', '/').eq('status', 'published').is('deleted_at', null).maybeSingle();
  if (pErr !== null) fail(`page lookup failed: ${pErr.message}`);
  const tree = page?.layout_tree as { root?: Record<string, unknown>; meta?: unknown } | null | undefined;
  const root = tree?.root;
  if (page === null || root === undefined || root['archetypeKey'] !== 'main-street' || !holdsLegacyContent(root['content'])) fail(`${sub} isn't an old family sample`);
  for (const table of ['site_moments', 'site_sections', 'site_profiles', 'site_testimonials'] as const) {
    const { count } = await db.from(table).select('tenant_id', { count: 'exact', head: true }).eq('tenant_id', tid);
    if ((count ?? 0) > 0) fail(`${sub} already has content in ${table}; not converting over it`);
  }
  const legacy = root['content'] as MainStreetView;
  const homes = homesFromLegacy(legacy);

  // 2) The moment and its media.
  const mediaId = homes.momentMediaUrl === null ? null : await recordUpload(db, tid, homes.momentMediaUrl, legacy.moment.media.alt);
  const posterId = homes.momentPosterUrl === null ? null : await recordUpload(db, tid, homes.momentPosterUrl, '');
  const { error: mErr } = await db.from('site_moments').insert({ tenant_id: tid, ...homes.moment, media_upload_id: mediaId, poster_upload_id: posterId });
  if (mErr !== null) fail(`moment failed: ${mErr.message}`);
  for (const [position, p] of homes.momentPhotoUrls.entries()) {
    const uploadId = await recordUpload(db, tid, p.url, p.alt);
    const { error } = await db.from('site_moment_photos').insert({ tenant_id: tid, upload_id: uploadId, position });
    if (error !== null) fail(`moment photo failed: ${error.message}`);
  }

  // 3) Section words, About you, testimonials, markets.
  const sectionRows = Object.entries(homes.sections).map(([section, row]) => ({ tenant_id: tid, section, ...row }));
  if (sectionRows.length > 0) {
    const { error } = await db.from('site_sections').insert(sectionRows);
    if (error !== null) fail(`section words failed: ${error.message}`);
  }
  const portraitId = homes.portraitUrl === null ? null : await recordUpload(db, tid, homes.portraitUrl, legacy.founder.photo.alt);
  try {
    await writeProfileHomes(db, tid, homes.profile, { portrait_upload_id: portraitId });
  } catch (err) {
    fail(`About you failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (homes.testimonials.length > 0) {
    const { error } = await db.from('site_testimonials').insert(homes.testimonials.map((t, position) => ({ tenant_id: tid, ...t, position })));
    if (error !== null) fail(`testimonials failed: ${error.message}`);
  }
  if (homes.markets.length > 0) {
    const { error } = await db.from('events').insert(homes.markets.map((m) => ({ tenant_id: tid, name: m.name, event_date: m.date, hours: m.hours, status: 'upcoming' })));
    if (error !== null) fail(`markets failed: ${error.message}`);
  }

  // 4) Product photos that are only a web address become uploads.
  const { data: listings, error: lErr } = await db.from('listings').select('id, slug, name, media_ids, metadata').eq('tenant_id', tid).is('deleted_at', null);
  if (lErr !== null) fail(`products read failed: ${lErr.message}`);
  let photos = 0;
  for (const l of listings ?? []) {
    const meta = { ...((l.metadata ?? {}) as Record<string, unknown>) };
    const imageUrl = typeof meta['image_url'] === 'string' ? meta['image_url'] : null;
    if (imageUrl === null) continue;
    delete meta['image_url'];
    const media = l.media_ids.length > 0 ? l.media_ids : [await recordUpload(db, tid, imageUrl, l.name)];
    const { error } = await db.from('listings').update({ media_ids: media, metadata: meta as Json }).eq('id', l.id);
    if (error !== null) fail(`product photo failed (${l.slug}): ${error.message}`);
    photos += 1;
  }

  // 5) The page record: settings only, so the site reads only from the homes.
  const settings = Object.fromEntries(Object.entries(root).filter(([k]) => ['kind', 'archetypeKey', 'lookKey', 'mood', 'accentOverride', 'brandPalette', 'texture', 'catalogSize'].includes(k)));
  const { error: cErr } = await db
    .from('content_pages')
    .update({ layout_tree: { root: { ...settings, content: {} }, meta: { title: site.business_name } } as unknown as Json })
    .eq('id', page.id);
  if (cErr !== null) fail(`page record failed: ${cErr.message}`);

  // 6) The switches its content needs, then the plan.
  const { error: fErr } = await db.from('tenant_features').upsert([
    { tenant_id: tid, feature_key: 'moment', enabled: true },
    { tenant_id: tid, feature_key: 'profile', enabled: true },
  ]);
  if (fErr !== null) fail(`switches failed: ${fErr.message}`);
  if (plan !== undefined) {
    const applied = await applyPlan(db, tid, plan);
    if (!applied.ok) fail(`plan failed: ${applied.error}`);
  }

  process.stdout.write(`converted ${sub}: ${sectionRows.length} section rows, ${homes.testimonials.length} testimonials, ${homes.markets.length} markets, ${photos} product photos${plan === undefined ? '' : `, on ${plan}`}\n`);
  if (homes.undatedMarkets.length > 0) process.stdout.write(`markets with no date, not moved:\n  ${homes.undatedMarkets.join('\n  ')}\n`);
}

main().catch((err: unknown) => fail(String(err)));
