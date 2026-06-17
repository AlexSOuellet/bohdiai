#!/usr/bin/env node
// Quick tenant inspection. Usage: node --env-file=.env.local scripts/check-tenant.mjs <subdomain>
import { createClient } from '@supabase/supabase-js';

const [, , subdomain] = process.argv;
if (!subdomain) {
  console.error('usage: node --env-file=.env.local scripts/check-tenant.mjs <subdomain>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);

const { data: t } = await sb
  .from('tenants')
  .select('subdomain, shop_name, niche_slug, mood, status, design_tokens, brand_colors')
  .eq('subdomain', subdomain)
  .single();

if (!t) { console.error('not found'); process.exit(1); }

const skin =
  t.design_tokens?.skin ||
  t.design_tokens?.skinKey ||
  t.design_tokens?.skin_key ||
  t.design_tokens?.archetype?.skin ||
  null;

console.log(JSON.stringify({
  subdomain: t.subdomain,
  shop: t.shop_name,
  niche: t.niche_slug,
  mood: t.mood,
  status: t.status,
  skin,
  brand_colors: t.brand_colors,
  design_tokens_keys: Object.keys(t.design_tokens || {}),
}, null, 2));

const { data: choices } = await sb
  .from('design_choices')
  .select('decision_type, picked, reasoning')
  .eq('tenant_id', (await sb.from('tenants').select('id').eq('subdomain', subdomain).single()).data.id)
  .order('created_at', { ascending: true });

console.log('\n--- design_choices ---');
for (const c of choices ?? []) {
  const picked = typeof c.picked === 'object' ? JSON.stringify(c.picked).slice(0, 200) : c.picked;
  console.log(`[${c.decision_type}] ${picked}${c.reasoning ? '  — ' + c.reasoning.slice(0, 200) : ''}`);
}
