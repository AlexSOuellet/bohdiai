# Logo header treatment + brand-color anchoring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop discarding the logo's extracted brand colors; use them to (a) guarantee the header logo reads on any backdrop with no cheap white box, and (b) tint the store's accent to the maker's logo color inside their mood.

**Architecture:** Two clocks. The logo's *header contrast* is a render-time property derived live from `tenants.brand_colors` every draw, so it's correct whenever the logo arrives. The *accent tint* is baked at build into the stored envelope, so a late logo never silently repaints a built store. Both halves share one new persisted column and one pure color-math module.

**Tech Stack:** Next.js (App Router), Supabase (Postgres), TypeScript (strictest), Vitest, React Testing Library.

**Design source:** `docs/superpowers/specs/2026-06-11-logo-header-and-brand-colors-design.md`

---

## File structure

- **Create** `lib/archetypes/main-street/logo-contrast.ts` — pure color math: luminance, logo tone, readable-text, dominant color, nav-contrast decision. No React, no IO.
- **Create** `lib/archetypes/main-street/logo-contrast.test.ts` — unit tests for the above.
- **Create** `supabase/migrations/20260611000001_tenants_brand_colors.sql` — add `brand_colors text[]`.
- **Modify** `lib/onboarding/run-storefront.ts` — stop dropping `brandColors`; forward it.
- **Modify** `lib/onboarding/run-storefront.test.ts` — invert the drop-it assertion.
- **Modify** `lib/onboarding/build-archetype-store.ts` — accept `brandColors`, compute the baked `accentOverride`, forward both to the writer.
- **Modify** `lib/generation/write-archetype-storefront.ts` — write `brand_colors` column; store `accentOverride` in the envelope root.
- **Modify** `app/storefront/_components/StorefrontPage.tsx` — load `brand_colors`; read `accentOverride` from the envelope; thread both into render.
- **Modify** `lib/archetypes/builder.ts` — add `accentOverride` + `brandColors` to the render arg contracts.
- **Modify** `lib/archetypes/main-street/builder.tsx` — apply the accent override to the resolved skin; inject logo tone into identity.
- **Modify** `lib/archetypes/main-street/chrome.tsx` — delete `ms-logo-plate`; `WordmarkLink` renders the bare logo; `SubHeader`/`Nav` apply the nav-contrast surface.
- **Modify** `lib/archetypes/main-street/MomentHero.tsx` — apply the nav-contrast surface in both nav states (transparent-over-media and solid).
- **Modify** `lib/archetypes/main-street/schemas.ts` — add optional `logoTone` to identity (parallels `logoUrl`).

---

## Task 1: Migration — persist brand colors on the tenant

**Files:**
- Create: `supabase/migrations/20260611000001_tenants_brand_colors.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Persist the logo's extracted brand colors on the tenant so the renderer can
-- guarantee logo contrast (render-time) and a late upload re-anchors cleanly.
-- Ordered by visual prominence; empty/absent when no raster logo was analyzed.
alter table public.tenants
  add column if not exists brand_colors text[];

comment on column public.tenants.brand_colors is
  'Dominant logo ink colors (hex), prominence-ordered. Drives render-time logo header contrast. Null/empty when no logo or SVG/failed analysis.';
```

- [ ] **Step 2: Apply the migration**

Run: `node scripts/db-migrate.mjs`
Expected: migration `20260611000001_tenants_brand_colors` applies; no error.

- [ ] **Step 3: Regenerate types**

Run: `npm run gen:types`
Expected: `lib/database.types.ts` now lists `brand_colors: string[] | null` on `tenants` Row/Insert/Update.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260611000001_tenants_brand_colors.sql lib/database.types.ts
git commit -m "feat(db): add tenants.brand_colors for logo-driven contrast + accent"
```

---

## Task 2: Stop discarding brand colors — persist them through the build

**Files:**
- Modify: `lib/onboarding/run-storefront.ts`
- Modify: `lib/onboarding/run-storefront.test.ts`
- Modify: `lib/onboarding/build-archetype-store.ts:29-40` (input type), `:153-168` (writer call)
- Modify: `lib/generation/write-archetype-storefront.ts:12-33` (input), `:47-58` (insert)

- [ ] **Step 1: Invert the drop-it test**

In `lib/onboarding/run-storefront.test.ts`, replace the test at line 47 (`does not pass brandColors into the build…`) with:

```ts
it('passes brandColors through to the build (so they can be persisted)', async () => {
  const passedInput = await captureBuildInput(); // existing harness that spies buildArchetypeStore
  await runStorefront({ ...baseInput, brandColors: ['#1d7a66', '#e7d8b0'] });
  expect(passedInput).toHaveProperty('brandColors', ['#1d7a66', '#e7d8b0']);
});
```

(If the existing test uses a local spy variable rather than `captureBuildInput`, keep that mechanism — only the assertion flips from `not.toHaveProperty` to `toHaveProperty('brandColors', [...])`.)

- [ ] **Step 2: Run it — verify it fails**

Run: `npx vitest run lib/onboarding/run-storefront.test.ts`
Expected: FAIL — `brandColors` is currently stripped, so the property is missing.

- [ ] **Step 3: Forward brandColors in run-storefront**

In `lib/onboarding/run-storefront.ts`, add `brandColors` to the `buildArchetypeStore` call (after `logoUrl: input.logoUrl,`):

```ts
      logoUrl: input.logoUrl,
      brandColors: input.brandColors,
```

- [ ] **Step 4: Accept + forward brandColors in build-archetype-store**

In `lib/onboarding/build-archetype-store.ts`, add to `ArchetypeBuildInput` (after `logoUrl?`):

```ts
  logoUrl?: string | undefined;
  /** The logo's extracted brand colors (prominence-ordered hex), or empty. Persisted
   *  for render-time contrast; the dominant one bakes the accent (Task 5). */
  brandColors?: string[] | undefined;
```

And in the `writeArchetypeStorefront({ … })` call (around line 153), add after `logoUrl: input.logoUrl,`:

```ts
    logoUrl: input.logoUrl,
    brandColors: input.brandColors ?? [],
```

- [ ] **Step 5: Persist the column in the writer**

In `lib/generation/write-archetype-storefront.ts`, add to `ArchetypeWriteInput` (after `logoUrl?`):

```ts
  logoUrl?: string | undefined;
  /** Logo brand colors to persist on the tenant (render-time contrast source). */
  brandColors?: string[] | undefined;
```

And in the `.insert({ … })` (after the `logo_url:` line):

```ts
      logo_url: input.logoUrl && input.logoUrl !== '' ? input.logoUrl : null,
      brand_colors: input.brandColors && input.brandColors.length > 0 ? input.brandColors : null,
```

- [ ] **Step 6: Run the test — verify it passes**

Run: `npx vitest run lib/onboarding/run-storefront.test.ts`
Expected: PASS.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/onboarding/run-storefront.ts lib/onboarding/run-storefront.test.ts lib/onboarding/build-archetype-store.ts lib/generation/write-archetype-storefront.ts
git commit -m "feat(build): persist logo brand_colors through the build path"
```

---

## Task 3: Pure color math (logo-contrast module)

**Files:**
- Create: `lib/archetypes/main-street/logo-contrast.ts`
- Create: `lib/archetypes/main-street/logo-contrast.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import {
  relativeLuminance, dominantBrandColor, logoTone, readableOn, navContrast,
} from './logo-contrast';

describe('relativeLuminance', () => {
  it('is ~0 for black and ~1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 2);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 2);
  });
});

describe('dominantBrandColor', () => {
  it('returns the first valid hex, prominence-ordered', () => {
    expect(dominantBrandColor(['#1d7a66', '#e7d8b0'])).toBe('#1d7a66');
  });
  it('skips invalid entries and returns undefined when none valid', () => {
    expect(dominantBrandColor(['nope', '#zzzzzz'])).toBeUndefined();
    expect(dominantBrandColor([])).toBeUndefined();
  });
});

describe('logoTone', () => {
  it('reads a dark dominant ink as dark, a light one as light', () => {
    expect(logoTone(['#1a1a1a'])).toBe('dark');
    expect(logoTone(['#f3ead8'])).toBe('light');
  });
  it('is unknown when there is no usable color', () => {
    expect(logoTone([])).toBe('unknown');
  });
});

describe('readableOn', () => {
  it('puts dark text on a light fill and light text on a dark fill', () => {
    expect(readableOn('#f3ead8')).toBe('#1a1a1a');
    expect(readableOn('#1d3a2e')).toBe('#ffffff');
  });
});

describe('navContrast', () => {
  it('returns null (bare) when the logo tone contrasts the backdrop', () => {
    expect(navContrast('light', 'dark')).toBeNull();
    expect(navContrast('dark', 'light')).toBeNull();
  });
  it('returns null (status quo) when the tone is unknown', () => {
    expect(navContrast('unknown', 'dark')).toBeNull();
  });
  it('returns a light surface for a dark logo on a dark backdrop', () => {
    expect(navContrast('dark', 'dark')).toEqual({ bg: '#F7F5F2', fg: '#1a1a1a' });
  });
  it('returns a dark surface for a light logo on a light backdrop', () => {
    expect(navContrast('light', 'light')).toEqual({ bg: '#1b1b1b', fg: '#F7F5F2' });
  });
});
```

- [ ] **Step 2: Run them — verify they fail**

Run: `npx vitest run lib/archetypes/main-street/logo-contrast.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the module**

```ts
/**
 * Pure color math for the Main Street header. Decides — with no IO and no React —
 * whether the maker's logo reads on a given header backdrop, and what surface to
 * give the header when it doesn't. The renderer applies these; it never boxes the
 * logo. See docs/superpowers/specs/2026-06-11-logo-header-and-brand-colors-design.md.
 */
export type Tone = 'light' | 'dark' | 'unknown';

const HEX6 = /^#[0-9a-fA-F]{6}$/;

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) … 1 (white). */
export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The most prominent usable brand color (first valid hex), or undefined. */
export function dominantBrandColor(colors: string[]): string | undefined {
  return colors.find((c) => HEX6.test(c));
}

/** Whether the logo, as a whole, reads light or dark — from its dominant ink. */
export function logoTone(colors: string[]): Tone {
  const c = dominantBrandColor(colors);
  if (c === undefined) return 'unknown';
  return relativeLuminance(c) > 0.5 ? 'light' : 'dark';
}

/** Readable text color (near-black or near-white) for content placed ON `hex`. */
export function readableOn(hex: string): '#1a1a1a' | '#ffffff' {
  return relativeLuminance(hex) > 0.5 ? '#1a1a1a' : '#ffffff';
}

/**
 * The header surface needed so the logo reads on a backdrop of `backdrop` tone.
 * Null means leave the header as-is (the logo already contrasts, or we can't tell).
 * Otherwise the header takes a full-width contrasting surface — intentional chrome,
 * never a box around the mark.
 */
export function navContrast(logo: Tone, backdrop: 'light' | 'dark'): { bg: string; fg: string } | null {
  if (logo === 'unknown' || logo !== backdrop) return null;
  return logo === 'dark'
    ? { bg: '#F7F5F2', fg: '#1a1a1a' }
    : { bg: '#1b1b1b', fg: '#F7F5F2' };
}
```

- [ ] **Step 4: Run them — verify they pass**

Run: `npx vitest run lib/archetypes/main-street/logo-contrast.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/logo-contrast.ts lib/archetypes/main-street/logo-contrast.test.ts
git commit -m "feat(main-street): pure logo-contrast color math"
```

---

## Task 4: Render-time logo contrast — delete the plate, contrast the header

**Files:**
- Modify: `lib/archetypes/main-street/schemas.ts` (identity: add optional `logoTone`)
- Modify: `app/storefront/_components/StorefrontPage.tsx:65-86,125-140,330-339` (load brand_colors, thread it)
- Modify: `lib/archetypes/builder.ts:99-127` (render contracts: add `brandColors`)
- Modify: `lib/archetypes/main-street/builder.tsx:143-146,202-228` (inject logoTone into identity)
- Modify: `lib/archetypes/main-street/chrome.tsx:70-75,189-207,229-266` (delete plate; contrast SubHeader/Nav)
- Modify: `lib/archetypes/main-street/MomentHero.tsx:287-308` (contrast both nav states)
- Modify: `lib/archetypes/main-street/pages.tsx:16-45` (SubHeader contrast)

### 4a — Thread the logo tone to the chrome

- [ ] **Step 1: Add `logoTone` to the identity schema**

In `lib/archetypes/main-street/schemas.ts`, find the identity object schema (the one with `wordmark`, `nav`, optional `logoUrl`) and add, alongside `logoUrl`:

```ts
  logoUrl: z.string().optional(),
  logoTone: z.enum(['light', 'dark', 'unknown']).optional(),
```

- [ ] **Step 2: Load brand_colors at render**

In `app/storefront/_components/StorefrontPage.tsx`, beside `loadTenantLogo` (line ~65), add:

```ts
async function loadTenantBrandColors(tenantId: string): Promise<string[]> {
  const db = supabaseAdmin() as unknown as {
    from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { brand_colors: string[] | null } | null }> } } };
  };
  const { data } = await db.from('tenants').select('brand_colors').eq('id', tenantId).maybeSingle();
  return data?.brand_colors ?? [];
}
```

(Match the exact local typing style already used by `loadTenantLogo` in this file — mirror it, do not introduce a new pattern.)

- [ ] **Step 3: Pass brandColors into every render call**

In the same file, wherever `logoUrl: await loadTenantLogo(tenantId)` / `logoUrl: a.logoUrl` is passed to a `spec.render*` call (lines ~94, 105, 113, 135, 339 and the loader at ~85), add a sibling `brandColors`. At the loader (line ~85):

```ts
  const logoUrl = await loadTenantLogo(tenantId);
  const brandColors = await loadTenantBrandColors(tenantId);
  return { spec, lookKey, content: env['content'], logoUrl, brandColors };
```

and thread `brandColors: a.brandColors` / `brandColors: await loadTenantBrandColors(tenantId)` into each `spec.render*({ … })` call alongside `logoUrl`.

- [ ] **Step 4: Add `brandColors` to the render contracts**

In `lib/archetypes/builder.ts`, add to each of `render`, `renderProduct`, `renderContentPage`, `renderShell` arg objects (beside `logoUrl?`):

```ts
    /** The tenant's logo brand colors (live, render-time) — drives header contrast. */
    brandColors?: string[] | undefined;
```

- [ ] **Step 5: Derive + inject the tone in the Main Street spec**

In `lib/archetypes/main-street/builder.tsx`, replace `withLogo` (lines 143-146) with a version that also folds the tone:

```ts
function withLogo(content: MainStreetContent, logoUrl?: string, brandColors?: string[]): MainStreetContent {
  if ((logoUrl === undefined || logoUrl === '') && (brandColors === undefined || brandColors.length === 0)) return content;
  const identity = { ...content.identity };
  if (logoUrl !== undefined && logoUrl !== '') identity.logoUrl = logoUrl;
  if (brandColors !== undefined && brandColors.length > 0) identity.logoTone = logoTone(brandColors);
  return { ...content, identity };
}
```

Add the import at the top: `import { logoTone } from './logo-contrast';`. Then in every `render*` method, pass `brandColors` into `withLogo(content as MainStreetContent, logoUrl, brandColors)` and destructure `brandColors` from the args.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/archetypes/main-street/schemas.ts app/storefront/_components/StorefrontPage.tsx lib/archetypes/builder.ts lib/archetypes/main-street/builder.tsx
git commit -m "feat(render): thread live logo tone from brand_colors to the chrome"
```

### 4b — Delete the plate; contrast the sub-page header

- [ ] **Step 1: Write the failing render tests**

In `lib/archetypes/main-street/pages.test.tsx` add:

```ts
it('renders the logo bare — no white plate element', () => {
  const content = { ...baseContent, identity: { ...baseContent.identity, logoUrl: 'https://cdn/logo.png', logoTone: 'dark' as const } };
  const { container } = render(<AboutPage content={content} skin={lightSkin} />);
  expect(container.querySelector('.ms-logo-plate')).toBeNull();
  expect(container.querySelector('[data-ms-logo]')).not.toBeNull();
});

it('gives the sub-header a contrasting surface when the logo matches the skin tone', () => {
  // dark logo on a dark skin → header should take a light surface
  const content = { ...baseContent, identity: { ...baseContent.identity, logoUrl: 'https://cdn/logo.png', logoTone: 'dark' as const } };
  const { container } = render(<AboutPage content={content} skin={darkSkin} />);
  const header = container.querySelector('header')!;
  expect(header.getAttribute('style')).toContain('#F7F5F2');
});
```

(Use the file's existing `baseContent`/skin fixtures; add a `darkSkin` whose `palette.bg` is dark and a `lightSkin` whose `palette.bg` is light if not already present.)

- [ ] **Step 2: Run — verify they fail**

Run: `npx vitest run lib/archetypes/main-street/pages.test.tsx`
Expected: FAIL — plate still present; header has no contrasting bg.

- [ ] **Step 3: Delete the plate CSS**

In `lib/archetypes/main-street/chrome.tsx`, remove the `.ms-logo-plate` rule (line 73) and its explanatory comment (lines 70-72). Keep the `[data-ms-logo]` height rules. In the mobile media query (line 75) drop the `.ms-logo-plate` padding clause, keep the logo-height clause.

- [ ] **Step 4: Make WordmarkLink render the bare logo**

Replace `WordmarkLink` (lines 194-207) body so the logo is not wrapped in a plate:

```tsx
export function WordmarkLink({ wordmark, logoUrl, role }: { wordmark: string; logoUrl?: string | undefined; role: TypeRole }) {
  return (
    <Link href="/" data-type="wordmark" style={{ ...typeRoleCss(role), color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={wordmark} data-ms-logo style={{ display: 'block' }} />
      ) : (
        wordmark
      )}
    </Link>
  );
}
```

- [ ] **Step 5: Contrast the sub-page header**

In `lib/archetypes/main-street/pages.tsx`, update `SubHeader` (lines 16-45) to compute the contrast surface from the logo tone and the skin's background tone:

```tsx
import { navContrast } from './logo-contrast';
import { relativeLuminance } from './logo-contrast';
// …
function SubHeader({ content, skin }: { content: MainStreetContent; skin: ArchetypeTheme }) {
  const r = roles(skin);
  const backdrop = relativeLuminance(skin.palette.bg) > 0.5 ? 'light' : 'dark';
  const surface = navContrast(content.identity.logoTone ?? 'unknown', backdrop);
  return (
    <header
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24,
        padding: '22px 40px', borderBottom: '1px solid var(--ms-rule)',
        background: surface ? surface.bg : 'var(--ms-bg)',
        color: surface ? surface.fg : 'var(--ms-fg)',
        flexWrap: 'wrap',
      }}
    >
      <WordmarkLink wordmark={content.identity.wordmark} logoUrl={content.identity.logoUrl} role={r.wordmark} />
      <nav style={{ display: 'flex', gap: 26, alignItems: 'center', flexWrap: 'wrap' }}>
        {MAIN_STREET_NAV.map((item) => (
          <a key={item.href} href={item.href} data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), color: 'inherit', opacity: 0.85 }}>{item.label}</a>
        ))}
        <a href="/cart" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), color: 'inherit', opacity: 0.85 }}>Cart</a>
      </nav>
    </header>
  );
}
```

(Nav links use `color: inherit`, so they follow the header `color` automatically — they read on the contrast surface for free.)

- [ ] **Step 6: Run — verify they pass**

Run: `npx vitest run lib/archetypes/main-street/pages.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/archetypes/main-street/chrome.tsx lib/archetypes/main-street/pages.tsx lib/archetypes/main-street/pages.test.tsx
git commit -m "feat(render): delete logo plate; contrast the sub-page header from logo tone"
```

### 4c — Contrast the home nav in both scroll states

- [ ] **Step 1: Write the failing test**

In `lib/archetypes/main-street/MomentHero.test.tsx` add:

```ts
it('gives the over-media nav a light surface for a dark logo (instead of staying transparent)', () => {
  const darkLogoIdentity = { ...identity, logoUrl: 'https://cdn/logo.png', logoTone: 'dark' as const };
  const { container } = render(<MomentHero identity={darkLogoIdentity} moment={moment} skin={skin} />);
  const nav = container.querySelector('[data-ms-nav]')!;
  expect(nav.getAttribute('style')).toContain('#F7F5F2');
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npx vitest run lib/archetypes/main-street/MomentHero.test.tsx`
Expected: FAIL — nav is transparent over media regardless of logo.

- [ ] **Step 3: Apply nav-contrast in both states**

In `lib/archetypes/main-street/MomentHero.tsx`, import the helper and compute per-state surfaces, then fold them into the nav `style` (lines 289-308):

```tsx
import { navContrast, relativeLuminance } from './logo-contrast';
// inside MomentHero, before the return:
const tone = identity.logoTone ?? 'unknown';
const overMedia = navContrast(tone, 'dark'); // transparent state sits on the dark scrim
const onSurface = navContrast(tone, relativeLuminance(skin.palette.bg) > 0.5 ? 'light' : 'dark'); // solid state sits on skin bg
const navBg = solid
  ? (onSurface ? onSurface.bg : 'var(--ms-bg)')
  : (overMedia ? overMedia.bg : 'transparent');
const navFg = solid
  ? (onSurface ? onSurface.fg : 'var(--ms-fg)')
  : (overMedia ? overMedia.fg : 'var(--ms-on-media)');
```

Then in the nav `style`, replace the `background`/`color` lines:

```tsx
          background: navBg,
          color: navFg,
          boxShadow: solid && !onSurface ? '0 1px 0 var(--ms-rule)' : 'none',
```

(`Nav` children use `color: inherit`, so the wordmark/links follow `navFg`.)

- [ ] **Step 4: Run — verify it passes**

Run: `npx vitest run lib/archetypes/main-street/MomentHero.test.tsx`
Expected: PASS.

- [ ] **Step 5: Full suite + typecheck**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: green; no type errors. (The plate is gone; confirm no other test asserted `.ms-logo-plate`.)

- [ ] **Step 6: Commit**

```bash
git add lib/archetypes/main-street/MomentHero.tsx lib/archetypes/main-street/MomentHero.test.tsx
git commit -m "feat(render): contrast the home nav logo in both scroll states"
```

---

## Task 5: Build-time strong accent override

**Files:**
- Modify: `lib/onboarding/build-archetype-store.ts` (compute `accentOverride`, forward it)
- Modify: `lib/generation/write-archetype-storefront.ts` (store `accentOverride` in envelope root)
- Modify: `app/storefront/_components/StorefrontPage.tsx` (read `accentOverride` from envelope, thread it)
- Modify: `lib/archetypes/builder.ts` (render contracts: add `accentOverride`)
- Modify: `lib/archetypes/main-street/builder.tsx` (apply override to skin)
- Create: `applyAccentOverride` helper + tests in `logo-contrast.ts` / `logo-contrast.test.ts`

- [ ] **Step 1: Test the accent-override helper**

Add to `lib/archetypes/main-street/logo-contrast.test.ts`:

```ts
import { applyAccentOverride } from './logo-contrast';

describe('applyAccentOverride', () => {
  const skin = { palette: { bg: '#fff', fg: '#111', fgMuted: '#666', accent: '#0a0', rule: '#ddd' } } as never;
  it('swaps the accent and recomputes readable on-accent text', () => {
    const out = applyAccentOverride(skin, '#1d3a2e');
    expect(out.palette.accent).toBe('#1d3a2e');
    expect(out.palette.onAccent).toBe('#ffffff');
  });
  it('returns the skin untouched when there is no override', () => {
    expect(applyAccentOverride(skin, undefined)).toBe(skin);
  });
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npx vitest run lib/archetypes/main-street/logo-contrast.test.ts`
Expected: FAIL — `applyAccentOverride` not exported.

- [ ] **Step 3: Implement the helper**

Append to `lib/archetypes/main-street/logo-contrast.ts`:

```ts
import type { ArchetypeTheme } from '../types';

/**
 * The STRONG brand-tint (build-time): keep the mood's skin but swap its accent to
 * the maker's dominant logo color, recomputing the on-accent text for contrast.
 * Everything else of the skin — bg, fg, type, light — is the mood's, untouched.
 * No override → the skin is returned as-is (Bohdi's free accent stands).
 */
export function applyAccentOverride(skin: ArchetypeTheme, accent: string | undefined): ArchetypeTheme {
  if (accent === undefined || !HEX6.test(accent)) return skin;
  return { ...skin, palette: { ...skin.palette, accent, onAccent: readableOn(accent) } };
}
```

- [ ] **Step 4: Run — verify it passes**

Run: `npx vitest run lib/archetypes/main-street/logo-contrast.test.ts`
Expected: PASS.

- [ ] **Step 5: Bake the override at build**

In `lib/onboarding/build-archetype-store.ts`, import `dominantBrandColor` from `@/lib/archetypes/main-street/logo-contrast`, and before the `writeArchetypeStorefront` call compute:

```ts
  const accentOverride = dominantBrandColor(input.brandColors ?? []);
```

Pass it into the writer call: `accentOverride,` (alongside `brandColors`).

- [ ] **Step 6: Store it in the envelope root**

In `lib/generation/write-archetype-storefront.ts`, add `accentOverride?: string | undefined;` to `ArchetypeWriteInput`, and in the envelope `root` object (after `lookKey: input.lookKey,`):

```ts
      lookKey: input.lookKey,
      accentOverride: input.accentOverride ?? null,
```

- [ ] **Step 7: Read + thread the baked override at render**

In `app/storefront/_components/StorefrontPage.tsx`, where `lookKey` is read from `env` (lines ~81, ~297), also read `const accentOverride = typeof env['accentOverride'] === 'string' ? env['accentOverride'] as string : undefined;` and pass `accentOverride` into each `spec.render*` call alongside `lookKey`/`logoUrl`.

In `lib/archetypes/builder.ts`, add to each render contract:

```ts
    /** Baked brand-accent (build-time) — overrides the skin's accent. Stable across
     *  later logo changes until an explicit re-tint rewrites the envelope. */
    accentOverride?: string | undefined;
```

- [ ] **Step 8: Apply the override to the resolved skin**

In `lib/archetypes/main-street/builder.tsx`, import `applyAccentOverride`, and in every `render*` method change the skin line:

```ts
    const skin = applyAccentOverride(mainStreetArchetype.resolveTheme({ skinKey: lookKey }), accentOverride);
```

destructuring `accentOverride` from the args.

- [ ] **Step 9: Add a render test for the baked accent**

In `lib/archetypes/main-street/builder.test.tsx` add:

```ts
it('paints the baked accentOverride as the store accent', () => {
  const el = MAIN_STREET_SPEC.render({ content: baseEnvelopeContent, lookKey: someLightSkinKey, products: [], page: 'about', accentOverride: '#1d3a2e' });
  const { container } = render(el);
  const style = container.querySelector('.arch-main-street')?.getAttribute('style') ?? container.innerHTML;
  expect(style).toContain('#1d3a2e'); // emitted as --ms-accent
});
```

- [ ] **Step 10: Run the suite + typecheck**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: green; no type errors.

- [ ] **Step 11: Commit**

```bash
git add lib/archetypes/main-street/logo-contrast.ts lib/archetypes/main-street/logo-contrast.test.ts lib/onboarding/build-archetype-store.ts lib/generation/write-archetype-storefront.ts app/storefront/_components/StorefrontPage.tsx lib/archetypes/builder.ts lib/archetypes/main-street/builder.tsx lib/archetypes/main-street/builder.test.tsx
git commit -m "feat(build): bake logo-driven accent override into the store, applied at render"
```

---

## Soft-fallback note (post-live)

The accent override is the STRONG version Alex approved on a try-it basis. If live builds show a skin whose character fights a swapped accent, the fallback to SOFT is small and isolated: stop calling `applyAccentOverride` in `builder.tsx` and instead pass `brandColors` into the Graphic Artist prompt as a skin-selection hint (so the color only appears when a fitting skin already carries it). No data-model change — `brand_colors` and `accentOverride` stay persisted either way.

## Verification (live, after the suite is green)

This is previewable. After the tasks land, do a real onboarding build with a logo and confirm in the browser: (1) no white box around the logo on the home hero or any sub-page; (2) a dark logo stays readable on a dark skin page (header takes a light surface); (3) the store's buttons/links carry the logo's color. Hand Alex the dev URL for the final eyeball.

---

## Self-review

- **Spec coverage:** persist brand colors (Task 1–2 ✓); render-time contrast + delete plate (Task 3–4 ✓); strong accent anchor, baked, stable across late uploads (Task 5 ✓); SVG/empty-colors corner → `logoTone`/`dominantBrandColor` return `unknown`/`undefined`, so `navContrast` returns null (bare) and `applyAccentOverride` no-ops (✓); late-upload contrast works because Task 4 reads live `brand_colors` every render (✓).
- **Type consistency:** `brandColors: string[]` everywhere through the build; `logoTone: 'light'|'dark'|'unknown'` on identity and from `logoTone()`; `accentOverride: string | undefined` from `dominantBrandColor()` baked to envelope and read back as `string | undefined`; helper names — `relativeLuminance`, `dominantBrandColor`, `logoTone`, `readableOn`, `navContrast`, `applyAccentOverride` — used identically in tests and impl.
- **Placeholders:** none — every step has concrete code or an exact command.
- **Open dependency:** the post-build logo-upload UI and the "re-tint to match" action are intentionally out of scope (no editor yet); the data model (persisted `brand_colors`, baked `accentOverride`) is ready for them.
