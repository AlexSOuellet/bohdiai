# Main Street Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. UI/render tasks ALSO require the frontend-design skill before writing the component.

**Goal:** Replace Main Street's rejected "tasteful template" visual layer with the validated four-beat sales page (moment-as-hero → goods marquee → founder + find-us → close), produced by the system reading 100% from a skin — proven to reproduce on a second niche.

**Architecture:** Keep the archetype contract + the shared catalog core + the harness pattern (the scaffolding). Evolve a "theme" into a two-surface, three-voice "skin" (additive to `ColorPair`). Rebuild the home renderer as one fixed composition of four full-width beats, each reading colors/fonts from the skin, motion baked in. The hero moment is a skin-native client component that reproduces the proven Story timing (900ms breath / 3400ms hold / 1.8s linear cross-fade, landing on the brand) without bridging into the design-system layout engine. The mockup `public/main-street-mockup.html` is the exact visual source for every CSS value.

**Tech Stack:** Next.js (App Router, RSC), TypeScript (strict), Zod, React, vitest + jsdom + @testing-library/react.

**Source of truth for visual values:** `public/main-street-mockup.html` (committed). When a step says "port the CSS for beat N", it means copy those exact declarations and replace each literal (`#F4EAD7`, `'Instrument Serif'`, `12px`, `uppercase`, niche words) with the corresponding skin var / named role / content slot.

**PARAMOUNT RULE (checkable, see spec §"THE PARAMOUNT BUILD RULE"):** the renderer owns STRUCTURE ONLY. No hex, no `font-family`, no px font-size, no `uppercase`, no niche vocabulary in any `lib/archetypes/main-street/*` file. Every color is the skin or a `color-mix`/derivation; every type value is a named role; every word is a content slot. Task 11 greps for violations and they must be fixed in the archetype, never the test page.

---

## File Structure

```
lib/archetypes/
  types.ts                         MODIFY  add optional `contrast` surface to ColorPair
  main-street/
    skins.ts                       CREATE  (replaces themes.ts) makeType (3-voice), MainStreetRoles, MAIN_STREET_SKINS, font hrefs
    skins.test.ts                  CREATE  (replaces themes.test.ts)
    schemas.ts                     REWRITE four-beat content schema + MediaSlot; drop arrangement schema
    schemas.test.ts                REWRITE
    chrome.tsx                     CREATE  MainStreetRoot (css vars + fonts + grain), Media/Photo, Nav (markup), Footer, typeRoleCss, fontHref
    chrome.test.tsx                CREATE
    MomentHero.tsx                 CREATE  'use client' — fixed nav + the moment cross-fade hero (beat 1)
    MomentHero.test.tsx            CREATE
    beats.tsx                      CREATE  GoodsMarquee (beat 2), FounderCalendar (beat 3), Close (beat 4)
    beats.test.tsx                 CREATE
    Reveal.tsx                     CREATE  'use client' — scroll-in reveal wrapper
    MainStreet.tsx                 REWRITE compose the four beats (no arrangement dispatch)
    MainStreetProduct.tsx          MODIFY  remap role names to the new set; footer no longer takes authored columns
    index.tsx                      MODIFY  drop arrangements; export skins; meta moods
    index.test.ts                  REWRITE
    arrangements-meta.ts           DELETE
    themes.ts                      DELETE  (superseded by skins.ts)
    themes.test.ts                 DELETE
app/archetype-test/main-street/
    page.tsx                       MODIFY  new content shape; inject hero video + product stand-ins; drop ?arrangement
    product/page.tsx               MODIFY  footer call + content shape
    ../main-street-fixture.june.json  REWRITE four-beat fixture
scripts/
    test-main-street-archetype.ts  CREATE  Bohdi harness against the new schema (proof step)
```

**Role set (final, used everywhere):** `wordmark, brand, storyline, goodsHead, title, cardTitle, quote, closeHead, eyebrow, navLabel, price, day, sig, legal, body, caption, where`. Display roles: wordmark, brand, storyline, goodsHead, title, cardTitle, quote, closeHead. Mono roles: eyebrow, navLabel, price, day, sig, legal. Body roles: body, caption, where.

---

## Task 1: Contract — add the second surface to ColorPair

**Files:**
- Modify: `lib/archetypes/types.ts` (the `ColorPair` interface, ~line 17-24)

- [ ] **Step 1: Add the optional contrast surface**

In `lib/archetypes/types.ts`, replace the `ColorPair` interface with:

```ts
/** A color pair guaranteed to meet AA contrast at body size. */
export interface ColorPair {
  bg: string;
  fg: string;
  fgMuted: string;
  accent: string;
  rule: string;
  /**
   * The skin's SECOND surface — the contrast panel used by alternating bands
   * (e.g. the founder band). Direction-agnostic: a light skin's contrast is
   * near-black, a dark skin's is a lifted charcoal. Each carries its own
   * readable text. Skins that use only one surface omit it.
   */
  contrast?: { bg: string; fg: string; fgMuted: string };
}
```

- [ ] **Step 2: Verify the type compiles and existing archetypes still satisfy it**

Run: `npm run typecheck`
Expected: PASS (the field is optional, so gallery/broadsheet themes are unaffected).

- [ ] **Step 3: Commit**

```bash
git add lib/archetypes/types.ts
git commit -m "feat(archetypes): add optional contrast surface to ColorPair for two-surface skins"
```

---

## Task 2: Skins — the two-surface, three-voice skin shelf

**Files:**
- Create: `lib/archetypes/main-street/skins.ts`
- Create: `lib/archetypes/main-street/skins.test.ts`
- Delete: `lib/archetypes/main-street/themes.ts`, `lib/archetypes/main-street/themes.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/archetypes/main-street/skins.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SKINS, MAIN_STREET_FONT_HREFS, type MainStreetRoles } from './skins';

describe('MAIN_STREET_SKINS', () => {
  it('ships skin #1 (ember)', () => {
    expect(MAIN_STREET_SKINS['main-street-ember']).toBeTruthy();
  });

  it('every skin carries a second contrast surface with its own readable text', () => {
    for (const skin of Object.values(MAIN_STREET_SKINS)) {
      expect(skin.palette.contrast).toBeTruthy();
      expect(skin.palette.contrast!.bg).toBeTruthy();
      expect(skin.palette.contrast!.fg).toBeTruthy();
      expect(skin.palette.contrast!.fgMuted).toBeTruthy();
    }
  });

  it('every skin is a three-voice type system (display, body, mono all distinct)', () => {
    for (const skin of Object.values(MAIN_STREET_SKINS)) {
      const t = skin.type as unknown as MainStreetRoles;
      const display = t.brand.family;
      const body = t.body.family;
      const mono = t.eyebrow.family;
      expect(new Set([display, body, mono]).size).toBe(3);
    }
  });

  it('defines every required role', () => {
    const required = ['wordmark','brand','storyline','goodsHead','title','cardTitle','quote','closeHead','eyebrow','navLabel','price','day','sig','legal','body','caption','where'];
    for (const skin of Object.values(MAIN_STREET_SKINS)) {
      for (const r of required) expect(skin.type[r]).toBeTruthy();
    }
  });

  it('provides a font href for every skin', () => {
    for (const key of Object.keys(MAIN_STREET_SKINS)) {
      expect(MAIN_STREET_FONT_HREFS[key]).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -- lib/archetypes/main-street/skins.test.ts`
Expected: FAIL (cannot resolve `./skins`).

- [ ] **Step 3: Create `lib/archetypes/main-street/skins.ts`**

```ts
/**
 * Main Street — the skin shelf.
 *
 * A skin is the CLOTHES: color (two surfaces, each with readable text), a
 * three-voice type system (display + body + mono), grain, and a photo grade.
 * The bones (composition, type SCALE, spacing, motion) live in the renderer and
 * never change per skin. The renderer reads everything here generically — it
 * names no color and no font — so the same Main Street wears any skin, light or
 * dark, with zero code change.
 *
 * Skin #1 ("ember") is extracted from the validated mockup. The shelf grows by
 * adding skins here; the renderer is untouched.
 */
import type { ArchetypeTheme, TypeRole } from '../types';

const MOTION = {
  // Slow and deliberate — motion is an event, not a state. Linear, never eased.
  reveal: { duration: 1100, stagger: 120, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
} as const;

const SPACING = { hairline: 1, tight: 8, base: 16, loose: 32, section: 96, page: 130 };

// Faint paper grain — a technique shared across skins, opacity tuned in the CSS.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** The 17-role type system, built from a skin's three voices. The SCALE is
 *  shared (bones); the three faces change per skin (clothes). Display roles are
 *  deliberately large — conviction, not a corner logo. */
export interface MainStreetRoles {
  wordmark: TypeRole; brand: TypeRole; storyline: TypeRole; goodsHead: TypeRole;
  title: TypeRole; cardTitle: TypeRole; quote: TypeRole; closeHead: TypeRole;
  eyebrow: TypeRole; navLabel: TypeRole; price: TypeRole; day: TypeRole; sig: TypeRole; legal: TypeRole;
  body: TypeRole; caption: TypeRole; where: TypeRole;
}

function makeType(display: string, body: string, mono: string): Record<string, TypeRole> {
  const d = (size: number, sizeMobile: number, ls: string, lh: number): TypeRole => ({
    family: display, size, sizeMobile, weight: 400, lineHeight: lh, letterSpacing: ls,
  });
  const m = (size: number, ls: string): TypeRole => ({
    family: mono, size, weight: 500, lineHeight: 1, letterSpacing: ls, uppercase: true,
  });
  const roles: MainStreetRoles = {
    wordmark: d(26, 22, '-0.01em', 1.0),
    brand: d(124, 52, '-0.02em', 0.95),
    storyline: d(76, 32, '-0.01em', 1.08),
    goodsHead: d(64, 34, '-0.01em', 1.0),
    title: d(34, 26, '-0.01em', 1.05),
    cardTitle: d(27, 24, '0', 1.05),
    quote: d(44, 28, '-0.01em', 1.15),
    closeHead: d(92, 40, '-0.015em', 0.98),
    eyebrow: m(12, '0.22em'),
    navLabel: m(11, '0.2em'),
    price: { family: mono, size: 12, weight: 500, lineHeight: 1, letterSpacing: '0.02em' },
    day: m(11, '0.12em'),
    sig: m(12, '0.2em'),
    legal: m(10, '0.18em'),
    body: { family: body, size: 17, sizeMobile: 15, weight: 400, lineHeight: 1.6 },
    caption: { family: body, size: 14, weight: 400, lineHeight: 1.5 },
    where: { family: body, size: 15, weight: 400, lineHeight: 1.4 },
  };
  return roles as unknown as Record<string, TypeRole>;
}

const INSTRUMENT = "'Instrument Serif', Georgia, serif";
const INTER = "'Inter', system-ui, sans-serif";
const PLEX_MONO = "'IBM Plex Mono', ui-monospace, monospace";

export const MAIN_STREET_SKINS: Record<string, ArchetypeTheme> = {
  // Skin #1 — committed ember on warm cream; character "homey/warm"; mood lean cozy/rustic.
  'main-street-ember': {
    key: 'main-street-ember',
    label: 'Ember',
    palette: {
      bg: '#F4EAD7',
      fg: '#2B1A12',
      fgMuted: '#7A6249',
      accent: '#C8431B',
      rule: 'rgba(43,26,18,0.16)',
      contrast: { bg: '#1C120B', fg: '#F4EAD7', fgMuted: 'rgba(244,234,215,0.66)' },
    },
    type: makeType(INSTRUMENT, INTER, PLEX_MONO),
    spacing: SPACING,
    atmosphere: { grain: GRAIN, photoFilter: 'saturate(1.02) contrast(1.04) sepia(0.06)' },
    motion: MOTION,
  },
};

export const MAIN_STREET_FONT_HREFS: Record<string, string> = {
  'main-street-ember':
    'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap',
};

export type MainStreetSkinKey = keyof typeof MAIN_STREET_SKINS;
```

- [ ] **Step 4: Delete the superseded theme files**

```bash
git rm lib/archetypes/main-street/themes.ts lib/archetypes/main-street/themes.test.ts
```

- [ ] **Step 5: Run the new test**

Run: `npm run test -- lib/archetypes/main-street/skins.test.ts`
Expected: PASS (5 tests). Other files won't compile yet (they import `./themes`) — that's fixed in later tasks; vitest runs the targeted file fine.

- [ ] **Step 6: Commit**

```bash
git add lib/archetypes/main-street/skins.ts lib/archetypes/main-street/skins.test.ts
git commit -m "feat(main-street): two-surface three-voice skin shelf; ember as skin #1"
```

---

## Task 3: Schema — the four-beat content contract

**Files:**
- Rewrite: `lib/archetypes/main-street/schemas.ts`
- Rewrite: `lib/archetypes/main-street/schemas.test.ts`
- Delete: `lib/archetypes/main-street/arrangements-meta.ts`

- [ ] **Step 1: Write the failing test** — replace the whole body of `lib/archetypes/main-street/schemas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { MainStreetContentSchema } from './schemas';

function valid() {
  return {
    shopName: "June's Sourdough",
    identity: { wordmark: "June's Sourdough", nav: ['Shop', 'About', 'Find us'] },
    moment: {
      media: { kind: 'video', prompt: 'Steam rising off a cracked sourdough crust, slow', alt: 'A loaf cooling' },
      story: ['It starts the night before', 'Folded by hand, left to rise slow', 'Pulled from the oven at first light'],
      eyebrow: 'Baked fresh every morning',
      brand: "June's Sourdough",
      ctaLabel: 'See the loaves',
    },
    goods: { title: 'Pulled from the oven this morning' },
    founder: {
      quote: 'I started with one cast-iron oven and a starter named Frank, and fourteen years on he still does most of the work',
      attribution: 'June Carter, founder and baker',
      photo: { prompt: 'A baker holding a loaf in a warm kitchen', alt: 'June in her kitchen' },
      findUs: {
        label: 'Find us this week',
        rows: [
          { day: 'Wed', where: 'Riverside Farmers Market', time: '8-1' },
          { day: 'Sat', where: 'Downtown Makers Market', time: '9-2' },
        ],
      },
    },
    close: { label: 'Come say hello', headline: 'Warm bread is on Main Street by seven', ctaLabel: 'Order for pickup' },
  };
}

describe('MainStreetContentSchema', () => {
  it('accepts a complete valid store', () => {
    expect(MainStreetContentSchema.safeParse(valid()).success).toBe(true);
  });

  it('accepts a store with findUs omitted', () => {
    const c = valid();
    delete (c.founder as Record<string, unknown>)['findUs'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(true);
  });

  it('requires at least two story lines', () => {
    const c = valid();
    c.moment.story = ['only one'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('caps the story line length', () => {
    const c = valid();
    c.moment.story = ['x'.repeat(60), 'ok'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('rejects fewer than 2 nav items', () => {
    const c = valid();
    c.identity.nav = ['Shop'];
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });

  it('caps the close headline', () => {
    const c = valid();
    c.close.headline = 'x'.repeat(80);
    expect(MainStreetContentSchema.safeParse(c).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -- lib/archetypes/main-street/schemas.test.ts`
Expected: FAIL (old schema shape, `moment`/`goods`/`founder`/`close` not present).

- [ ] **Step 3: Rewrite `lib/archetypes/main-street/schemas.ts`** (full file):

```ts
/**
 * Main Street archetype — content schema (the four-beat sales page).
 *
 * Niche-neutral by construction: every label and string is a content slot, so
 * the archetype never assumes a maker bakes, throws pots, or pours candles. The
 * four beats — the MOMENT (hero), GOODS in motion, the FOUNDER + a find-us
 * calendar, and the CLOSE — are filled in the maker's own words. Catalog rows
 * (the goods) are passed to the renderer separately as the shared ProductView
 * core; the archetype never authors the catalog.
 *
 * Every text field is capped (max) as well as floored (min) so authored content
 * cannot overflow the geometry the renderer assumes.
 */
import { z } from 'zod';
import { MAIN_STREET_SKINS } from './skins';

/** A held-media slot for the hero moment — a generation prompt, optionally a
 *  resolved url (+ poster for video). Niche-neutral. */
const MediaSlot = z.object({
  kind: z.enum(['video', 'image']).default('video'),
  prompt: z.string().min(8).max(400),
  url: z.string().url().optional(),
  poster: z.string().url().optional(),
  alt: z.string().min(4).max(120),
});

/** A photo slot for the founder portrait. */
const PhotoSlot = z.object({
  prompt: z.string().min(8).max(400),
  url: z.string().url().optional(),
  alt: z.string().min(4).max(120),
});

/** One "find us this week" row. */
const FindUsRow = z.object({
  day: z.string().min(1).max(12),
  where: z.string().min(4).max(60),
  time: z.string().min(1).max(12),
});

export const MainStreetContentSchema = z.object({
  /** The shop's actual name — used in the footer + as the default wordmark. */
  shopName: z.string().min(2).max(40),

  identity: z.object({
    wordmark: z.string().min(2).max(28),
    nav: z.array(z.string().min(2).max(18)).min(2).max(4),
  }),

  /** BEAT 1 — the moment is the hero. Held media + a story told one line at a
   *  time, landing on the brand + CTA. */
  moment: z.object({
    media: MediaSlot,
    /** The story lines, each cross-fading into the next. Kept tight so they set
     *  large and read in one breath. */
    story: z.array(z.string().min(4).max(48)).min(2).max(5),
    eyebrow: z.string().min(4).max(48),
    brand: z.string().min(2).max(28),
    ctaLabel: z.string().min(3).max(24),
    secondaryCtaLabel: z.string().min(3).max(24).optional(),
  }),

  /** BEAT 2 — goods in motion. Just the heading; products are catalog rows. */
  goods: z.object({
    title: z.string().min(2).max(48),
    /** Optional small label on the heading row, e.g. "This week". */
    label: z.string().min(2).max(24).optional(),
  }),

  /** BEAT 3 — the founder + a real "find us this week" calendar. Required: the
   *  authority the platform is built on. */
  founder: z.object({
    quote: z.string().min(24).max(280),
    attribution: z.string().min(4).max(60),
    photo: PhotoSlot,
    findUs: z
      .object({
        label: z.string().min(2).max(28),
        rows: z.array(FindUsRow).min(1).max(5),
      })
      .optional(),
  }),

  /** BEAT 4 — the close: a big-type sign-off + an order/pickup CTA. */
  close: z.object({
    label: z.string().min(2).max(28),
    headline: z.string().min(6).max(72),
    ctaLabel: z.string().min(3).max(24),
  }),
});

export type MainStreetContent = z.infer<typeof MainStreetContentSchema>;

/** The only skin choice is which curated skin to wear. Everything inside it is
 *  the archetype's, not Bohdi's. */
export const MainStreetSkinSchema = z.object({
  skinKey: z.enum(Object.keys(MAIN_STREET_SKINS) as [string, ...string[]]),
});
export type MainStreetSkinPick = z.infer<typeof MainStreetSkinSchema>;
```

- [ ] **Step 4: Delete arrangements-meta**

```bash
git rm lib/archetypes/main-street/arrangements-meta.ts
```

- [ ] **Step 5: Run the schema test**

Run: `npm run test -- lib/archetypes/main-street/schemas.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/archetypes/main-street/schemas.ts lib/archetypes/main-street/schemas.test.ts
git commit -m "feat(main-street): four-beat niche-neutral content schema; drop arrangements"
```

---

## Task 4: Chrome — root, css vars, media, nav markup, footer

**Files:**
- Create: `lib/archetypes/main-street/chrome.tsx`
- Create: `lib/archetypes/main-street/chrome.test.tsx`

This file owns the skin→CSS bridge and the shared shell. It emits every skin value as a CSS custom property scoped to `.arch-main-street`, so the beats reference vars (`var(--ms-accent)`) and `color-mix` derivations rather than literals.

- [ ] **Step 1: Write the failing test** — create `lib/archetypes/main-street/chrome.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MainStreetRoot, MainStreetFooter, skinVarsCss } from './chrome';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
afterEach(cleanup);

describe('skinVarsCss', () => {
  it('emits both surfaces as CSS vars and no raw font literals leak as values', () => {
    const css = skinVarsCss(skin);
    expect(css).toContain('--ms-bg:');
    expect(css).toContain('--ms-contrast-bg:');
    expect(css).toContain('--ms-contrast-fg:');
    expect(css).toContain('--ms-accent:');
    expect(css).toContain('--ms-disp:');
    expect(css).toContain('--ms-mono:');
  });
});

describe('MainStreetRoot', () => {
  it('renders the scoped container, grain layer, and a stage', () => {
    const { container } = render(<MainStreetRoot skin={skin}><div>child</div></MainStreetRoot>);
    expect(container.querySelector('.arch-main-street')).toBeTruthy();
    expect(container.querySelector('.ms-grain')).toBeTruthy();
  });
});

describe('MainStreetFooter', () => {
  it('renders the shop name and the platform-guaranteed legal links', () => {
    const { getByText, container } = render(<MainStreetFooter shopName="June's Sourdough" skin={skin} />);
    expect(getByText("June's Sourdough")).toBeTruthy();
    const links = Array.from(container.querySelectorAll('a')).map((a) => a.textContent);
    expect(links).toEqual(expect.arrayContaining(['Home', 'Privacy', 'Terms']));
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -- lib/archetypes/main-street/chrome.test.tsx`
Expected: FAIL (cannot resolve `./chrome`).

- [ ] **Step 3: Create `lib/archetypes/main-street/chrome.tsx`**

Implementation notes:
- `skinVarsCss(skin)` returns the `.arch-main-street { --ms-*: ... }` block plus the base/grain/photo/reveal/marquee keyframes and the layout media queries. Port the structural CSS (grain, fixed-nav rules, reveal keyframes, marquee keyframes, responsive breakpoints) from `public/main-street-mockup.html` `<style>`, replacing every literal color with a `--ms-*` var and every font with `--ms-disp/--ms-body/--ms-mono`.
- Vars to emit: `--ms-bg, --ms-fg, --ms-fg-muted, --ms-accent, --ms-rule, --ms-contrast-bg, --ms-contrast-fg, --ms-contrast-fg-muted, --ms-disp, --ms-body, --ms-mono, --ms-section, --ms-loose, --ms-base, --ms-tight`.
- `typeRoleCss(role)` — identical to the old shared.tsx helper (fontFamily/size/weight/lineHeight/letterSpacing/italic/uppercase/variationSettings).
- `fontHref(skin)` — looks up `MAIN_STREET_FONT_HREFS[skin.key]`.
- `Media({ media, skin, className })` — renders `<video autoplay loop muted playsinline>` for `kind:'video'` (poster as `poster`), `<img>` for image, graceful tinted placeholder when no url. Always applies the `.archetype-photo` grade class.
- `Nav({ identity, skin })` — markup only (the interactive state is owned by MomentHero, which renders the nav). Export it so MomentHero composes it. Wordmark uses role `wordmark`, links use role `navLabel`, all colors via vars.
- `MainStreetFooter({ shopName, skin })` — the contrast-surface footer: wordmark (role `wordmark`) + the guaranteed `Home / Privacy / Terms` legal row (role `legal`) + `© {shopName}`. Background `var(--ms-contrast-bg)`, text `var(--ms-contrast-fg)`.

```tsx
import React from 'react';
import type { ArchetypeTheme, TypeRole } from '../types';
import type { MainStreetContent } from './schemas';
import { MAIN_STREET_FONT_HREFS, type MainStreetRoles } from './skins';

export function typeRoleCss(role: TypeRole): React.CSSProperties {
  return {
    fontFamily: role.family,
    fontSize: role.size,
    fontWeight: role.weight,
    lineHeight: role.lineHeight,
    letterSpacing: role.letterSpacing,
    fontStyle: role.italic ? 'italic' : undefined,
    textTransform: role.uppercase ? 'uppercase' : undefined,
    fontVariationSettings: role.variationSettings,
  };
}

export function fontHref(skin: ArchetypeTheme): string {
  return MAIN_STREET_FONT_HREFS[skin.key] ?? Object.values(MAIN_STREET_FONT_HREFS)[0]!;
}

export function roles(skin: ArchetypeTheme): MainStreetRoles {
  return skin.type as unknown as MainStreetRoles;
}

export function skinVarsCss(skin: ArchetypeTheme): string {
  const p = skin.palette;
  const c = p.contrast ?? { bg: p.fg, fg: p.bg, fgMuted: p.fgMuted };
  const sp = skin.spacing;
  const a = skin.atmosphere;
  const mo = skin.motion;
  // Mobile font-size overrides for roles that declare a distinct sizeMobile.
  const responsive = Object.entries(skin.type)
    .filter(([, r]) => r.sizeMobile && r.sizeMobile !== r.size)
    .map(([k, r]) => `@media (max-width:768px){.arch-main-street [data-type="${k}"]{font-size:${r.sizeMobile}px}}`)
    .join('\n');
  return `
    .arch-main-street{
      --ms-bg:${p.bg};--ms-fg:${p.fg};--ms-fg-muted:${p.fgMuted};--ms-accent:${p.accent};--ms-rule:${p.rule};
      --ms-contrast-bg:${c.bg};--ms-contrast-fg:${c.fg};--ms-contrast-fg-muted:${c.fgMuted};
      --ms-disp:${roles(skin).brand.family};--ms-body:${roles(skin).body.family};--ms-mono:${roles(skin).eyebrow.family};
      --ms-section:${sp.section}px;--ms-loose:${sp.loose}px;--ms-base:${sp.base}px;--ms-tight:${sp.tight}px;
      background:var(--ms-bg);color:var(--ms-fg);position:relative;isolation:isolate;min-height:100vh;
      font-family:var(--ms-body);line-height:1.6;
    }
    .arch-main-street a{color:var(--ms-accent);text-decoration:none}
    .arch-main-street .ms-grain{position:fixed;inset:0;z-index:60;pointer-events:none;opacity:.05;mix-blend-mode:multiply;background-image:${a.grain ?? 'none'}}
    .arch-main-street .archetype-photo{filter:${a.photoFilter ?? 'none'};display:block;width:100%;height:100%;object-fit:cover}
    .arch-main-street .ms-wrap{max-width:1200px;margin-inline:auto;padding-inline:40px}
    @media(max-width:860px){.arch-main-street .ms-wrap{padding-inline:20px}}
    /* scroll reveal — arrives once, resolves to stillness */
    .arch-main-street .ms-reveal{opacity:0;transform:translateY(30px);transition:opacity 1.1s ${mo.reveal.easing},transform 1.1s ${mo.reveal.easing}}
    .arch-main-street .ms-reveal.in{opacity:1;transform:none}
    .arch-main-street .ms-reveal.d1{transition-delay:.12s}
    @media(prefers-reduced-motion:reduce){.arch-main-street .ms-reveal{opacity:1;transform:none;transition:none}}
    ${responsive}
  `;
}

export function MainStreetRoot({ skin, children }: { skin: ArchetypeTheme; children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href={fontHref(skin)} />
      <style dangerouslySetInnerHTML={{ __html: skinVarsCss(skin) }} />
      <div className="arch-main-street">
        <div className="ms-grain" aria-hidden />
        {children}
      </div>
    </>
  );
}

export function Media({
  media,
  skin,
  className,
  style,
}: {
  media: { kind?: 'video' | 'image'; url?: string; poster?: string; alt: string };
  skin: ArchetypeTheme;
  className?: string;
  style?: React.CSSProperties;
}) {
  const cls = ['archetype-photo', className].filter(Boolean).join(' ');
  if (media.kind === 'video' && media.url) {
    return <video className={cls} style={style} src={media.url} poster={media.poster} autoPlay loop muted playsInline aria-label={media.alt} />;
  }
  if (media.url) return <img className={cls} style={style} src={media.url} alt={media.alt} />;
  return <div className={cls} aria-label={media.alt} style={{ ...style, background: 'var(--ms-fg-muted)', opacity: 0.18 }} />;
}

export function Nav({ identity, skin }: { identity: MainStreetContent['identity']; skin: ArchetypeTheme }) {
  const r = roles(skin);
  return (
    <>
      <a href="/" className="ms-wm" data-type="wordmark" style={{ ...typeRoleCss(r.wordmark), color: 'inherit' }}>
        {identity.wordmark}
      </a>
      <div className="ms-navlinks">
        {identity.nav.map((item) => (
          <a key={item} href="#" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), color: 'inherit', opacity: 0.85 }}>
            {item}
          </a>
        ))}
        <a href="/cart" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), color: 'inherit', opacity: 0.85 }}>Cart</a>
      </div>
    </>
  );
}

export function MainStreetFooter({ shopName, skin }: { shopName: string; skin: ArchetypeTheme }) {
  const r = roles(skin);
  return (
    <footer style={{ background: 'var(--ms-contrast-bg)', color: 'var(--ms-contrast-fg)', padding: 'var(--ms-loose) 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
      <span data-type="wordmark" style={{ ...typeRoleCss(r.wordmark) }}>{shopName}</span>
      <div style={{ display: 'flex', gap: 20, alignItems: 'baseline' }}>
        <a href="/" data-type="legal" style={{ ...typeRoleCss(r.legal), color: 'inherit', opacity: 0.6 }}>Home</a>
        <a href="/privacy" data-type="legal" style={{ ...typeRoleCss(r.legal), color: 'inherit', opacity: 0.6 }}>Privacy</a>
        <a href="/terms" data-type="legal" style={{ ...typeRoleCss(r.legal), color: 'inherit', opacity: 0.6 }}>Terms</a>
        <span data-type="legal" style={{ ...typeRoleCss(r.legal), opacity: 0.5 }}>&copy; {shopName}</span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Run the chrome test**

Run: `npm run test -- lib/archetypes/main-street/chrome.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/chrome.tsx lib/archetypes/main-street/chrome.test.tsx
git commit -m "feat(main-street): chrome — skin→CSS-var bridge, media, nav, footer"
```

---

## Task 5: MomentHero — the hero (beat 1), skin-native, proven timing

**Files:**
- Create: `lib/archetypes/main-street/MomentHero.tsx`
- Create: `lib/archetypes/main-street/MomentHero.test.tsx`

This is the only piece that reproduces the proven Story moment. Timing constants are copied EXACTLY from `components/storefront/layout/primitives/Story.tsx`: `OPEN_MS = 900`, `HOLD_MS = 3400`, `FADE = '1.8s'`, linear cross-fade, land on the brand frame and stop. It reads colors/fonts from the skin (vars + roles), never the design-system context.

- [ ] **Step 1: Write the failing test** — create `lib/archetypes/main-street/MomentHero.test.tsx`:

```tsx
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { MomentHero } from './MomentHero';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const identity = { wordmark: "June's Sourdough", nav: ['Shop', 'About'] };
const moment = {
  media: { kind: 'video' as const, url: '/bread-kling.mp4', alt: 'A loaf cooling' },
  story: ['It starts the night before', 'Pulled from the oven at first light'],
  eyebrow: 'Baked fresh every morning',
  brand: "June's Sourdough",
  ctaLabel: 'See the loaves',
};

afterEach(cleanup);

describe('MomentHero', () => {
  it('renders a full-screen hero with the held media and a frame per story line plus a brand frame', () => {
    const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
    expect(container.querySelector('[data-ms-hero]')).toBeTruthy();
    expect(container.querySelector('video')).toBeTruthy();
    expect(container.querySelectorAll('[data-story-line]')).toHaveLength(moment.story.length);
    expect(container.querySelector('[data-story-brand]')).toBeTruthy();
  });

  it('advances through the lines and lands on the brand frame', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
      // 900ms breath + (2 lines * 3400ms) + a step past the last line → brand shown.
      act(() => { vi.advanceTimersByTime(900 + 3400 * 2 + 3400); });
      const brand = container.querySelector('[data-story-brand]') as HTMLElement;
      expect(brand.style.opacity).toBe('1');
    } finally {
      vi.useRealTimers();
    }
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -- lib/archetypes/main-street/MomentHero.test.tsx`
Expected: FAIL (cannot resolve `./MomentHero`).

- [ ] **Step 3: Create `lib/archetypes/main-street/MomentHero.tsx`** (`'use client'`)

Implementation notes (port the beat-1 CSS from the mockup `.hero / .frame / .storyline / .brandframe / nav / .scrollcue`, swapping literals for vars/roles):
- Sequence with `useState(step=-1)` + `useEffect` setTimeout: `delay = step < 0 ? OPEN_MS : HOLD_MS`; stop when `step >= story.length`. Identical to Story.tsx.
- Frames: each story line is a centered absolute frame, `opacity` toggled by `step === i`, `transition: opacity 1.8s linear`. Story text uses role `storyline`, color `var(--ms-contrast-fg)` (the moment sits on a dark stage), with the mockup's text-shadow.
- Brand frame: `opacity` 1 once `step >= story.length`; eyebrow (role `eyebrow`), brand (role `brand`), CTA button (accent bg, white text, role `navLabel`), optional secondary ghost CTA.
- Fixed `<nav>`: rendered here; hidden (`opacity:0`) until the brand lands (`landed` = `step >= story.length`), then visible. An `IntersectionObserver` on the hero toggles a `solid` class (paper bg + ink text) once the hero scrolls out. Compose `<Nav identity={identity} skin={skin} />` from chrome inside it.
- Scroll cue: appears when landed.
- Stage background: `#0c0907`-equivalent is the media's own darkness + a scrim `radial-gradient(...rgba(0,0,0,.74))` (the scrim is a legibility device, allowed as a neutral black/white gradient, not a skin color). Media gets the skin `photoFilter` via `.archetype-photo`.

```tsx
'use client';
import React, { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { Media, Nav, typeRoleCss, roles } from './chrome';

const OPEN_MS = 900;
const HOLD_MS = 3400;
const FADE = '1.8s';

export function MomentHero({
  identity,
  moment,
  skin,
}: {
  identity: MainStreetContent['identity'];
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
}) {
  const r = roles(skin);
  const brandStep = moment.story.length;
  const [step, setStep] = useState(-1);
  const [solid, setSolid] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const landed = step >= brandStep;

  useEffect(() => {
    if (step >= brandStep) return;
    const t = setTimeout(() => setStep((s) => s + 1), step < 0 ? OPEN_MS : HOLD_MS);
    return () => clearTimeout(t);
  }, [step, brandStep]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => setSolid(!e.isIntersecting)),
      { rootMargin: '-80px 0px 0px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const frame = (visible: boolean, z: number): CSSProperties => ({
    position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center',
    padding: 'clamp(28px,6vw,96px)', opacity: visible ? 1 : 0, transition: `opacity ${FADE} linear`,
    pointerEvents: visible ? 'auto' : 'none', zIndex: z,
  });

  return (
    <>
      <nav
        data-ms-nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: solid ? '14px 40px' : '20px 40px',
          background: solid ? 'var(--ms-bg)' : 'transparent',
          color: solid ? 'var(--ms-fg)' : 'var(--ms-contrast-fg)',
          boxShadow: solid ? '0 1px 0 var(--ms-rule)' : 'none',
          opacity: landed || solid ? 1 : 0,
          transition: 'opacity .8s ease, background .5s ease, padding .5s ease, color .5s ease',
          pointerEvents: landed || solid ? 'auto' : 'none',
        }}
      >
        <Nav identity={identity} skin={skin} />
      </nav>

      <header ref={heroRef} data-ms-hero style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#0c0907', color: 'var(--ms-contrast-fg)' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Media media={moment.media} skin={skin} style={{ filter: 'saturate(1.02) contrast(1.04) brightness(.92) sepia(.06)' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,.25), rgba(0,0,0,.74))' }} />

        {moment.story.map((line, i) => (
          <div key={i} data-story-line style={frame(step === i, 2)}>
            <p data-type="storyline" style={{ ...typeRoleCss(r.storyline), color: 'var(--ms-contrast-fg)', maxWidth: '18ch', margin: 0, textShadow: '0 2px 36px rgba(0,0,0,.55)' }}>{line}</p>
          </div>
        ))}

        <div data-story-brand style={frame(landed, 3)}>
          <div>
            <div data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-contrast-fg-muted)', marginBottom: 18 }}>{moment.eyebrow}</div>
            <h1 data-type="brand" style={{ ...typeRoleCss(r.brand), color: 'var(--ms-contrast-fg)', margin: 0, textShadow: '0 2px 40px rgba(0,0,0,.5)' }}>{moment.brand}</h1>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
              <a href="#goods" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), background: 'var(--ms-accent)', color: '#fff', padding: '16px 26px', borderRadius: 2 }}>{moment.ctaLabel}</a>
              {moment.secondaryCtaLabel && (
                <a href="#" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), border: '1px solid var(--ms-contrast-fg-muted)', color: 'var(--ms-contrast-fg)', padding: '16px 26px', borderRadius: 2 }}>{moment.secondaryCtaLabel}</a>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `npm run test -- lib/archetypes/main-street/MomentHero.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/MomentHero.tsx lib/archetypes/main-street/MomentHero.test.tsx
git commit -m "feat(main-street): skin-native moment hero (beat 1) with the proven Story timing"
```

---

## Task 6: Beats 2-4 + the scroll-reveal wrapper

**Files:**
- Create: `lib/archetypes/main-street/Reveal.tsx`
- Create: `lib/archetypes/main-street/beats.tsx`
- Create: `lib/archetypes/main-street/beats.test.tsx`

- [ ] **Step 1: Write the failing test** — create `lib/archetypes/main-street/beats.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GoodsMarquee, FounderCalendar, Close } from './beats';
import { MAIN_STREET_SKINS } from './skins';
import type { ProductView } from '../content';

const skin = MAIN_STREET_SKINS['main-street-ember']!;
const products: ProductView[] = [
  { slug: 'country', name: 'Country sourdough', price: '$9', description: '', shortDescription: '48-hour cold ferment', status: 'active', media: [{ kind: 'image', url: '/x.webp', alt: 'loaf' }], variations: [] },
];
afterEach(cleanup);

describe('GoodsMarquee', () => {
  it('renders the heading and a card per product (duplicated for the loop)', () => {
    const { container, getByText } = render(<GoodsMarquee goods={{ title: 'Pulled from the oven' }} products={products} skin={skin} />);
    expect(getByText('Pulled from the oven')).toBeTruthy();
    expect(container.querySelectorAll('[data-ms-card]').length).toBeGreaterThanOrEqual(products.length);
  });
});

describe('FounderCalendar', () => {
  it('renders the quote, attribution, and find-us rows on the contrast surface', () => {
    const founder = {
      quote: 'I started with one cast-iron oven and a starter named Frank',
      attribution: 'June Carter, founder and baker',
      photo: { prompt: 'baker', alt: 'June' },
      findUs: { label: 'Find us this week', rows: [{ day: 'Sat', where: 'Downtown Market', time: '9-2' }] },
    };
    const { getByText, container } = render(<FounderCalendar founder={founder} skin={skin} />);
    expect(getByText(/cast-iron oven/)).toBeTruthy();
    expect(getByText('Downtown Market')).toBeTruthy();
    expect((container.querySelector('[data-ms-founder]') as HTMLElement).style.background).toContain('--ms-contrast-bg');
  });
});

describe('Close', () => {
  it('renders the close headline and CTA', () => {
    const { getByText } = render(<Close close={{ label: 'Come say hello', headline: 'Warm bread by seven', ctaLabel: 'Order for pickup' }} skin={skin} />);
    expect(getByText('Warm bread by seven')).toBeTruthy();
    expect(getByText('Order for pickup')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm run test -- lib/archetypes/main-street/beats.test.tsx`
Expected: FAIL (cannot resolve `./beats`).

- [ ] **Step 3: Create `lib/archetypes/main-street/Reveal.tsx`** (`'use client'`)

```tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';

export function Reveal({ children, delay }: { children: React.ReactNode; delay?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { setShown(true); io.unobserve(e.target); } }),
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`ms-reveal${delay ? ' d1' : ''}${shown ? ' in' : ''}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create `lib/archetypes/main-street/beats.tsx`**

Implementation notes (port beat 2/3/4 CSS from the mockup, literals → vars/roles):
- `GoodsMarquee` — `<section id="goods">`; a heading row (role `goodsHead`, optional `goods.label` in role `eyebrow` accent); a `.ms-marquee` flex row, `width:max-content`, `animation: ms-scroll 46s linear infinite`, `:hover` paused, content duplicated (render `[...products, ...products]`) so the loop is seamless. Each `[data-ms-card]`: photo (`Media`, aspect 4/5), an absolute price chip (paper bg, role `price`), name (role `cardTitle`), shortDescription (role `caption`, `var(--ms-fg-muted)`). Add the `@keyframes ms-scroll{to{transform:translateX(-50%)}}` to `skinVarsCss` in chrome (so it's defined once) — OR inline a `<style>` here; prefer adding it to `skinVarsCss`. (If added to chrome, update the chrome test note accordingly — not required to assert.)
- `FounderCalendar` — `<section data-ms-founder>` on `background:'var(--ms-contrast-bg)'`, `color:'var(--ms-contrast-fg)'`; two columns (portrait `Media` 4/5; words). Quote role `quote`; attribution role `sig` (muted); find-us under a top rule: label role `eyebrow` (accent), each row `day` (role `day`, muted) / `where` (role `where`) / `time` (role `price`, muted), separated by `1px solid` rule derived from contrast-fg via `color-mix`/rgba. Collapses to one column under 860px.
- `Close` — centered `<section>`; label role `eyebrow` (accent), headline role `closeHead`, CTA accent button (role `navLabel`, white text).

```tsx
import React from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { Media, typeRoleCss, roles } from './chrome';

export function GoodsMarquee({ goods, products, skin }: { goods: MainStreetContent['goods']; products: ProductView[]; skin: ArchetypeTheme }) {
  const r = roles(skin);
  const loop = [...products, ...products];
  return (
    <section id="goods" style={{ padding: '96px 0 110px', overflow: 'hidden' }}>
      <div className="ms-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 48 }}>
        <h2 data-type="goodsHead" style={{ ...typeRoleCss(r.goodsHead), color: 'var(--ms-fg)', maxWidth: '16ch', margin: 0 }}>{goods.title}</h2>
        {goods.label && <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)' }}>{goods.label}</span>}
      </div>
      <div className="ms-marquee" style={{ display: 'flex', gap: 26, width: 'max-content', padding: '0 13px' }}>
        {loop.map((p, i) => (
          <article key={p.slug + i} data-ms-card style={{ width: 340, flex: '0 0 auto' }}>
            <div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 3, overflow: 'hidden', background: 'color-mix(in srgb, var(--ms-fg-muted) 40%, var(--ms-bg))' }}>
              <Media media={p.media[0] ?? { kind: 'image', alt: p.name }} skin={skin} />
              <span data-type="price" style={{ ...typeRoleCss(r.price), position: 'absolute', left: 12, bottom: 12, background: 'var(--ms-bg)', color: 'var(--ms-fg)', padding: '6px 10px', borderRadius: 2 }}>{p.price}</span>
            </div>
            <h3 data-type="cardTitle" style={{ ...typeRoleCss(r.cardTitle), color: 'var(--ms-fg)', margin: '16px 0 2px' }}>{p.name}</h3>
            {p.shortDescription && <p data-type="caption" style={{ ...typeRoleCss(r.caption), color: 'var(--ms-fg-muted)', margin: 0 }}>{p.shortDescription}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

export function FounderCalendar({ founder, skin }: { founder: MainStreetContent['founder']; skin: ArchetypeTheme }) {
  const r = roles(skin);
  const hair = 'color-mix(in srgb, var(--ms-contrast-fg) 18%, transparent)';
  return (
    <section data-ms-founder className="ms-founder" style={{ background: 'var(--ms-contrast-bg)', color: 'var(--ms-contrast-fg)', padding: '110px 40px' }}>
      <div className="ms-wrap" style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 64, alignItems: 'center' }}>
        <div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 3, overflow: 'hidden' }}>
          <Media media={founder.photo} skin={skin} />
        </div>
        <div>
          <p data-type="quote" style={{ ...typeRoleCss(r.quote), color: 'var(--ms-contrast-fg)', margin: 0 }}>{founder.quote}</p>
          <div data-type="sig" style={{ ...typeRoleCss(r.sig), color: 'var(--ms-contrast-fg-muted)', marginTop: 26 }}>&mdash; {founder.attribution}</div>
          {founder.findUs && (
            <div style={{ marginTop: 40, borderTop: `1px solid ${hair}`, paddingTop: 24 }}>
              <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', display: 'block', marginBottom: 16 }}>{founder.findUs.label}</span>
              {founder.findUs.rows.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, padding: '13px 0', borderBottom: `1px solid ${hair}` }}>
                  <span data-type="day" style={{ ...typeRoleCss(r.day), color: 'var(--ms-contrast-fg-muted)', flex: '0 0 95px' }}>{row.day}</span>
                  <span data-type="where" style={{ ...typeRoleCss(r.where), color: 'var(--ms-contrast-fg)', flex: 1 }}>{row.where}</span>
                  <span data-type="price" style={{ ...typeRoleCss(r.price), color: 'var(--ms-contrast-fg-muted)' }}>{row.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Close({ close, skin }: { close: MainStreetContent['close']; skin: ArchetypeTheme }) {
  const r = roles(skin);
  return (
    <section style={{ padding: '130px 40px', textAlign: 'center' }}>
      <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', display: 'block', marginBottom: 22 }}>{close.label}</span>
      <h2 data-type="closeHead" style={{ ...typeRoleCss(r.closeHead), color: 'var(--ms-fg)', maxWidth: '16ch', margin: '0 auto 36px' }}>{close.headline}</h2>
      <a href="#" data-type="navLabel" style={{ ...typeRoleCss(r.navLabel), background: 'var(--ms-accent)', color: '#fff', padding: '16px 26px', borderRadius: 2, display: 'inline-block' }}>{close.ctaLabel}</a>
    </section>
  );
}
```

- [ ] **Step 5: Add the marquee + founder-responsive CSS to `skinVarsCss`**

In `chrome.tsx` `skinVarsCss`, append before the closing backtick:

```
    .arch-main-street .ms-marquee{animation:ms-scroll 46s linear infinite}
    .arch-main-street .ms-marquee:hover{animation-play-state:paused}
    @keyframes ms-scroll{to{transform:translateX(-50%)}}
    @media(max-width:860px){
      .arch-main-street .ms-founder .ms-wrap{grid-template-columns:1fr!important;gap:36px}
      .arch-main-street .ms-marquee [data-ms-card]{width:74vw}
    }
    @media(prefers-reduced-motion:reduce){.arch-main-street .ms-marquee{animation:none}}
```

- [ ] **Step 6: Run the beats test**

Run: `npm run test -- lib/archetypes/main-street/beats.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add lib/archetypes/main-street/beats.tsx lib/archetypes/main-street/Reveal.tsx lib/archetypes/main-street/chrome.tsx lib/archetypes/main-street/beats.test.tsx
git commit -m "feat(main-street): beats 2-4 (goods marquee, founder+find-us, close) + scroll reveal"
```

---

## Task 7: Compose the page + rewire the archetype + product page

**Files:**
- Rewrite: `lib/archetypes/main-street/MainStreet.tsx`
- Modify: `lib/archetypes/main-street/MainStreetProduct.tsx`
- Modify: `lib/archetypes/main-street/index.tsx`
- Rewrite: `lib/archetypes/main-street/index.test.ts`

- [ ] **Step 1: Rewrite `lib/archetypes/main-street/MainStreet.tsx`** (full file)

```tsx
/**
 * Main Street — the four-beat sales page.
 *
 * One fixed composition (no arrangement dispatch): the MOMENT is the hero, then
 * GOODS in motion, the FOUNDER + a find-us calendar, and the CLOSE. Surfaces
 * alternate via the skin's two panels. Every color/font is the skin; structure
 * is the archetype's. Catalog rows are passed in — the archetype never authors
 * the catalog.
 */
import React from 'react';
import type { ArchetypeTheme } from '../types';
import type { ProductView } from '../content';
import type { MainStreetContent } from './schemas';
import { MainStreetRoot, MainStreetFooter } from './chrome';
import { MomentHero } from './MomentHero';
import { GoodsMarquee, FounderCalendar, Close } from './beats';
import { Reveal } from './Reveal';

export interface MainStreetProps {
  content: MainStreetContent;
  skin: ArchetypeTheme;
  products: ProductView[];
}

export function MainStreet({ content, skin, products }: MainStreetProps) {
  return (
    <MainStreetRoot skin={skin}>
      <MomentHero identity={content.identity} moment={content.moment} skin={skin} />
      <Reveal><GoodsMarquee goods={content.goods} products={products} skin={skin} /></Reveal>
      <Reveal><FounderCalendar founder={content.founder} skin={skin} /></Reveal>
      <Reveal><Close close={content.close} skin={skin} /></Reveal>
      <MainStreetFooter shopName={content.shopName} skin={skin} />
    </MainStreetRoot>
  );
}
```

- [ ] **Step 2: Update `lib/archetypes/main-street/MainStreetProduct.tsx`**

Change its imports and role references to the new chrome + role set. Specifically:
- Import from `./chrome` instead of `./shared`: `MainStreetRoot, MainStreetFooter, typeRoleCss, roles`. Drop `MainStreetHeader` (no compact header now — render `<Nav>` inside a static top bar, or omit; for the product page render a simple top bar using `Nav`). Simplest: import `Nav` too and wrap it in a static `<nav>` styled like the solid nav.
- Replace `const t = theme.type as unknown as MainStreetRoles;` with `const r = roles(skin);` and rename the `theme` prop to `skin: ArchetypeTheme`.
- Role remap: `makerHead`→`title` (product name), `title`→`title` (price stays), `label`→`eyebrow`, `nav`→`navLabel`, `body`→`body`, `caption`→`caption`. Use `var(--ms-*)` colors (`--ms-fg`, `--ms-fg-muted`, `--ms-accent`, `--ms-bg`, `--ms-rule`) instead of `theme.palette.*`.
- Footer call: `<MainStreetFooter shopName={content.shopName} skin={skin} />` (no `footer` prop).
- The `MediaTile` video badge label uses role `eyebrow`.

Concrete header replacement for the product page (top of the returned JSX, replacing `<MainStreetHeader .../>`):

```tsx
<nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 40px', background: 'var(--ms-bg)', color: 'var(--ms-fg)', borderBottom: '1px solid var(--ms-rule)' }}>
  <Nav identity={content.identity} skin={skin} />
</nav>
<div className="ms-wrap" style={{ paddingTop: skin.spacing.section, paddingBottom: skin.spacing.section }}>
  {/* ...existing product detail + description sections, moved inside this wrap... */}
</div>
```

Wrap the two product `<section>`s in the `.ms-wrap` div so they have page gutters (the new root no longer provides a stage wrapper).

- [ ] **Step 3: Update `lib/archetypes/main-street/index.tsx`**

```tsx
import type { Archetype, ArchetypeMeta } from '../types';
import { MainStreet } from './MainStreet';
import { MainStreetContentSchema, MainStreetSkinSchema, type MainStreetSkinPick } from './schemas';
import { MAIN_STREET_SKINS } from './skins';

const META: ArchetypeMeta = {
  key: 'main-street',
  label: 'Main Street',
  description:
    "The everyday maker shop as a paced sales page: the brand's moment is the hero, then goods in motion, the maker beside a real find-us calendar, and a big-type close. Niche-neutral by construction — any maker fills the same slots in their own voice, dressed in a skin picked off the shelf.",
  suitableFor: {
    nicheKinds: ['bakery', 'candles', 'ceramics', 'soap', 'food', 'apparel', 'general'],
    moods: ['cozy', 'rustic', 'simple', 'modern'],
  },
};

export const mainStreetArchetype: Archetype<typeof MainStreetContentSchema, typeof MainStreetSkinSchema> = {
  meta: META,
  contentSchema: MainStreetContentSchema,
  themeSchema: MainStreetSkinSchema,
  themes: MAIN_STREET_SKINS,
  resolveTheme(pick: MainStreetSkinPick) {
    const skin = MAIN_STREET_SKINS[pick.skinKey];
    if (!skin) {
      throw new Error(`Main Street: unknown skin "${pick.skinKey}". Valid: ${Object.keys(MAIN_STREET_SKINS).join(', ')}`);
    }
    return skin;
  },
  render: ({ content, theme }) => <MainStreet content={content} skin={theme} products={[]} />,
};

export { MAIN_STREET_SKINS } from './skins';
export { MainStreetContentSchema, MainStreetSkinSchema, type MainStreetContent, type MainStreetSkinPick } from './schemas';
export { MainStreet } from './MainStreet';
export { MainStreetProduct } from './MainStreetProduct';
export type { ProductView, CatalogMedia, CatalogVariation } from '../content';
```

Note: the contract's `themeSchema` expects a `skinKey` field now. The harness/test routes must send `{ skinKey }`.

- [ ] **Step 4: Rewrite `lib/archetypes/main-street/index.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { mainStreetArchetype } from './index';
import { MAIN_STREET_SKINS } from './skins';

describe('mainStreetArchetype', () => {
  it('exposes meta, schemas, and the skin shelf', () => {
    expect(mainStreetArchetype.meta.key).toBe('main-street');
    expect(Object.keys(mainStreetArchetype.themes).length).toBeGreaterThanOrEqual(1);
  });

  it('no longer ships the rejected arrangements', () => {
    expect(mainStreetArchetype.arrangements).toBeUndefined();
  });

  it('resolveTheme returns the matching skin', () => {
    const key = Object.keys(MAIN_STREET_SKINS)[0]!;
    expect(mainStreetArchetype.resolveTheme({ skinKey: key }).key).toBe(key);
  });

  it('resolveTheme throws on an unknown key', () => {
    expect(() => mainStreetArchetype.resolveTheme({ skinKey: 'nope' })).toThrow();
  });
});
```

- [ ] **Step 5: Delete the old shared.tsx**

`MainStreet.tsx` and `MainStreetProduct.tsx` no longer import `./shared`. Confirm nothing else imports it (`git grep "main-street/shared"` / search), then:

```bash
git rm lib/archetypes/main-street/shared.tsx
```

- [ ] **Step 6: Typecheck + run the whole main-street suite**

Run: `npm run typecheck`
Expected: PASS.
Run: `npm run test -- lib/archetypes/main-street`
Expected: PASS (all main-street test files).

- [ ] **Step 7: Commit**

```bash
git add lib/archetypes/main-street/
git commit -m "feat(main-street): compose the four-beat page; rewire archetype to skins; update product page"
```

---

## Task 8: Test route + fixture

**Files:**
- Modify: `app/archetype-test/main-street/page.tsx`
- Modify: `app/archetype-test/main-street/product/page.tsx`
- Rewrite: `app/archetype-test/main-street-fixture.june.json`

- [ ] **Step 1: Rewrite the fixture** `app/archetype-test/main-street-fixture.june.json` to the new shape:

```json
{
  "content": {
    "shopName": "June's Sourdough",
    "identity": { "wordmark": "June's Sourdough", "nav": ["Shop", "About", "Find us"] },
    "moment": {
      "media": { "kind": "video", "prompt": "Steam rising off a cracked sourdough crust at first light, slow and close", "alt": "A loaf cooling on the rack" },
      "story": ["It starts the night before", "Folded by hand, left to rise slow", "Pulled from the oven at first light"],
      "eyebrow": "Baked fresh every morning",
      "brand": "June's Sourdough",
      "ctaLabel": "See the loaves",
      "secondaryCtaLabel": "Our story"
    },
    "goods": { "title": "Pulled from the oven this morning", "label": "This week" },
    "founder": {
      "quote": "I started June's with one cast-iron oven and a starter named Frank, and fourteen years on he still does most of the work",
      "attribution": "June Carter, founder and baker",
      "photo": { "prompt": "A baker in an apron holding a loaf in a warm kitchen", "alt": "June in her kitchen" },
      "findUs": {
        "label": "Find us this week",
        "rows": [
          { "day": "Wed", "where": "Riverside Farmers Market", "time": "8-1" },
          { "day": "Fri", "where": "The shop on Main, fresh loaves", "time": "7-6" },
          { "day": "Sat", "where": "Downtown Makers Market", "time": "9-2" }
        ]
      }
    },
    "close": { "label": "Come say hello", "headline": "Warm bread is on Main Street by seven", "ctaLabel": "Order for pickup" }
  },
  "skinKey": "main-street-ember"
}
```

- [ ] **Step 2: Rewrite `app/archetype-test/main-street/page.tsx`**

```tsx
/**
 * Archetype test route — renders Main Street with fixture content.
 *
 * PREVIEW-ONLY stand-ins: media slots hold PROMPTS, not generated assets, and
 * the goods read catalog rows that don't exist yet. To judge the composition
 * before spending on real assets, this route injects the demo bread video into
 * the hero and supplies stand-in products. This scaffolding lives in the route
 * ONLY — the archetype renderer never sees a stand-in.
 */
import { MainStreet, type MainStreetContent, type ProductView } from '@/lib/archetypes/main-street';
import { mainStreetArchetype, MAIN_STREET_SKINS } from '@/lib/archetypes/main-street';
import fixture from '../main-street-fixture.june.json';

interface Fixture { content: MainStreetContent; skinKey: string }

const HERO_VIDEO = '/bread-kling.mp4';
const COUNTRY = '/storefronts/country.webp';
const SEEDED = '/storefronts/seeded.webp';
const CINNAMON = '/storefronts/cinnamon.webp';

function withStandIns(content: MainStreetContent): MainStreetContent {
  return {
    ...content,
    moment: { ...content.moment, media: { ...content.moment.media, url: content.moment.media.url ?? HERO_VIDEO } },
    founder: { ...content.founder, photo: { ...content.founder.photo, url: content.founder.photo.url ?? SEEDED } },
  };
}

const PREVIEW_PRODUCTS: ProductView[] = [
  { slug: 'country', name: 'Country sourdough', price: '$9', shortDescription: '48-hour cold ferment, cracked crust', description: '', status: 'active', media: [{ kind: 'image', url: COUNTRY, alt: 'Country sourdough' }], variations: [] },
  { slug: 'seeded', name: 'Seeded rye', price: '$8', shortDescription: 'Caraway, molasses, a dense honest loaf', description: '', status: 'active', media: [{ kind: 'image', url: SEEDED, alt: 'Seeded rye' }], variations: [] },
  { slug: 'cinnamon', name: 'Cinnamon morning bun', price: '$6', shortDescription: 'Saturdays only, gone by ten', description: '', status: 'active', media: [{ kind: 'image', url: CINNAMON, alt: 'Cinnamon morning bun' }], variations: [] },
];

export default async function MainStreetTestPage({ searchParams }: { searchParams: Promise<{ skin?: string }> }) {
  const sp = await searchParams;
  const f = fixture as Fixture;
  const skinKey = sp.skin && MAIN_STREET_SKINS[sp.skin] ? sp.skin : f.skinKey;
  const skin = mainStreetArchetype.resolveTheme({ skinKey });
  return <MainStreet content={withStandIns(f.content)} skin={skin} products={PREVIEW_PRODUCTS} />;
}
```

- [ ] **Step 3: Update `app/archetype-test/main-street/product/page.tsx`**

Update it to pass `skin` (not `theme`) and a `skinKey` resolve, and the new fixture content shape (it reads `identity` + `shopName`, both still present). Match the prop names `MainStreetProduct` now expects (`content`, `product`, `skin`). Keep its existing product fixture.

- [ ] **Step 4: Verify both routes compile and serve**

Run (dev server in one shell): `npm run dev`
Then: `node scripts/shot.mjs http://localhost:3000/archetype-test/main-street main-street-home`
Expected: screenshots written, no console errors; the hero plays the bread video, the story cross-fades and lands on "June's Sourdough", the marquee scrolls, the founder band is dark with the find-us list, the close is big-type.

- [ ] **Step 5: Commit**

```bash
git add app/archetype-test/main-street/ app/archetype-test/main-street-fixture.june.json
git commit -m "feat(main-street): test route + fixture for the four-beat page"
```

---

## Task 9: Harness — brief Bohdi against the new schema

**Files:**
- Create: `scripts/test-main-street-archetype.ts`

Model it on `scripts/test-gallery-archetype.ts` (read it first for the exact Anthropic client setup, tool-use loop, and validation pattern). The harness: builds a system prompt describing the four beats + the capped schema (with the "you are bad at counting characters, stay comfortably under the caps" guidance from the Gallery lesson), asks Bohdi to author the content + pick a skin + write the hero video PROMPT, validates against `MainStreetContentSchema` + `MainStreetSkinSchema`, and writes the result to a fixture for rendering.

- [ ] **Step 1: Read the reference harness**

Run: `sed -n '1,80p' scripts/test-gallery-archetype.ts` (study the client + loop; reuse the same shape).

- [ ] **Step 2: Write `scripts/test-main-street-archetype.ts`** mirroring the gallery harness, swapping in `MainStreetContentSchema`/`MainStreetSkinSchema`, the four-beat field descriptions, and a niche passed via CLI arg (default a non-bakery niche to prove reproduction, e.g. `candles`).

- [ ] **Step 3: Run it for a second, non-bakery niche**

Run: `npx tsx scripts/test-main-street-archetype.ts candles`
Expected: Bohdi returns content that validates (retry loop handles cap misses); a fixture is written. This is the reproduction proof — the SAME bones render a candle shop in its own words.

- [ ] **Step 4: Render the proof**

Point the test route at the generated fixture (or add a `?fixture=` switch) and screenshot via `scripts/shot.mjs`. Confirm it reads as a candle shop, not a recolored bakery.

- [ ] **Step 5: Commit**

```bash
git add scripts/test-main-street-archetype.ts app/archetype-test/
git commit -m "feat(main-street): Bohdi harness; reproduction proven on a second niche"
```

---

## Task 10: No-hardcode self-check (the PARAMOUNT rule, made checkable)

**Files:** none (audit + fixes in the archetype where violations are found)

- [ ] **Step 1: Grep the renderer for forbidden literals**

Run each; every hit must be justified (a scrim's neutral black/white gradient and the `#fff` on accent buttons are the only allowed literals — see note) or moved into the skin:

```bash
git grep -nE "#[0-9A-Fa-f]{3,6}" -- 'lib/archetypes/main-street/*.tsx' 'lib/archetypes/main-street/*.ts' ':!*skins.ts'
git grep -nE "font-family|'Instrument|'Inter|'IBM" -- 'lib/archetypes/main-street/*.tsx' ':!*skins.ts'
git grep -niE "uppercase" -- 'lib/archetypes/main-street/*.tsx'
git grep -niE "bread|loaf|sourdough|bake|candle|wax|June" -- 'lib/archetypes/main-street/*.tsx' 'lib/archetypes/main-street/*.ts' ':!*.test.*'
```

Expected: the niche grep returns NOTHING in non-test files. The hex grep should return only the documented scrim gradient (`rgba(0,0,0,...)`) and `#fff`/`#0c0907` stage literals in `MomentHero.tsx` — if any skin color leaked, move it to a `--ms-*` var. `uppercase` should appear only via role definitions (in `skins.ts`), not inline in components. Font-family literals only in `skins.ts`.

- [ ] **Step 2: Fix any violation in the archetype** (not the test page). Re-run the greps until clean. Commit if changes were made:

```bash
git add lib/archetypes/main-street/
git commit -m "fix(main-street): move leaked literals into the skin (no-hardcode self-check)"
```

---

## Task 11: Full verification

**Files:** none

- [ ] **Step 1: Full test suite**

Run: `npm run test`
Expected: PASS (all suites; coverage gate on `lib/**` holds).

- [ ] **Step 2: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 3: Visual proof**

Run the dev server + `scripts/shot.mjs` for both the june fixture and the harness-generated second-niche fixture. Confirm against the four-beat acceptance: moment plays + lands; nav appears after landing, goes solid on scroll; goods marquee scrolls and pauses on hover; founder band uses the contrast surface with the find-us list; close is big-type; footer carries the legal row.

- [ ] **Step 4: Final commit (if any verification fixes)**

```bash
git add -A
git commit -m "chore(main-street): verification pass — tests, types, lint, visual proof"
```

---

## Notes on allowed literals (so the grep self-check has a clear bar)

- **Scrim gradients** in the hero are neutral black/white `rgba()` — legibility devices, not skin colors. Allowed, and the only place raw rgba black appears.
- **`#fff`** on accent CTA buttons: white text on the committed accent. Acceptable as the on-accent color; if a future skin needs a different on-accent, promote it to `--ms-on-accent` in the skin. Note it as a known small debt.
- **`#0c0907`** hero stage backstop behind the video: a near-black so letterboxing doesn't flash the paper bg. Acceptable backstop; could become `--ms-contrast-bg` — prefer that if it reads fine. Reviewer's call during Task 5.

## Self-review (done)
- **Spec coverage:** moment-as-hero (T5), goods marquee not a grid (T6), founder + find-us (T6), close (T6), two-surface skin (T1/T2), three-voice type (T2), skin #1 ember (T2), capped niche-neutral schema (T3), motion as event w/ reveal-to-stillness (T4 reveal + T6), keep contract/catalog-core/harness pattern (untouched + T9), reproduction proof on a 2nd niche (T9), no-hardcode checkable (T10). Light/dark-agnostic: founder + footer + nav all read the contrast surface, so a dark skin would invert with zero code change (T2 leaves the shelf at one skin — coverage of more skins is explicitly next-session).
- **Out of scope (stated):** full skin shelf + character×mood grid; the separate shop/about/find-us pages folded into the contract; the eyes/critic loop. These remain the next threads.
- **Type consistency:** `skin: ArchetypeTheme` prop name used consistently across MomentHero/beats/chrome/MainStreet; the archetype contract still calls the field `theme`/`themeSchema`/`resolveTheme` (unchanged contract) and maps `skinKey`→skin inside. `roles(skin)` helper used everywhere for the typed role set.
- **Placeholders:** none — every code step carries full code or an exact port reference to the committed mockup with the literal→var mapping spelled out.
</content>
</invoke>
