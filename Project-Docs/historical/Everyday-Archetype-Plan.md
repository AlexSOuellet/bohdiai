# Everyday Archetype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Everyday archetype — the niche-neutral, hero-led "Safe" maker shop — as a self-contained module that ships a curated family of three complete arrangements, three–four themes, a product page, a Bohdi test harness, and render routes, satisfying the archetype contract with one additive extension.

**Architecture:** Mirror the Gallery module (`lib/archetypes/gallery/`) exactly — same file layout, same no-hardcode discipline (renderer owns structure only; every color is the palette or a derivation, every type value is a named role), same shared-chrome factoring, same harness shape. The new capability is a **curated arrangement family**: the home renderer composes reusable region components (Hero, Featured, MakerStory, SecondaryBand, StayInTouch) into three fixed, art-directed page compositions selected by an `arrangement` key — never recombined freely. The contract (`lib/archetypes/types.ts`) gets a small additive extension so an archetype can declare arrangements and the renderer can receive an arrangement key.

**Tech Stack:** TypeScript (strictest), React (server components), Zod, Next.js App Router, `@anthropic-ai/sdk` for the harness, `tsx` for running it. No new dependencies.

**Reference, read before starting:**
- Spec: `project-docs/Everyday-Archetype-Spec.md`
- The whole Gallery module is the template: `lib/archetypes/gallery/{schemas,themes,index}.ts`, `shared.tsx`, `Gallery.tsx`, `GalleryProduct.tsx`
- Shared catalog core: `lib/archetypes/content.ts` (`ProductView` etc.)
- Contract: `lib/archetypes/types.ts`
- Harness template: `scripts/test-gallery-archetype.ts`
- Render route template: `app/archetype-test/gallery/page.tsx`

**A note on TDD scope:** the deterministic pieces — the contract extension, the content schema, theme resolution, the harness validation loop — get real unit tests. The renderers are *visual artifacts*; like the Gallery, they are verified by `npm run typecheck`, the render route returning 200 with expected markers, and an eyes pass (visual companion + Alex review), not by per-pixel unit tests. This matches how the Gallery was actually built and verified. Theme palettes and composition details are iterated with the visual companion and reviewed by Alex (his reserved decision per the spec); starter values are given here so nothing is a placeholder.

---

## File Structure

**Create:**
- `lib/archetypes/everyday/schemas.ts` — niche-neutral content schema (capped) + theme + arrangement pick schemas.
- `lib/archetypes/everyday/themes.ts` — curated themes (color pair + type roles + spacing + atmosphere + motion).
- `lib/archetypes/everyday/shared.tsx` — root wrapper, header, footer, the five region components, helpers.
- `lib/archetypes/everyday/Everyday.tsx` — home renderer: dispatches to the three arrangements.
- `lib/archetypes/everyday/EverydayProduct.tsx` — product page renderer (reads `ProductView`).
- `lib/archetypes/everyday/index.ts` — assembled `everydayArchetype` + re-exports.
- `lib/archetypes/everyday/schemas.test.ts` — schema validation tests.
- `lib/archetypes/everyday/themes.test.ts` — theme integrity tests.
- `lib/archetypes/everyday/index.test.ts` — archetype assembly + resolveTheme + arrangements tests.
- `scripts/test-everyday-archetype.ts` — Bohdi harness (parametrized by niche brief).
- `app/archetype-test/everyday/page.tsx` — home render route.
- `app/archetype-test/everyday/product/page.tsx` — product render route.
- `app/archetype-test/everyday-fixture.june.json` — Bohdi's bakery authoring output.
- `app/archetype-test/everyday-fixture.potter.json` — Bohdi's non-bakery authoring output (niche-neutrality proof).
- `app/archetype-test/everyday-product-fixture.json` — a `ProductView` row for the product route.

**Modify:**
- `lib/archetypes/types.ts` — add `ArchetypeArrangement`, optional `arrangements` + `defaultArrangement` on `Archetype`, optional `arrangement` prop on `render`.

---

## Task 1: Extend the contract for arrangements (additive)

**Files:**
- Modify: `lib/archetypes/types.ts`
- Test: `npm run typecheck` (the Gallery must still compile unchanged)

- [ ] **Step 1: Add the arrangement type and extend the interface**

In `lib/archetypes/types.ts`, after the `ArchetypeMeta` interface, add:

```ts
/** One curated, complete page composition the archetype can wear. */
export interface ArchetypeArrangement {
  key: string;
  label: string;
}
```

Then extend the `Archetype` interface — add these two optional fields (after `themes`) and widen the `render` prop. Keep everything else as-is:

```ts
  /** Curated theme variants. Resolved from the theme pick. */
  themes: Record<string, ArchetypeTheme>;

  /**
   * Optional curated arrangements — complete page compositions the archetype
   * ships. The engine (or the maker, in the editor) picks one; the renderer
   * switches composition on it. Omitted by archetypes with a single layout.
   */
  arrangements?: Record<string, ArchetypeArrangement>;

  /** Default arrangement key when none is supplied. */
  defaultArrangement?: string;

  /** Resolve a theme pick to its concrete ArchetypeTheme. */
  resolveTheme(pick: z.infer<TThemeSchema>): ArchetypeTheme;

  /** Renderer — takes validated content + a resolved theme + optional arrangement. */
  render: ComponentType<{
    content: z.infer<TContentSchema>;
    theme: ArchetypeTheme;
    arrangement?: string;
  }>;
```

- [ ] **Step 2: Verify the Gallery still compiles**

Run: `npm run typecheck`
Expected: PASS. The `arrangement?` prop is optional, so `galleryArchetype.render` (a `({content, theme}) => …` component) remains assignable. If it errors, stop — the extension is not additive and must be reworked.

- [ ] **Step 3: Commit**

```bash
git add lib/archetypes/types.ts
git commit -m "feat(archetypes): extend contract with optional curated arrangements"
```

---

## Task 2: Content schema

The schema is niche-neutral and **capped on every text field** (broadsheet lesson). It covers the six regions plus the moment slot. Optional regions use `.optional()` and drop out when absent.

**Files:**
- Create: `lib/archetypes/everyday/schemas.ts`
- Create: `lib/archetypes/everyday/themes.ts` (stub first — Task 3 fills it; needed for the import)
- Test: `lib/archetypes/everyday/schemas.test.ts`

- [ ] **Step 1: Stub themes.ts so the schema import resolves**

Create `lib/archetypes/everyday/themes.ts` with a temporary minimal export (Task 3 replaces the body):

```ts
import type { ArchetypeTheme } from '../types';
export const EVERYDAY_THEMES: Record<string, ArchetypeTheme> = {};
```

- [ ] **Step 2: Write the failing schema test**

Create `lib/archetypes/everyday/schemas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { EverydayContentSchema } from './schemas';

function validContent() {
  return {
    shopName: "June's Sourdough",
    identity: {
      wordmark: "June's Sourdough",
      tagline: 'Naturally leavened, by hand, in small batches',
      nav: ['Shop', 'About', 'Contact'],
    },
    moment: {
      eyebrow: 'Baked fresh every morning',
      lines: ['It starts the night before', 'Folded by hand, left to rise slow'],
      assetPrompt: 'Slow steam rising off a fresh-cut sourdough loaf on a wood board, warm morning light, locked camera',
      mode: 'still',
    },
    hero: {
      headline: 'Naturally leavened, by hand',
      sub: 'Country, seeded, and a cinnamon-raisin special each week',
      ctaLabel: 'Shop the loaves',
      photo: { prompt: 'A rustic round sourdough loaf, scored and blistered crust', alt: 'A round sourdough loaf' },
    },
    featured: { title: 'This week' },
    maker: {
      label: 'Meet June',
      headline: 'One oven, one pair of hands',
      body: 'I started baking for neighbors and never stopped. Every loaf is mixed, folded, and shaped by hand the night before. I bake what I would want on my own table.',
      photo: { prompt: 'A baker in an apron holding a loaf, warm kitchen', alt: 'June in her kitchen' },
      ctaLabel: 'Read the full story',
    },
    secondary: {
      label: 'Where to find us',
      headline: 'Saturdays at the market',
      body: 'Find this week’s bake at the Hope Street Farmers Market, 9 to 11am.',
    },
    stayInTouch: {
      headline: 'Get next week’s bake list',
      body: 'One email a week, the loaves and the pickup details.',
      ctaLabel: 'Join the list',
    },
    footer: {
      blurb: 'Baked and sold in Providence, Rhode Island',
      columns: [
        { title: 'Shop', items: ['Loaves', 'Pickup', 'Gift cards'] },
        { title: 'Connect', items: ['Instagram', 'Email'] },
      ],
    },
  };
}

describe('EverydayContentSchema', () => {
  it('accepts a complete valid store', () => {
    expect(EverydayContentSchema.safeParse(validContent()).success).toBe(true);
  });

  it('accepts a store with the optional regions omitted', () => {
    const c = validContent();
    delete (c as Record<string, unknown>).moment;
    delete (c as Record<string, unknown>).secondary;
    delete (c as Record<string, unknown>).stayInTouch;
    expect(EverydayContentSchema.safeParse(c).success).toBe(true);
  });

  it('rejects a hero headline that exceeds the cap', () => {
    const c = validContent();
    c.hero.headline = 'x'.repeat(60);
    expect(EverydayContentSchema.safeParse(c).success).toBe(false);
  });

  it('rejects fewer than 2 nav items', () => {
    const c = validContent();
    c.identity.nav = ['Shop'];
    expect(EverydayContentSchema.safeParse(c).success).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run lib/archetypes/everyday/schemas.test.ts`
Expected: FAIL — `EverydayContentSchema` is not exported yet.

- [ ] **Step 4: Write the schema**

Create `lib/archetypes/everyday/schemas.ts`:

```ts
/**
 * Everyday archetype — schemas.
 *
 * The Everyday is the default maker shop: a hero, a featured selection of the
 * maker's goods, the maker's own story, optional supporting bands, and a footer.
 * It ships a curated family of arrangements (see Everyday.tsx); the content here
 * is the same for every arrangement, so a maker can switch format with one click.
 *
 * Niche-neutral by construction — every label and string is a content slot.
 * Every text field is capped (max) as well as floored (min) so Bohdi cannot
 * overflow the geometry the renderer assumes (the broadsheet lesson).
 */
import { z } from 'zod';
import { EVERYDAY_THEMES } from './themes';
import { EVERYDAY_ARRANGEMENTS } from './arrangements-meta';

const PhotoSlot = z.object({
  prompt: z.string().min(8).max(400),
  url: z.string().url().optional(),
  alt: z.string().min(4).max(120),
});

const FooterColumn = z.object({
  title: z.string().min(2).max(24),
  items: z.array(z.string().min(1).max(28)).min(2).max(5),
});

export const EverydayContentSchema = z.object({
  shopName: z.string().min(2).max(40),

  identity: z.object({
    wordmark: z.string().min(2).max(28),
    tagline: z.string().min(8).max(96),
    nav: z.array(z.string().min(2).max(18)).min(2).max(4),
  }),

  /** The meldable intro moment. Optional — drops out if the maker skips it. */
  moment: z
    .object({
      eyebrow: z.string().min(4).max(48),
      lines: z.array(z.string().min(4).max(64)).min(1).max(4),
      assetPrompt: z.string().min(8).max(400),
      mode: z.enum(['still', 'video']),
    })
    .optional(),

  /** The hero — the shop's face. Required. */
  hero: z.object({
    headline: z.string().min(6).max(52),
    sub: z.string().min(8).max(120),
    ctaLabel: z.string().min(3).max(24),
    photo: PhotoSlot,
  }),

  /** Featured selection — just the section heading; the products are catalog
   *  rows passed to the renderer separately (see EverydayProduct / props). */
  featured: z.object({
    title: z.string().min(2).max(36),
  }),

  /** The maker — story and face. Required: the authority beat. */
  maker: z.object({
    label: z.string().min(2).max(24),
    headline: z.string().min(6).max(52),
    body: z.string().min(40).max(480),
    photo: PhotoSlot,
    ctaLabel: z.string().min(3).max(28),
  }),

  /** Optional supporting band — "where to find us", "what's new", etc. */
  secondary: z
    .object({
      label: z.string().min(2).max(24),
      headline: z.string().min(4).max(52),
      body: z.string().min(12).max(280),
    })
    .optional(),

  /** Optional email-capture beat. */
  stayInTouch: z
    .object({
      headline: z.string().min(4).max(52),
      body: z.string().min(8).max(160),
      ctaLabel: z.string().min(3).max(24),
    })
    .optional(),

  footer: z.object({
    blurb: z.string().min(8).max(90),
    columns: z.array(FooterColumn).length(2),
  }),
});

export type EverydayContent = z.infer<typeof EverydayContentSchema>;

export const EverydayThemeSchema = z.object({
  themeKey: z.enum(Object.keys(EVERYDAY_THEMES) as [string, ...string[]]),
});
export type EverydayThemePick = z.infer<typeof EverydayThemeSchema>;

export const EverydayArrangementSchema = z.object({
  arrangement: z.enum(Object.keys(EVERYDAY_ARRANGEMENTS) as [string, ...string[]]),
});
export type EverydayArrangementPick = z.infer<typeof EverydayArrangementSchema>;
```

> Note: this imports `./arrangements-meta` and `./themes`. Create `arrangements-meta.ts` now (it is tiny and shared by schema + index, avoiding a circular import through Everyday.tsx):

Create `lib/archetypes/everyday/arrangements-meta.ts`:

```ts
import type { ArchetypeArrangement } from '../types';

/** The curated arrangement family. Each is a complete page composition built
 *  in Everyday.tsx. Adding one means designing another complete page, never
 *  recombining pieces. */
export const EVERYDAY_ARRANGEMENTS: Record<string, ArchetypeArrangement> = {
  classic: { key: 'classic', label: 'Classic' },
  'goods-first': { key: 'goods-first', label: 'Goods first' },
  'story-led': { key: 'story-led', label: 'Story led' },
};

export const EVERYDAY_DEFAULT_ARRANGEMENT = 'classic';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run lib/archetypes/everyday/schemas.test.ts`
Expected: PASS (4 tests). The `EVERYDAY_THEMES` stub is `{}` for now, so `EverydayThemeSchema`'s enum is empty — that is fine; the schema test doesn't exercise it. (Task 3 fills the themes.)

- [ ] **Step 6: Commit**

```bash
git add lib/archetypes/everyday/schemas.ts lib/archetypes/everyday/schemas.test.ts lib/archetypes/everyday/arrangements-meta.ts lib/archetypes/everyday/themes.ts
git commit -m "feat(everyday): niche-neutral capped content schema + arrangement meta"
```

---

## Task 3: Themes

Four curated themes mapped to the Everyday's natural moods (SIMPLE, COZY, RUSTIC, MODERN). Same structure as `GALLERY_THEMES`. **Starter palettes below are subject to Alex's review** (his reserved decision); they are real values so the module runs and renders, and get refined with the visual companion during the eyes pass.

**Files:**
- Modify: `lib/archetypes/everyday/themes.ts`
- Test: `lib/archetypes/everyday/themes.test.ts`

- [ ] **Step 1: Write the failing theme test**

Create `lib/archetypes/everyday/themes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { EVERYDAY_THEMES } from './themes';

describe('EVERYDAY_THEMES', () => {
  it('ships four themes', () => {
    expect(Object.keys(EVERYDAY_THEMES)).toHaveLength(4);
  });

  it('each theme has a complete color pair and the required type roles', () => {
    const roles = ['wordmark', 'tagline', 'nav', 'label', 'heroHead', 'makerHead', 'title', 'body', 'price', 'caption'];
    for (const [key, theme] of Object.entries(EVERYDAY_THEMES)) {
      expect(theme.key, key).toBe(key);
      for (const c of ['bg', 'fg', 'fgMuted', 'accent', 'rule'] as const) {
        expect(theme.palette[c], `${key}.${c}`).toMatch(/^#/);
      }
      for (const r of roles) {
        expect(theme.type[r], `${key}.type.${r}`).toBeTruthy();
      }
      expect(theme.spacing.section).toBeGreaterThan(0);
      expect(theme.motion.reveal.duration).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/archetypes/everyday/themes.test.ts`
Expected: FAIL — `EVERYDAY_THEMES` is the empty stub.

- [ ] **Step 3: Write the themes**

Replace `lib/archetypes/everyday/themes.ts` with the full module. Structure copied from the Gallery; one shared type pairing + spacing + motion, four palettes. Type roles include `heroHead` (the hero headline) and `title` (section headings) in addition to the Gallery's set.

```ts
/**
 * Everyday archetype — curated themes.
 *
 * Each theme is a complete designed package: a readable color pair, a type
 * system with hierarchy, a spacing scale, a unifying photo grade, and motion.
 * Bohdi picks one by key; he cannot mix across themes. One shared type pairing
 * carries all four today (per-theme pairings can be added later).
 *
 * Palettes map to the Everyday's natural moods. They are starter values pending
 * Alex's design review and the eyes pass.
 */
import type { ArchetypeTheme } from '../types';

const EVERYDAY_MOTION = {
  reveal: { duration: 800, stagger: 110, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
} as const;

const EVERYDAY_SPACING = {
  hairline: 1, tight: 8, base: 16, loose: 32, section: 72, page: 96,
};

// A warm, friendly, familiar pairing: humanist serif display (Fraunces),
// clean humanist sans body (Mulish), mono for prices.
const EVERYDAY_TYPE: Record<string, ArchetypeTheme['type'][string]> = {
  wordmark: { family: "'Fraunces', Georgia, serif", size: 26, sizeMobile: 22, weight: 700, lineHeight: 1.0, letterSpacing: '-0.01em', variationSettings: '"opsz" 72' },
  tagline: { family: "'Mulish', system-ui, sans-serif", size: 14, sizeMobile: 13, weight: 400, lineHeight: 1.4 },
  nav: { family: "'Mulish', system-ui, sans-serif", size: 12, sizeMobile: 12, weight: 600, lineHeight: 1, letterSpacing: '0.12em', uppercase: true },
  label: { family: "'Mulish', system-ui, sans-serif", size: 11, sizeMobile: 11, weight: 700, lineHeight: 1, letterSpacing: '0.18em', uppercase: true },
  heroHead: { family: "'Fraunces', Georgia, serif", size: 56, sizeMobile: 36, weight: 600, lineHeight: 1.05, letterSpacing: '-0.02em', variationSettings: '"opsz" 144' },
  makerHead: { family: "'Fraunces', Georgia, serif", size: 34, sizeMobile: 26, weight: 600, lineHeight: 1.12, letterSpacing: '-0.015em', variationSettings: '"opsz" 96' },
  title: { family: "'Fraunces', Georgia, serif", size: 24, sizeMobile: 20, weight: 600, lineHeight: 1.15, letterSpacing: '-0.01em', variationSettings: '"opsz" 72' },
  body: { family: "'Mulish', system-ui, sans-serif", size: 16, sizeMobile: 15, weight: 400, lineHeight: 1.6 },
  price: { family: "'DM Mono', 'Courier New', monospace", size: 13, sizeMobile: 13, weight: 500, lineHeight: 1, letterSpacing: '0.02em' },
  caption: { family: "'Mulish', system-ui, sans-serif", size: 13, sizeMobile: 13, weight: 400, lineHeight: 1.5 },
};

export const EVERYDAY_THEMES: Record<string, ArchetypeTheme> = {
  'everyday-paper': {
    key: 'everyday-paper', label: 'Paper',
    palette: { bg: '#FBF8F2', fg: '#21201C', fgMuted: '#6A655C', accent: '#B5542F', rule: '#E7E0D4' },
    type: EVERYDAY_TYPE, spacing: EVERYDAY_SPACING,
    atmosphere: { photoFilter: 'saturate(0.94) contrast(1.02) brightness(1.0)' },
    motion: EVERYDAY_MOTION,
  }, // SIMPLE
  'everyday-hearth': {
    key: 'everyday-hearth', label: 'Hearth',
    palette: { bg: '#F3E9DC', fg: '#2C1F17', fgMuted: '#6E5A4B', accent: '#9A5A2C', rule: '#DECbB6'.toUpperCase() },
    type: EVERYDAY_TYPE, spacing: EVERYDAY_SPACING,
    atmosphere: { photoFilter: 'saturate(0.96) contrast(1.03) sepia(0.10) brightness(1.0)' },
    motion: EVERYDAY_MOTION,
  }, // COZY
  'everyday-field': {
    key: 'everyday-field', label: 'Field',
    palette: { bg: '#EEEAE0', fg: '#27261F', fgMuted: '#665F4F', accent: '#5E6B3B', rule: '#D9D3C3' },
    type: EVERYDAY_TYPE, spacing: EVERYDAY_SPACING,
    atmosphere: { photoFilter: 'saturate(0.9) contrast(1.02) sepia(0.08) brightness(1.0)' },
    motion: EVERYDAY_MOTION,
  }, // RUSTIC
  'everyday-press': {
    key: 'everyday-press', label: 'Press',
    palette: { bg: '#F4F4F2', fg: '#161618', fgMuted: '#5C5C60', accent: '#1F4FD6', rule: '#DEDEDC' },
    type: EVERYDAY_TYPE, spacing: EVERYDAY_SPACING,
    atmosphere: { photoFilter: 'saturate(1.0) contrast(1.04) brightness(1.0)' },
    motion: EVERYDAY_MOTION,
  }, // MODERN
};

export type EverydayThemeKey = keyof typeof EVERYDAY_THEMES;
```

> NOTE: fix the `rule` value for `everyday-hearth` to a literal hex `#DECBB6` (the `.toUpperCase()` above is a deliberate flag to ensure the implementer writes a real literal — replace it). All palette values must be plain hex string literals.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/archetypes/everyday/themes.test.ts`
Expected: PASS (2 tests). Also run the schema test again — its theme enum is now non-empty: `npx vitest run lib/archetypes/everyday/schemas.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/everyday/themes.ts lib/archetypes/everyday/themes.test.ts
git commit -m "feat(everyday): four curated themes (Paper/Hearth/Field/Press)"
```

---

## Task 4: Shared chrome + region components

`shared.tsx` holds: `EverydayRoot` (fonts + compiled CSS + staged main), `EverydayHeader` (sticky top bar; home + compact variants), `EverydayFooter` (columns + guaranteed legal row), helpers (`typeRoleCss`, `fontHrefForTheme`, `rootCss`), and the **five region components** the arrangements compose: `HeroRegion`, `FeaturedRegion`, `MakerRegion`, `SecondaryRegion`, `StayInTouchRegion`. Each region takes a `variant` prop so arrangements can request a treatment; the archetype hard-wires which variant each arrangement uses (curated, not Bohdi-mixed).

**Files:**
- Create: `lib/archetypes/everyday/shared.tsx`
- Test: verified via the home render route in Task 9 (visual artifact)

- [ ] **Step 1: Write `typeRoleCss`, `fontHrefForTheme`, `rootCss`**

Copy `typeRoleCss` verbatim from `gallery/shared.tsx`. `fontHrefForTheme` returns the Google Fonts URL for Fraunces + Mulish + DM Mono:

```ts
export function fontHrefForTheme(_theme: ArchetypeTheme): string {
  return 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700&family=Mulish:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap';
}
```

`rootCss(theme)` mirrors the Gallery's: set `.arch-everyday` background/color + `--e-*` CSS vars (bg/fg/fg-muted/accent/rule + spacing), the `::after` wash, the `.archetype-photo` filter, link colors, the `archEverydayReveal` keyframes with staggered `nth-child` delays (generate 10), the reduced-motion exemption, and the per-role mobile `@media (max-width: 768px)` font-size overrides keyed on `[data-type="…"]`. Use the prefix `arch-everyday` / `--e-` / `archEverydayReveal` throughout (do not reuse the Gallery's `arch-gallery`/`--g-` names).

- [ ] **Step 2: Write `EverydayRoot`, `EverydayHeader`, `EverydayFooter`**

Model on the Gallery equivalents. Differences:
- `EverydayRoot`: wrapper class `arch-everyday`, staged `<main className="arch-stage">`, `maxWidth: 1200`. Same fonts + `<style>` injection pattern.
- `EverydayHeader`: a top nav bar (wordmark left, nav + Cart right) with a `home` variant (slightly larger) and a `compact` variant (inner pages). Wordmark uses the `wordmark` role; nav uses `nav`. Colors from the palette pair. (Unlike the Gallery's centered masthead — the Everyday is a conventional shop header.)
- `EverydayFooter`: identical structure and the **platform-guaranteed legal row** (`Home` / `Privacy` / `Terms` + `© shopName`) — copy that block verbatim from `gallery/shared.tsx` so the policy holds.

Define a `EverydayRoles` interface listing the ten roles (wordmark, tagline, nav, label, heroHead, makerHead, title, body, price, caption), as the Gallery does.

- [ ] **Step 3: Write the five region components**

Each is `export function XRegion({ content slice, products?, theme, variant }): JSX`. No hardcoded colors/sizes — palette + roles only. Signatures:

```ts
export function HeroRegion(props: { hero: EverydayContent['hero']; identity: EverydayContent['identity']; theme: ArchetypeTheme; variant: 'bleed' | 'band' | 'closer' }): React.ReactElement;
export function FeaturedRegion(props: { featured: EverydayContent['featured']; products: ProductView[]; theme: ArchetypeTheme; variant: 'grid3' | 'grid2' }): React.ReactElement;
export function MakerRegion(props: { maker: EverydayContent['maker']; theme: ArchetypeTheme; variant: 'dark' | 'editorial' }): React.ReactElement;
export function SecondaryRegion(props: { secondary: NonNullable<EverydayContent['secondary']>; theme: ArchetypeTheme }): React.ReactElement;
export function StayInTouchRegion(props: { stayInTouch: NonNullable<EverydayContent['stayInTouch']>; theme: ArchetypeTheme }): React.ReactElement;
```

Treatments:
- `HeroRegion` `bleed` = off-axis headline beside an image bleeding to the edge; `band` = full-width tinted brand band, centered headline (used mid-page in goods-first); `closer` = quieter, smaller hero used to close a page.
- `FeaturedRegion` reads `ProductView[]`: a responsive grid (`grid3` = 3-up, `grid2` = 2-up larger tiles), each tile = primary media (`media[0]`) via `.archetype-photo` with a placeholder fallback (copy the Gallery's url-or-placeholder pattern), the product `name`, `price` (price role), linking to `/shop/{slug}` (stub route is fine). The section heading uses `content.featured.title` (title role).
- `MakerRegion` `dark` = the palette's own pair inverted (like the Gallery maker band); `editorial` = light, face beside text. Both: label (accent), `makerHead`, body (muted), CTA.
- `SecondaryRegion` = a slim band: label + headline + body, tone a `color-mix` of the palette.
- `StayInTouchRegion` = headline + body + an email input shape + CTA button (button uses `--e-accent` bg with the paired on-accent text — derive via `color-mix` or use bg/fg pair; keep it readable).

Use `data-type="…"` on every text node (so the responsive CSS + reveal apply), exactly as the Gallery does.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/everyday/shared.tsx
git commit -m "feat(everyday): shared chrome + five region components"
```

---

## Task 5: Home renderer with the three arrangements

`Everyday.tsx` dispatches on the `arrangement` key and composes the region components into each curated page. It also needs the catalog rows; the home renderer takes `products: ProductView[]` as an extra prop (the contract's `render` passes `content`/`theme`/`arrangement` — the route supplies products by wrapping; see Task 9). To keep the contract clean, the archetype's `render` is a thin wrapper that pulls products from a module-level context is **not** used — instead the home component accepts products and the route passes them. Define the exported component to accept `{ content, theme, arrangement, products }` and have `index.ts` adapt it to the contract (Task 7).

**Files:**
- Create: `lib/archetypes/everyday/Everyday.tsx`
- Test: render route (Task 9)

- [ ] **Step 1: Write the dispatcher and three arrangements**

```ts
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { EverydayContent } from './schemas';
import { EVERYDAY_DEFAULT_ARRANGEMENT } from './arrangements-meta';
import {
  EverydayRoot, EverydayHeader, EverydayFooter,
  HeroRegion, FeaturedRegion, MakerRegion, SecondaryRegion, StayInTouchRegion,
} from './shared';

export interface EverydayProps {
  content: EverydayContent;
  theme: ArchetypeTheme;
  arrangement?: string;
  products: ProductView[];
}

export function Everyday({ content, theme, arrangement, products }: EverydayProps) {
  const key = arrangement ?? EVERYDAY_DEFAULT_ARRANGEMENT;
  const header = <EverydayHeader identity={content.identity} theme={theme} variant="home" />;
  const footer = <EverydayFooter shopName={content.shopName} footer={content.footer} theme={theme} />;
  const secondary = content.secondary ? <SecondaryRegion secondary={content.secondary} theme={theme} /> : null;
  const stay = content.stayInTouch ? <StayInTouchRegion stayInTouch={content.stayInTouch} theme={theme} /> : null;

  let body: React.ReactNode;
  if (key === 'goods-first') {
    body = (
      <>
        <FeaturedRegion featured={content.featured} products={products} theme={theme} variant="grid3" />
        <HeroRegion hero={content.hero} identity={content.identity} theme={theme} variant="band" />
        <MakerRegion maker={content.maker} theme={theme} variant="editorial" />
        {secondary}{stay}
      </>
    );
  } else if (key === 'story-led') {
    body = (
      <>
        <MakerRegion maker={content.maker} theme={theme} variant="editorial" />
        <FeaturedRegion featured={content.featured} products={products} theme={theme} variant="grid3" />
        <HeroRegion hero={content.hero} identity={content.identity} theme={theme} variant="closer" />
        {secondary}{stay}
      </>
    );
  } else {
    // classic
    body = (
      <>
        <HeroRegion hero={content.hero} identity={content.identity} theme={theme} variant="bleed" />
        <FeaturedRegion featured={content.featured} products={products} theme={theme} variant="grid3" />
        <MakerRegion maker={content.maker} theme={theme} variant="dark" />
        {secondary}{stay}
      </>
    );
  }

  return (
    <EverydayRoot theme={theme}>
      {header}
      {body}
      {footer}
    </EverydayRoot>
  );
}
```

(The moment slot is rendered in front of the hero by the portable moment layer at integration time; it is not part of the home renderer's body for this build — the spec scopes the moment layer to a later session. The `content.moment` slot is authored and validated now so it's ready.)

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/archetypes/everyday/Everyday.tsx
git commit -m "feat(everyday): home renderer dispatching three curated arrangements"
```

---

## Task 6: Product page renderer

Mirror `GalleryProduct.tsx`: a compact header, a media gallery (images + a video tile), the product name/price, seller variations, add-to-cart, full description, then the shared footer. Reads a `ProductView`.

**Files:**
- Create: `lib/archetypes/everyday/EverydayProduct.tsx`

- [ ] **Step 1: Write the product renderer**

Signature:

```ts
export function EverydayProduct({ content, theme, product }: { content: EverydayContent; theme: ArchetypeTheme; product: ProductView }): React.ReactElement;
```

Use `EverydayRoot`, `EverydayHeader variant="compact"`, `EverydayFooter`. Render `product.media` (image via `.archetype-photo`, video as a `<video>` with `poster`), `product.name` (title/makerHead role), `product.price` (price role), `product.variations` (each a labeled set of option chips), an add-to-cart button (accent bg, paired text), and `product.description` (body). No hardcoded colors/sizes — palette + roles only. Copy the url-or-placeholder media pattern from `GalleryProduct.tsx`.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/archetypes/everyday/EverydayProduct.tsx
git commit -m "feat(everyday): product page renderer (reads ProductView)"
```

---

## Task 7: Assemble the archetype (index.ts)

**Files:**
- Create: `lib/archetypes/everyday/index.ts`
- Test: `lib/archetypes/everyday/index.test.ts`

The contract's `render` is `({content, theme, arrangement}) => JSX`, but `Everyday` also needs `products`. Bridge it: `index.ts` exposes the full archetype for the engine, and the render adapter throws if used without products wired (the route uses the `Everyday` component directly with products — see Task 9). To satisfy the contract type while keeping products explicit, the contract `render` renders the home with an **empty** featured fallback only if no products are provided, but the real routes call `Everyday` directly. Keep `everydayArchetype.render` as a thin component that renders `Everyday` with `products={[]}` (engine wiring that supplies real catalog rows is integration work, next session). Document this clearly.

- [ ] **Step 1: Write the failing assembly test**

Create `lib/archetypes/everyday/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { everydayArchetype } from './index';
import { EVERYDAY_THEMES } from './themes';

describe('everydayArchetype', () => {
  it('has meta, schemas, themes, and arrangements', () => {
    expect(everydayArchetype.meta.key).toBe('everyday');
    expect(Object.keys(everydayArchetype.themes)).toHaveLength(4);
    expect(Object.keys(everydayArchetype.arrangements ?? {})).toEqual(['classic', 'goods-first', 'story-led']);
    expect(everydayArchetype.defaultArrangement).toBe('classic');
  });

  it('resolveTheme returns the matching theme', () => {
    const key = Object.keys(EVERYDAY_THEMES)[0]!;
    expect(everydayArchetype.resolveTheme({ themeKey: key }).key).toBe(key);
  });

  it('resolveTheme throws on an unknown key', () => {
    expect(() => everydayArchetype.resolveTheme({ themeKey: 'nope' })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/archetypes/everyday/index.test.ts`
Expected: FAIL — `./index` has no exports yet.

- [ ] **Step 3: Write index.ts**

```ts
import type { Archetype, ArchetypeMeta } from '../types';
import { Everyday } from './Everyday';
import { EverydayContentSchema, EverydayThemeSchema, type EverydayThemePick } from './schemas';
import { EVERYDAY_THEMES } from './themes';
import { EVERYDAY_ARRANGEMENTS, EVERYDAY_DEFAULT_ARRANGEMENT } from './arrangements-meta';

const META: ArchetypeMeta = {
  key: 'everyday',
  label: 'Everyday',
  description:
    "The default maker shop: a hero, a featured selection of the maker's goods, the maker's own story, optional supporting bands, and a footer. Ships a curated family of complete arrangements the maker can switch between. Familiar by design, composed in ways the template builders never would. Niche-neutral — any maker fills the same slots.",
  suitableFor: {
    nicheKinds: ['bakery', 'candles', 'ceramics', 'soap', 'food', 'apparel', 'general'],
    moods: ['simple', 'cozy', 'rustic', 'modern'],
  },
};

export const everydayArchetype: Archetype<typeof EverydayContentSchema, typeof EverydayThemeSchema> = {
  meta: META,
  contentSchema: EverydayContentSchema,
  themeSchema: EverydayThemeSchema,
  themes: EVERYDAY_THEMES,
  arrangements: EVERYDAY_ARRANGEMENTS,
  defaultArrangement: EVERYDAY_DEFAULT_ARRANGEMENT,
  resolveTheme(pick: EverydayThemePick) {
    const theme = EVERYDAY_THEMES[pick.themeKey];
    if (!theme) {
      throw new Error(
        `Everyday archetype: unknown theme key "${pick.themeKey}". Valid keys: ${Object.keys(EVERYDAY_THEMES).join(', ')}`,
      );
    }
    return theme;
  },
  // Contract render: products are wired by the engine at integration time.
  // Until then this renders the chrome with no catalog rows; the test routes
  // call <Everyday> directly with real ProductView fixtures.
  render: ({ content, theme, arrangement }) => (
    <Everyday content={content} theme={theme} arrangement={arrangement} products={[]} />
  ),
};

export { EVERYDAY_THEMES } from './themes';
export { EVERYDAY_ARRANGEMENTS, EVERYDAY_DEFAULT_ARRANGEMENT } from './arrangements-meta';
export {
  EverydayContentSchema, EverydayThemeSchema, EverydayArrangementSchema,
  type EverydayContent, type EverydayThemePick, type EverydayArrangementPick,
} from './schemas';
export { Everyday } from './Everyday';
export { EverydayProduct } from './EverydayProduct';
export type { ProductView, CatalogMedia, CatalogVariation } from '../content';
```

> If JSX in `index.ts` trips the build, rename to `index.tsx` (the Gallery's is `.ts` because its render is a referenced component, not inline JSX — using a wrapper here needs `.tsx`). Prefer `index.tsx`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/archetypes/everyday/index.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Full suite + typecheck**

Run: `npx vitest run && npm run typecheck`
Expected: PASS, no regressions (Gallery untouched).

- [ ] **Step 6: Commit**

```bash
git add lib/archetypes/everyday/index.tsx lib/archetypes/everyday/index.test.ts
git commit -m "feat(everyday): assemble archetype with arrangements + theme resolution"
```

---

## Task 8: Bohdi test harness

Adapt `scripts/test-everyday-archetype.ts` from `scripts/test-gallery-archetype.ts`. Differences: the Everyday content schema; the system prompt describes the Everyday's regions (hero, featured heading, maker, optional secondary/stayInTouch/moment, footer) with the same "you're bad at counting, stay under the max" guidance; the submit tool also takes an `arrangement` enum; **the brief is parametrized** so the same script runs for June (bakery) and the potter.

**Files:**
- Create: `scripts/test-everyday-archetype.ts`

- [ ] **Step 1: Write the harness**

Copy `test-gallery-archetype.ts` and change:
- Import `EverydayContentSchema`, `EVERYDAY_THEMES`, `EVERYDAY_ARRANGEMENTS` from `../lib/archetypes/everyday`.
- Read the brief from a CLI arg: `const which = process.argv[2] ?? 'june';` and select from a `BRIEFS` map with `june` (bakery / COZY / "June's Sourdough") and `potter` (ceramics / SIMPLE / "Marl & Ash Ceramics"). Each brief carries `shopName`, `niche`, `nicheDescription`, `mood`, `moodDescription`.
- Rewrite `SYSTEM_PROMPT` to describe the Everyday content schema field-by-field with the max-length caps and the counting guidance (same tone as the Gallery prompt). Describe the four themes and the three arrangements (with one-line descriptions) and ask Bohdi to pick a `themeKey` and an `arrangement` that fit the maker.
- The submit tool `submit_everyday` takes `{ content, themeKey, arrangement }`; validate `content` with `EverydayContentSchema.safeParse`, check `themeKey` ∈ keys, check `arrangement` ∈ `Object.keys(EVERYDAY_ARRANGEMENTS)`; on success write `app/archetype-test/everyday-fixture.${which}.json` as `{ content, themeKey, arrangement }`.
- Keep the turn loop, validation-error feedback, and `model: 'claude-sonnet-4-6'` exactly as the Gallery harness.

- [ ] **Step 2: Typecheck the script**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add scripts/test-everyday-archetype.ts
git commit -m "feat(everyday): Bohdi test harness, parametrized by niche brief"
```

---

## Task 9: Render routes + fixtures

So the archetype can be seen before spending money on a Bohdi run, create hand-authored fixtures and the routes. The routes inject preview-only stand-in images (NOT the archetype's job) exactly like the Gallery routes.

**Files:**
- Create: `app/archetype-test/everyday-fixture.june.json` (hand-authored placeholder; the harness overwrites it on a real run)
- Create: `app/archetype-test/everyday-product-fixture.json`
- Create: `app/archetype-test/everyday/page.tsx`
- Create: `app/archetype-test/everyday/product/page.tsx`

- [ ] **Step 1: Hand-author the home fixture**

Create `app/archetype-test/everyday-fixture.june.json` = `{ "content": <the validContent() object from Task 2's test>, "themeKey": "everyday-hearth", "arrangement": "classic" }`. (Reuse the exact object so it is known-valid.)

- [ ] **Step 2: Author the product fixture**

Create `app/archetype-test/everyday-product-fixture.json` — a `ProductView`: a "Country Loaf" with `slug`, `price: "$9"`, `status: "active"`, two `media` images + one `video`, and one variation (`{ name: 'Size', options: ['Boule', 'Batard'] }`). Model the shape on `app/archetype-test/gallery-product-fixture.json`.

- [ ] **Step 3: Write the home route**

`app/archetype-test/everyday/page.tsx`: import the fixture JSON, `everydayArchetype.resolveTheme({ themeKey })`, build a `ProductView[]` for the featured grid (derive 3–6 rows from a small inline array with stand-in Unsplash image URLs — preview-only, in the route), and render `<Everyday content={fixture.content} theme={theme} arrangement={fixture.arrangement} products={previewProducts} />`. Model imports/shape on `app/archetype-test/gallery/page.tsx`.

- [ ] **Step 4: Write the product route**

`app/archetype-test/everyday/product/page.tsx`: import the product fixture + the home fixture (for `content`/theme), inject stand-in media URLs, render `<EverydayProduct content={...} theme={theme} product={...} />`.

- [ ] **Step 5: Verify both routes render**

Start dev (`npm run dev`) and check:
Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/archetype-test/everyday` → `200`
Run: `curl -s http://localhost:3000/archetype-test/everyday | grep -c "arch-everyday"` → ≥ 1
Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/archetype-test/everyday/product` → `200`

- [ ] **Step 6: Eyes pass (visual companion + Alex)**

Open both routes. Switch `arrangement` in the fixture between `classic`, `goods-first`, `story-led` and confirm each is a complete, distinct, readable page. Review the four themes by swapping `themeKey`. **This is where palettes and composition get refined with Alex** (his reserved design review). Fix in the archetype, never in the route.

- [ ] **Step 7: Commit**

```bash
git add app/archetype-test/everyday app/archetype-test/everyday-fixture.june.json app/archetype-test/everyday-product-fixture.json
git commit -m "feat(everyday): render routes + fixtures; arrangements + themes verified by eye"
```

---

## Task 10: Prove niche-neutrality with real Bohdi runs

A cost step (Anthropic API). Run the harness for two niches and confirm the same archetype carries both without niche leaking into the structure — the broadsheet/Gallery discipline.

**Files:**
- Updates: `app/archetype-test/everyday-fixture.june.json`, `app/archetype-test/everyday-fixture.potter.json` (written by the harness)

- [ ] **Step 1: Run Bohdi for the bakery**

Run: `npx tsx scripts/test-everyday-archetype.ts june`
Expected: a valid submission within the turn budget; fixture written. Note turns used and any char-count fights (tune the guidance/caps if needed, like the Gallery's 480 fix).

- [ ] **Step 2: Run Bohdi for the potter**

Run: `npx tsx scripts/test-everyday-archetype.ts potter`
Expected: valid submission; `everyday-fixture.potter.json` written.

- [ ] **Step 3: Point the route at each fixture and eyes-check both**

Temporarily import the potter fixture in the home route (or add a `?fixture=potter` switch). Confirm both render as complete, distinct, niche-appropriate pages with no bakery/pottery vocabulary baked into the structure.

- [ ] **Step 4: Commit the fixtures + a short findings note**

```bash
git add app/archetype-test/everyday-fixture.june.json app/archetype-test/everyday-fixture.potter.json
git commit -m "test(everyday): Bohdi-authored bakery + potter fixtures (niche-neutrality proven)"
```

- [ ] **Step 5: Update the session brief**

Add an Everyday-archetype entry to `project-docs/SESSION-BRIEF.md` summarizing what shipped, findings (char counts, theme/arrangement picks, niche-neutrality result), and the next step (engine integration — now with two archetypes, selection is real).

---

## Self-Review

**Spec coverage:**
- §1 identity / niche-neutral / moment-paired → Tasks 2 (moment slot), 5, 7 (META). ✓
- §2 anti-slop (signature + arrangement family + themes) → Tasks 3, 4, 5. ✓
- §3 six regions + required/optional → Task 2 (schema optionals), Task 4 (region components). ✓
- §4 curated arrangements + editor portability (shared content) → Tasks 1, 5, 7; content is arrangement-independent by construction. ✓
- §5 themes, deterministic mood→theme → Task 3 (themes); deterministic *selection* is integration (out of scope, noted). ✓
- §6 content slots, caps, counting guidance → Tasks 2, 8. ✓
- §7 catalog wiring via ProductView → Tasks 5, 6, 9. ✓
- §8 moment meld → slot authored now (Task 2); meld rendering deferred to the moment-layer session (noted in Task 5). ✓ (consistent with §11 scope)
- §9 contract fit + additive extension → Task 1. ✓
- §10 harness on two niches → Tasks 8, 10. ✓
- §11 scope (what's NOT built) → respected; engine integration, editor switcher UI, companion pages, moment layer all excluded. ✓
- §12 open decisions (name, themes, arrangements, caps) → name used as "everyday" working key (Alex can rename → mechanical find/replace of the key/folder); themes + caps flagged for review in Task 3/9. ✓

**Placeholder scan:** The only deliberate flag is the `everyday-hearth` `rule` `.toUpperCase()` trick in Task 3 Step 3, with an explicit instruction to replace it with the literal `#DECBB6`. No "TBD"/"handle edge cases"/"similar to" placeholders. Theme palettes are real values flagged for review, not placeholders.

**Type consistency:** `EverydayContent`, `EverydayThemePick`, `EverydayArrangementPick`, `ProductView`, `EVERYDAY_THEMES`, `EVERYDAY_ARRANGEMENTS`, `EVERYDAY_DEFAULT_ARRANGEMENT`, region component signatures, and the `EverydayProps` (`{content, theme, arrangement, products}`) are used consistently across Tasks 2–9. Type role set (10 roles incl. `heroHead`) matches between Task 3 (themes), Task 4 (`EverydayRoles`), and the themes test.

**Naming caveat for the implementer:** if Alex renames the archetype from "Everyday," it is a mechanical rename of the folder, the `key`/`label`, the CSS prefixes (`arch-everyday`/`--e-`/`archEverydayReveal`), and the fixture filenames. Do it before Task 10.
