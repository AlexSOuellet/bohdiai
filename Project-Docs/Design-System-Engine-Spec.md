# Design System Engine — Build Spec ("Our Own Stitch")

**Date:** 2026-05-31 (Session 16)
**Status:** Committed direction. Ready to build in a new session. This supersedes the per-page renderer patching approach.
**Read with:** `Bohdi-Build-Quality-Design.md` (the why), `Engine-Audit-2026-05-31.md` (the seam bugs), `Page-Architecture-Policy-2026-05-31.md` (per-tenant/editable rules). This doc is the how.

---

## The goal (one line)

Bohdi must at least **appear to be a designer** — produce storefronts at the quality of Claude Design / Google Stitch, unique to each maker, **never templated**, and never shipping amateur tells (unreadable type, broken contrast, monotonic stacks).

"Appear to be a designer" is the bar on purpose: it's not award-tier genius, it's the reliable *absence* of the tells that betray that no designer was involved. Makers can't grade great design, but they instantly feel "a pro made this" vs "a robot/amateur made this."

---

## Why we're here (the road that led to this)

- We spent Session 16 fixing real seam bugs — empty nav (fixed, engine-level, tested) and a script font mangled by forced uppercase (fixed, then the size was still wrong). See the Engine Audit.
- Fixing fonts in the renderer proved a dead end: **you cannot fix font sizing/treatment per rendered page from the renderer** — every blanket rule (uppercase, then a size) is wrong in some other context. Alex's words: "We cannot fix every rendered page if the font is too small or too big."
- A curated **font list is not enough** either — Sacramento is a fine font; it failed because of *how* it was used (tiny, thin, on a busy photo, as an eyebrow). The failure is in usage, not inventory.
- **Templates are never the answer** — they are the exact faceless thing BohdiAI exists to kill. Off the table, permanently.
- Two real tenants from the same run proved the point: **Carol's home page is good** (specific copy — "burns 45 to 55 hours," "three collections: morning, golden hour, after dark"; a real split composition) and **Brian's is generic** (platitude headline "Every room deserves," stock photo, dead space). Same engine, same niche, same prompts. **The engine can produce the good one — it just doesn't do it reliably.** The problem is the floor and consistency, not capability.

## The key realization

Bohdi **is** Claude — the same model class that powers Claude Design. The design judgment isn't missing from the model; our harness removed the conditions under which that model designs well. Claude Design / Stitch succeed because they (1) establish a complete **design system** first and (2) design holistically within it (and can see/iterate). We made Bohdi fill in an abstract layout DSL node-by-node, blind, against a paint-box "style sheet" with no system.

## What Stitch actually does (from a real Stitch DESIGN.md)

Reference artifact Alex provided:
`C:\Users\Bohdi\Downloads\stitch sample\stitch_bohdiai_editorial_landing_page\stitch_bohdiai_editorial_landing_page\editorial_manifest\DESIGN.md`

**Stitch generates the design system first (this file), then composes the page strictly within it.** The file is *output* by the model, not hand-fed. That two-step — establish the system, then compose — is what makes the result look professionally designed, and competence lives in the system, not in any individual page.

A real design system (the DESIGN.md) contains far more than our style sheet:

1. **A full semantic color system with paired foregrounds.** Not "named colors with a nice description" — semantic roles (`surface`, `on-surface`, `primary`, `on-primary`, `*-container` levels, `outline`, etc.). Every background has a defined `on-*` foreground, so **contrast/readability is guaranteed by construction.**
2. **A complete type scale with named roles.** `display-xl`, `headline-lg`, `headline-lg-mobile`, `headline-md`, `body-lg`, `body-md`, `label-caps` — each with exact `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, and **mobile variants baked in**. The smallest size in the system is 14px. **There is no illegible size to pick.** And the label treatment (uppercase + wide tracking) is *bound to a sans* (Hanken Grotesk) — role + font + size + treatment decided together, so a script can never land on a label.
3. **A spacing system.** `unit: 8px`, `gutter`, `margin`, `border-weight`.
4. **Prose design principles** the model reads every generation: brand/voice, layout philosophy (structural asymmetry, 12-col offset grid, "the frame"), elevation (flat, tonal, no blurs), shape language (sharp 0px), responsive behavior per breakpoint.
5. **Component specs:** buttons (primary/secondary with exact colors + hover), inputs, cards, chips, lists, editorial accents.

Our current style sheet (`lib/style-sheet.ts`) is just `palette` (name/hex/character) + `fonts` (name/family/weights/fallback/character) + `textures`. Raw materials, no system. That gap is the entire source of the font/contrast failures.

---

## The commitment — three pieces

**Build BohdiAI's own Stitch: generate the design system first, compose within it, and enforce competence on the system — not the page.**

### 1. The system
Replace the thin style sheet with a real, **generated** design system per tenant — paired semantic colors, a full type scale (roles + exact legible sizes + mobile variants), a spacing system, and component rules. The shape of the DESIGN.md above. Bohdi authors it in the step he already has (`set_style_sheet`), just far richer. It is generated fresh per tenant (that's what keeps every store unique); it is NOT hand-written templates.

### 2. The floor (validator)
A validator runs on the **generated system** before any page is composed. It rejects a system that doesn't clear competence — any type size below a legible minimum, any color without a contrasting paired foreground, broken spacing — and makes Bohdi regenerate it. **This is where "appears designed" is guaranteed, once.** It is the answer to "we can't fix every page": we don't. A page built against a validated system is sound by construction.

### 3. The composition
Bohdi builds pages by **referencing the system's roles** ("this text is a `headline-lg`", "this is a `label-caps`", "this surface is `surface-container`") instead of free-assigning fonts, sizes, and colors to nodes. The renderer reads sizes/weights/colors from the system's scale and tokens instead of its own hardcoded role classes.

---

## What it is NOT / what it builds ON

**Not:**
- Not templates (the thing we exist to kill).
- Not generating raw eval'd frontend code (the security project we deliberately avoided — keep the DSL as the safe medium; it already compiles to React).
- Not patching rendered pages one at a time — we stop that entirely.

**Builds on:**
- The existing two-phase flow: `set_style_sheet` → `set_layout` per page. The architecture is right; step one just needs to produce a real system and everything downstream needs to obey it.
- The nav fix (per-page placement, Session 16) stands.
- The Page-Architecture policy (every page per-tenant; content editable; functional surfaces themed-not-editable) stands.

**Supersedes:**
- The renderer's hardcoded type role classes in `components/storefront/layout/content/Text.tsx`, **including the script-eyebrow font patches made in Session 16** — those get replaced by the system's type scale. Don't preserve them; the scale is the source of truth.

---

## Phase boundary (important)

This commitment is the **design-system foundation** — the competence floor that makes output *appear designed*. It does **not** include the **render → see → revise "eyes" loop** (feeding Bohdi a rendered image of his page so he can judge composition/feeling and revise). That loop is the likely **next phase**, for the open-ended quality a rules system can't guarantee (is it ordinary? does it have feeling?). **Decide the loop with evidence** — after we see how far the validated design system gets us — not blind, not now.

---

## How it maps onto current files (for the build session)

- `lib/style-sheet.ts` — `StyleSheetSchema` becomes the **design system schema**: add `colors` (semantic paired tokens), `typography` (named roles with size/weight/lineHeight/letterSpacing + mobile variants), `spacing`, and optionally component/principle fields. Decide how roles are named and referenced.
- `lib/style-sheet-loader.ts` — `compileStyleSheet` extends to emit the type scale, spacing, and semantic color CSS variables (e.g. `--type-headline-lg-size`, `--color-on-surface`) plus the existing font links.
- `lib/bohdi/layout-tools.ts` — `set_style_sheet` tool description + `handleSetStyleSheet` updated to author the full system; `finalizeLayoutEngine` unchanged in shape.
- `lib/bohdi/system-prompt.ts` — `LAYOUT_ENGINE_PROMPT` teaches the **system-first** approach: generate a complete, coherent design system, then compose pages by referencing its roles.
- **New:** a validator module (e.g. `lib/design-system/validate.ts`) enforcing the floor on the generated system, returning structured issues so Bohdi can regenerate (same pattern as `validatePage`).
- `components/storefront/layout/content/Text.tsx` + `components/storefront/layout/intent.ts` + the renderer — read type/color from the system's scale/tokens instead of hardcoded classes. Text nodes reference a type role by name.
- DB: `style_sheets.sheet` already stores arbitrary JSONB, so the richer system likely needs **no migration** — confirm the schema/validation only.

**Open design decision to settle first (use brainstorming):** how text nodes reference type roles. Options: (a) the generated system defines the type roles and nodes reference them by name (consistent with how `intent.palette` references a named palette entry today); (b) keep the fixed node roles (eyebrow/headline/…) and map them to system roles. (a) is more faithful to Stitch and more flexible; (b) is less disruptive. Decide before building.

---

## Open questions / risks

- **Can Bohdi reliably generate a *good* system?** Stitch proves a model can. The validator backstops the measurable floor; taste beyond the floor is the eyes-loop's job (phase 2).
- **Cost.** A richer system-generation step + a possible regenerate-on-validation-failure loop adds tokens. Build cost was already flagged as too high (~$2.40); weigh deliberately. (The eyes loop, phase 2, adds more.)
- **DSL ceiling.** If a validated system + role-based composition still can't reach the bar because the layout DSL can't express enough, *that's* when we'd revisit the medium (richer DSL vs sandboxed code) — with evidence, not now.
- **Per-tenant system vs mood/niche.** Decide whether the generated system keys off mood, niche, the maker's inputs, or all — and how much variety we want across tenants.
- **Gemini.** If/when we build the eyes loop, a model with strong native vision is a motivated A/B (ties back to the original Claude-vs-Gemini question). Not part of this phase.

---

## Suggested build order (for the new session)

1. Brainstorm + settle the type-role referencing decision (above).
2. Define the new design-system schema (`lib/style-sheet.ts`) — TDD.
3. Build the validator (the floor) — TDD, with the competence checks.
4. Update `compileStyleSheet` to emit the scale/spacing/color tokens — TDD.
5. Update `set_style_sheet` tool + `LAYOUT_ENGINE_PROMPT` so Bohdi generates the full system.
6. Update the renderer (Text + intent + primitives) to consume the system; remove the hardcoded role classes (and the Session-16 font patches).
7. End-to-end: regenerate a candles tenant, validate the system clears the floor, eyeball against the Carol bar.

Tests are part of done. End with `npm run test:coverage` and typecheck.
