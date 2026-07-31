# Make It Yours walk — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is one small commit (Alex: small commits, one at a time).

**Goal:** Restructure the Make It Yours walk into a mandatory full-screen onboarding room that gates the editor, section by section, and add a matching section-by-section content area inside the editor for edits afterward — Words scope plus the standalone find-us dates editor.

**Architecture:** Pure section-resolution logic (`madeYours` / `kept` / `hidden`) and a publish honesty gate drive a full-screen walk route outside `/dashboard`. A reusable `SectionEditor` (extracted from today's `Walkthrough.tsx`) is hosted twice: in the gated walk sequence and in a free-navigation editor content area. The find-us section uses a separate small dates editor. All writes go to the existing draft; Publish promotes it. Governed by the spec `docs/superpowers/specs/2026-07-31-make-it-yours-onboarding-walk-design.md` and decisions D67–D71.

**Tech Stack:** Next.js 16 App Router (RSC + server actions), React client components, Vitest + Testing Library, Zod schemas, the existing draft/preview/HMAC-token plumbing.

**Execution note:** Tasks 1–4 and 12 are pure logic / schema and carry complete test-first code. Tasks 5–11 and 13–15 are components/routes: each names its exact files, the test to write with concrete assertions, and the implementation shape; final JSX is written at execution against the neighbouring component and test patterns already in `app/dashboard/website/_components/` (read the sibling file named in the task before writing). No task is complete without its test green, `tsc`, and lint clean.

---

## File structure

**New:**
- `lib/editor/section-state.ts` — pure read/write of a section's resolution state on the envelope (`madeYours` / `kept` / `hidden`).
- `lib/editor/publish-gate.ts` — pure `publishBlockers(env)`: which on-but-unresolved honesty sections block Publish.
- `app/make-it-yours/layout.tsx` — chrome-less full-screen layout (escapes the dashboard shell).
- `app/make-it-yours/page.tsx` — the walk host (welcome → sections → finish), gated.
- `app/dashboard/website/_components/SectionEditor.tsx` — the reusable per-section text editor (extracted from `Walkthrough.tsx`).
- `app/dashboard/website/_components/FindUsDatesEditor.tsx` — the standalone dates editor.
- `app/dashboard/website/_components/EditorContent.tsx` — the editor's free-navigation content area.

**Modified:**
- `lib/editor/walkthrough.ts` — section classes (must-change / keep-or-change / optional) + resolution rules + `walkComplete`.
- `lib/editor/editable-fields.ts` — (only if a field label/section tweak is needed for find-us; likely untouched).
- `lib/archetypes/main-street/schemas.ts` — additive `FindUsRow` fields (`eventName`, `address`, `link`).
- `app/dashboard/website/actions.ts` — `keepSection`, `toggleSection`, `setFindUsRows`; refactor to use `section-state.ts`; honesty gate in `publishStore`.
- `app/dashboard/website/page.tsx` — gate: redirect to `/make-it-yours` when the walk is incomplete.
- `app/dashboard/website/_components/Editor.tsx` — remove the in-editor walk host + re-entry + `firstRun` auto-open; add the content area beside the look area.
- `app/dashboard/website/_components/Walkthrough.tsx` — becomes the walk *sequence* host using `SectionEditor` + `FindUsDatesEditor`; moves under `/make-it-yours`.
- storefront preview param reader (file confirmed in Task 10) — add `previewSection`.

---

## Task 1: Section resolution state (pure)

**Files:**
- Create: `lib/editor/section-state.ts`
- Test: `lib/editor/section-state.test.ts`

Extracts and generalises the `markSectionMade` helper currently inline in `actions.ts` into a pure, tested module with all three states.

- [ ] **Step 1: Write the failing test** (`lib/editor/section-state.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { markSectionMade, markSectionKept, setSectionHidden, sectionState } from './section-state';

const base = () => ({ root: { content: {} } });

describe('section-state', () => {
  it('marks a section made-yours without touching live fields', () => {
    const next = markSectionMade(base(), 'hero');
    expect(sectionState(next, 'hero')).toBe('made');
  });
  it('marks kept and hidden', () => {
    expect(sectionState(markSectionKept(base(), 'reviews'), 'reviews')).toBe('kept');
    expect(sectionState(setSectionHidden(base(), 'reviews', true), 'reviews')).toBe('hidden');
  });
  it('made-yours wins over kept for the same section', () => {
    let t = markSectionKept(base(), 'hero');
    t = markSectionMade(t, 'hero');
    expect(sectionState(t, 'hero')).toBe('made');
  });
  it('un-hiding returns a section to unresolved', () => {
    let t = setSectionHidden(base(), 'reviews', true);
    t = setSectionHidden(t, 'reviews', false);
    expect(sectionState(t, 'reviews')).toBe('unresolved');
  });
  it('never mutates its input', () => {
    const input = base();
    markSectionMade(input, 'hero');
    expect((input.root.content as Record<string, unknown>).madeYours).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — `npx vitest run lib/editor/section-state.test.ts` → FAIL (module missing).

- [ ] **Step 3: Implement** (`lib/editor/section-state.ts`): three `string[]` lists on `root.content` — `madeYours`, `kept`, `hiddenSections`. Pure functions clone via `structuredClone`, add/remove the section from the relevant list (made-yours removes from kept; un-hide removes from hidden). `sectionState(env, section)` returns `'made' | 'kept' | 'hidden' | 'unresolved'` with precedence made > hidden > kept > unresolved. Export the list-reader used by `walkthrough.ts`.

- [ ] **Step 4: Run tests, verify pass.**

- [ ] **Step 5: Commit** — `feat(editor): pure section-resolution state (made/kept/hidden)`

---

## Task 2: Walk resolution rules + completeness (pure)

**Files:**
- Modify: `lib/editor/walkthrough.ts`
- Test: `lib/editor/walkthrough.test.ts`

Adds each step's **class** and the rule that must-change sections resolve only by `made`, and computes walk completeness.

- [ ] **Step 1: Write failing tests** — extend `walkthrough.test.ts`:

```ts
import { WALKTHROUGH_STEPS, walkComplete, sectionClass } from './walkthrough';
import { markSectionMade, markSectionKept, setSectionHidden } from './section-state';

it('classes: goods and founder are must-change; reviews/collections/marquee/findUs optional', () => {
  expect(sectionClass('goods')).toBe('must-change');
  expect(sectionClass('founder')).toBe('must-change');
  expect(sectionClass('reviews')).toBe('optional');
  expect(sectionClass('hero')).toBe('keep-or-change');
});

it('a must-change section is not resolved by keep or hide', () => {
  let env: Record<string, unknown> = { root: { content: {} } };
  env = markSectionKept(env, 'founder');
  expect(walkComplete(env)).toBe(false);
});

it('walk is complete only when every section is resolved by its allowed states', () => {
  let env: Record<string, unknown> = { root: { content: {} } };
  for (const s of WALKTHROUGH_STEPS) {
    env = s.cls === 'must-change' ? markSectionMade(env, s.section)
        : s.cls === 'optional'   ? setSectionHidden(env, s.section, true)
        :                          markSectionKept(env, s.section);
  }
  expect(walkComplete(env)).toBe(true);
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** — add `SectionClass = 'must-change' | 'keep-or-change' | 'optional'`; put `cls` on each `STEP_META` row (goods, founder → must-change; collections, reviews, marquee, findUs → optional; hero, contact, close → keep-or-change); add a `findUs` step (optional). `sectionClass(section)`. `walkComplete(env)`: every step resolved, where must-change needs `sectionState === 'made'`, optional accepts made/kept/hidden, keep-or-change accepts made/kept. Update `placeholderSections`/`walkthroughProgress` to use `section-state` + the class rules.

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Commit** — `feat(editor): section classes + walk-complete rule`

---

## Task 3: keep / toggle / find-us write actions + refactor

**Files:**
- Modify: `app/dashboard/website/actions.ts`
- Test: covered by Task 1/2 pure modules; add an action-shape smoke test only if a test harness for actions exists (check `Editor.test.tsx` imports).

- [ ] **Step 1:** Replace the inline `markSectionMade` in `actions.ts` with imports from `section-state.ts` (DRY). Verify existing tests still pass: `npx vitest run app/dashboard/website`.
- [ ] **Step 2:** Add `keepSection(section)` and `toggleSection(section, hidden)` server actions: load draft-or-live base tree, apply `markSectionKept` / `setSectionHidden`, `stageDraftTree`, `revalidatePath`. Same ownership + error shape as `editContent`.
- [ ] **Step 3:** Run `npx vitest run app/dashboard/website` + `npm run tsc` → pass.
- [ ] **Step 4: Commit** — `feat(editor): keepSection + toggleSection actions; DRY section-state`

---

## Task 4: Publish honesty gate (pure) + wire

**Files:**
- Create: `lib/editor/publish-gate.ts`
- Test: `lib/editor/publish-gate.test.ts`
- Modify: `app/dashboard/website/actions.ts` (`publishStore`)

- [ ] **Step 1: Write failing test:**

```ts
import { publishBlockers } from './publish-gate';
// founder unresolved -> 'about'; reviews on & unresolved -> 'reviews'; findUs on & unresolved -> 'findUs'
```
Assert: a fresh envelope blocks on `['about','goods','reviews','findUs']`; hiding reviews/findUs removes them; making founder+goods yours removes about/goods; a fully-resolved envelope returns `[]`.

- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement** — `publishBlockers(env)` returns the honesty sections that are on-but-unresolved: `founder` (about) and `goods` unless `made`; `reviews`/`findUs` when not hidden and not `made`. Reuses `section-state`. (Products join later via the listings build.)
- [ ] **Step 4:** Wire into `publishStore`: if `publishBlockers(draft).length > 0`, return `{ ok:false, error }` naming what's left. Run tests → pass.
- [ ] **Step 5: Commit** — `feat(editor): publish honesty gate (about/goods/reviews/find-us)`

---

## Task 5: Extract the reusable SectionEditor

**Files:**
- Create: `app/dashboard/website/_components/SectionEditor.tsx`
- Modify: `app/dashboard/website/_components/Walkthrough.tsx`
- Test: `app/dashboard/website/_components/SectionEditor.test.tsx` (read `Walkthrough.test.tsx` first for the render/mocking pattern)

Pure refactor: lift the per-section step body (LEADS lead, questions, ask/own modes, field editors, the `editContent`/`setFieldValues` calls) out of `Walkthrough.tsx` into `SectionEditor` with props `{ section, fields, values, mode: 'walk' | 'editor', onChanged }`. `Walkthrough` renders `<SectionEditor>` for the current step. Behaviour identical.

- [ ] **Step 1:** Write `SectionEditor.test.tsx`: renders a section's fields, "Ask Bohdi to write it" is the primary button, "I'll write it myself" toggles to field editors. (Mirror assertions from `Walkthrough.test.tsx`.)
- [ ] **Step 2:** Run → fail.
- [ ] **Step 3:** Extract the component; rewire `Walkthrough` to use it. Keep `LEADS` with `SectionEditor`.
- [ ] **Step 4:** Run `npx vitest run app/dashboard/website` → pass (both old and new tests).
- [ ] **Step 5: Commit** — `refactor(editor): extract reusable SectionEditor`

---

## Task 6: Keep / change / turn-off controls + resolve-to-advance

**Files:**
- Modify: `SectionEditor.tsx`
- Test: `SectionEditor.test.tsx`

- [ ] **Step 1:** Tests: a keep-or-change section shows "Keep as built"; an optional section shows "Keep as built", "Change it", and "Turn it off"; a must-change section shows neither keep nor skip (only edit); calling keep/off invokes `keepSection`/`toggleSection`.
- [ ] **Step 2:** Run → fail.
- [ ] **Step 3:** Add a `cls`-driven control row (from `sectionClass`): required pill vs the three optional buttons; wire the new actions; expose an `onResolved` callback so the walk host can light Next. Remove the old unconditional "Skip for now".
- [ ] **Step 4:** Run → pass; `tsc` + lint.
- [ ] **Step 5: Commit** — `feat(editor): per-class keep/change/turn-off controls`

---

## Task 7: Full-screen walk route (chrome-less)

**Files:**
- Create: `app/make-it-yours/layout.tsx`, `app/make-it-yours/page.tsx`
- Reference: `app/dashboard/website/page.tsx` (data loading), `app/dashboard/layout.tsx` (what to NOT inherit)

- [ ] **Step 1:** `layout.tsx`: minimal `min-h-screen bg-bg text-text`, no sidebar/header. `page.tsx`: load the same data `website/page.tsx` loads (`getCurrentShop`, draft/live envelope, `walkValues`, preview token/origin), render the walk sequence host full-screen.
- [ ] **Step 2:** Move the walk *sequence* host (progress bar, step nav, welcome/finish) from `Walkthrough.tsx`/`Editor.tsx` into this page, rendering `SectionEditor` per step. Manual check via dev server that `/make-it-yours` renders full-screen.
- [ ] **Step 3:** `tsc` + lint; existing tests pass.
- [ ] **Step 4: Commit** — `feat(editor): full-screen make-it-yours route`

---

## Task 8: Opening welcome screen

**Files:**
- Modify: `app/make-it-yours/page.tsx` (or a `WalkWelcome.tsx` component)

- [ ] **Step 1:** Test (component): the welcome step explains it's a step-by-step guide to make the site their own and has a single "Let's go" that advances to section 1.
- [ ] **Step 2:** Run → fail.
- [ ] **Step 3:** Implement the welcome step as step 0 of the sequence (D69 / Session 80: the first page explains the purpose).
- [ ] **Step 4:** Run → pass.
- [ ] **Step 5: Commit** — `feat(editor): make-it-yours welcome screen`

---

## Task 9: Gate the editor + remove re-entry

**Files:**
- Modify: `app/dashboard/website/page.tsx`, `app/make-it-yours/page.tsx`, `Editor.tsx`

- [ ] **Step 1:** In `website/page.tsx`, after loading the envelope: `if (!walkComplete(homeEnv)) redirect('/make-it-yours')`. In `make-it-yours/page.tsx`: `if (walkComplete(homeEnv)) redirect('/dashboard/website')`.
- [ ] **Step 2:** Remove from `Editor.tsx`: the `walkOpen`/`firstRun` auto-open, the `<Walkthrough>` branch, and the "Walk me through my store again" button. `Editor` becomes look-area + (Task 11) content-area only.
- [ ] **Step 3:** Manual: a store with placeholders lands on `/make-it-yours`; a resolved store reaches the editor; the editor has no walk re-entry.
- [ ] **Step 4:** `tsc` + lint; tests pass (update `Editor.test.tsx` for removed props).
- [ ] **Step 5: Commit** — `feat(editor): gate editor behind the walk; one-time (no re-entry)`

---

## Task 10: Single-section spotlit preview

**Files:**
- Modify: storefront preview param reader (grep `previewStill` / `previewMood` to find it — likely `app/storefront/page.tsx` + `StorefrontPage.tsx`), `SectionEditor.tsx` / walk host preview iframe.

- [ ] **Step 1:** Add a `previewSection=<SectionKey>` param that renders the store with only that section visible (or scrolled-to and locked so it can't scroll off — Alex Option B). Decide render-one vs scroll-lock by reading how sections compose in `MainStreet.tsx`; prefer rendering the single section if the composition allows, else anchor+lock.
- [ ] **Step 2:** Point each step's preview iframe at `...&previewSection=<step.section>` so the preview shows only the section being edited and updates via the existing `previewNonce`.
- [ ] **Step 3:** Manual: editing the hero shows only the hero, updating live, no scroll drift.
- [ ] **Step 4:** `tsc` + lint; tests pass.
- [ ] **Step 5: Commit** — `feat(editor): single-section spotlit preview`

---

## Task 11: Editor content area (free navigation)

**Files:**
- Create: `app/dashboard/website/_components/EditorContent.tsx`
- Modify: `Editor.tsx`

- [ ] **Step 1:** Test: the content area lists the store's sections and, on selecting one, renders `SectionEditor` in `mode='editor'` for it.
- [ ] **Step 2:** Run → fail.
- [ ] **Step 3:** Build `EditorContent`: a section list → `SectionEditor` (free, ungated, no Next); wire it as a second area of `Editor.tsx` alongside the existing look controls (a simple two-tab/segmented switch: "Your content" / "Your look"). Reuses the same actions + single-section preview.
- [ ] **Step 4:** Run → pass; `tsc` + lint.
- [ ] **Step 5: Commit** — `feat(editor): section-by-section content area in the editor`

---

## Task 12: FindUsRow schema — additive fields

**Files:**
- Modify: `lib/archetypes/main-street/schemas.ts`
- Test: `lib/archetypes/main-street/schemas.test.ts`

- [ ] **Step 1:** Test: `FindUsRow` accepts `eventName`, `address`, `link` (all optional so prior content parses); still accepts the legacy `day`/`where`/`time`/`date`/`kind`.
- [ ] **Step 2:** Run → fail.
- [ ] **Step 3:** Add `eventName: z.string().min(1).optional()`, `address: z.string().min(1).optional()`, `link: z.string().min(1).optional()` to `FindUsRow`. (Optional keeps it additive — no migration; the dates editor writes them, the renderer reads them with fallback to `where`.)
- [ ] **Step 4:** Run → pass; `tsc`.
- [ ] **Step 5: Commit** — `feat(storefront): find-us event name / address / link fields`

---

## Task 13: Find-us dates editor + action

**Files:**
- Create: `app/dashboard/website/_components/FindUsDatesEditor.tsx`
- Modify: `app/dashboard/website/actions.ts` (`setFindUsRows`), the walk host + `EditorContent` (host the dates editor for the `findUs` section instead of the text `SectionEditor`)
- Test: `FindUsDatesEditor.test.tsx`, plus `setFindUsRows` covered by section-state

- [ ] **Step 1:** Tests: the editor shows seeded rows; "Add a date" appends a blank row; a row needs date + event name + address before it counts; saving calls `setFindUsRows`; "Turn it off" calls `toggleSection('findUs', true)`.
- [ ] **Step 2:** Run → fail.
- [ ] **Step 3:** `setFindUsRows(rows)` action: coerce/validate rows (date, eventName, address required; link optional), stage onto `root.content.founder.findUs.rows` (confirm the exact path in `schemas.ts`), `markSectionMade(env,'findUs')`. Build `FindUsDatesEditor` (row list, add/remove, save, turn-off). Host it for the `findUs` section in both the walk and `EditorContent`.
- [ ] **Step 4:** Run → pass; `tsc` + lint.
- [ ] **Step 5: Commit** — `feat(editor): standalone find-us dates editor`

---

## Task 14: About-story bug fix

**Files:**
- Investigate: `lib/editor/content-agent.ts`, `editContent` in `actions.ts`, the `/about` page render + preview path.
- Test: `lib/editor/content-agent.test.ts` (regression)

- [ ] **Step 1:** Reproduce: read the Bill's Buns draft immediately after one story edit; confirm whether `about.story` changed. Root-cause (leading hypothesis: the content agent drops the large optional `about.story` field; alternate: `/about` preview falls back to published).
- [ ] **Step 2:** Write a regression test: a story-step edit must include `about.story` in the write set / produce a changed `about.story`.
- [ ] **Step 3:** Fix at root: ensure the required story step reliably rewrites the About body (make `about.story` a required output of that step, not left to Bohdi's discretion), and confirm the `/about` preview resolves the draft (`previewToken`) not published.
- [ ] **Step 4:** Run → pass; manual re-check live on a test store.
- [ ] **Step 5: Commit** — `fix(editor): story step reliably rewrites the About page`

---

## Task 15: Finish screen + full-run verification

**Files:**
- Modify: `app/make-it-yours/page.tsx`

- [ ] **Step 1:** Finish step after the last section resolves: confirms everything's theirs, shows any remaining publish blockers from `publishBlockers`, and Publish (gated) takes it live, then routes to the editor.
- [ ] **Step 2:** Full manual run on a fresh test store: land full-screen → welcome → each section keep/change/turn-off → find-us real dates → About real → Publish → lands in editor → editor content area edits a section → re-publish. Alex's eyes gate this (visible output).
- [ ] **Step 3:** `npx vitest run` (whole suite) + `npm run tsc` + lint all green.
- [ ] **Step 4: Commit** — `feat(editor): make-it-yours finish screen + gated publish`

---

## Self-review

- **Spec coverage:** welcome (T8), gating full-screen route (T7/T9), one-time/no re-entry (T9), per-section keep/change/skip + kept state (T1/T2/T6), must-change About+Goods (T2), single-section preview (T10), editor content area (T11), find-us standalone dates editor + schema (T12/T13), honesty gate (T4/T15), About bug (T14). All spec sections map to a task.
- **Placeholder scan:** UI tasks name exact files, the test to write, and the implementation shape; final JSX is written against the named sibling patterns at execution (execution note above). Pure-logic/schema tasks carry complete code.
- **Type consistency:** `sectionState` returns `'made' | 'kept' | 'hidden' | 'unresolved'`; `SectionClass` is `'must-change' | 'keep-or-change' | 'optional'`; actions `keepSection` / `toggleSection` / `setFindUsRows` and pure helpers `markSectionMade` / `markSectionKept` / `setSectionHidden` are used consistently across tasks.
- **Open at execution:** the exact `findUs.rows` envelope path (confirm in `schemas.ts` at T13); single-section preview render-one-vs-scroll-lock (decide at T10); whether an action test harness exists (T3).
