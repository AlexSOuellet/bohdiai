/**
 * Move a custom sample card site onto a family, in place (Alex, 2026-10-27:
 * "convert paper and patina to spotlight and make it showcase") — Claude's tool,
 * not a user surface. No copies: the site itself is changed.
 *
 *   npx tsx --env-file=.env.local scripts/convert-card-site.ts <site> [--dry]
 *
 * Reads scripts/sites/<site>.ts's FAMILY export: the family and skin, the plan,
 * the opening, each section's words and the pieces. Its gallery photos become its
 * pieces (the first can be the opening photo instead), reusing the site's own
 * uploads; its words, About you, socials and market dates stay as they are. The
 * family's buttons and labels are copied from a family site (they're the same on
 * every family site). The page record then names the family and skin, and the
 * site is put on the plan. The old gallery photos are kept, hidden by the plan.
 * Refuses a site that isn't a card site, or that already has an opening or pieces.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '../lib/database.types';
import { buildMomentRow, type MomentForm } from '../lib/backend/moment/moment-form';
import { buildSectionRow, EMPTY_SECTION, type SectionKey, type SectionWords } from '../lib/backend/sections/sections-form';
import { applyPlan } from '../lib/backend/plan/apply';
import type { SitePlan } from '../lib/backend/plan/plan';
import type { FamilyKey } from '../lib/archetypes/main-street/families';
import { MAIN_STREET_SKINS } from '../lib/archetypes/main-street/skins';
import { NO_PRICE_CENTS } from '../lib/catalog/price';
import { FAMILY_WORDS_PREFIX } from '../lib/archetypes/main-street/words';

type Db = ReturnType<typeof createClient<Database>>;

/** What a site file says about its move onto a family. */
export type FamilyMove = {
  family: FamilyKey;
  skin: string;
  plan: SitePlan;
  /** The gallery photo (by its caption) that becomes the opening photo instead of a piece. */
  openingPhoto: string;
  moment: MomentForm;
  sections: Partial<Record<SectionKey, Partial<SectionWords>>>;
  /** Each piece's words, by the caption of its photo. */
  pieces: Readonly<Record<string, string>>;
  /** A family site to copy the family's buttons and labels from. */
  wordsFrom: string;
};

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function check<T>(what: string, run: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await run;
  if (error !== null) fail(`${what} failed: ${error.message}`);
  return data;
}

const slugOf = (name: string): string => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function main(): Promise<void> {
  const [siteKey, ...rest] = process.argv.slice(2);
  const dry = rest.includes('--dry');
  if (siteKey === undefined) fail('usage: convert-card-site.ts <site> [--dry]');
  const mod = (await import(`./sites/${siteKey}.ts`)) as { SITE?: { subdomain: string }; FAMILY?: FamilyMove };
  if (mod.SITE === undefined || mod.FAMILY === undefined) fail(`${siteKey} has no SITE or no FAMILY`);
  const move = mod.FAMILY;
  if (MAIN_STREET_SKINS[move.skin as keyof typeof MAIN_STREET_SKINS] === undefined) fail(`no skin called ${move.skin}`);
  const moment = buildMomentRow(move.moment);
  if (!moment.ok) fail(`the opening isn't right: ${moment.error}`);
  const sections = Object.entries(move.sections).map(([section, words]) => {
    const row = buildSectionRow({ ...EMPTY_SECTION, ...words });
    if (!row.ok) fail(`${section} isn't right: ${row.error}`);
    return { section, row: row.row };
  });

  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('missing SUPABASE url / service key: run with --env-file=.env.local');
  const db: Db = createClient<Database>(url, key, { auth: { persistSession: false } });

  const tenant = await check('site lookup', db.from('tenants').select('id, business_name').eq('subdomain', mod.SITE.subdomain).is('deleted_at', null).maybeSingle());
  if (tenant === null) fail(`no site ${mod.SITE.subdomain}`);
  const tid = tenant.id;
  const page = await check('page record', db.from('content_pages').select('id, layout_tree').eq('tenant_id', tid).eq('slug', '/').is('deleted_at', null).maybeSingle());
  const root = (page?.layout_tree as { root?: { archetypeKey?: string } } | null)?.root;
  if (page === null || root?.archetypeKey !== 'card') fail(`${mod.SITE.subdomain} isn't a card site`);
  const hadMoment = await check('opening check', db.from('site_moments').select('tenant_id').eq('tenant_id', tid).maybeSingle());
  if (hadMoment !== null) fail('it already has an opening');
  const hadPieces = (await check('pieces check', db.from('listings').select('id').eq('tenant_id', tid).is('deleted_at', null).limit(1))) ?? [];
  if (hadPieces.length > 0) fail('it already has pieces');

  const gallery = (await check('gallery', db.from('gallery_items').select('caption, upload_id').eq('tenant_id', tid).order('position'))) ?? [];
  const opening = gallery.find((g) => g.caption === move.openingPhoto) ?? fail(`no gallery photo called ${move.openingPhoto}`);
  const pieces = gallery.filter((g) => g !== opening);
  for (const p of pieces) if (move.pieces[p.caption ?? ''] === undefined) fail(`no words for the piece ${p.caption}`);

  const from = await check('words site', db.from('tenants').select('id').eq('subdomain', move.wordsFrom).maybeSingle());
  if (from === null) fail(`no site ${move.wordsFrom}`);
  const theirs = (await check('family words', db.from('site_words').select('key, text').eq('tenant_id', from.id).like('key', `${FAMILY_WORDS_PREFIX}.%`))) ?? [];
  const ours = new Set(((await check('our words', db.from('site_words').select('key').eq('tenant_id', tid).like('key', `${FAMILY_WORDS_PREFIX}.%`))) ?? []).map((w) => w.key));
  const words = theirs.filter((w) => !ours.has(w.key));

  process.stdout.write(`${tenant.business_name}: ${move.family} / ${move.skin} on ${move.plan}; opening photo "${opening.caption}", ${pieces.length} pieces, ${sections.length} sections, ${words.length} family words\n`);
  if (dry) {
    process.stdout.write('--dry: nothing written.\n');
    return;
  }

  await check('the opening', db.from('site_moments').insert({ tenant_id: tid, ...moment.row, media_upload_id: opening.upload_id }));
  await check('section words', db.from('site_sections').upsert(sections.map((s) => ({ tenant_id: tid, section: s.section, ...s.row }))));
  for (const [i, p] of pieces.entries()) {
    const name = p.caption ?? '';
    await check(
      `piece ${name}`,
      db.from('listings').insert({
        tenant_id: tid, listing_type: 'product', slug: slugOf(name), name, description: move.pieces[name] ?? '',
        base_price_cents: NO_PRICE_CENTS, status: 'active', inventory_tracked: true, inventory_count: 1, stock_kind: 'one_of_a_kind', requires_shipping: true,
        media_ids: [p.upload_id], in_gallery: true, published_at: new Date(Date.now() - i * 1000).toISOString(),
      }),
    );
  }
  for (let i = 0; i < words.length; i += 500) {
    await check('family words', db.from('site_words').insert(words.slice(i, i + 500).map((w) => ({ tenant_id: tid, key: w.key, text: w.text }))));
  }
  const newRoot = { kind: 'archetype', archetypeKey: 'main-street', mood: move.family, lookKey: move.skin, content: {}, accentOverride: null };
  await check('page record', db.from('content_pages').update({ layout_tree: { root: newRoot, meta: { title: tenant.business_name } } as unknown as Json }).eq('id', page.id));
  const applied = await applyPlan(db, tid, move.plan);
  if (!applied.ok) fail(`plan failed: ${applied.error}`);
  process.stdout.write(`done: https://${mod.SITE.subdomain}.bohdiai.com\n`);
}

main().catch((err: unknown) => fail(`convert failed: ${err instanceof Error ? err.message : String(err)}`));
