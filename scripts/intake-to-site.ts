/**
 * An intake submission (bohdiai.com/start) into a site its maker publishes — Claude's
 * tool, not a user surface. Alex picks the family (when the maker said "you pick")
 * and the skin.
 *
 *   npx tsx --env-file=.env.local scripts/intake-to-site.ts <intake-id> --subdomain <s> --skin <skin> [--family <f>] [--scene <scene>] [--niche <slug>] [--words-from <site>] [--build] [--live] [--no-email]
 *
 * 1. Saves the maker's photos from the private intake folder into tmp/intake-sites/<s>/media.
 * 2. Claude drafts the words the maker didn't give (lib/build/intake-drafts), looking
 *    at the photos; the whole content file is checked (lib/build/site-plan) and the
 *    problems sent back once.
 * 3. Writes the content file tmp/intake-sites/<s>/site.ts (and drafts.json) to read.
 * 4. With --build: builds it with the one builder (private until the maker
 *    publishes it from their backend; --live skips that), makes the maker's account
 *    (from the form) the site's owner, emails them that it's ready to sign in to
 *    (--no-email skips it), and marks the intake built.
 *
 * Buttons and labels are copied from a family site that has all of them
 * (--words-from, or the first one found).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { anthropicClient } from '../lib/anthropic';
import { FAMILY_KEYS, type FamilyKey } from '../lib/archetypes/main-street/families';
import { isSitePlan } from '../lib/backend/plan/plan';
import { designWordKeys, planSite } from '../lib/build/site-plan';
import { siteFromIntake, type BuildSettings, type IntakeForBuild } from '../lib/build/from-intake';
import { draftIntake, type PiecePhoto } from '../lib/build/intake-drafts';
import { INTAKE_BUCKET } from '../lib/intake/save';
import { ensureBuilderAccess } from '../lib/backend/builder-access';
import { getIntakeWords } from '../lib/intake/queries';
import { composeReadyEmail } from '../lib/intake/ready-email';
import { resend, fromEmail } from '../lib/resend';

type Db = ReturnType<typeof createClient<Database>>;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function isFamily(v: string): v is FamilyKey {
  return (FAMILY_KEYS as readonly string[]).includes(v);
}

/** The buttons and labels from a family site that has every one the design shows. */
async function referenceWords(db: Db, from: string | undefined): Promise<Record<string, string>> {
  const need = designWordKeys('family');
  const read = async (tenantId: string): Promise<Map<string, string>> => {
    const { data, error } = await db.from('site_words').select('key, text').eq('tenant_id', tenantId);
    if (error !== null) fail(`reading words failed: ${error.message}`);
    return new Map((data ?? []).map((r) => [r.key, r.text]));
  };
  const complete = (words: Map<string, string>): boolean => need.every((k) => words.has(k));
  if (from !== undefined) {
    const { data } = await db.from('tenants').select('id').eq('subdomain', from).maybeSingle();
    if (data === null) fail(`no site called ${from}`);
    const words = await read(data.id);
    if (!complete(words)) fail(`${from} is missing some of the design's words: ${need.filter((k) => !words.has(k)).slice(0, 5).join(', ')}…`);
    return Object.fromEntries(need.map((k) => [k, words.get(k) ?? '']));
  }
  const { data: pages, error } = await db.from('content_pages').select('tenant_id, layout_tree');
  if (error !== null) fail(`reading pages failed: ${error.message}`);
  const ids = [...new Set((pages ?? []).filter((p) => (p.layout_tree as { root?: { archetypeKey?: unknown } } | null)?.root?.archetypeKey === 'main-street').map((p) => p.tenant_id))];
  for (const id of ids) {
    const words = await read(id);
    if (complete(words)) return Object.fromEntries(need.map((k) => [k, words.get(k) ?? '']));
  }
  return fail('no family site has every word the design shows; pass --words-from <site>');
}

async function main(): Promise<void> {
  const [intakeId, ...rest] = process.argv.slice(2);
  const subdomain = flag(rest, '--subdomain');
  const skin = flag(rest, '--skin');
  if (intakeId === undefined || subdomain === undefined || skin === undefined) {
    fail('usage: intake-to-site.ts <intake-id> --subdomain <s> --skin <skin> [--family <f>] [--scene <scene>] [--niche <slug>] [--words-from <site>] [--build] [--live] [--no-email]');
  }
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('missing SUPABASE url / service key: run with --env-file=.env.local');
  const db = createClient<Database>(url, key, { auth: { persistSession: false } });

  const { data: intake, error } = await db.from('intakes').select('*').eq('id', intakeId).maybeSingle();
  if (error !== null) fail(`reading the intake failed: ${error.message}`);
  if (intake === null) fail(`no intake ${intakeId}`);
  if (intake.status === 'built') fail(`intake ${intakeId} is already built`);
  if (!isSitePlan(intake.plan)) fail(`intake ${intakeId} has no plan (sent before the form asked for one)`);
  if (intake.user_id === null) fail(`intake ${intakeId} has no account (sent before the form made one)`);
  const familyFlag = flag(rest, '--family');
  const family = familyFlag ?? intake.family;
  if (family === null) fail('they said "you pick for me": pass --family');
  if (!isFamily(family)) fail(`unknown family "${family}"`);

  const { data: pieces, error: piecesErr } = await db.from('intake_pieces').select('*').eq('intake_id', intakeId).order('position');
  if (piecesErr !== null) fail(`reading the pieces failed: ${piecesErr.message}`);

  // 1) Their photos, out of the private folder.
  const outDir = resolve('tmp', 'intake-sites', subdomain);
  const mediaDir = join(outDir, 'media');
  mkdirSync(mediaDir, { recursive: true });
  const save = async (path: string, file: string): Promise<Buffer> => {
    const { data, error: dlErr } = await db.storage.from(INTAKE_BUCKET).download(path);
    if (dlErr !== null || data === null) fail(`saving ${path} failed: ${dlErr?.message ?? 'nothing came back'}`);
    const bytes = Buffer.from(await data.arrayBuffer());
    writeFileSync(join(mediaDir, file), bytes);
    return bytes;
  };
  const photos: PiecePhoto[] = [];
  const forBuild: IntakeForBuild = {
    plan: intake.plan,
    makerName: intake.maker_name,
    businessName: intake.business_name,
    email: intake.email,
    makes: intake.makes,
    about: intake.about,
    portraitFile: null,
    pieces: [],
  };
  for (const p of pieces ?? []) {
    const file = `piece-${p.position + 1}.webp`;
    photos.push({ mediaType: 'image/webp', base64: (await save(p.photo_path, file)).toString('base64') });
    forBuild.pieces.push({ name: p.name, priceCents: p.price_cents, description: p.description, file });
  }
  if (intake.portrait_path !== null) {
    await save(intake.portrait_path, 'portrait.webp');
    forBuild.portraitFile = 'portrait.webp';
  }

  // 2) The words we write, checked against the whole content file.
  const words = await referenceWords(db, flag(rest, '--words-from'));
  const niche = flag(rest, '--niche');
  // Scenic: the library scene behind the page (left out: the default scene).
  const scene = flag(rest, '--scene');
  if (scene !== undefined && family !== 'scenic') fail('--scene is only for a Scenic site');
  const settings: BuildSettings = { subdomain, family, skin, ...(niche === undefined ? {} : { niche }), ...(scene === undefined ? {} : { scene }) };
  const { data: moodWord } = await db.from('intake_words').select('text').eq('key', `intake.families.${family}.label`).maybeSingle();
  process.stdout.write(`drafting the words for ${forBuild.businessName} (${forBuild.pieces.length} pieces)…\n`);
  const drafted = await draftIntake(anthropicClient(), forBuild, moodWord?.text ?? family, photos, (d) => {
    const planned = planSite(siteFromIntake(forBuild, d, settings, words));
    return planned.ok ? [] : planned.errors;
  });
  if (!drafted.ok) fail(drafted.error);

  // 3) The content file, to read before building.
  const site = siteFromIntake(forBuild, drafted.drafts, settings, words);
  const siteFile = join(outDir, 'site.ts');
  writeFileSync(join(outDir, 'drafts.json'), `${JSON.stringify(drafted.drafts, null, 2)}\n`);
  writeFileSync(siteFile, `// Built from intake ${intakeId} by scripts/intake-to-site.ts.\nexport const SITE = ${JSON.stringify(site, null, 2)};\n`);
  process.stdout.write(`content file: ${siteFile}\n`);

  // 4) The site.
  if (!rest.includes('--build')) {
    process.stdout.write(`build it with: npx tsx --env-file=.env.local scripts/build-site.ts ${siteFile} --media ${mediaDir}\n`);
    return;
  }
  const build = spawnSync('npx', ['tsx', '--env-file=.env.local', 'scripts/build-site.ts', siteFile, '--media', mediaDir, ...(rest.includes('--live') ? ['--live'] : [])], { stdio: 'inherit', shell: true });
  if (build.status !== 0) fail('the build failed (above); the intake stays new');
  const { data: built } = await db.from('tenants').select('id').eq('subdomain', subdomain).maybeSingle();
  if (built === null) fail(`built, but ${subdomain} wasn't found to mark the intake`);
  // The maker owns it: their account from the form becomes the site's admin.
  const owner = await ensureBuilderAccess(db, built.id, intake.email);
  if (!owner.ok) fail(`built, but making ${intake.email} the owner failed: ${owner.error}`);
  const { error: markErr } = await db.from('intakes').update({ status: 'built', tenant_id: built.id }).eq('id', intakeId);
  if (markErr !== null) fail(`built, but marking the intake failed: ${markErr.message}`);
  process.stdout.write(`intake ${intakeId} is built as ${subdomain}; ${intake.email} owns it\n`);

  // Tell them it's ready: sign in with the email and password they chose.
  if (rest.includes('--no-email')) return;
  const email = composeReadyEmail({ makerName: intake.maker_name, businessName: intake.business_name, email: intake.email, words: await getIntakeWords(db) });
  const sent = await resend().emails.send({ from: fromEmail(), to: intake.email, subject: email.subject, text: email.text, html: email.html });
  if (sent.error) fail(`built and owned, but the ready email to ${intake.email} failed: ${sent.error.message}`);
  process.stdout.write(`told ${intake.email} their site is ready\n`);
}

void main();
