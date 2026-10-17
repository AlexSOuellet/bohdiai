/**
 * Make background photos for a site that already exists, from its own words, and
 * add them to the scene library (tagged and searchable). The same scene maker a
 * Scenic build runs (lib/build/scene-art). With --use, the first becomes the
 * site's photo behind its Scenic page; without it the site is left as it is.
 *
 *   npx tsx --env-file=.env.local scripts/make-scenes.ts <subdomain> [--scenes <2-4>] [--use]
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { anthropicClient } from '../lib/anthropic';
import { makeScenes, sceneKeys, SCENES_DEFAULT, SCENES_MAX, SCENES_MIN } from '../lib/build/scene-art';
import { falPainter } from '../lib/build/scene-painter';
import { addScenes } from '../lib/backend/scene/library';
import { saveSiteScene } from '../lib/backend/scene/queries';

/** Platform storage for the scene library's photos (not any one site's folder). */
const SCENE_BUCKET = 'generated-images';

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function flag(args: readonly string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

async function main(): Promise<void> {
  const [subdomain, ...rest] = process.argv.slice(2);
  if (subdomain === undefined) fail('usage: scripts/make-scenes.ts <subdomain> [--scenes <2-4>] [--use]');
  const count = Number(flag(rest, '--scenes') ?? SCENES_DEFAULT);
  if (!Number.isInteger(count) || count < SCENES_MIN || count > SCENES_MAX) fail(`--scenes takes ${SCENES_MIN} to ${SCENES_MAX}`);
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  const falKey = process.env['FAL_API_KEY'];
  if (url === undefined || key === undefined) fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed (use --env-file=.env.local)');
  if (falKey === undefined || falKey === '') fail('FAL_API_KEY is needed to make the photos');
  const db = createClient<Database>(url, key, { auth: { persistSession: false } });

  const { data: tenant, error: tErr } = await db.from('tenants').select('id, business_name').eq('subdomain', subdomain).maybeSingle();
  if (tErr !== null) fail(`reading the site failed: ${tErr.message}`);
  if (tenant === null) fail(`no site called ${subdomain}`);
  const { data: profile, error: pErr } = await db.from('site_profiles').select('makes, bio, headline').eq('tenant_id', tenant.id).maybeSingle();
  if (pErr !== null) fail(`reading About you failed: ${pErr.message}`);
  const makes = [...(profile?.makes ?? []), profile?.headline ?? ''].filter((m) => m !== '').join(', ');
  const about = profile?.bio ?? '';
  if (makes === '' && about === '') fail(`${subdomain} has no About words to make photos from`);

  const { data: taken, error: kErr } = await db.from('scenes').select('key').like('key', `${subdomain}-%`);
  if (kErr !== null) fail(`reading the scene library failed: ${kErr.message}`);
  const keys = sceneKeys(subdomain, count, new Set((taken ?? []).map((r) => r.key)));

  process.stdout.write(`making ${count} background photos for ${tenant.business_name}…\n`);
  const made = await makeScenes(
    {
      client: anthropicClient(),
      painter: falPainter(falKey),
      store: async (k, webp) => {
        const path = `scenes/${k}.webp`;
        const { error } = await db.storage.from(SCENE_BUCKET).upload(path, webp, { contentType: 'image/webp', upsert: false });
        if (error !== null) throw new Error(`saving ${path} failed: ${error.message}`);
        return db.storage.from(SCENE_BUCKET).getPublicUrl(path).data.publicUrl;
      },
      add: (scenes) => addScenes(db, scenes.map((m) => ({ ...m, focus: 'center', source: 'generated' as const, madeFor: tenant.id }))),
    },
    { businessName: tenant.business_name, makes: makes === '' ? about : makes, about },
    keys,
  );
  if (!made.ok) fail(`the background photos failed: ${made.error}`);
  for (const m of made.scenes) process.stdout.write(`  ${m.key} (${m.tone}) ${m.url}\n    ${m.tags.join(', ')}\n`);

  if (rest.includes('--use')) {
    const first = made.scenes[0];
    if (first === undefined) fail('no photo was made to use');
    await saveSiteScene(db, tenant.id, { kind: 'library', key: first.key });
    process.stdout.write(`${subdomain}'s Scenic page now uses ${first.key}\n`);
  }
}

void main();
