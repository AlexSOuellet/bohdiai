/**
 * Switch a site on, or hide it again — Claude's tool, not a user surface.
 *
 *   npx tsx --env-file=.env.local scripts/site-visibility.ts <subdomain> live|draft|link
 *
 * live: the public can see it. draft: "not found" to everyone but the private
 * preview link. link: print the preview link without changing anything.
 */
import { createClient } from '@supabase/supabase-js';
import { previewCode, previewLink } from '../lib/storefront/draft-preview';

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [subdomain, action] = process.argv.slice(2);
  if (subdomain === undefined || (action !== 'live' && action !== 'draft' && action !== 'link')) {
    fail('usage: site-visibility.ts <subdomain> live|draft|link');
  }
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('missing SUPABASE url / service key — run with --env-file=.env.local');
  const db = createClient(url, key);

  const { data, error } = await db.from('tenants').select('id, status').eq('subdomain', subdomain).is('deleted_at', null).maybeSingle();
  if (error !== null) fail(`lookup failed: ${error.message}`);
  if (data === null) fail(`no site "${subdomain}"`);
  const tenant = data as { id: string; status: string };

  if (action !== 'link') {
    const status = action === 'live' ? 'active' : 'draft';
    const { error: uErr } = await db.from('tenants').update({ status }).eq('id', tenant.id);
    if (uErr !== null) fail(`update failed: ${uErr.message}`);
    process.stdout.write(`${subdomain}: ${tenant.status} → ${status}\n`);
  } else {
    process.stdout.write(`${subdomain}: ${tenant.status}\n`);
  }
  const code = await previewCode(process.env['BACKEND_SESSION_SECRET'], subdomain);
  if (code === null) fail('BACKEND_SESSION_SECRET missing or short — cannot make the preview link');
  process.stdout.write(`Private preview link (works while it is a draft):\n  ${previewLink(subdomain, code)}\n`);
}

main().catch((err: unknown) => fail(`failed: ${err instanceof Error ? err.message : String(err)}`));
