# Archetype Try-On Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert a built store into another archetype as a saved *version* on the same tenant, previewable in place via `?v=<label>`, with a dashboard to run it — starting with Gallery → Main Street on Abigail's shop.

**Architecture:** A `PortableStore` bundle is the archetype-neutral handoff. Each archetype gains `handOff(content) → PortableStore` (extract). The target archetype re-uses its existing `authoringSpec`/`parseSubmission`/`mediaJobs`/`applyMedia`/`toPayload`; a try-on preamble seeds Bohdi with the portable content so he re-expresses rather than invents. Versions are **self-contained** — the envelope carries `content` + `products` + `lookKey` — so they never touch the live `listings`/`content_pages`. A new `store_versions` table holds them; the resolver renders a version when `?v=` is present.

**Tech Stack:** Next.js App Router, Supabase (service-role admin client), Anthropic SDK, Zod, Vitest.

---

## File structure

- Create `supabase/migrations/20260605000001_store_versions.sql` — the versions table.
- Create `lib/archetypes/portable.ts` — `PortableStore` type.
- Modify `lib/archetypes/builder.ts` — add optional `handOff?(content): PortableStore` to `ArchetypeBuildSpec`.
- Modify `lib/archetypes/gallery/builder.tsx` — implement `handOff`.
- Modify `lib/archetypes/main-street/builder.tsx` — implement `handOff` (round-trip completeness).
- Create `lib/tryon/author-from-portable.ts` — Bohdi loop that authors target content from a `PortableStore` + brief.
- Create `lib/tryon/convert.ts` — the orchestrator (handoff → author → media with reuse → version envelope → write).
- Create `lib/tryon/write-version.ts` — insert/read `store_versions` rows.
- Create `app/api/admin/tryon/route.ts` — POST endpoint that runs a conversion.
- Create `app/admin/tryon/page.tsx` — dashboard listing tenants + run button + version links.
- Modify `app/storefront/page.tsx` + `app/storefront/_components/StorefrontPage.tsx` — thread `?v=` and render the version envelope.
- Tests alongside each lib module.

---

## Task 1: store_versions table

**Files:** Create `supabase/migrations/20260605000001_store_versions.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Store versions — saved try-on variants of a tenant's store. The live store
-- stays in content_pages; a version is a self-contained archetype envelope
-- (content + products + look) previewed in place via ?v=<label>. RLS on with no
-- policies: service-role (admin client) only, same as builds.
create table store_versions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id) on delete cascade,
  label       text not null,
  -- { kind:'archetype', archetypeKey, lookKey, mood, catalogSize, content, products }
  envelope    jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, label),
  constraint store_versions_envelope_is_object check (jsonb_typeof(envelope) = 'object')
);

create index store_versions_tenant_idx on store_versions (tenant_id, created_at desc);

create trigger store_versions_set_updated_at
  before update on store_versions
  for each row execute function set_updated_at();

alter table store_versions enable row level security;

comment on table store_versions is
  'Saved try-on variants of a store. Self-contained archetype envelopes previewed via ?v=<label>; the live store stays in content_pages.';
```

- [ ] **Step 2: Run the migration**

Run: `node scripts/db-migrate.mjs`
Expected: applies `20260605000001_store_versions` cleanly.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260605000001_store_versions.sql
git commit -m "feat(tryon): store_versions table"
```

---

## Task 2: PortableStore type + handOff

**Files:**
- Create `lib/archetypes/portable.ts`
- Modify `lib/archetypes/builder.ts`
- Modify `lib/archetypes/gallery/builder.tsx`
- Modify `lib/archetypes/main-street/builder.tsx`
- Test `lib/archetypes/handoff.test.ts`

- [ ] **Step 1: Write `lib/archetypes/portable.ts`**

```ts
/**
 * The archetype-neutral handoff bundle. Lifting a maker out of one archetype's
 * stored content into this lets another archetype re-express the SAME maker
 * (try-on). Only the maker's content lives here — niche/mood travel separately
 * in the AuthoringBrief.
 */
export interface PortableProduct {
  name: string;
  /** Display price as written, e.g. "$48" or "from $18". */
  price: string;
  description?: string | undefined;
  /** A real photo URL if the source had one, else null. */
  photoUrl?: string | null | undefined;
}

export interface PortableStore {
  shopName: string;
  wordmark: string;
  tagline?: string | undefined;
  maker: {
    headline?: string | undefined;
    body?: string | undefined;
    photoUrl?: string | null | undefined;
  };
  products: PortableProduct[];
}
```

- [ ] **Step 2: Add `handOff` to the contract** — `lib/archetypes/builder.ts`

Add the import and the optional method to `ArchetypeBuildSpec`:

```ts
import type { PortableStore } from './portable';
```

Inside `interface ArchetypeBuildSpec<T = unknown>`, after `toPayload`:

```ts
  /** Lift the maker's portable content out of THIS archetype's stored content,
   *  so another archetype can re-express the same maker (try-on). Optional —
   *  an archetype that can't be a try-on SOURCE omits it. */
  handOff?(content: T): PortableStore;
```

- [ ] **Step 3: Write the failing test** — `lib/archetypes/handoff.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { GALLERY_SPEC } from './gallery/builder';
import { MAIN_STREET_SPEC } from './main-street/builder';

const galleryContent = {
  shopName: 'Abigail\'s Custom Creations',
  identity: { wordmark: 'Abigail\'s Custom Creations', tagline: 'Yarn worked by hand', nav: ['Shop', 'About'] },
  wall: { products: [
    { name: 'Ripple Throw Blanket', price: '$148', photo: { prompt: 'a blanket', alt: 'blanket', url: 'http://x/1.jpg' } },
    { name: 'Classic Beanie', price: 'from $34', photo: { prompt: 'a beanie', alt: 'beanie' } },
  ] },
  maker: { label: 'The Maker', headline: 'One hook one skein', body: 'I crochet from a small home studio.', photo: { prompt: 'maker', alt: 'maker', url: 'http://x/maker.jpg' }, ctaLabel: 'Shop' },
  footer: { blurb: 'Made to order', columns: [{ title: 'Shop', items: ['All'] }, { title: 'More', items: ['About'] }] },
};

describe('Gallery.handOff', () => {
  it('lifts wordmark, tagline, maker, and products with photos out of the wall', () => {
    const p = GALLERY_SPEC.handOff!(galleryContent as never);
    expect(p.wordmark).toBe('Abigail\'s Custom Creations');
    expect(p.tagline).toBe('Yarn worked by hand');
    expect(p.maker.photoUrl).toBe('http://x/maker.jpg');
    expect(p.products).toHaveLength(2);
    expect(p.products[0]).toMatchObject({ name: 'Ripple Throw Blanket', price: '$148', photoUrl: 'http://x/1.jpg' });
    expect(p.products[1]!.photoUrl ?? null).toBeNull();
  });
});

describe('Main Street.handOff', () => {
  it('exposes handOff', () => {
    expect(typeof MAIN_STREET_SPEC.handOff).toBe('function');
  });
});
```

- [ ] **Step 4: Run it — expect FAIL** (`handOff` undefined)

Run: `npx vitest run lib/archetypes/handoff.test.ts`

- [ ] **Step 5: Implement `Gallery.handOff`** — `lib/archetypes/gallery/builder.tsx`

Add import `import type { PortableStore } from '../portable';` and a function, then reference it in `GALLERY_SPEC`:

```ts
function handOff(content: GalleryContent): PortableStore {
  return {
    shopName: content.shopName,
    wordmark: content.identity.wordmark,
    tagline: content.identity.tagline,
    maker: {
      headline: content.maker.headline,
      body: content.maker.body,
      photoUrl: content.maker.photo.url ?? null,
    },
    products: content.wall.products.map((p) => ({
      name: p.name,
      price: p.price,
      photoUrl: p.photo.url ?? null,
    })),
  };
}
```

Add `handOff,` to the `GALLERY_SPEC` object.

- [ ] **Step 6: Implement `Main Street.handOff`** — `lib/archetypes/main-street/builder.tsx`

Add import `import type { PortableStore } from '../portable';` and:

```ts
function handOff(a: MainStreetAuthored): PortableStore {
  return {
    shopName: a.content.shopName,
    wordmark: a.content.identity.wordmark,
    tagline: a.content.moment.eyebrow,
    maker: {
      body: a.content.founder.quote,
      photoUrl: a.content.founder.photo.url ?? null,
    },
    products: a.products.map((p, i) => ({
      name: p.name,
      price: formatPrice(p.basePriceCents),
      description: p.description,
      photoUrl: a.productUrls[i] ?? null,
    })),
  };
}
```

Add `handOff,` to the `MAIN_STREET_SPEC` object. NOTE: Main Street's stored content is `MainStreetContent` (not `MainStreetAuthored`); for the stored-render path the products live in listing rows. `handOff` here is defined over the authored shape for round-trip; the conversion only calls `handOff` on the SOURCE archetype (Gallery in the first cut), so this is for completeness.

- [ ] **Step 7: Run tests — expect PASS**

Run: `npx vitest run lib/archetypes/handoff.test.ts`

- [ ] **Step 8: Commit**

```bash
git add lib/archetypes/portable.ts lib/archetypes/builder.ts lib/archetypes/gallery/builder.tsx lib/archetypes/main-street/builder.tsx lib/archetypes/handoff.test.ts
git commit -m "feat(tryon): PortableStore + archetype handOff"
```

---

## Task 3: authorFromPortable (Bohdi re-expression loop)

**Files:** Create `lib/tryon/author-from-portable.ts`, Test `lib/tryon/author-from-portable.test.ts`

This mirrors `authorStore` in `lib/onboarding/build-archetype-store.ts` but the archetype is FIXED — no `choose_format`, only `submit_store` — and the system prompt is the target's `authoringSpec(brief)` plus a try-on preamble built from the portable store.

- [ ] **Step 1: Write the module**

```ts
import type Anthropic from '@anthropic-ai/sdk';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import type { ArchetypeBuildSpec, AuthoringBrief } from '@/lib/archetypes/builder';
import type { PortableStore } from '@/lib/archetypes/portable';

const MODEL = 'claude-sonnet-4-6';
const MAX_TURNS = 8;

const SUBMIT_TOOL: Anthropic.Tool = {
  name: 'submit_store',
  description: 'Submit the re-expressed store. Returns { ok:true } or { ok:false, issues:[...] } to fix and resubmit.',
  input_schema: {
    type: 'object',
    properties: {
      content: { type: 'object', description: "The archetype's content object." },
      products: { type: 'array', description: 'Separate product catalog, if this archetype uses one.', items: { type: 'object' } },
    },
    required: ['content'],
  },
};

function portableBlock(p: PortableStore): string {
  const products = p.products.map((x) => `  - ${x.name} — ${x.price}${x.description ? ` (${x.description})` : ''}`).join('\n');
  return `YOU ARE RE-EXPRESSING AN EXISTING SHOP IN A NEW LAYOUT — not inventing a new business. Keep this maker's identity, voice, and their exact product names and prices. Do not rename the shop, invent new products, or change prices.

EXISTING SHOP
- Wordmark: ${p.wordmark}
${p.tagline ? `- Tagline / voice: ${p.tagline}\n` : ''}${p.maker.body ? `- Maker story: ${p.maker.body}\n` : ''}- Products (reuse these names and prices exactly):
${products}

Author the new layout's content FROM the above. Where the new layout needs fields the old one lacked (a hero story, a founder line, a close), write them in this maker's voice. For image prompts, describe shots fitting these exact products.`;
}

export async function authorFromPortable<T>(
  spec: ArchetypeBuildSpec<T>,
  brief: AuthoringBrief,
  portable: PortableStore,
): Promise<T> {
  const system = `${spec.authoringSpec(brief)}\n\n${portableBlock(portable)}`;
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: 'Re-express this shop in the new layout. Call submit_store.' },
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const resp = await anthropicClient().messages.create({
      model: MODEL, max_tokens: 16000, system, tools: [SUBMIT_TOOL], messages,
    });
    messages.push({ role: 'assistant', content: resp.content });
    const toolUses = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (toolUses.length === 0) {
      if (resp.stop_reason === 'end_turn') throw new Error('authorFromPortable: ended without submitting');
      continue;
    }
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const parsed = spec.parseSubmission(tu.input);
      if (parsed.ok) {
        logger.info('tryon: re-expressed', { archetype: spec.key, turn: turn + 1 });
        return parsed.authored;
      }
      results.push({ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues: parsed.issues.slice(0, 14) }) });
    }
    messages.push({ role: 'user', content: results });
  }
  throw new Error(`authorFromPortable: no valid submission in ${MAX_TURNS} turns`);
}
```

- [ ] **Step 2: Write the test** (mock the Anthropic client) — `lib/tryon/author-from-portable.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/anthropic', () => ({
  anthropicClient: () => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        stop_reason: 'tool_use',
        content: [{ type: 'tool_use', id: 't1', name: 'submit_store', input: { content: { ok: 1 } } }],
      }),
    },
  }),
}));

import { authorFromPortable } from './author-from-portable';
import type { ArchetypeBuildSpec } from '@/lib/archetypes/builder';

const fakeSpec = {
  key: 'fake',
  authoringSpec: () => 'AUTHOR THIS',
  parseSubmission: (raw: unknown) => ({ ok: true as const, authored: raw }),
} as unknown as ArchetypeBuildSpec;

describe('authorFromPortable', () => {
  it('returns the authored result once parseSubmission passes', async () => {
    const out = await authorFromPortable(fakeSpec, { shopName: 'S', nicheDisplayName: 'n', nicheBody: '', moodLabel: 'm', moodDescription: '', productCount: 2 }, { shopName: 'S', wordmark: 'S', maker: {}, products: [{ name: 'A', price: '$1' }] });
    expect(out).toEqual({ content: { ok: 1 } });
  });
});
```

- [ ] **Step 3: Run — expect PASS.** `npx vitest run lib/tryon/author-from-portable.test.ts`

- [ ] **Step 4: Commit**

```bash
git add lib/tryon/author-from-portable.ts lib/tryon/author-from-portable.test.ts
git commit -m "feat(tryon): authorFromPortable — Bohdi re-expression loop"
```

---

## Task 4: convert orchestrator + write-version

**Files:** Create `lib/tryon/write-version.ts`, `lib/tryon/convert.ts`, Test `lib/tryon/convert.test.ts`

- [ ] **Step 1: Write `lib/tryon/write-version.ts`**

```ts
import { supabaseAdmin } from '@/lib/supabase';

export interface VersionEnvelope {
  kind: 'archetype';
  archetypeKey: string;
  lookKey: string;
  mood: string;
  catalogSize: number;
  content: unknown;
  products: unknown[];
}

export async function writeVersion(tenantId: string, label: string, envelope: VersionEnvelope): Promise<void> {
  const db = supabaseAdmin() as unknown as {
    from: (t: string) => { upsert: (r: unknown, o: unknown) => Promise<{ error: { message: string } | null }> };
  };
  const { error } = await db.from('store_versions').upsert(
    { tenant_id: tenantId, label, envelope },
    { onConflict: 'tenant_id,label' },
  );
  if (error) throw new Error(`writeVersion failed: ${error.message}`);
}

export async function readVersion(tenantId: string, label: string): Promise<VersionEnvelope | null> {
  const db = supabaseAdmin() as unknown as {
    from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { envelope: VersionEnvelope } | null }> } } } };
  };
  const { data } = await db.from('store_versions').select('envelope').eq('tenant_id', tenantId).eq('label', label).maybeSingle();
  return data?.envelope ?? null;
}
```

- [ ] **Step 2: Write `lib/tryon/convert.ts`**

```ts
import { supabaseAdmin } from '@/lib/supabase';
import { MOODS, type MoodKey } from '@/lib/moods';
import { logger } from '@/lib/logger';
import { generateMomentVideo, generateMomentStill } from '@/lib/moments/media';
import { archetypeSpec } from '@/lib/archetypes/registry';
import type { AuthoringBrief, MediaJob } from '@/lib/archetypes/builder';
import { MAX_PRODUCT_IMAGES, recycleProductPhotos } from '@/lib/onboarding/build-archetype-store';
import { authorFromPortable } from './author-from-portable';
import { writeVersion, type VersionEnvelope } from './write-version';

export interface ConvertInput {
  subdomain: string;
  targetArchetypeKey: string;
  label: string;
  /** Optional explicit look; defaults to the target's first look. */
  lookKey?: string | undefined;
}

export interface ConvertResult { tenantId: string; subdomain: string; label: string; archetypeKey: string; lookKey: string; }

export async function convertStore(input: ConvertInput): Promise<ConvertResult> {
  const db = supabaseAdmin();

  // 1. Load tenant + its live home envelope.
  const { data: tenant, error: te } = await db
    .from('tenants').select('id, primary_niche, mood_key, business_name').eq('subdomain', input.subdomain).single();
  if (te || !tenant) throw new Error(`convert: tenant not found: ${input.subdomain}`);
  const t = tenant as { id: string; primary_niche: string; mood_key: string; business_name: string };

  const { data: page } = await db.from('content_pages').select('layout_tree').eq('tenant_id', t.id).eq('slug', '/').single();
  const root = (page as { layout_tree: { root?: VersionEnvelope } } | null)?.layout_tree?.root;
  if (!root || root.kind !== 'archetype') throw new Error('convert: live store is not an archetype');

  // 2. Hand off from the source.
  const sourceSpec = archetypeSpec(root.archetypeKey);
  if (!sourceSpec?.handOff) throw new Error(`convert: ${root.archetypeKey} has no handOff`);
  const portable = sourceSpec.handOff(root.content as never);

  // 3. Build the brief from the tenant's niche + mood.
  const { data: niche } = await db.from('niches').select('display_name, body_markdown').eq('slug', t.primary_niche).single();
  const n = niche as { display_name: string; body_markdown: string | null } | null;
  const mood = MOODS[t.mood_key as MoodKey];
  const brief: AuthoringBrief = {
    shopName: portable.shopName,
    nicheDisplayName: n?.display_name ?? t.primary_niche,
    nicheBody: n?.body_markdown ?? '',
    moodLabel: mood?.label ?? t.mood_key,
    moodDescription: mood?.description ?? '',
    productCount: portable.products.length,
  };

  // 4. Re-express in the target.
  const targetSpec = archetypeSpec(input.targetArchetypeKey);
  if (!targetSpec) throw new Error(`convert: unknown target ${input.targetArchetypeKey}`);
  const authored = await authorFromPortable(targetSpec, brief, portable);

  // 5. Media — reuse the maker photo + any source product photos; generate the rest.
  const jobs = targetSpec.mediaJobs(authored as never);
  const urls: Record<string, string | null> = {};
  const toGen: MediaJob[] = [];
  const productGen: MediaJob[] = [];
  for (const j of jobs) {
    if ((j.id === 'portrait' || j.id === 'maker') && portable.maker.photoUrl) { urls[j.id] = portable.maker.photoUrl; continue; }
    const pm = j.id.match(/^product:(\d+)$/);
    if (pm && portable.products[Number(pm[1])]?.photoUrl) { urls[j.id] = portable.products[Number(pm[1])]!.photoUrl ?? null; continue; }
    if (j.group === 'product') productGen.push(j); else toGen.push(j);
  }
  const run = (j: MediaJob) => j.kind === 'video'
    ? generateMomentVideo(j.prompt, { subdomain: `${input.subdomain}/${input.label}/${j.id}`, aspect: j.aspect, ...(j.durationSec !== undefined ? { durationSec: j.durationSec } : {}) })
    : generateMomentStill(j.prompt, { subdomain: `${input.subdomain}/${input.label}/${j.id}`, aspect: j.aspect });
  const cappedProduct = productGen.slice(0, MAX_PRODUCT_IMAGES);
  const [featUrls, prodUrls] = await Promise.all([Promise.all(toGen.map(run)), Promise.all(cappedProduct.map(run))]);
  toGen.forEach((j, i) => { urls[j.id] = featUrls[i] ?? null; });
  const prodPhotos = prodUrls.filter((u): u is string => typeof u === 'string' && u.length > 0);
  const recycled = recycleProductPhotos(productGen.length, prodPhotos);
  productGen.forEach((j, i) => { urls[j.id] = recycled[i] ?? null; });

  // 6. Fold media in, build the self-contained envelope, write the version.
  const withMedia = targetSpec.applyMedia(authored as never, urls);
  const payload = targetSpec.toPayload(withMedia as never);
  const lookKey = input.lookKey && targetSpec.looks.some((l) => l.key === input.lookKey) ? input.lookKey : targetSpec.looks[0]!.key;
  const envelope: VersionEnvelope = {
    kind: 'archetype', archetypeKey: targetSpec.key, lookKey, mood: t.mood_key,
    catalogSize: portable.products.length, content: payload.content, products: payload.products,
  };
  await writeVersion(t.id, input.label, envelope);
  logger.info('tryon: version written', { subdomain: input.subdomain, label: input.label, archetype: targetSpec.key, lookKey });
  return { tenantId: t.id, subdomain: input.subdomain, label: input.label, archetypeKey: targetSpec.key, lookKey };
}
```

- [ ] **Step 3: Test the media-reuse partition** (the pure decision) — extract it if needed. For now a light test on `recycleProductPhotos` already exists; add `lib/tryon/convert.test.ts` asserting the reuse rule via a small exported helper `partitionMedia(jobs, portable)`. (If extraction is too invasive, skip — the live run is the proof; note this in the test file.)

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit`

```bash
git add lib/tryon/write-version.ts lib/tryon/convert.ts lib/tryon/convert.test.ts
git commit -m "feat(tryon): convert orchestrator + version persistence"
```

---

## Task 5: Resolver `?v=` branch

**Files:** Modify `app/storefront/page.tsx`, `app/storefront/_components/StorefrontPage.tsx`

- [ ] **Step 1:** `app/storefront/page.tsx` — read `searchParams.v` and pass it down:

```tsx
import StorefrontPage from './_components/StorefrontPage';

export default async function StorefrontHomePage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const sp = await searchParams;
  return <StorefrontPage slug="/" version={sp.v} />;
}
```

- [ ] **Step 2:** `StorefrontPage` — accept `version?: string`. After resolving `tenantId`, before the normal page load, if `version` is set, load the version envelope and render it directly:

```tsx
// near the top, after tenantId is known:
if (version) {
  const env = await readVersion(tenantId, version);
  if (env && env.kind === 'archetype') {
    const spec = archetypeSpec(env.archetypeKey);
    if (spec) {
      const products = (env.products ?? []) as ProductView[];
      return spec.render({ content: env.content, lookKey: env.lookKey, products, mood: env.mood, catalogSize: env.catalogSize });
    }
  }
  // unknown version → fall through to the live store
}
```

Import `readVersion` from `@/lib/tryon/write-version` and `archetypeSpec` from `@/lib/archetypes/registry` (and reuse the existing `ProductView` import). The version render must inject the skin's font links the same way `renderArchetypeStore` does — confirm `MainStreetRoot` (inside `spec.render`) already injects `MAIN_STREET_FONT_HREFS`, which it does, so no extra wiring.

- [ ] **Step 3:** Confirm the existing `renderArchetypeStore` (live path) is unchanged.

- [ ] **Step 4: Typecheck + commit**

```bash
git add app/storefront/page.tsx app/storefront/_components/StorefrontPage.tsx
git commit -m "feat(tryon): render a store version on ?v="
```

---

## Task 6: API route

**Files:** Create `app/api/admin/tryon/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server';
import { convertStore } from '@/lib/tryon/convert';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { subdomain?: string; target?: string; label?: string; lookKey?: string };
    if (!body.subdomain || !body.target || !body.label) {
      return NextResponse.json({ ok: false, error: 'subdomain, target, label required' }, { status: 400 });
    }
    const result = await convertStore({ subdomain: body.subdomain, targetArchetypeKey: body.target, label: body.label, lookKey: body.lookKey });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/admin/tryon/route.ts
git commit -m "feat(tryon): POST /api/admin/tryon"
```

---

## Task 7: Dashboard

**Files:** Create `app/admin/tryon/page.tsx` (server component lists tenants) + a small client component for the run button.

- [ ] **Step 1:** Server page lists active tenants (subdomain, business_name, live archetype from `content_pages.layout_tree.root.archetypeKey`) and their existing versions (from `store_versions`). Each row shows: live link (`http://{sub}.localhost:3000/`), a "Try on Main Street" button (client), and links to any versions (`…/?v={label}`).

- [ ] **Step 2:** Client button POSTs `{ subdomain, target: 'main-street', label: 'mainstreet' }` to `/api/admin/tryon`, shows a spinner, then on success reveals the `?v=mainstreet` link. (Plain `fetch`; no framework.)

- [ ] **Step 3:** Access at `http://localhost:3000/admin/tryon` (host `localhost` → not a storefront, so the route renders normally). NOTE: no auth yet — founder-only, dev. Add auth before this ships.

- [ ] **Step 4: Typecheck + lint + commit**

```bash
git add app/admin/tryon
git commit -m "feat(tryon): admin dashboard to run + preview conversions"
```

---

## Task 8: Live proof — Abigail Gallery → Main Street

- [ ] **Step 1:** Start dev server (already running on 3000). Open `http://localhost:3000/admin/tryon`.
- [ ] **Step 2:** On `abigails-custom-creations`, click "Try on Main Street". Wait for the build (hero + ~5 product photos; ~1–10 min depending on still vs video).
- [ ] **Step 3:** Open the live Gallery (`http://abigails-custom-creations.localhost:3000/`) and the conversion (`/?v=mainstreet`) side by side. Hand to Alex to judge.

---

## Self-review notes

- **Spec coverage:** PortableStore + handOff (T2), takeOn via authorFromPortable (T3), conversion flow + media reuse + version envelope (T4), store_versions (T1), resolver ?v= (T5), dashboard access (T6–7), live proof (T8). Security/owner-gating and make-live are explicitly out of scope per the spec.
- **Products travel in the envelope** (not the listings table), so a version never pollutes the live store — resolved in T4/T5.
- **Look selection** for the target is a default (first look / optional override) — the niche→world→voice selection debate is deliberately out of scope; the dashboard can pass an explicit `lookKey` later.
- **Open risk:** `authorFromPortable` is a live-Bohdi seam; only the pass-through is unit-tested. The Abigail run (T8) is the real proof.
