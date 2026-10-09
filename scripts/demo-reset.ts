/**
 * Put a demo site back to a clean starting point for a recording (Saltmarsh & Lace
 * demo spec) — Claude's tool, not a user surface. Refuses any site that isn't a
 * demo (the demo_checkout switch), so a real client can never be reset.
 *
 *   npx tsx --env-file=.env.local scripts/demo-reset.ts <site> showcase|lite|full
 *
 * <site> names a module in scripts/sites/ (the same one build-card-site.ts uses).
 *   showcase  her gallery from the module's photos, no products, no testimonials,
 *             monthly billing 20 days from renewal, nothing waiting
 *   lite      showcase, then the real upgrade: each photo becomes a product with
 *             "Ask for price", and the Lite switches
 *   full      lite, then the Full switches and the module's TESTIMONIALS
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { applyPlan } from '../lib/backend/plan/apply';
import { galleryToProducts } from '../lib/backend/plan/convert';
import { addDays, todayDay } from '../lib/backend/plan/billing';
import type { CardSiteModule } from './build-card-site';

type DemoModule = CardSiteModule & { TESTIMONIALS?: { quote: string; name: string; detail?: string }[] };

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [siteKey, stage] = process.argv.slice(2);
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

  // Full: the Full switches and her testimonials.
  const full = await applyPlan(db, tid, 'full');
  if (!full.ok) fail(`plan failed: ${full.error}`);
  const words = site.TESTIMONIALS ?? [];
  if (words.length > 0) {
    await step('testimonials', () => db.from('site_testimonials').insert(words.map((t, position) => ({ tenant_id: tid, position, quote: t.quote, name: t.name, detail: t.detail ?? null }))));
  }
  process.stdout.write(`full: ${words.length} testimonials\n`);
}

main().catch((err: unknown) => fail(`failed: ${err instanceof Error ? err.message : String(err)}`));
