/**
 * The automatic build (Alex, Session 119): once a maker has signed up, paid,
 * confirmed their email and sent the site form, their site builds itself. Only
 * their own photos are used; no product photo is ever made up.
 *
 * It runs as steps, so no one step is long (on Cloudflare each is its own
 * request inside a Workflow; on the dev server they run one after another):
 *
 *   prepare      the mood (Claude picks for "you pick"), its default skin, the
 *                web address sign-up made, names for the background photos
 *   plan         Claude plans the three background photos from their words
 *   background   one per photo: painted, enlarged, finished, into the library
 *   draft        Claude writes the words the maker didn't give, from theirs and
 *                their photos
 *   write        the site, into the site record sign-up made (never retried:
 *                a half-written site is looked at, not written twice)
 *   finish       the form is marked built and the maker gets "your site is ready"
 *   attach       the first background photo goes behind the site
 *
 * On Scenic the background photos come before the words (the page needs one);
 * on every other mood they come after "your site is ready" (Alex).
 */
import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod/v4';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { FAMILIES, FAMILY_KEYS, type FamilyKey } from '@/lib/archetypes/main-street/families';
import { isSitePlan } from '@/lib/backend/plan/plan';
import { addScenes } from '@/lib/backend/scene/library';
import { INTAKE_BUCKET } from '@/lib/intake/save';
import { getIntakeWords } from '@/lib/intake/queries';
import { composeReadyEmail } from '@/lib/intake/ready-email';
import { DRAFT_MODEL, draftIntake, type PiecePhoto } from './intake-drafts';
import { siteFromIntake, type BuildSettings, type IntakeDrafts, type IntakeForBuild } from './from-intake';
import { planSite } from './site-plan';
import { planScenes, sceneKeys, SCENES_DEFAULT, type ScenePainter, type ScenePlan } from './scene-art';
import { finishSceneWith } from './scene-finish';
import { referenceWords } from './reference-words';
import { writeSite } from './write-site';

type Db = SupabaseClient<Database>;

/** Platform storage for the scene library's photos (not any one site's folder). */
const SCENE_BUCKET = 'generated-images';

/** What the steps pass along (small: it's kept between steps). */
export type BuildState = {
  intakeId: string;
  tenantId: string;
  subdomain: string;
  family: FamilyKey;
  skin: string;
  sceneKeys: string[];
};

/** Everything from outside, passed in so each step is tested on its own. */
export type BuildDeps = {
  db: Db;
  claude: () => Pick<Anthropic, 'messages'>;
  painter: () => ScenePainter;
  images: () => Promise<ImagesBinding>;
  send: (msg: { to: string; subject: string; text: string; html: string }) => Promise<{ error: { message: string } | null }>;
};

async function loadIntake(db: Db, intakeId: string) {
  const { data: intake, error } = await db.from('intakes').select('*').eq('id', intakeId).maybeSingle();
  if (error !== null) throw new Error(`reading the form failed: ${error.message}`);
  if (intake === null) throw new Error(`no form ${intakeId}`);
  if (!isSitePlan(intake.plan)) throw new Error(`form ${intakeId} has no plan with a site`);
  if (intake.tenant_id === null) throw new Error(`form ${intakeId} isn't tied to a site`);
  const { data: pieces, error: piecesErr } = await db.from('intake_pieces').select('*').eq('intake_id', intakeId).order('position');
  if (piecesErr !== null) throw new Error(`reading the pieces failed: ${piecesErr.message}`);
  return { intake: { ...intake, plan: intake.plan, tenant_id: intake.tenant_id }, pieces: pieces ?? [] };
}

/** The form as the builder reads it; photos are named piece-<n>.webp and portrait.webp. */
function forBuild(loaded: Awaited<ReturnType<typeof loadIntake>>): { intake: IntakeForBuild; paths: Map<string, string> } {
  const { intake, pieces } = loaded;
  const paths = new Map<string, string>();
  const built: IntakeForBuild = {
    plan: intake.plan,
    makerName: intake.maker_name,
    businessName: intake.business_name,
    email: intake.email,
    makes: intake.makes,
    about: intake.about,
    portraitFile: null,
    pieces: [],
  };
  for (const p of pieces) {
    const file = `piece-${p.position + 1}.webp`;
    paths.set(file, p.photo_path);
    built.pieces.push({ name: p.name, priceCents: p.price_cents, description: p.description, file });
  }
  if (intake.portrait_path !== null) {
    paths.set('portrait.webp', intake.portrait_path);
    built.portraitFile = 'portrait.webp';
  }
  return { intake: built, paths };
}

async function download(db: Db, path: string): Promise<Uint8Array> {
  const { data, error } = await db.storage.from(INTAKE_BUCKET).download(path);
  if (error !== null || data === null) throw new Error(`reading ${path} failed: ${error?.message ?? 'nothing came back'}`);
  return new Uint8Array(await data.arrayBuffer());
}

const toBase64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64');

/** Claude picks the mood when the maker said "you pick", from their own words. */
export async function pickFamily(client: Pick<Anthropic, 'messages'>, intake: Pick<IntakeForBuild, 'businessName' | 'makes' | 'about'>, moods: readonly { key: FamilyKey; label: string; line: string }[]): Promise<FamilyKey> {
  const response = await client.messages.parse({
    model: DRAFT_MODEL,
    max_tokens: 2000,
    system: 'You choose the mood for a maker’s website from the list given. Pick the one that best suits the maker’s own words about their work. Answer with the mood’s key only.',
    messages: [
      {
        role: 'user',
        content: [
          `Business: ${intake.businessName}`,
          `What they make, in their words: ${intake.makes}`,
          `About them, in their words: ${intake.about}`,
          `Moods:\n${moods.map((m) => `- ${m.key}: ${m.label}. ${m.line}`).join('\n')}`,
        ].join('\n\n'),
      },
    ],
    output_config: { effort: 'low', format: zodOutputFormat(z.object({ mood: z.enum(moods.map((m) => m.key) as [FamilyKey, ...FamilyKey[]]) })) },
  });
  const mood = response.parsed_output?.mood;
  if (mood === undefined) throw new Error('Claude didn’t pick a mood');
  return mood;
}

/** Step: what this build is. */
export async function prepare(deps: BuildDeps, intakeId: string): Promise<BuildState> {
  const loaded = await loadIntake(deps.db, intakeId);
  const { intake } = loaded;
  const { data: tenant, error } = await deps.db.from('tenants').select('subdomain').eq('id', intake.tenant_id).single();
  if (error !== null) throw new Error(`reading the site failed: ${error.message}`);

  let family: FamilyKey;
  if (intake.family !== null && (FAMILY_KEYS as readonly string[]).includes(intake.family)) family = intake.family as FamilyKey;
  else {
    const words = await getIntakeWords(deps.db);
    const moods = FAMILY_KEYS.map((key) => ({ key, label: words.families[key].label, line: words.families[key].line }));
    family = await pickFamily(deps.claude(), forBuild(loaded).intake, moods);
  }

  const { data: taken, error: takenErr } = await deps.db.from('scenes').select('key').like('key', `${tenant.subdomain}-%`);
  if (takenErr !== null) throw new Error(`reading the scene library failed: ${takenErr.message}`);
  const keys = sceneKeys(tenant.subdomain, SCENES_DEFAULT, new Set((taken ?? []).map((r) => r.key)));
  return { intakeId, tenantId: intake.tenant_id, subdomain: tenant.subdomain, family, skin: FAMILIES[family].defaultSkin, sceneKeys: keys };
}

/** Step: Claude plans the background photos from the maker's words. */
export async function planBackgrounds(deps: BuildDeps, state: BuildState): Promise<ScenePlan[]> {
  const { intake } = await loadIntake(deps.db, state.intakeId);
  const planned = await planScenes(deps.claude(), { businessName: intake.business_name, makes: intake.makes, about: intake.about }, state.sceneKeys.length);
  if (!planned.ok) throw new Error(planned.error);
  return planned.scenes;
}

/** Step: one background photo, painted and into the library. Already there: left as is. */
export async function makeBackground(deps: BuildDeps, state: BuildState, index: number, plan: ScenePlan): Promise<void> {
  const key = state.sceneKeys[index];
  if (key === undefined) throw new Error(`no background photo ${index + 1}`);
  const { data: have } = await deps.db.from('scenes').select('key').eq('key', key).maybeSingle();
  if (have !== null) return;
  const painter = deps.painter();
  const painted = await painter.paint(plan.picture);
  const enlarged = await painter.enlarge(painted);
  const { webp, tone } = await finishSceneWith(await deps.images(), new Uint8Array(enlarged));
  const path = `scenes/${key}.webp`;
  const { error } = await deps.db.storage.from(SCENE_BUCKET).upload(path, webp, { contentType: 'image/webp', upsert: true });
  if (error !== null) throw new Error(`saving ${path} failed: ${error.message}`);
  const url = deps.db.storage.from(SCENE_BUCKET).getPublicUrl(path).data.publicUrl;
  await addScenes(deps.db, [{ key, url, tone, tags: plan.tags, description: plan.picture, focus: 'center', source: 'generated', madeFor: state.tenantId }]);
}

/** The settings the site is built with; Scenic's first background photo sits behind its page. */
function settingsFor(state: BuildState): BuildSettings {
  const scene = state.family === 'scenic' ? state.sceneKeys[0] : undefined;
  return { subdomain: state.subdomain, family: state.family, skin: state.skin, ...(scene === undefined ? {} : { scene }) };
}

/** Step: Claude writes the words the maker didn't give, checked against the whole site. */
export async function draft(deps: BuildDeps, state: BuildState): Promise<IntakeDrafts> {
  const loaded = await loadIntake(deps.db, state.intakeId);
  const { intake, paths } = forBuild(loaded);
  const photos: PiecePhoto[] = [];
  for (const p of intake.pieces) {
    const path = paths.get(p.file);
    if (path === undefined) throw new Error(`no photo for ${p.file}`);
    photos.push({ mediaType: 'image/webp', base64: toBase64(await download(deps.db, path)) });
  }
  const words = await referenceWords(deps.db);
  const all = await getIntakeWords(deps.db);
  const settings = settingsFor(state);
  const drafted = await draftIntake(deps.claude(), intake, all.families[state.family].label || state.family, photos, (d) => {
    const planned = planSite(siteFromIntake(intake, d, settings, words));
    return planned.ok ? [] : planned.errors;
  });
  if (!drafted.ok) throw new Error(drafted.error);
  return drafted.drafts;
}

/** Step: the site, written into the site record sign-up made. */
export async function write(deps: BuildDeps, state: BuildState, drafts: IntakeDrafts): Promise<void> {
  const loaded = await loadIntake(deps.db, state.intakeId);
  if (loaded.intake.status === 'built') return;
  const { intake, paths } = forBuild(loaded);
  const planned = planSite(siteFromIntake(intake, drafts, settingsFor(state), await referenceWords(deps.db)));
  if (!planned.ok) throw new Error(`the site isn't right yet: ${planned.errors.join('; ')}`);
  await writeSite(deps.db, state.tenantId, planned.plan, async (file) => {
    const path = paths.get(file);
    if (path === undefined) throw new Error(`no photo called ${file}`);
    return download(deps.db, path);
  });
}

/** Step: marked built, and the maker is told it's ready (once). */
export async function finish(deps: BuildDeps, state: BuildState): Promise<void> {
  const { intake } = await loadIntake(deps.db, state.intakeId);
  if (intake.status === 'built') return;
  const { error } = await deps.db.from('intakes').update({ status: 'built' }).eq('id', state.intakeId);
  if (error !== null) throw new Error(`marking the form built failed: ${error.message}`);
  const mail = composeReadyEmail({ makerName: intake.maker_name, businessName: intake.business_name, email: intake.email, words: await getIntakeWords(deps.db) });
  const sent = await deps.send({ to: intake.email, subject: mail.subject, text: mail.text, html: mail.html });
  if (sent.error !== null) throw new Error(`the ready email failed: ${sent.error.message}`);
}

/** Step: the first background photo goes behind the site (every mood but Scenic, whose page already has it). */
export async function attachBackground(deps: BuildDeps, state: BuildState): Promise<void> {
  const key = state.sceneKeys[0];
  if (state.family === 'scenic' || key === undefined) return;
  const { data: have } = await deps.db.from('site_scenes').select('tenant_id').eq('tenant_id', state.tenantId).maybeSingle();
  if (have !== null) return;
  const { error } = await deps.db.from('site_scenes').insert({ tenant_id: state.tenantId, scene_key: key });
  if (error !== null) throw new Error(`setting the background photo failed: ${error.message}`);
}
