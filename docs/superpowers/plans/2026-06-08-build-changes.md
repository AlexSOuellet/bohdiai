# Build / Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The new work decided in the Session 34 design conversation — swap the Moment video to Seedance 2.0, delete the dead biased legacy path, stop the cinematographer baking text into images, log the crew's choices, and (design-gated) redefine the moods and make the goods treatment follow the mood.

**Architecture:** Parts A–D are ready-to-build, self-contained changes to the generation seam and the crew. Part E (moods + treatments) is a larger redesign that is **design-gated** — it cannot be built as no-placeholder tasks until the founder locks the mood definitions, the palette/skin re-tagging, and the mood→treatment mapping. Part E captures the implementation shape and the exact decisions it waits on.

**Tech Stack:** Next.js · TypeScript (strict) · Vitest · fal (`@fal-ai/client`) · Anthropic SDK · Supabase (`design_choices` table).

---

## Part A — Swap the Moment video to Seedance 2.0

The Moment video currently calls Kling 3.0 Pro. Route it to Seedance 2.0 on fal: 720p, 16:9, audio off. Output came out flat on Kling versus the cinematic Seedance reference; this is a one-constant swap plus input-shape changes, behind the existing provider seam.

**Files:**
- Modify: `lib/moments/media.ts` (`generateMomentVideo`, the model constant, the duration clamp)
- Test: `lib/moments/media.test.ts`

- [ ] **Step 1: Update the failing test to expect the Seedance call shape**

In `lib/moments/media.test.ts`, change the video test so it asserts the new model id and input:

```ts
it('calls Seedance 2.0 with 720p, 16:9, audio off', async () => {
  const sub = vi.fn().mockResolvedValue({ data: { video: { url: 'https://x/clip.mp4' } } });
  // ...wire the mocked fal client so falClient().subscribe === sub...
  await generateMomentVideo('a single flame, slow ambient drift', { subdomain: 's', durationSec: 6 });
  const [model, opts] = sub.mock.calls[0];
  expect(model).toBe('bytedance/seedance-2.0/text-to-video');
  expect(opts.input.resolution).toBe('720p');
  expect(opts.input.aspect_ratio).toBe('16:9');
  expect(opts.input.generate_audio).toBe(false);
  expect(opts.input.duration).toBe('6');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/moments/media.test.ts`
Expected: FAIL — still calls the Kling model with `{ duration, aspect_ratio }` only.

- [ ] **Step 3: Swap the model constant and input shape**

In `lib/moments/media.ts`:

```ts
// fal model id — Seedance 2.0 text-to-video. Input: { prompt, duration "4".."15"|"auto",
// resolution "480p"|"720p", aspect_ratio, generate_audio }. Swapping this string (or
// routing to another model) is the whole "change one file" promise of the seam.
export const SEEDANCE_VIDEO_MODEL = 'bytedance/seedance-2.0/text-to-video';
```

Change the duration clamp minimum from 3 to 4 (Seedance accepts "4".."15"):

```ts
function seedanceDuration(durationSec: number | undefined): string {
  const n = Math.round(durationSec ?? 6);
  return String(Math.max(4, Math.min(15, n)));
}
```

In `generateMomentVideo`, replace the `subscribe` input block:

```ts
const result = await withTimeout(
  falClient().subscribe(SEEDANCE_VIDEO_MODEL as string, {
    input: {
      prompt,
      duration: seedanceDuration(opts.durationSec),
      resolution: '720p',
      aspect_ratio: aspect,
      generate_audio: false,
    },
  }),
  MOMENT_VIDEO_TIMEOUT_MS,
  `moment video (${opts.subdomain})`,
);
```

Remove the old `KLING_VIDEO_MODEL`/`klingDuration` if nothing else references them (grep first).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/moments/media.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/moments/media.ts lib/moments/media.test.ts
git commit -m "feat(moment): route the Moment video to Seedance 2.0 (720p, 16:9, audio off)"
```

---

## Part B — Delete the dead legacy layout-engine path

`LAYOUT_ENGINE_NICHES` routes the candles niche to a legacy path (`runBohdi` + `system-prompt.ts` + `layout-tools.ts`) that is no longer reached — every build goes through the crew. That dead path also carries the niche-example bias we strip on sight (candle flame / steam off bread / uneven wax in its video guidance). Delete it.

**Files:**
- Delete: `lib/bohdi/layout-engine-niches.ts` (+ its test), `lib/bohdi/layout-tools.ts` (+ test) — only if no live caller remains
- Modify: `lib/bohdi/system-prompt.ts` (drop `INTRO_MOMENT_PROMPT`/the layout branch), `lib/bohdi/tools.ts` (drop the `isLayoutEngineNiche`/`finalizeLayoutEngine` branch)
- Test: existing `lib/bohdi/*` tests updated to match

- [ ] **Step 1: Confirm nothing live routes through it**

Run: `rg "isLayoutEngineNiche|finalizeLayoutEngine|LAYOUT_ENGINE_NICHES|runBohdi|INTRO_MOMENT_PROMPT" --type ts -l`
Expected: hits only in `lib/bohdi/*` and their tests, plus `run-storefront.ts` history. Confirm `run-storefront.ts` routes everything to `buildArchetypeStore` and does NOT call `runBohdi`. If any app route calls `runBohdi`, STOP — it is not dead; re-scope this task.

- [ ] **Step 2: Remove the layout branch from the dispatch**

In `lib/bohdi/tools.ts`, remove the `isLayoutEngineNiche(...)` branch in `finalize` (and the `finalizeLayoutEngine` import) and the layout-tools concatenation. In `system-prompt.ts`, make `systemPromptFor` always return the legacy/non-layout prompt (or delete the function if unused after the crew took over) and remove `INTRO_MOMENT_PROMPT`.

- [ ] **Step 3: Delete the now-orphaned files**

Run: `git rm lib/bohdi/layout-engine-niches.ts lib/bohdi/layout-engine-niches.test.ts lib/bohdi/layout-tools.ts lib/bohdi/layout-tools.test.ts`
(Only the files that Step 1 proved are unreferenced. Keep any still imported by a live module.)

- [ ] **Step 4: Run the full type + test + lint sweep**

Run: `npx tsc --noEmit && npx vitest run lib/bohdi && npx eslint lib/bohdi`
Expected: PASS. Fix any test that imported a deleted symbol by deleting that test.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(bohdi): delete dead legacy layout-engine path and its niche-example bias"
```

---

## Part C — Stop the cinematographer baking text into images

Wally's stored shot asked for a "slab-serif title treatment hand-set in the lower-right corner" — text in the image, which models can't render legibly and which our engine owns via the wordmark. Add the no-text-in-image rule (a physics rule, not taste) to the cinematographer prompt and validate the scene fields don't request lettering.

**Files:**
- Modify: `lib/onboarding/crew/cinematographer.ts` (prompt + a light post-validation)
- Test: `lib/onboarding/crew/cinematographer.test.ts`

- [ ] **Step 1: Add the failing test**

```ts
it('rejects a scene whose style asks for text/title/lettering in frame', async () => {
  // mock the model to return a scene with style: "... slab-serif title in the corner ..."
  // expect shootMoment to retry/reject rather than return that scene unchanged
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/onboarding/crew/cinematographer.test.ts`
Expected: FAIL — no text guard exists.

- [ ] **Step 3: Add the physics rule to the prompt and a validator**

In `buildCinematographerPrompt`, add one line to the shot instructions:

```
- No text, lettering, logos, titles, or typography anywhere in the frame — the engine sets the type; the shot is image only. (A physics rule: image models can't render legible text.)
```

After `MomentSceneSchema.safeParse` succeeds, add a guard that scans the seven scene phrases for text-requesting words (`title`, `text`, `lettering`, `typography`, `wordmark`, `logo`, `caption`, `headline`) and, if found, treats it like a validation failure (push a tool_result asking the model to remove the lettering and retry within the existing attempt loop).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/onboarding/crew/cinematographer.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/crew/cinematographer.ts lib/onboarding/crew/cinematographer.test.ts
git commit -m "fix(crew): forbid text/lettering in the Moment shot (no-text-in-image physics rule)"
```

---

## Part D — Log the crew's choices to `design_choices`

We could not explain why one build chose video and another a still, or why both chose the same treatment, because nothing is logged. Write the cinematographer's video/still pick and the chosen goods/founder treatments to `design_choices` (the table built in D25) so patterns become visible instead of guessed.

**Files:**
- Modify: `lib/onboarding/crew/pipeline.ts` (log after the relevant stages)
- Reuse: the existing `design_choices` logging helper (find it: `rg "design_choices" --type ts -l`)
- Test: `lib/onboarding/crew/pipeline.test.ts`

- [ ] **Step 1: Locate the logging helper and its signature**

Run: `rg "design_choices|logDecision|log_decision" --type ts -l`
Note the helper's name and arguments (it takes `tenant_id`, `decision_type`, `candidates`, `picked`, `reasoning`, `niche_slug`, `mood_key` per D25).

- [ ] **Step 2: Write the failing test**

Assert that running `directAndProduce` with a mocked crew calls the logging helper with `decision_type: 'moment-kind'` (video|image) and `decision_type: 'goods-treatment'`.

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run lib/onboarding/crew/pipeline.test.ts`
Expected: FAIL — no logging call exists.

- [ ] **Step 4: Add the logging calls in the pipeline**

After the cinematographer returns, log `{ decision_type: 'moment-kind', picked: { kind }, niche_slug, mood_key }`. After the copywriter returns, log `{ decision_type: 'goods-treatment', picked: { treatment } }` and the founder treatment. Keep it fire-and-forget so a logging failure never fails a build.

- [ ] **Step 5: Run the test + typecheck**

Run: `npx vitest run lib/onboarding/crew/pipeline.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/onboarding/crew/pipeline.ts lib/onboarding/crew/pipeline.test.ts
git commit -m "feat(crew): log moment-kind and treatment choices to design_choices"
```

---

## Part E — Redefine the moods, and make the goods treatment follow the mood

**DESIGN-GATED — not buildable as no-placeholder tasks yet.** This is the big redesign from the Session 34 conversation. It cannot become bite-sized tasks until the founder locks the decisions below, because filling them in would mean inventing the founder's taste — the exact thing the conversation was about removing. Capture the decisions first (as a design spec + decisions-log entries), then a follow-up plan turns them into tasks.

### What was agreed (the principles)

- A mood is a **feeling**, not a color or subject classifier. Color lives as a layer *underneath* the mood, not as its own mood.
- Three tests for what qualifies as a mood: strip the color and a feeling remains; our levers can build it; a maker in any niche could plausibly pick it (a mood crosses niches; a niche-flavor doesn't).
- New lineup (names locked): **Dark, Rustic, Cozy, Modern, Elegant, Playful, Industrial** — seven real feelings — plus **Templated**, a deliberate baseline foil.
- The goods **treatment follows the mood** (a layout is subject-agnostic, so the goods model does not pick the layout — the mood does). The goods model only routes which *archetype* a maker belongs in, separately and post-build — not a Main Street concern.
- **Templated** is a fixed set design: one locked layout, no treatment options, **no Moment**. It exists to show the maker what more they can have; Bohdi nudges them off it post-build.

### Decisions that MUST be locked before this is buildable

1. **The feeling-definition of each of the seven moods** — one line each, in maker-plain language (e.g. Cozy = safety, warmth, home). These replace the current `lib/moods.ts` definitions.
2. **The color layer** — how a maker picks color *within* a mood (a new onboarding step? a default palette per mood the maker can shift?). Currently mood and color are fused.
3. **The skin re-tagging** — `MAIN_STREET_SKIN_TAGS` tags skins with the OLD mood words (`dark`, `candlelit`, `cozy`, `golden`, `harvest`, `warm`, …). Every skin must be re-tagged to the seven new moods, and gaps filled (does every mood have skins? Industrial, Playful, Elegant especially).
4. **The mood→treatment mapping** — which mood leans to which of the four treatments. There are four treatments and seven moods, so either some moods share a treatment, or we build more treatments. This is the mapping that makes the pick stop converging.
5. **The Templated set design** — the one fixed layout (the deliberate slop), and confirmation it ships with no Moment and no treatment choice.

### Implementation shape (once decisions are locked)

- `lib/moods.ts` — replace the seven definitions; add the color-layer model.
- `lib/archetypes/main-street/skins.ts` — re-tag `MAIN_STREET_SKIN_TAGS` to the new moods; fill skin gaps.
- `lib/archetypes/main-street/goods.ts` — add a `MOOD_TREATMENT` map (mood → treatment) and a `treatmentForMood(mood)` selector; strip the catalog-size language and the feel-words ("editorial", "curated", "cinematic") from `GOODS_TREATMENT_MENU` (those are imposed taste).
- `lib/onboarding/crew/copywriter.ts` — STOP the copywriter free-picking `goods.treatment`/`founder.treatment`; instead the pipeline passes the mood-derived treatment in, and the copywriter only writes the words for it.
- `lib/onboarding/crew/pipeline.ts` / `director.ts` — the mood is already known at the top; derive the treatment from it deterministically and hand it to the copywriter.
- Templated — a new fixed render path that bypasses treatment selection and the Moment layer entirely.
- Onboarding mood picker UI — reflect the new eight (seven + Templated-as-foil), with Templated presented as the baseline, not a peer tile.

- [ ] **Step 0 (this plan's only actionable step): write the mood/treatment design spec**

Capture decisions 1–5 above in `docs/superpowers/specs/2026-06-08-moods-and-treatments-design.md` and the corresponding entries in `project-docs/Phase-1-Decisions-Log.md` (founder readback per the capture protocol). Then write a follow-up implementation plan from that spec. Do NOT start the code in this part until that spec exists.

---

## Self-Review Notes

- Parts A–D are fully specified, TDD, ready to build now.
- Part E is correctly gated: building it now would require inventing mood definitions, palettes, a skin re-tagging, and a treatment mapping that are the founder's calls. The plan names exactly what must be decided and the code shape that follows, with no fabricated content.
- Type consistency: Part A renames `KLING_VIDEO_MODEL`→`SEEDANCE_VIDEO_MODEL` and `klingDuration`→`seedanceDuration`; grep for old names before deleting. Part E's `treatmentForMood` and `MOOD_TREATMENT` are introduced together in `goods.ts`.
