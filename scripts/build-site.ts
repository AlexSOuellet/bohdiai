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
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { planSite, type SiteFile } from '../lib/build/site-plan';
import { writeSite } from '../lib/build/write-site';
import { nextRenewal, todayDay } from '../lib/backend/plan/billing';
import { BUILDER_EMAIL } from '../lib/backend/builder-access';
import { previewCode, previewLink } from '../lib/storefront/draft-preview';


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
  await check('billing start', db.from('tenants').update({ plan_billing: 'monthly', plan_renews_on: nextRenewal(todayDay(null), 'monthly'), plan_next: null }).eq('id', tid));
  try {
    await writeSite(db, tid, plan, async (file) => readFileSync(join(mediaDir, file)));
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
  }
  process.stdout.write(
    `built: ${plan.sections.length} section rows, ${plan.collections.length} collections, ${plan.products.length} pieces, ${plan.markets.length} markets, ${plan.testimonials.length} testimonials, ${plan.words.length} words\n${BUILDER_EMAIL} is an admin of the site\n`,
  );
  const code = await previewCode(process.env['BACKEND_SESSION_SECRET'], plan.subdomain);
  process.stdout.write(live ? `live: https://${plan.subdomain}.bohdiai.com\n` : code === null ? 'no preview link: BACKEND_SESSION_SECRET is missing\n' : `preview: ${previewLink(plan.subdomain, code)}\n`);
}

main().catch((err: unknown) => fail(`build failed: ${err instanceof Error ? err.message : String(err)}`));
