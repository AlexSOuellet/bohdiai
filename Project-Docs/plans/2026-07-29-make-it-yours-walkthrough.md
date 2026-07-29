# "Make It Yours" Walkthrough — Content + Photos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Test-first throughout. The UI tasks invoke `frontend-design:frontend-design` before writing components, and **Alex's eyes gate every visible task** — tests-green proves it runs, not that it looks right.

**Goal:** Deliver the first-run editor experience — a structured "Make It Yours" walkthrough where Bohdi steps the maker through replacing every placeholder that's *ours* with their own: rewriting the store's **words**, uploading their own **photos** in place of the AI hero image and founder photo, and turning optional sections on/off — all staged in the draft and promoted on Publish.

**Architecture:** A stateless content-editing agent (reusing the crew copywriter's forced-tool loop) rewrites all generated text into the draft; a new upload action puts a maker's own photo into Storage and sets its URL in the draft. Both write only to the `store_drafts` draft (`stageLook`'s seed-then-accumulate pattern) and go live only on Publish. The walkthrough is a re-enterable mode of the one website editor that drives all of it one section at a time, apply-then-see. Section on/off is a per-section flag in the same draft envelope, honored by the renderer's section-stack walk.

**Tech stack:** Next.js server actions (incl. one FormData upload action), Anthropic SDK (`claude-sonnet-4-6`, matching the crew), Supabase Storage (`generated-images` bucket), Zod shape-only schemas, Vitest + Testing Library (jsdom), the existing `store_drafts` draft.

**Depends on:** the editor's draft-and-publish (`2026-07-27-editor-staging-engine.md`, complete) and `Project-Docs/Editor-Make-It-Yours-Design.md` (Parts 2 & 3 + Section on/off; **this plan widens that spec's word-only scope to include photo replacement per Alex, 2026-07-29**). Honors `Editor-Design-Notes.md`.

---

## Phasing

This plan is built in phases (see `Project-Docs/Editor-Make-It-Yours-Phases.md`), each ending at a shippable, eyes-checked checkpoint: **Phase 1 Words** = Tasks 1–4 + the walkthrough's word steps + host (Tasks 8, 10, 11); **Phase 2 Photos** = Tasks 5, 6, 9 + the photo step; **Phase 3 Sections on/off** = Task 7 + the off-switch in the optional steps. Ship and check each phase before starting the next. Products are the separate next build.

## What's in, and what's the next build

**In this build:** rewrite any generated words; replace the two home-store photos (hero image, founder photo) with the maker's own uploads; turn optional sections on/off; the stepped walkthrough that drives all three.

**The next build (not here):** replacing the five placeholder *products* with real ones — name, price, photo, options. That's the whole listings side, a large separate build. The walkthrough is built as a stepped frame so a products step slots in once listings exist. Product photos ride with it.

**Also not here:** the photo *touch-up* editor (background removal, crop, brightness — D65) — this build is photo *replacement* (upload your own), not editing. Free-form chat, reordering, deep per-section editing, "use my own colors" — all later, same engine.

---

## Resolved decisions

1. **The maker can rewrite ANYTHING we generated.** Bohdi's editable set is *all* generated text in the home envelope — comprehensive, small labels included — not a hand-picked subset. Left out only because they aren't ours to rewrite: the maker's own inputs (the shop name — `shopName`/`moment.brand`/`identity.wordmark`; it came from the maker, changed later by renaming, not by Bohdi); images (handled by upload, below, and the future touch-up editor); and structure/treatments/link-destinations (the family's call — content-only).
2. **Photos are replacement, in this build.** The maker uploads their own photo for the hero image and the founder photo; we set its URL in the draft. Product photos wait for listings.
3. **Walkthrough step order = the store's own top-to-bottom order:** Welcome (hero words + hero photo) → Your story (founder/About words + founder photo) → Kind words (reviews) → Where to find you (find-us) → Your sign-off (close) → Getting in touch (contact) → The small stuff (headings + marquee).
4. **The agent reuses the crew's model `claude-sonnet-4-6`** for voice consistency.

---

## File structure

**Create:**
- `lib/editor/editable-fields.ts` (+ `.test.ts`) — the registry of every editable generated-text field (id, envelope path, kind, section, label) + `getFieldValue`/`setFieldValue`/`fieldsForSection`.
- `lib/editor/content-agent.ts` (+ `.test.ts`) — `runContentEdit(...)`: the stateless writer (forced Anthropic tool over the fields in play; normalize; return new values). No DB.
- `lib/editor/niche-voice.ts` (+ `.test.ts`) — `loadNicheVoice(tenantId)` → `{ displayName, body }`, reusing the `niches.body_markdown` read from `lib/onboarding/build-archetype-store.ts`.
- `lib/editor/image-slots.ts` (+ `.test.ts`) — `REPLACEABLE_IMAGE_SLOTS` (hero, founder) with envelope path + slot kind + storage-path builder + section; `setImageUrl(env, slotId, url)`.
- `lib/editor/section-visibility.ts` (+ `.test.ts`) — `OPTIONAL_SECTIONS`, `isOptionalSection`, `getHiddenSections`, `setSectionHidden`.
- `lib/editor/walkthrough.ts` (+ `.test.ts`) — `WALKTHROUGH_STEPS`, `placeholderSections`, `walkthroughProgress`.
- `app/dashboard/website/_components/ImagePicker.tsx` (+ `.test.tsx`) — a client file-picker (choose → validate mime/size → POST to the upload action → callback with the new URL).
- `app/dashboard/website/_components/Walkthrough.tsx` (+ `.test.tsx`) — the stepped panel driving words + photos + on/off.

**Modify:**
- `app/dashboard/website/actions.ts` — add `editContent(...)`, `toggleSection(...)`, and `uploadStoreImage(...)` (a FormData action). All gate ownership + seed-then-accumulate + `stageDraftTree`, mirroring `stageLook`.
- `lib/archetypes/main-street/schemas.ts` — add optional `hiddenSections?: SectionKey[]` and `madeYours?: SectionKey[]` to `MainStreetContent` (shape-only).
- `lib/archetypes/main-street/MainStreet.tsx` — section-stack walk skips a maker-hidden optional section.
- `lib/archetypes/main-street/builder.tsx` — thread `content.hiddenSections`.
- `app/dashboard/website/page.tsx` — compute first-run + pass walkthrough props + niche.
- `app/dashboard/website/_components/Editor.tsx` — host the walkthrough (auto-launch + re-trigger + preview refresh).

**No DB migration.** Draft table, envelope, `generated-images` bucket, and renderer all exist; the new flags ride inside the envelope JSON.

---

## Task 1: Editable-field allowlist + get/set helpers

**Files:** Create `lib/editor/editable-fields.ts`, `lib/editor/editable-fields.test.ts`.

The registry is the content-only lever: it lists **every generated text field** so Bohdi can reword anything we wrote, while its existence still keeps him off structure/look (a path not in the registry can't be written). Comprehensive, not cherry-picked — see Resolved Decision 1. Paths root at `root.content`. Kinds: `text` (string), `lines` (`string[]`), `items` (array of objects — reviews, collections; the whole array is the value).

- [ ] **Step 1: failing test.**

```ts
import { describe, it, expect } from 'vitest';
import { EDITABLE_FIELDS, fieldsForSection, getFieldValue, setFieldValue } from './editable-fields';

const ENV = () => ({ root: { kind: 'archetype', content: {
  shopName: 'Aurora',
  moment: { eyebrow: 'Hand-poured', story: ['a', 'b'], brand: 'Aurora', ctaLabel: 'Shop' },
  goods: { title: 'The candles', viewAllLabel: 'See all' },
  reviews: { title: 'Kind words', label: 'Reviews', items: [{ quote: 'Lovely', author: 'Sam' }] },
  about: { heading: 'Our story', story: ['p1'] },
} } });

describe('editable-fields', () => {
  it('excludes what is not ours to rewrite: shop name, images, structure', () => {
    const ids = EDITABLE_FIELDS.map((f) => f.id);
    expect(ids).not.toContain('shopName');
    expect(ids).not.toContain('moment.brand');
    expect(ids.some((i) => i.includes('media') || i.includes('photo') || i.includes('logo'))).toBe(false);
  });
  it('includes the small generated labels', () => {
    const ids = EDITABLE_FIELDS.map((f) => f.id);
    expect(ids).toContain('goods.viewAllLabel');
    expect(ids).toContain('reviews.label');
  });
  it('reads text and lines by id', () => {
    expect(getFieldValue(ENV(), 'moment.eyebrow')).toBe('Hand-poured');
    expect(getFieldValue(ENV(), 'about.story')).toEqual(['p1']);
  });
  it('sets a field without mutating the input', () => {
    const env = ENV();
    const next = setFieldValue(env, 'moment.eyebrow', 'Made by hand');
    expect(getFieldValue(next, 'moment.eyebrow')).toBe('Made by hand');
    expect(getFieldValue(env, 'moment.eyebrow')).toBe('Hand-poured');
  });
  it('groups by section', () => {
    expect(fieldsForSection('hero').map((f) => f.id)).toContain('moment.story');
  });
});
```

- [ ] **Step 2: run → FAIL** (`npx vitest run lib/editor/editable-fields.test.ts`).
- [ ] **Step 3: implement.** `EditableFieldKind = 'text'|'lines'|'items'`; `EditableField = { id; path: string[]; kind; section: SectionKey; label }`; `EDITABLE_FIELDS` enumerating every generated text field — hero: `moment.eyebrow`, `moment.story` (lines), `moment.sub`, `moment.ctaLabel`, `moment.secondaryCtaLabel`; goods: `goods.title`, `goods.label`, `goods.viewAllLabel`; collections: `collections.title`, `collections.label`, `collections.viewAllLabel`, `collections.items` (items); reviews: `reviews.title`, `reviews.label`, `reviews.viewAllLabel`, `reviews.items` (items); marquee: `marquee.voice` (lines); founder: `founder.quote`, `founder.attribution`, `founder.eyebrow`, `founder.heading`, `founder.aboutLabel`; close: `close.label`, `close.headline`, `close.ctaLabel`; about: `about.heading`, `about.story` (lines); contact: `contact.heading`, `contact.intro`. **Exclude** `shopName`/`moment.brand`/`identity.*`, all media/photo slots, `moment.ctaTarget`/treatments, product fields. `get/setFieldValue` walk `['root','content',...path]`; `setFieldValue` `structuredClone`s then writes.
- [ ] **Step 4: run → PASS. Step 5: typecheck + lint. Step 6: commit** `feat(editor): editable-field registry (all generated text) + get/set`.

---

## Task 2: The content-editing agent (Bohdi the writer)

**Files:** Create `lib/editor/content-agent.ts`, `lib/editor/content-agent.test.ts`. Reuse the copywriter loop shape from `lib/onboarding/crew/copywriter.ts` and the transforms from `lib/onboarding/crew/normalize-copy.ts`.

`runContentEdit({ fields, current, instruction, niche })` builds a forced Anthropic tool whose input schema is exactly `fields`, runs the attempt loop (`withTimeout`, `tool_choice` forced, retry on parse failure), normalizes per field kind, returns `{ values }`. No DB.

- [ ] **Step 1: failing test** (mock `@/lib/anthropic` so no network) — returns normalized values for the requested fields only (headline punctuation stripped, `lines` stays an array); throws a typed error after the attempt budget when no valid tool call comes back.
- [ ] **Step 2: run → FAIL.**
- [ ] **Step 3: implement** mirroring `copywriter.ts`: `MODEL='claude-sonnet-4-6'`, `MAX_TOKENS=4000`, `MAX_ATTEMPTS=4`, `TIMEOUT_MS=60_000`; tool `write_fields` with a schema built from `fields`; system prompt gives niche body + current values + the maker's instruction, "rewrite ONLY these fields in the shop's own voice; if it's really about the look, leave them unchanged"; validate returned keys ⊆ `fields`; normalize via `stripHeadlinePunct`/`stripStoryPunct`; throw `ContentEditError` after the budget.
- [ ] **Step 4: run → PASS. Step 5: typecheck + lint. Step 6: commit** `feat(editor): Bohdi content-editing agent (stateless writer)`.

---

## Task 3: Niche voice loader

**Files:** Create `lib/editor/niche-voice.ts`, `lib/editor/niche-voice.test.ts`.

- [ ] **Step 1: failing test** — mock `supabaseAdmin`; `loadNicheVoice('t1')` returns `{ displayName, body }` from the tenant's niche row; returns a safe empty `body` when the niche is missing.
- [ ] **Step 2–3:** implement by extracting the `niches.body_markdown`/`display_name` read used in `lib/onboarding/build-archetype-store.ts` (resolve the tenant's `primary_niche` → the `niches` row). Run → PASS.
- [ ] **Step 4: typecheck + lint. Commit** `feat(editor): niche voice loader for content edits`.

---

## Task 4: `editContent` server action (stage words into the draft)

**Files:** Modify `app/dashboard/website/actions.ts`. Test: `app/dashboard/website/actions.test.ts` (create if absent).

- [ ] **Step 1: failing test** — mock `getCurrentShop`, draft loaders, `stageDraftTree`, `runContentEdit`, `loadNicheVoice`. Assert: success stages the new values at the right paths; live is never written; unauthenticated → `{ ok:false }`; when `runContentEdit` throws, returns a friendly error and does NOT stage.
- [ ] **Step 2: run → FAIL.**
- [ ] **Step 3: implement** `editContent(fieldIds: string[], instruction: string, section?: SectionKey): Promise<ActionResult>` — resolve `fields` from `EDITABLE_FIELDS` (empty/unknown → `{ ok:false }`); `getCurrentShop`; seed `baseTree` (draft ?? `{ root: live }`); `current` via `getFieldValue`; `loadNicheVoice`; `try runContentEdit` (throw → log + `{ ok:false, error:'Couldn't write that just now — try again.' }`, draft untouched); fold `values` via `setFieldValue`; if `section` given, add it to `content.madeYours`; `stageDraftTree`; `revalidatePath('/dashboard/website')`.
- [ ] **Step 4: run → PASS. Step 5: full suite + typecheck + lint. Step 6: commit** `feat(editor): editContent stages Bohdi rewrites into the draft`.

---

## Task 5: Image slots + setter

**Files:** Create `lib/editor/image-slots.ts`, `lib/editor/image-slots.test.ts`.

Two replaceable home-store photos. `REPLACEABLE_IMAGE_SLOTS = [{ id:'hero', path:['moment','media'], kind:'media', section:'hero', storagePath:(sub)=>`hero-images/${sub}/hero-${'{'}stamp{'}'}.jpg` }, { id:'founder', path:['founder','photo'], kind:'photo', section:'founder', storagePath:(sub)=>`about-images/${sub}/about-${'{'}stamp{'}'}.jpg` }]`. (Unique per-upload filename avoids CDN cache staleness; `{stamp}` = a value passed by the action.) `setImageUrl(env, slotId, url)` clones and sets `.url` on the slot — and for the `media` kind also sets `kind:'still'` (the maker uploaded a photo, not a video), mirroring `applyMedia` in `builder.tsx:145`. Product/collage images are out.

- [ ] **Step 1: failing test** — `setImageUrl(env,'hero','https://x/y.jpg')` sets `content.moment.media.url` and `.kind==='still'` without mutating input; `setImageUrl(env,'founder', url)` sets `content.founder.photo.url` (no `kind` on a PhotoSlot); unknown slot id → returns env unchanged; `REPLACEABLE_IMAGE_SLOTS` excludes any product slot.
- [ ] **Step 2–3: implement. Run → PASS.**
- [ ] **Step 4: typecheck + lint. Commit** `feat(editor): replaceable image slots + URL setter`.

---

## Task 6: `uploadStoreImage` action (upload a maker's photo into the draft)

**Files:** Modify `app/dashboard/website/actions.ts`. Test in `actions.test.ts`.

Reuses the Storage pattern from `lib/fal.ts:26` (`supabaseAdmin().storage.from('generated-images').upload(path, buffer, { contentType, upsert:true })` → `getPublicUrl(path).data.publicUrl`). No user-upload route exists today — this is new. Server-side validates mime + size (nothing reusable exists; only the bucket's 10 MB / jpeg-webp-png backstop).

- [ ] **Step 1: failing test** — mock `getCurrentShop`, the storage client (`upload` + `getPublicUrl`), draft loaders, `stageDraftTree`. A valid `image/jpeg` File for slot `'hero'` uploads and stages `content.moment.media.url` = the public URL with `kind:'still'`; an oversized or wrong-mime File returns `{ ok:false, error }` and never uploads; unknown slot id → `{ ok:false }`; unauthenticated → `{ ok:false }`.
- [ ] **Step 2: run → FAIL.**
- [ ] **Step 3: implement** `uploadStoreImage(slotId: string, form: FormData): Promise<{ ok:true; url:string } | { ok:false; error:string }>` — resolve the slot (unknown → `{ ok:false }`); `getCurrentShop`; read `const file = form.get('file')`; validate `file instanceof File`, `ALLOWED_MIME = ['image/jpeg','image/png','image/webp']` includes `file.type`, `file.size <= 10*1024*1024` (else friendly error); `const buffer = Buffer.from(await file.arrayBuffer())`; `const path = slot.storagePath(shop.subdomain).replace('{stamp}', String(Date.now()))`; `upload(path, buffer, { contentType: file.type, upsert:true })` (on error → `{ ok:false, error:'Upload failed — try again.' }`); `const url = getPublicUrl(path).data.publicUrl`; seed `baseTree`; `setImageUrl(baseTree, slotId, url)`; add `slot.section` to `content.madeYours`; `stageDraftTree`; `revalidatePath(...)`; return `{ ok:true, url }`.
- [ ] **Step 4: run → PASS. Step 5: full suite + typecheck + lint. Step 6: commit** `feat(editor): uploadStoreImage stages a maker's own photo into the draft`.

---

## Task 7: Section on/off

**Files:** Modify `lib/archetypes/main-street/schemas.ts`, `MainStreet.tsx`, `builder.tsx`; create `lib/editor/section-visibility.ts` (+ test); add `toggleSection` to `actions.ts`.

Optional sections: `reviews`, `collections`, `marquee`, `findUs`. Structural (`hero`, `goods`, `founder`, `close`, `contact`) can never be hidden. Flag at `content.hiddenSections`; the renderer skips a hidden optional section even with content; toggling back on restores the kept content.

- [ ] **Step 1 (schema):** failing test — `MainStreetContentSchema.parse` accepts `hiddenSections:['reviews']` and `madeYours:['hero']`; rejects an unknown section. **Step 2:** add `hiddenSections: z.array(SectionKeySchema).optional()` and `madeYours: z.array(SectionKeySchema).optional()` (define `SectionKeySchema` from the `SectionKey` union). Run → PASS.
- [ ] **Step 3 (helpers):** failing test for `section-visibility.ts` — `OPTIONAL_SECTIONS` is exactly the four; `setSectionHidden(env,'reviews',true)` adds without mutating; `false` removes; `setSectionHidden(env,'hero',true)` is a no-op; `getHiddenSections(env)` returns the list. **Step 4:** implement. Run → PASS.
- [ ] **Step 5 (renderer):** failing test in `MainStreet.test.tsx` — reviews populated + family-on but `hiddenSections={['reviews']}` → beat absent; `[]` → present; a structural section still renders even if passed in `hiddenSections`. **Step 6:** `MainStreetProps` gains `hiddenSections?: readonly SectionKey[]`; body filter becomes `stack.filter((e)=> e.section!=='hero' && e.on && !(isOptionalSection(e.section) && hidden.has(e.section)))`; `builder.tsx` passes `hiddenSections={c.hiddenSections}`. Run → PASS.
- [ ] **Step 7 (action):** failing test — `toggleSection('reviews', false)` stages `hiddenSections` incl `'reviews'`; `toggleSection('hero', false)` → `{ ok:false }`. **Step 8:** implement `toggleSection(section: string, visible: boolean)` (reject non-optional; seed; `setSectionHidden`; add section to `madeYours`; stage; revalidate). Run → PASS.
- [ ] **Step 9: full suite + typecheck + lint. Commit** `feat(editor): section on/off (hidden flag, renderer skip, toggleSection)`.

---

## Task 8: Walkthrough state (pure logic)

**Files:** Create `lib/editor/walkthrough.ts`, `lib/editor/walkthrough.test.ts`.

Each step names a section, the text field ids it rewrites, an optional image slot id, and whether it's an optional-section step. "Placeholder" = a section not in `content.madeYours` and not hidden (we mark `madeYours` on any edit/upload/toggle — pragmatic completeness without per-field diffing).

- [ ] **Step 1: failing test** — `WALKTHROUGH_STEPS` is in Decision-3 order; each step's `fieldIds ⊆ EDITABLE_FIELDS` and any `imageSlot ∈ REPLACEABLE_IMAGE_SLOTS`; the hero step carries `imageSlot:'hero'`, the story step `imageSlot:'founder'`; `placeholderSections(env)` lists sections not made-yours and not hidden; `walkthroughProgress(env)` returns `{ done, total }`; all-made/off → `done===total`.
- [ ] **Step 2: implement** `WALKTHROUGH_STEPS: readonly { id; title; section; fieldIds: string[]; imageSlot?: string; optional: boolean }[]`, `placeholderSections`, `walkthroughProgress`.
- [ ] **Step 3: run → PASS. Typecheck + lint. Commit** `feat(editor): walkthrough steps, placeholder detection, progress`.

---

## Task 9: The image picker component

**Files:** Create `app/dashboard/website/_components/ImagePicker.tsx` (+ `.test.tsx`).

> **Invoke `frontend-design:frontend-design` before writing.** A warm "add your own photo" control, not a raw file input.

Client component: props `{ slotId: string; onUploaded: (url: string) => void }`. Renders a file input (`accept="image/png,image/jpeg,image/webp"`), validates mime + size client-side (friendly message on fail), builds `FormData` with the `File`, calls `uploadStoreImage(slotId, form)`, and on `{ ok:true, url }` calls `onUploaded(url)`; shows the upload error on `{ ok:false }`.

- [ ] **Step 1: failing test** (jsdom) — selecting a valid file calls a stubbed `uploadStoreImage` with the slot id and a FormData carrying the file, then calls `onUploaded` with the returned url; an oversized/wrong-type file shows an error and does NOT call the action.
- [ ] **Step 2: build to pass (frontend-design). Step 3: run → PASS. Typecheck + lint.**
- [ ] **Step 4: commit** `feat(editor): image picker (maker uploads a photo)`.

---

## Task 10: The walkthrough panel

**Files:** Create `app/dashboard/website/_components/Walkthrough.tsx` (+ `.test.tsx`).

> **Invoke `frontend-design:frontend-design` before writing. Alex's eyes gate this task.** This is the maker's first real conversation with Bohdi — it must feel like a person walking them through their store.

Per step (design Part 3): Bohdi *leads* with a plain-language ask; the maker types their info (or "you write it"); submit calls `editContent(step.fieldIds, input, step.section)`; steps with `imageSlot` also render `<ImagePicker slotId={step.imageSlot} onUploaded={...}/>`; the preview iframe refreshes after any change; the maker can **keep** (next), **try again** (re-run same input), or **tweak** (direct edit); optional-section steps also offer **switch it off** → `toggleSection(section,false)` and advance. Progress cue ("N of M made yours"). Undo/Reset/Publish stay (reuse the Editor's controls).

- [ ] **Step 1: failing test** (jsdom, actions stubbed) — first step shows its prompt; type+submit calls `editContent` with the step's field ids + section; the hero step renders the image picker; "switch it off" shows only on optional steps and calls `toggleSection`; "keep" advances; progress reflects the index.
- [ ] **Step 2: build (frontend-design), preview refresh via the Editor's iframe key/src. Step 3: run → PASS. Typecheck + lint.**
- [ ] **Step 4: Alex's eyes** — walkthrough running on a real store. **Step 5: commit** `feat(editor): Make It Yours walkthrough panel`.

---

## Task 11: Host the walkthrough in the editor

**Files:** Modify `app/dashboard/website/page.tsx`, `app/dashboard/website/_components/Editor.tsx`.

- [ ] **Step 1: failing test** in `Editor.test.tsx` — `firstRun` true → walkthrough open on mount; false → closed with a "walk me through my store again" trigger that opens it.
- [ ] **Step 2:** `page.tsx` computes `firstRun = placeholderSections(envelope).length === WALKTHROUGH_STEPS.length`, passes `firstRun` + `niche` + content into `Editor`; `Editor.tsx` hosts `<Walkthrough/>` (auto-open on `firstRun`, plus the re-trigger). Run → PASS.
- [ ] **Step 3: typecheck + lint. Step 4: Alex's eyes** (auto-open first-run + re-trigger). **Step 5: commit** `feat(editor): auto-launch walkthrough on first run + re-trigger`.

---

## Task 12: Full verification (Alex's eyes gate)

- [ ] Whole suite green; `npm run typecheck` + `npm run lint` clean.
- [ ] **Manual, on a fresh-onboarded store (all placeholder):**
  1. Editor opens → walkthrough auto-launches.
  2. Welcome step: reword the hero lines (watch them land); upload your own hero photo (the AI image is replaced in the preview).
  3. Story step: reword the About; upload your own founder photo.
  4. Reviews / find-us: switch off → gone from preview; switch back on → seeded content returns.
  5. Remaining steps: reword sign-off, contact, headings.
  6. Publish → the live store shows your words, your photos, your on/off choices; the draft is gone.
  7. Reset mid-walk → back to live, nothing half-applied.
  8. Re-trigger on the now-real store → keep-or-change tour, every step skippable.
- [ ] Bohdi never touched structure/look/shop-name: the family, skin, nav, and shop name are unchanged throughout.

---

## Known caveats (not blockers)

- **"Placeholder" is a `madeYours` marker, not per-field diffing.** Fine — the goal is coverage.
- **"Tweak" is direct-instruction, not click-to-edit.** Click-on-a-headline and highlight-and-rewrite are later plans.
- **Photo replacement, not editing.** Upload your own; the touch-up editor (D65) is later.
- **Uploaded photos use a unique filename** (timestamp) so a replacement never shows a stale CDN copy; old files are left in the bucket (fine for beta).
- **Free-form chat is the same agent, later face.** `runContentEdit` is built to be driven by the walkthrough now or free-form chat later.
- **Products are the next build** (listings) and slot into the walkthrough frame; product photos ride with them.

---

## Self-review (against `Editor-Make-It-Yours-Design.md` + Alex's 2026-07-29 scope widening)

- Words — rewrite anything generated: Tasks 1–4 (comprehensive registry, stateless agent, apply-then-see, voice grounding, content-only). ✔
- Photos — replace hero + founder with the maker's own upload: Tasks 5–6, 9 (Storage reuse, URL into the draft slot, client picker). ✔
- Section on/off: Task 7 (flag in the draft, renderer skips, content kept, structural can't hide). ✔
- Walkthrough — stepped, Bohdi-leads, words+photos+on/off per step, completeness, auto-launch/re-trigger: Tasks 8, 10, 11. ✔
- Products explicitly the next build; touch-up editor later. ✔
- Honors design notes: one source of truth (every control writes the one draft envelope), curated levers (registry tool, upload to fixed slots — never freehand structure), never silently rewrites authored (Bohdi writes only when asked). ✔
