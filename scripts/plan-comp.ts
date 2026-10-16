/**
 * Mark a site free (Alex, 2026-10-16), until Alex's dashboard has a screen for it.
 *
 *   npx tsx --env-file=.env.local scripts/plan-comp.ts <subdomain> free|showcase|none ["why, for Alex"]
 *   npx tsx --env-file=.env.local scripts/plan-comp.ts list
 *
 * free: nothing to pay on any plan. showcase: Showcase is free, Market and Full
 * at their normal price. none: pays normally.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';
import { isPlanComp } from '../lib/backend/plan/billing';

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const [sub, kind, note] = process.argv.slice(2);
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (url === undefined || key === undefined) fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed (use --env-file=.env.local)');
  const db = createClient<Database>(url, key, { auth: { persistSession: false } });

  if (sub === 'list') {
    const { data, error } = await db.from('tenants').select('subdomain, plan_comp, plan_comp_note').not('plan_comp', 'is', null).order('subdomain');
    if (error !== null) fail(`reading failed: ${error.message}`);
    for (const r of data ?? []) process.stdout.write(`${r.subdomain}: ${r.plan_comp}${r.plan_comp_note === null ? '' : ` (${r.plan_comp_note})`}\n`);
    if ((data ?? []).length === 0) process.stdout.write('no free sites\n');
    return;
  }
  if (sub === undefined || kind === undefined || !(isPlanComp(kind) || kind === 'none')) fail('usage: plan-comp.ts <subdomain> free|showcase|none ["why"] | list');
  const { data, error } = await db
    .from('tenants')
    .update({ plan_comp: kind === 'none' ? null : kind, plan_comp_note: kind === 'none' ? null : (note ?? null) })
    .eq('subdomain', sub)
    .select('subdomain');
  if (error !== null) fail(`saving failed: ${error.message}`);
  if ((data ?? []).length === 0) fail(`no site called ${sub}`);
  process.stdout.write(`${sub}: ${kind === 'none' ? 'pays normally' : kind}\n`);
}

void main();
