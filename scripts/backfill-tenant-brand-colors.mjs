#!/usr/bin/env node
/**
 * Backfill brand_colors + envelope accentOverride for an existing tenant.
 *
 * Use to test the new logo treatment on a tenant that was built before the
 * brand_colors column existed (or to retry on a tenant where Vision failed).
 * Does NOT regenerate images or video — those stay as-is. The render-time logo
 * contrast and the baked accent override are the only things that change.
 *
 * Usage:
 *   node scripts/backfill-tenant-brand-colors.mjs <subdomain> [--colors "#hex,#hex"] [--dry]
 *
 *   <subdomain>           Required. The tenant subdomain (e.g. rhody-strong).
 *   --colors "#a,#b,..."  Optional. Comma-separated hex colors, prominence-ordered.
 *                         When provided, skips the Vision call entirely (zero tokens).
 *   --dry                 Optional. Print what would change without writing.
 *
 *   With no --colors flag, runs ONE Claude Vision call on the existing logo URL
 *   to extract the colors (same call onboarding makes; ~$0.005 worst case).
 *
 *   Writes tenants.brand_colors and the / page's layout_tree.root.accentOverride.
 *   The accentOverride is the first valid hex (the dominant color); the contrast
 *   guard at render skips the override on its own when the color is gray or pale.
 */
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const [, , subdomain, ...rest] = process.argv;
if (!subdomain || subdomain.startsWith('-')) {
  console.error('usage: node scripts/backfill-tenant-brand-colors.mjs <subdomain> [--colors "#hex,#hex"] [--dry]');
  process.exit(1);
}

const dry = rest.includes('--dry');
const colorsIdx = rest.indexOf('--colors');
const manualColors = colorsIdx >= 0 ? rest[colorsIdx + 1] : null;

const HEX6 = /^#[0-9a-fA-F]{6}$/;

function parseColors(raw) {
  return raw.split(',').map((c) => c.trim()).filter((c) => HEX6.test(c));
}

function dominantBrandColor(colors) {
  return colors.find((c) => HEX6.test(c));
}

async function extractBrandColorsViaVision(logoUrl, apiKey) {
  const client = new Anthropic({ apiKey });
  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'url', url: logoUrl } },
        { type: 'text', text: `Identify the dominant brand colors in this logo. Return 2-4 hex codes ordered by visual prominence in the design. Ignore white, transparent, or off-white backgrounds — those are page color, not brand color. Ignore very thin outlines and small accents.\n\nReturn ONLY a JSON object, no markdown:\n{"colors":["#rrggbb","#rrggbb",...]}` },
      ],
    }],
  });
  const text = resp.content[0]?.type === 'text' ? resp.content[0].text : '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Vision returned no JSON');
  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed.colors)) throw new Error('Vision returned no colors array');
  return parsed.colors.filter((c) => typeof c === 'string' && HEX6.test(c));
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — load .env.local with `node --env-file=.env.local`');
  process.exit(1);
}
const db = createClient(url, serviceKey);

// 1) Load the tenant.
const { data: tenant, error: tErr } = await db
  .from('tenants')
  .select('id, subdomain, business_name, logo_url, brand_colors')
  .eq('subdomain', subdomain)
  .maybeSingle();
if (tErr) { console.error('tenant lookup failed:', tErr.message); process.exit(1); }
if (!tenant) { console.error(`no tenant with subdomain "${subdomain}"`); process.exit(1); }
if (!tenant.logo_url) { console.error(`tenant "${subdomain}" has no uploaded logo — nothing to derive colors from`); process.exit(1); }

console.log(`tenant: ${tenant.business_name} (${tenant.id})`);
console.log(`  logo: ${tenant.logo_url}`);
console.log(`  current brand_colors: ${JSON.stringify(tenant.brand_colors)}`);

// 2) Decide the colors: manual or Vision.
let colors;
if (manualColors) {
  colors = parseColors(manualColors);
  if (colors.length === 0) { console.error(`--colors gave no valid 6-digit hex values`); process.exit(1); }
  console.log(`  source: --colors flag (no token use)`);
} else {
  if (!anthropicKey) { console.error('Missing ANTHROPIC_API_KEY (needed for Vision; or pass --colors to skip)'); process.exit(1); }
  console.log(`  source: Claude Vision on the existing logo (one ~$0.005 call) — pass --colors to skip`);
  if (dry) {
    console.log(`  --dry: skipping the Vision call`);
    process.exit(0);
  }
  colors = await extractBrandColorsViaVision(tenant.logo_url, anthropicKey);
}
console.log(`  new brand_colors: ${JSON.stringify(colors)}`);
const accent = dominantBrandColor(colors) ?? null;
console.log(`  envelope accentOverride: ${accent ?? '(null — no usable color)'}`);

// 3) Load the home page envelope (slug '/').
const { data: page, error: pErr } = await db
  .from('content_pages')
  .select('id, layout_tree')
  .eq('tenant_id', tenant.id)
  .eq('slug', '/')
  .maybeSingle();
if (pErr) { console.error('home page lookup failed:', pErr.message); process.exit(1); }
if (!page) { console.error(`no home page row for tenant "${subdomain}"`); process.exit(1); }

const envelope = page.layout_tree && typeof page.layout_tree === 'object' ? { ...page.layout_tree } : {};
if (!envelope.root || envelope.root.kind !== 'archetype') {
  console.error(`home page envelope is not an archetype envelope (kind=${envelope.root?.kind ?? 'missing'}) — cannot backfill`);
  process.exit(1);
}
const newEnvelope = { ...envelope, root: { ...envelope.root, accentOverride: accent } };

if (dry) {
  console.log('--dry: not writing.');
  process.exit(0);
}

// 4) Write tenants.brand_colors and the updated envelope.
const { error: uErr } = await db
  .from('tenants')
  .update({ brand_colors: colors.length > 0 ? colors : null })
  .eq('id', tenant.id);
if (uErr) { console.error('tenant update failed:', uErr.message); process.exit(1); }

const { error: pUpdErr } = await db
  .from('content_pages')
  .update({ layout_tree: newEnvelope })
  .eq('id', page.id);
if (pUpdErr) { console.error('home page update failed:', pUpdErr.message); process.exit(1); }

console.log('done — reload the storefront to see the new logo treatment.');
