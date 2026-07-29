# "Make It Yours" Walkthrough + Content Editing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Test-first throughout. The UI tasks (6–8) invoke `frontend-design:frontend-design` before writing components, and **Alex's eyes gate every visible task** — tests-green proves it runs, not that it looks right.

**Goal:** Deliver the first-run editor experience — a structured "Make It Yours" walkthrough where Bohdi steps the maker through replacing every placeholder *word* with their own, section by section, plus turning optional sections on/off — all staged in the draft and promoted on Publish.

**Architecture:** A stateless content-editing agent (reusing the crew copywriter's forced-tool loop) rewrites an allowlisted set of text fields into the existing draft (`stageLook`'s seed-then-accumulate pattern). The walkthrough is a re-enterable mode of the one website editor that drives that agent one section at a time, apply-then-see, on the draft-and-publish we already shipped. Section on/off is a per-section visibility flag stored in the same draft envelope and honored by the renderer's section-stack walk.

**Tech stack:** Next.js server actions, Anthropic SDK (`claude-sonnet-4-6`, matching the crew), Zod shape-only schemas, Vitest + Testing Library (jsdom), the existing `store_drafts` draft.

**Depends on:** the editor's draft-and-publish (`2026-07-27-editor-staging-engine.md`, complete) and the design spec `Project-Docs/Editor-Make-It-Yours-Design.md` (Parts 2 & 3 + Section on/off). Honors `Editor-Design-Notes.md` (one source of truth; subjective intent → curated levers; sync-derived / never silently rewrite authored).

---

## Decisions for Alex (flagged — plan proceeds on the recommended default; say the word to change)

1. **RESOLVED (Alex, 2026-07-29): the maker can rewrite ANYTHING we generated.** Bohdi's editable set is *all* the generated text in the home envelope — comprehensive, not a hand-picked subset. The only things left out are things that aren't ours to rewrite: (a) **the maker's own inputs** — the shop name (`content.shopName`, `content.moment.brand`, `content.identity.wordmark`); it came from the maker, so it's already theirs, and they change it by *renaming* (a later Settings action), not by Bohdi rewording copy; (b) **images** — media slots belong to the image editor (D65), not the writer; (c) **structure / treatments / link destinations** — the family's call, never Bohdi's (the content-only non-negotiable). Everything else generated — including the small labels ("See all", "View the full catalog") — is editable, because the maker can rewrite anything we wrote.

2. **Walkthrough step order = the store's own top-to-bottom order (recommended).** Welcome (hero) → Your story (founder + About) → Kind words (reviews) → Where to find you (find-us) → Your sign-off (close) → Getting in touch (contact) → The small stuff (headings + marquee). The design listed these "open for review"; mirroring the store means the preview fills in from the top as the maker goes.

3. **The agent reuses the crew's model `claude-sonnet-4-6`** for voice consistency with onboarding copy. Technical call, noted for the record.

---

## File structure

**Create:**
- `lib/editor/editable-fields.ts` — the allowlist: a registry of editable text fields (id, envelope path, kind, which section, UI label) + `getFieldValue` / `setFieldValue` helpers that read/write a field in a cloned envelope. The single source of "what Bohdi may touch."
- `lib/editor/editable-fields.test.ts`
- `lib/editor/content-agent.ts` — `runContentEdit(...)`: the stateless writer. Builds a forced Anthropic tool whose input schema is exactly the fields in play, runs the copywriter-style attempt loop, normalizes, returns new field values. No DB, no draft — pure agent.
- `lib/editor/content-agent.test.ts` — drives the agent with a mocked Anthropic client.
- `lib/editor/section-visibility.ts` — `OPTIONAL_SECTIONS`, `isOptionalSection`, `getHiddenSections`, `setSectionHidden` (reads/writes `content.hiddenSections` in a cloned envelope). Structural sections can never be hidden.
- `lib/editor/section-visibility.test.ts`
- `lib/editor/walkthrough.ts` — `WALKTHROUGH_STEPS` (ordered step definitions: id, title, section, the field ids it writes, whether it's an optional-section step), `placeholderSections(envelope)` (which content sections still read as placeholder), `walkthroughProgress(envelope)`. Pure functions.
- `lib/editor/walkthrough.test.ts`
- `app/dashboard/website/_components/Walkthrough.tsx` — the stepped walkthrough panel (client). Drives the actions, shows the step, "keep / try again / tweak", "make it yours or switch it off", progress.
- `app/dashboard/website/_components/Walkthrough.test.tsx`

**Modify:**
- `app/dashboard/website/actions.ts` — add `editContent(...)` (runs the agent, stages the new values into the draft) and `toggleSection(...)` (stages the hidden flag). Both mirror `stageLook`'s ownership-gate + seed-then-accumulate + `stageDraftTree`.
- `lib/archetypes/main-street/schemas.ts` — add optional `hiddenSections?: SectionKey[]` to `MainStreetContentSchema` / `MainStreetContent` (shape-only, no behavior).
- `lib/archetypes/main-street/MainStreet.tsx` — the section-stack walk skips a section the maker flagged hidden (in addition to the family `.on` and the data-presence checks). Structural sections ignore the flag.
- `lib/archetypes/main-street/builder.tsx` — thread `content.hiddenSections` into `<MainStreet hiddenSections=... />`.
- `app/dashboard/website/page.tsx` — compute first-run (`placeholderSections`) and pass the walkthrough props + niche to `Editor`.
- `app/dashboard/website/_components/Editor.tsx` — host the walkthrough as a mode: auto-open on first run, a "walk me through my store again" re-trigger, and refresh the preview after each content edit.

**No DB migration.** The draft table, the content envelope, and the renderer already exist; `hiddenSections` rides inside the envelope JSON.

---

## Task 1: The editable-field allowlist + get/set helpers

**Files:** Create `lib/editor/editable-fields.ts`, `lib/editor/editable-fields.test.ts`.

The registry is the content-only lever: it lists **every generated text field** so Bohdi can rewrite anything we wrote, while its existence still keeps him off structure/look (a path not in the registry is a path his tool can't write). The set is comprehensive of generated text, not a cherry-picked subset — the exclusions are principled (see Decision 1): the maker's own inputs (shop name), images, and structure/treatments/link-destinations. Every path is rooted at the envelope `root.content` (the `MainStreetContent`). Fields come in three kinds: `text` (a single string), `lines` (a `string[]` — story paragraphs, marquee voice), and `items` (an array of `{...}` objects — reviews, collections; the whole array is the value).

- [ ] **Step 1: Write the failing test.**

```ts
import { describe, it, expect } from 'vitest';
import { EDITABLE_FIELDS, fieldsForSection, getFieldValue, setFieldValue } from './editable-fields';

const ENV = () => ({
  root: { kind: 'archetype', content: {
    shopName: 'Aurora',
    moment: { eyebrow: 'Hand-poured', story: ['a', 'b'], brand: 'Aurora', sub: 'small batch', ctaLabel: 'Shop' },
    goods: { title: 'The candles' },
    reviews: { title: 'Kind words', items: [{ quote: 'Lovely', author: 'Sam' }] },
    about: { heading: 'Our story', story: ['p1'] },
    contact: { heading: 'Say hi', intro: 'Reach out' },
  } },
});

describe('editable-fields allowlist', () => {
  it('excludes what is not ours to rewrite: shop name, images, structure', () => {
    const ids = EDITABLE_FIELDS.map((f) => f.id);
    expect(ids).not.toContain('shopName');           // maker's own input
    expect(ids).not.toContain('moment.brand');       // hero brand = shop name
    expect(ids.some((i) => i.includes('media'))).toBe(false); // images → image editor
    expect(ids.some((i) => i.includes('logo'))).toBe(false);
  });

  it('includes the small generated labels — the maker can reword anything we wrote', () => {
    const ids = EDITABLE_FIELDS.map((f) => f.id);
    expect(ids).toContain('goods.viewAllLabel');
    expect(ids).toContain('reviews.label');
  });

  it('reads a text field by id', () => {
    expect(getFieldValue(ENV(), 'moment.eyebrow')).toBe('Hand-poured');
  });

  it('reads a lines field as an array', () => {
    expect(getFieldValue(ENV(), 'about.story')).toEqual(['p1']);
  });

  it('sets a text field without mutating the input', () => {
    const env = ENV();
    const next = setFieldValue(env, 'moment.eyebrow', 'Made by hand');
    expect(getFieldValue(next, 'moment.eyebrow')).toBe('Made by hand');
    expect(getFieldValue(env, 'moment.eyebrow')).toBe('Hand-poured'); // original untouched
  });

  it('groups fields by section', () => {
    const heroIds = fieldsForSection('hero').map((f) => f.id);
    expect(heroIds).toContain('moment.eyebrow');
    expect(heroIds).toContain('moment.story');
    expect(heroIds).not.toContain('about.story');
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** (`Cannot find module './editable-fields'`). Run: `npx vitest run lib/editor/editable-fields.test.ts`.

- [ ] **Step 3: Implement.** Define `EditableFieldKind = 'text' | 'lines' | 'items'`, an `EditableField` interface (`id`, `path: string[]` rooted at `content`, `kind`, `section: SectionKey`, `label: string`), and the `EDITABLE_FIELDS` registry. Enumerate **every generated text field** — hero: `moment.eyebrow` (text), `moment.story` (lines), `moment.sub` (text), `moment.ctaLabel` (text), `moment.secondaryCtaLabel` (text); goods: `goods.title` (text), `goods.label` (text), `goods.viewAllLabel` (text); collections: `collections.title` (text), `collections.label` (text), `collections.viewAllLabel` (text), `collections.items` (items: name+description per row); reviews: `reviews.title` (text), `reviews.label` (text), `reviews.viewAllLabel` (text), `reviews.items` (items: quote+author); marquee: `marquee.voice` (lines); founder: `founder.quote` (text), `founder.attribution` (text), `founder.eyebrow` (text), `founder.heading` (text), `founder.aboutLabel` (text); close: `close.label` (text), `close.headline` (text), `close.ctaLabel` (text); about: `about.heading` (text), `about.story` (lines); contact: `contact.heading` (text), `contact.intro` (text). Include the small labels too — they're generated, so the maker can reword them. **Exclude only what isn't ours to rewrite:** `shopName`, `moment.brand`, `identity.*` (the maker's shop name); every `*.media`/`photo` slot (images → image editor); `moment.ctaTarget`/`secondaryCtaTarget` and all treatments (structure/destinations → the family); and product fields (a different surface — the Listing Manager). `getFieldValue`/`setFieldValue` walk `['root','content', ...path]`; `setFieldValue` deep-clones via `structuredClone` and writes at the path, returning the new envelope. `fieldsForSection(section)` filters `EDITABLE_FIELDS`.

- [ ] **Step 4: Run tests — expect PASS.** Run: `npx vitest run lib/editor/editable-fields.test.ts`.

- [ ] **Step 5: Typecheck + lint.** Run: `npm run typecheck` and `npx eslint lib/editor/editable-fields.ts lib/editor/editable-fields.test.ts`.

- [ ] **Step 6: Commit.** `git commit -m "feat(editor): editable-field allowlist + get/set helpers"`

---

## Task 2: The content-editing agent (Bohdi the writer)

**Files:** Create `lib/editor/content-agent.ts`, `lib/editor/content-agent.test.ts`.

`runContentEdit` takes the fields in play (a subset of `EDITABLE_FIELDS`), their current values, the maker's instruction, and voice grounding (niche display name + body). It builds a forced Anthropic tool whose input schema has exactly those fields, runs the copywriter-style attempt loop (`withTimeout`, forced `tool_choice`, retry on parse failure), normalizes the output with the copywriter's helpers, and returns `{ values: Record<fieldId, string | string[] | items> }`. It never touches the DB or the draft — the action does that.

- [ ] **Step 1: Write the failing test** (mock the Anthropic client so no network). Prove: it forces the tool, returns normalized values for the requested fields only, strips headline punctuation, and throws a typed error when the model never returns a valid tool call within the attempt budget.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { runContentEdit } from './content-agent';
import { fieldsForSection } from './editable-fields';

function toolReply(input: unknown) {
  return { content: [{ type: 'tool_use', name: 'write_fields', input }] };
}

beforeEach(() => create.mockReset());

describe('runContentEdit', () => {
  it('returns normalized values for the requested fields', async () => {
    create.mockResolvedValueOnce(toolReply({ 'moment.eyebrow': 'Made by hand.', 'moment.story': ['One line', 'Two.'] }));
    const out = await runContentEdit({
      fields: fieldsForSection('hero').filter((f) => ['moment.eyebrow', 'moment.story'].includes(f.id)),
      current: { 'moment.eyebrow': 'Old', 'moment.story': ['x'] },
      instruction: 'Make it warmer',
      niche: { displayName: 'Candle maker', body: '...' },
    });
    // headline punctuation stripped, story is an array
    expect(out.values['moment.eyebrow']).toBe('Made by hand');
    expect(out.values['moment.story']).toEqual(['One line', 'Two']);
  });

  it('throws after the attempt budget when no valid tool call comes back', async () => {
    create.mockResolvedValue({ content: [{ type: 'text', text: 'no tool' }] });
    await expect(runContentEdit({
      fields: fieldsForSection('contact'),
      current: {}, instruction: 'x', niche: { displayName: 'X', body: '' },
    })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** (module missing). Run: `npx vitest run lib/editor/content-agent.test.ts`.

- [ ] **Step 3: Implement**, mirroring `lib/onboarding/crew/copywriter.ts`. Constants `MODEL = 'claude-sonnet-4-6'`, `MAX_TOKENS = 4000`, `MAX_ATTEMPTS = 4`, `TIMEOUT_MS = 60_000`. Build the tool input schema dynamically from `fields` (`text`→string, `lines`→array of strings, `items`→array of the row shape). Forced `tool_choice: { type: 'tool', name: 'write_fields' }`. System prompt: Bohdi is the store's writer; here is the niche (`niche.body`), the current values, and the maker's instruction; rewrite ONLY the listed fields in the shop's own voice; if the request is genuinely ambiguous return the current values unchanged (the action surfaces "ask one question" — see Task 3); if the request is about the *look* not words, leave values unchanged. Loop with `withTimeout((signal) => anthropicClient().messages.create({...}, { signal }), TIMEOUT_MS, 'content-edit')`; on a valid `tool_use`, validate each returned key is in `fields`, coerce/normalize (reuse `stripHeadlinePunct`/`stripStoryPunct` from `lib/onboarding/crew/normalize-copy.ts` per field kind), return. Retry with a `tool_result` `is_error` note on parse failure; throw a typed `ContentEditError` after `MAX_ATTEMPTS`.

- [ ] **Step 4: Run tests — expect PASS.** Run: `npx vitest run lib/editor/content-agent.test.ts`.

- [ ] **Step 5: Typecheck + lint.**

- [ ] **Step 6: Commit.** `git commit -m "feat(editor): Bohdi content-editing agent (stateless writer)"`

---

## Task 3: The `editContent` server action (stage into the draft)

**Files:** Modify `app/dashboard/website/actions.ts`. Test: `app/dashboard/website/actions.test.ts` (create if absent).

`editContent(sectionOrFieldIds, instruction)` gates ownership, seeds the draft (existing draft, else the live envelope — exactly `stageLook`), reads the current values via `getFieldValue`, runs `runContentEdit`, writes each returned value back via `setFieldValue`, and `stageDraftTree`s the result. Never touches live.

- [ ] **Step 1: Write the failing test.** Mock `getCurrentShop`, `readDraftTree`/`loadHomeEnvelope`/`stageDraftTree`, and `runContentEdit`. Assert: on success the staged tree carries the new values at the right paths; the live store is never written; an unauthenticated caller returns `{ ok: false }`; when `runContentEdit` throws, the action returns a friendly error and does NOT stage.

```ts
// key assertions
const res = await editContent(['moment.eyebrow'], 'warmer');
expect(res).toEqual({ ok: true });
expect(stageDraftTree).toHaveBeenCalledWith('t1', expect.objectContaining({
  root: expect.objectContaining({ content: expect.objectContaining({
    moment: expect.objectContaining({ eyebrow: 'Made by hand' }),
  }) }),
}));
```

- [ ] **Step 2: Run it — expect FAIL** (`editContent` not exported). 

- [ ] **Step 3: Implement** `editContent(fieldIds: string[], instruction: string): Promise<ActionResult>`: resolve `fields` = `EDITABLE_FIELDS.filter(f => fieldIds.includes(f.id))` (reject empty/unknown → `{ ok:false, error:'Nothing to edit.' }`); `getCurrentShop`; seed `baseTree` (draft ?? `{ root: live }`); `current` = map each field via `getFieldValue`; load niche (helper `loadNicheVoice(tenantId)` — reuse the same `niches.body_markdown` read as `build-archetype-store.ts`, extracted into `lib/editor/niche-voice.ts` with its own tiny test); `try { const { values } = await runContentEdit({...}); }` — on throw log + `{ ok:false, error:'Couldn’t write that just now — try again.' }` (draft untouched, per spec error handling); fold `values` into `baseTree` via `setFieldValue` per field; `stageDraftTree`; `revalidatePath('/dashboard/website')`.

- [ ] **Step 4: Run tests — expect PASS.**

- [ ] **Step 5: Typecheck + lint + full suite** (`npm test`).

- [ ] **Step 6: Commit.** `git commit -m "feat(editor): editContent action stages Bohdi rewrites into the draft"`

---

## Task 4: Section on/off

**Files:** Modify `lib/archetypes/main-street/schemas.ts`, `lib/archetypes/main-street/MainStreet.tsx`, `lib/archetypes/main-street/builder.tsx`; create `lib/editor/section-visibility.ts` (+ test); add `toggleSection` to `app/dashboard/website/actions.ts`.

Optional sections: `reviews`, `collections`, `marquee`, `findUs`. Structural (`hero`, `goods`, `founder`, `close`, `contact`) can never be hidden. The flag lives at `content.hiddenSections: SectionKey[]`; the renderer skips a hidden optional section even when it has content, and turning it back on restores the kept content.

- [ ] **Step 1 (schema): failing test** in `schemas` test (or a new `section-visibility.test.ts`) — `MainStreetContentSchema.parse({...valid, hiddenSections: ['reviews'] })` succeeds; an unknown section value fails.

- [ ] **Step 2:** add `hiddenSections: z.array(SectionKeySchema).optional()` to `MainStreetContentSchema` (define/import `SectionKeySchema` from the `SectionKey` union). Run the schema test → PASS.

- [ ] **Step 3 (helpers): failing test** for `section-visibility.ts`: `OPTIONAL_SECTIONS` is exactly the four; `isOptionalSection('hero')===false`; `setSectionHidden(env,'reviews',true)` adds it to `content.hiddenSections` without mutating input; `setSectionHidden(env,'reviews',false)` removes it; `setSectionHidden(env,'hero',true)` is a no-op (structural cannot hide); `getHiddenSections(env)` returns the list.

- [ ] **Step 4:** implement `section-visibility.ts`. Run → PASS.

- [ ] **Step 5 (renderer): failing test** in `MainStreet.test.tsx` — render with `content.reviews` populated (items present) and family reviews-on, but `hiddenSections={['reviews']}`; assert the reviews beat is absent. Render again with `hiddenSections={[]}`; assert it's present. Assert a structural section (`goods`) still renders even if someone passes it in `hiddenSections`.

- [ ] **Step 6:** thread it. `MainStreetProps` gains `hiddenSections?: readonly SectionKey[]`. In `MainStreet`, compute `const hidden = new Set(hiddenSections ?? [])` and change the body filter to `stack.filter((e) => e.section !== 'hero' && e.on && !(isOptionalSection(e.section) && hidden.has(e.section)))`. `builder.tsx` passes `hiddenSections={c.hiddenSections}` into `<MainStreet .../>`. Run → PASS.

- [ ] **Step 7 (action): failing test** — `toggleSection('reviews', false)` stages `content.hiddenSections` including `'reviews'`; `toggleSection('hero', false)` returns `{ ok:false }` (not optional). Same ownership + seed-then-accumulate + `stageDraftTree` shape as `stageLook`.

- [ ] **Step 8:** implement `toggleSection(section: string, visible: boolean): Promise<ActionResult>` in `actions.ts` (reject non-optional; seed draft; `setSectionHidden(baseTree, section, !visible)`; stage; revalidate). Run → PASS.

- [ ] **Step 9: full suite + typecheck + lint. Commit.** `git commit -m "feat(editor): section on/off (hidden flag, renderer skip, toggleSection)"`

---

## Task 5: Walkthrough state (pure logic)

**Files:** Create `lib/editor/walkthrough.ts`, `lib/editor/walkthrough.test.ts`.

The stepped flow's brain, UI-free: the ordered steps (Decision 2), which sections still read as placeholder, and progress. "Placeholder" = the content still matches what onboarding seeded (we don't have a per-field authored/edited flag, so use a pragmatic signal: a step is "done" once the maker has touched any of its fields — tracked by the walkthrough writing a `content.madeYours: SectionKey[]` marker on edit — OR the optional section is switched off). This keeps completeness honest without a schema migration beyond the marker array.

- [ ] **Step 1: failing test** — `WALKTHROUGH_STEPS` is in the Decision-2 order and every step's `fieldIds` are a subset of `EDITABLE_FIELDS`; `placeholderSections(env)` lists sections not in `content.madeYours` and not hidden; `walkthroughProgress(env)` returns `{ done, total }`; a store with everything marked/​off reports `done === total`.

- [ ] **Step 2: implement.** `WALKTHROUGH_STEPS: readonly { id; title; section: SectionKey; fieldIds: string[]; optional: boolean }[]`. `placeholderSections(env)` and `walkthroughProgress(env)` read `content.madeYours` + `content.hiddenSections`. Add `madeYours?: SectionKey[]` to the schema (Task 4 pattern; shape-only) and mark it in `editContent`/`toggleSection` (fold the step's section into `madeYours` when a step completes — thread a `section` arg into `editContent`).

- [ ] **Step 3: run → PASS. Typecheck + lint. Commit.** `git commit -m "feat(editor): walkthrough steps, placeholder detection, progress"`

---

## Task 6: The walkthrough UI

**Files:** Create `app/dashboard/website/_components/Walkthrough.tsx` (+ `.test.tsx`).

> **Invoke `frontend-design:frontend-design` before writing this component.** This is the maker's first real conversation with Bohdi — it must feel like a person walking them through their store, not a form. **Alex's eyes gate this task.**

Behavior (design Part 3): one step at a time; Bohdi *leads* with a plain-language ask ("tell me how you got started — or tell me the feeling and I'll write it"); the maker types their info (or asks Bohdi to write it); on submit the component calls `editContent(step.fieldIds, input, step.section)`; the preview iframe refreshes to show the draft; the maker can **keep** (next step), **try again** (re-run with the same input for a fresh take), or **tweak** (edit the text directly — a direct `editContent` with the typed value as the instruction, or a future click-to-edit). Optional-section steps also offer **switch it off** → `toggleSection(section, false)` and advance. A progress cue ("N of M made yours"). Undo/Reset/Publish stay available (reuse the Editor's existing controls).

- [ ] **Step 1:** failing test (jsdom) — renders the first step's prompt; typing + submit calls a stubbed `editContent` with the step's field ids and section; a "switch it off" control shows only on optional steps and calls `toggleSection`; "keep" advances to the next step; progress reflects the step index. Mock the actions.
- [ ] **Step 2:** build the component to pass, using frontend-design output. Preview refresh = bump the iframe `key`/src (reuse the Editor's existing preview wiring).
- [ ] **Step 3:** run → PASS. Typecheck + lint.
- [ ] **Step 4: Alex's eyes** — show the walkthrough running on a real store before commit.
- [ ] **Step 5: Commit.** `git commit -m "feat(editor): Make It Yours walkthrough panel"`

---

## Task 7: Host the walkthrough in the editor (auto-launch + re-trigger)

**Files:** Modify `app/dashboard/website/page.tsx`, `app/dashboard/website/_components/Editor.tsx`.

- [ ] **Step 1:** failing test in `Editor.test.tsx` — when `firstRun` prop is true the walkthrough is open on mount; when false it's closed but a "walk me through my store again" trigger renders and opens it.
- [ ] **Step 2:** `page.tsx` computes `firstRun = placeholderSections(envelope).length === WALKTHROUGH_STEPS.length` (nothing made yours yet) and passes `firstRun` + `niche` + the current content into `Editor`. `Editor.tsx` hosts `<Walkthrough/>` as a mode (open state), auto-open when `firstRun`, plus the re-trigger button (design: re-run is the same steps as a keep-or-change tour).
- [ ] **Step 3:** run → PASS. Typecheck + lint. 
- [ ] **Step 4: Alex's eyes** (first-run auto-open + re-trigger on a real store).
- [ ] **Step 5: Commit.** `git commit -m "feat(editor): auto-launch walkthrough on first run + re-trigger"`

---

## Task 8: Full verification (Alex's eyes gate)

- [ ] Whole suite green; `npm run typecheck` + `npm run lint` clean.
- [ ] **Manual, on a real store (fresh onboarding so it's all placeholder):**
  1. Open the editor → the walkthrough auto-launches.
  2. Walk each step: give Bohdi real info, watch the words land in the preview; try "try again"; "tweak" a line; keep.
  3. On reviews / find-us, switch the section off → confirm it disappears from the preview; switch back on → the seeded content returns.
  4. Finish → Publish → the live store shows your words and your on/off choices; the draft is gone.
  5. Reset mid-walkthrough → back to live, nothing half-applied.
  6. Re-trigger the walkthrough on the now-real store → it's a keep-or-change tour, every step skippable.
- [ ] Confirm Bohdi never touched structure/look/shop-name: the family, skin, nav, and shop name are unchanged through the whole walkthrough.

---

## Known caveats (not blockers)

- **"Placeholder" is tracked by a `madeYours` marker, not per-field diffing.** Good enough for completeness; a maker who edits then reverts still counts the section as touched. Fine — the goal is coverage, not forensic accuracy.
- **"Tweak" is direct-instruction for now, not click-to-edit.** Click-straight-on-a-headline and highlight-and-rewrite are their own later plans; this delivers the walkthrough + apply-then-see, which is the first-run need.
- **Free-form chat is the same agent, later face.** `runContentEdit` is built to be driven by either the walkthrough (per-section fields) or a future free-form chat (fields resolved from the request). Not built here.
- **Product/collection *content* steps are the next phase.** This walkthrough covers words; replacing the five placeholder products rides with the Listing Manager. The step frame is additive so they slot in.

---

## Self-review (against `Editor-Make-It-Yours-Design.md`)

- Part 2 (Bohdi content editing): Tasks 1–3 — allowlist (curated lever), stateless agent reusing the crew loop, apply-then-see into the draft, voice grounding, never touches structure/look. ✔
- Part 3 (walkthrough): Tasks 5–7 — stepped, Bohdi-leads, completeness, re-enterable/auto-launch/re-trigger. ✔
- Section on/off: Task 4 — flag in the draft envelope, renderer skips hidden, content kept, structural can't hide. ✔
- Honors design notes: one source of truth (every control writes the one draft envelope), curated levers (allowlist tool, not freehand), never silently rewrites authored (Bohdi writes only when the maker asks, per step). ✔
- Error handling (design): agent failure → friendly message, draft untouched (Task 3); ownership gated (Tasks 3, 4); normalize reused (Task 2); shape-only schema, no length caps (Tasks 1, 4). ✔
