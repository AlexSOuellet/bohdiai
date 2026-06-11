# Spotlight Moment treatment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `spotlight` as a second Moment treatment alongside `video`. The director picks which one the trajectory calls for, the copywriter and cinematographer execute to that kind, and the renderer paints a held cinematic reveal (object rises out of pure black, slow push-in, words fade in over the top) when the kind is spotlight.

**Architecture:** The kind decision rides on the trajectory (the one creative North Star the crew already shares), so the copywriter writes a single tagline for spotlight or a multi-line story for video, and the cinematographer designs the appropriate scene. The MediaSlot schema widens to accept `'video' | 'image' | 'spotlight'` (`image` stays as a legacy kind so old stores keep rendering). The renderer branches on `kind` inside `MomentHero` with a new `SpotlightStage` component.

**Tech Stack:** Next.js (App Router), TypeScript (strictest), Zod, Vitest, React Testing Library, Tailwind/inline styles.

**Design source:** `docs/superpowers/specs/2026-06-11-spotlight-moment-treatment-design.md`

---

## File structure

- **Modify** `lib/onboarding/crew/trajectory.ts` — add `momentKind: 'video' | 'spotlight'` to the trajectory schema.
- **Modify** `lib/onboarding/crew/director.ts` — director picks `momentKind` from the trajectory criterion; tool schema + prompt updated.
- **Modify** `lib/onboarding/crew/director.test.ts` — assert the director emits a valid `momentKind`.
- **Modify** `lib/onboarding/crew/copywriter-schema.ts` — `moment.story` minimum drops to 1 so a single-line tagline is valid.
- **Modify** `lib/onboarding/crew/copywriter.ts` — prompt branches on `trajectory.momentKind` (multi-line story for video, one tagline for spotlight).
- **Modify** `lib/onboarding/crew/copywriter.test.ts` — cover the spotlight-tagline path.
- **Modify** `lib/onboarding/crew/cinematographer.ts` — prompt branches on `trajectory.momentKind`; schema enum narrows to `'video' | 'spotlight'`; the criterion language is rewritten away from "prefer video, still is last resort" toward "would I have to invent the motion".
- **Modify** `lib/onboarding/crew/cinematographer.test.ts` — cover both kinds, drop image expectations.
- **Modify** `lib/onboarding/crew/pipeline.ts` — pass `trajectory` through to copywriter (already does) and cinematographer; thread `momentKind` end-to-end.
- **Modify** `lib/archetypes/main-street/schemas.ts` — `MediaSlot.kind` widens to `'video' | 'image' | 'spotlight'`; `StoryLine.min(1)` stays as it is; the moment's `story` array min drops to 1 to match the copywriter draft.
- **Modify** `lib/archetypes/main-street/builder.tsx` — `mediaJobs` maps a `spotlight` MediaSlot to an `image` generation job (the rise/push happen in CSS at render time, the generator produces a single still).
- **Create** `lib/archetypes/main-street/SpotlightStage.tsx` — pure stage: pure black bg, object rises (opacity), slow push-in (scale), then eyebrow / wordmark / line / CTA fade in. Reduced-motion respected.
- **Create** `lib/archetypes/main-street/SpotlightStage.test.tsx` — unit tests for content + reduced-motion behavior.
- **Modify** `lib/archetypes/main-street/MomentHero.tsx` — branch on `moment.media.kind`; video/image keep the existing `MomentStage`, spotlight uses the new `SpotlightStage`. Intro overlay continues to play first and melts to the rested stage.
- **Modify** `lib/archetypes/main-street/MomentHero.test.tsx` — cover the spotlight branch (rested + intro).

No data migration. Existing tenants whose stored envelopes have `kind: 'image'` keep rendering through the existing `MomentStage` path.

---

## Task 1: Trajectory carries the moment kind

**Files:**
- Modify: `lib/onboarding/crew/trajectory.ts`

- [ ] **Step 1: Write the failing test**

Add to a new file `lib/onboarding/crew/trajectory.test.ts` (or append if it exists — check first):

```ts
import { describe, it, expect } from 'vitest';
import { TrajectorySchema } from './trajectory';

describe('TrajectorySchema', () => {
  const base = {
    feeling: 'f', customerWhy: 'w', visualWorld: 'v', momentConcept: 'm', register: 'restrained' as const,
  };
  it('requires momentKind to be video or spotlight', () => {
    expect(TrajectorySchema.safeParse({ ...base, momentKind: 'video' }).success).toBe(true);
    expect(TrajectorySchema.safeParse({ ...base, momentKind: 'spotlight' }).success).toBe(true);
    expect(TrajectorySchema.safeParse({ ...base, momentKind: 'image' }).success).toBe(false);
    expect(TrajectorySchema.safeParse(base).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run — verify it fails**

Run: `npx vitest run lib/onboarding/crew/trajectory.test.ts`
Expected: FAIL — `momentKind` not in schema.

- [ ] **Step 3: Add the field**

In `lib/onboarding/crew/trajectory.ts`, add to `TrajectorySchema` after `register`:

```ts
  register: z.enum(['loud', 'restrained']),
  /** Which kind of Moment the director called for. Video when the subject has real
   *  ambient motion (steam, flame, water, hands at work). Spotlight when the
   *  product is at rest and inventing motion would feel fake — the rise out of
   *  black is the cinematic arc. (See the design doc.) */
  momentKind: z.enum(['video', 'spotlight']),
});
```

- [ ] **Step 4: Run — verify it passes**

Run: `npx vitest run lib/onboarding/crew/trajectory.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/crew/trajectory.ts lib/onboarding/crew/trajectory.test.ts
git commit -m "feat(crew): trajectory carries momentKind (video | spotlight)"
```

---

## Task 2: Director picks the moment kind

**Files:**
- Modify: `lib/onboarding/crew/director.ts`
- Modify: `lib/onboarding/crew/director.test.ts`

- [ ] **Step 1: Write the failing test**

Open `lib/onboarding/crew/director.test.ts` and add a test that, with a mocked Anthropic response carrying `momentKind: 'spotlight'`, `direct()` returns a trajectory whose `momentKind` is `'spotlight'`. Mirror the existing mocking style in this file (don't invent a new pattern — read it first). The assertion is the new field; the rest of the trajectory mock can be minimal valid values.

- [ ] **Step 2: Run — verify it fails**

Run: `npx vitest run lib/onboarding/crew/director.test.ts`
Expected: FAIL — director's tool schema doesn't accept `momentKind`, or the trajectory schema rejects it (already added in Task 1 — but the director still needs to forward the field through its tool schema; without that, the model returning `momentKind` would be ignored as an extra property and TrajectorySchema would then reject the result for missing field).

- [ ] **Step 3: Add `momentKind` to the director's tool schema**

In `lib/onboarding/crew/director.ts`, in `SET_TRAJECTORY_TOOL.input_schema.properties`, add after `register`:

```ts
        register: { type: 'string', enum: ['loud', 'restrained'], description: 'Loud or restrained type.' },
        momentKind: {
          type: 'string',
          enum: ['video', 'spotlight'],
          description: "Which kind of Moment the front door plays. 'video' when the scene contains real ambient motion that belongs to the subject (steam off bread, a flame, water, hands at work). 'spotlight' when the product is at rest and inventing motion would feel fake — the rise out of black is the cinematic arc.",
        },
```

And in `required`: add `'momentKind'` to the array.

- [ ] **Step 4: Add the criterion to the director's prompt**

In `buildDirectorPrompt`, in the field list after the `register` line, add:

```
- momentKind: 'video' or 'spotlight'. The Moment is BohdiAI's signature, so it MUST be cinematic — but cinematic is not always video. Pick 'video' when the maker's craft contains real ambient motion you can capture in 5 seconds (steam off bread, a candle flame, water moving, hands at work, dust in light, a kiln's glow). Pick 'spotlight' when the product is at rest and you would have to INVENT motion to fill the time (a sticker, a print, a finished piece of jewelry). The criterion is the test: am I capturing motion that's really there, or am I making it up? A held cinematic still always beats invented motion — and spotlight gives that still a cinematic frame (the object rises from black, the camera slowly pushes in, the words fade in over).
```

- [ ] **Step 5: Run — verify it passes**

Run: `npx vitest run lib/onboarding/crew/director.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/onboarding/crew/director.ts lib/onboarding/crew/director.test.ts
git commit -m "feat(crew): director picks momentKind from the inventing-motion criterion"
```

---

## Task 3: Copywriter's story minimum drops to 1; prompt branches on kind

**Files:**
- Modify: `lib/onboarding/crew/copywriter-schema.ts`
- Modify: `lib/archetypes/main-street/schemas.ts`
- Modify: `lib/onboarding/crew/copywriter.ts`
- Modify: `lib/onboarding/crew/copywriter.test.ts`

- [ ] **Step 1: Write the failing schema test**

In `lib/onboarding/crew/copywriter.test.ts` (or copywriter-schema.test.ts if separate — find it first), add:

```ts
it('accepts a single-line moment.story (spotlight tagline)', () => {
  const draft = makeValidDraft(); // existing helper — use what the file already has
  draft.moment.story = ['One brave line that lands the brand'];
  expect(CopywriterDraftSchema.safeParse(draft).success).toBe(true);
});
```

If the file doesn't expose a `makeValidDraft` helper, construct the minimal valid draft inline by mirroring the existing test fixtures in the file (do not invent fields not in the schema).

- [ ] **Step 2: Run — verify it fails**

Run the targeted test. Expected: FAIL — current min is 2.

- [ ] **Step 3: Drop the schema minimum to 1**

In `lib/onboarding/crew/copywriter-schema.ts`, change:

```ts
    story: z.array(StoryLine).min(2).max(4),
```

to:

```ts
    story: z.array(StoryLine).min(1).max(4),
```

Then in `lib/archetypes/main-street/schemas.ts`, find the corresponding `moment.story` field (it lives inside the moment object schema — grep the file for `story: z.array(StoryLine)`) and drop its `.min(2)` to `.min(1)` to match — the content schema must accept what the crew now produces.

- [ ] **Step 4: Run — verify schema test passes**

Run the schema test. Expected: PASS.

- [ ] **Step 5: Write the failing prompt-branch test**

Open `lib/onboarding/crew/copywriter.test.ts` and find the test that exercises `buildCopywriterPrompt` (it should exist — that file already tests prompt building). Add or extend tests that:
- with `trajectory.momentKind === 'video'`, the prompt mentions multi-line story (the existing `2-4 lines` wording is preserved or replaced with similar multi-line direction);
- with `trajectory.momentKind === 'spotlight'`, the prompt explicitly directs ONE line ("write a single tagline-strength line in moment.story") and indicates the story array has length 1.

- [ ] **Step 6: Run — verify it fails**

Run the test. Expected: FAIL — prompt currently has fixed multi-line wording.

- [ ] **Step 7: Branch the prompt**

In `lib/onboarding/crew/copywriter.ts`, in `buildCopywriterPrompt`, replace the `moment.story` line:

```
- moment.story (2-4 lines, each 4-48): the hero lines, shown one at a time, each cross-fading into the next, landing on the brand. HARD: a line carries NO punctuation — no periods, commas, dashes, colons, or quotes (apostrophes and intra-word hyphens are fine). The marks would smear as the lines cross-fade.
```

with a conditional based on `trajectory.momentKind`:

```ts
  const storyDirective = trajectory.momentKind === 'spotlight'
    ? '- moment.story (EXACTLY 1 line, 4-48): the spotlight Moment lands one tagline-strength line over the wordmark after the object has risen from black. Write the single line as the only entry in moment.story. HARD: the line carries NO punctuation — no periods, commas, dashes, colons, or quotes (apostrophes and intra-word hyphens are fine).'
    : '- moment.story (2-4 lines, each 4-48): the hero lines, shown one at a time, each cross-fading into the next, landing on the brand. HARD: a line carries NO punctuation — no periods, commas, dashes, colons, or quotes (apostrophes and intra-word hyphens are fine). The marks would smear as the lines cross-fade.';
```

and use `${storyDirective}` in the prompt template at the existing line's position.

- [ ] **Step 8: Run — verify the prompt-branch test passes**

Run the test. Expected: PASS.

- [ ] **Step 9: Full vitest + tsc**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: green; no type errors.

- [ ] **Step 10: Commit**

```bash
git add lib/onboarding/crew/copywriter-schema.ts lib/archetypes/main-street/schemas.ts lib/onboarding/crew/copywriter.ts lib/onboarding/crew/copywriter.test.ts
git commit -m "feat(crew): copywriter branches on momentKind — story for video, one tagline for spotlight"
```

---

## Task 4: Cinematographer reads kind from trajectory, drops 'image' from new output

**Files:**
- Modify: `lib/onboarding/crew/cinematographer.ts`
- Modify: `lib/onboarding/crew/cinematographer.test.ts`

- [ ] **Step 1: Write the failing test**

Open `lib/onboarding/crew/cinematographer.test.ts`. Add tests that:
- when the trajectory has `momentKind: 'spotlight'` (mock the Anthropic response with `kind: 'spotlight'` and valid prompt groups), `shootMoment(trajectory, story)` returns a scene with `kind: 'spotlight'`;
- when the trajectory has `momentKind: 'video'`, returns a scene with `kind: 'video'`;
- a returned `kind: 'image'` fails validation (the cinematographer no longer produces image kinds).

If `shootMoment`'s signature doesn't take the trajectory's full object today (it might take just trajectory + story), check the current signature — Task 5 might be where the signature change happens. For this task, assume the signature is what it is and adjust the trajectory parameter to carry `momentKind` (Task 1 added the field already, so a complete trajectory object is the right shape).

- [ ] **Step 2: Run — verify it fails**

Expected: FAIL — schema still accepts `'image'`; cinematographer ignores `trajectory.momentKind`.

- [ ] **Step 3: Narrow the schema enum**

In `lib/onboarding/crew/cinematographer.ts`, change:

```ts
export const MomentSceneSchema = z.object({
  kind: z.enum(['video', 'image']),
```

to:

```ts
export const MomentSceneSchema = z.object({
  kind: z.enum(['video', 'spotlight']),
```

- [ ] **Step 4: Rewrite the prompt's kind direction**

In `buildCinematographerPrompt`, the existing `kind: ...` paragraph that says "Reach for video by default… still is the last resort" gets replaced with a directive that READS the trajectory's kind and EXECUTES it (the director already made the call). Replace the `kind: "video" or "image"` paragraph with:

```
The director has called for a ${trajectory.momentKind.toUpperCase()} Moment for this shop. Build the shot accordingly. Set kind to "${trajectory.momentKind}". Do not second-guess this — the director judged the inventing-motion criterion against the trajectory; your job is to execute that call into a great shot.
```

Then add two branches, only one of which is relevant per build, but both can sit in the prompt:

For video, retain the existing camera-locked + in-frame-motion direction (the camera-physics rule from D52 still holds).

For spotlight, add:

```
For a SPOTLIGHT Moment: design a single beautiful still of one HERO OBJECT framed centrally on pure black. The composition treats the object as a held subject under light — describe what we see, how it's framed, and how it's lit. The 'environment' group is black (the void the object rises out of). The 'camera' group describes the lens and framing of the STATIC shot (a slow rise and a slow push-in are added by the renderer in CSS, not in the generated image — so the camera group here is just framing, not motion). The 'atmosphere' is the air around the object. The image must contain NO text, lettering, or logos, and the object must be one clean subject — not a collage.
```

The camera-movement guard for video stays as-is. For spotlight, the camera-movement check should be skipped because spotlight is a STILL (the rise/push are CSS, not video) — adjust the existing validation:

```ts
const cameraHit = parsed.data.kind === 'video' ? findCameraMovement(parsed.data.prompt.camera) : null;
```

is already correctly scoped to video; once spotlight enters the schema as a non-video kind, it will skip the camera check naturally. Verify this with the test.

- [ ] **Step 5: Wire the trajectory into the prompt builder**

If `buildCinematographerPrompt` doesn't already take the trajectory (it does — see signature `(trajectory: Trajectory, story: string[])`), it now needs to reference `trajectory.momentKind` in the directive above. Update the function body accordingly.

- [ ] **Step 6: Update the header doc comment**

The current header comment (lines 14-19) describes the old "prefer video" intent. Rewrite to reflect the two-kind model:

```
* The kind decision belongs to the DIRECTOR (trajectory.momentKind, see director.ts);
* this stage executes whichever kind was called for. Video carries real ambient motion
* belonging to the subject; spotlight carries the cinematic rise of a static hero
* object (the rise/push happen in CSS at render — see SpotlightStage). The Moment is
* always cinematic — that is D33 — but cinematic is not always video.
```

- [ ] **Step 7: Run — verify it passes**

Run: `npx vitest run lib/onboarding/crew/cinematographer.test.ts`
Expected: PASS.

- [ ] **Step 8: Full vitest + tsc**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: green.

- [ ] **Step 9: Commit**

```bash
git add lib/onboarding/crew/cinematographer.ts lib/onboarding/crew/cinematographer.test.ts
git commit -m "feat(crew): cinematographer executes the director's kind, schema is video | spotlight"
```

---

## Task 5: Widen MediaSlot schema + map spotlight to still generation

**Files:**
- Modify: `lib/archetypes/main-street/schemas.ts`
- Modify: `lib/archetypes/main-street/builder.tsx`
- Modify: `lib/archetypes/main-street/builder.test.tsx`

- [ ] **Step 1: Write the failing test**

In `lib/archetypes/main-street/builder.test.tsx`, add:

```ts
it('emits an image MediaJob for a spotlight Moment (rise/push happen in CSS at render)', () => {
  const authored = makeAuthoredWithSpotlightMoment(); // construct using existing test scaffolding
  const jobs = MAIN_STREET_SPEC.mediaJobs(authored);
  const heroJob = jobs.find((j) => j.id === 'moment'); // adjust id to whatever the codebase uses
  expect(heroJob?.kind).toBe('image'); // spotlight generates a still; the cinematic motion is CSS
});
```

Construct `makeAuthoredWithSpotlightMoment` from the existing test scaffolding in this file — read the existing tests to see how authored Moments are built and adapt for `kind: 'spotlight'`.

- [ ] **Step 2: Run — verify it fails**

Run: `npx vitest run lib/archetypes/main-street/builder.test.tsx`
Expected: FAIL — schema rejects `'spotlight'` in MediaSlot, or the kind doesn't map.

- [ ] **Step 3: Widen MediaSlot.kind**

In `lib/archetypes/main-street/schemas.ts`, find the `MediaSlot` definition (around line 56 of the current file) and change:

```ts
  kind: z.enum(['video', 'image']).default('video'),
```

to:

```ts
  kind: z.enum(['video', 'image', 'spotlight']).default('video'),
```

The `'image'` value stays as a LEGACY kind so already-built stores keep rendering; the cinematographer no longer produces it (Task 4).

- [ ] **Step 4: Map spotlight to a still job in `mediaJobs`**

In `lib/archetypes/main-street/builder.tsx`, find `mediaJobs` (grep for `export function mediaJobs` or `mediaJobs:`). For the Moment job, the `kind` field on the emitted `MediaJob` should map a spotlight MediaSlot to `kind: 'image'` (so the generation pipeline calls `generateMomentStill`). Concretely, if the current code reads `media.kind` directly, branch:

```ts
const heroKind = a.content.moment.media.kind === 'spotlight' ? 'image' : a.content.moment.media.kind;
// then use heroKind when building the MediaJob
```

(Adapt to whatever the actual local variable names are — read the file first.)

- [ ] **Step 5: Run — verify it passes**

Run: `npx vitest run lib/archetypes/main-street/builder.test.tsx`
Expected: PASS.

- [ ] **Step 6: Typecheck + full suite**

Run: `npx tsc --noEmit` then `npx vitest run`
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add lib/archetypes/main-street/schemas.ts lib/archetypes/main-street/builder.tsx lib/archetypes/main-street/builder.test.tsx
git commit -m "feat(main-street): MediaSlot accepts spotlight; spotlight generates a still"
```

---

## Task 6: SpotlightStage component (pure stage, behavior unit-tested)

**Files:**
- Create: `lib/archetypes/main-street/SpotlightStage.tsx`
- Create: `lib/archetypes/main-street/SpotlightStage.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `lib/archetypes/main-street/SpotlightStage.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SpotlightStage } from './SpotlightStage';
import { MAIN_STREET_SKINS } from './skins';

const skin = MAIN_STREET_SKINS['main-street-hearthstone']!;

const moment = {
  media: { kind: 'spotlight' as const, prompt: { composition: 'c', subject: 's', environment: 'e', atmosphere: 'a', camera: 'k', lighting: 'l', style: 'y' }, url: 'https://cdn/hero.png', alt: 'a hero object' },
  story: ['One brave line'],
  eyebrow: 'EYEBROW',
  brand: 'Shop Name',
  ctaLabel: 'Shop now',
  ctaTarget: 'shop' as const,
};

describe('SpotlightStage', () => {
  it('paints a pure-black backdrop, the hero object, and the words', () => {
    const { container } = render(<SpotlightStage moment={moment} skin={skin} phase={{ kind: 'brand' }} action={null} />);
    const root = container.querySelector('[data-spotlight-stage]') as HTMLElement;
    expect(root.getAttribute('style')).toContain('background:'); // and the bg is some form of black
    expect(container.querySelector('img[alt="a hero object"]')).not.toBeNull();
    expect(container.textContent).toContain('Shop Name');
    expect(container.textContent).toContain('One brave line');
    expect(container.textContent).toContain('EYEBROW');
  });

  it('hides the words until the phase reaches brand', () => {
    const { container } = render(<SpotlightStage moment={moment} skin={skin} phase={{ kind: 'rising' }} action={null} />);
    const brand = container.querySelector('[data-spotlight-brand]') as HTMLElement;
    // visible-on-brand is enforced by opacity; the brand element exists but reads as not visible
    expect(brand.getAttribute('style')).toMatch(/opacity:\s*0/);
  });

  it('renders an action element when one is supplied (e.g. the Enter button)', () => {
    const { container } = render(<SpotlightStage moment={moment} skin={skin} phase={{ kind: 'brand' }} action={<button data-action>Enter site</button>} />);
    expect(container.querySelector('[data-action]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run — verify they fail**

Run: `npx vitest run lib/archetypes/main-street/SpotlightStage.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `SpotlightStage`**

Create `lib/archetypes/main-street/SpotlightStage.tsx`. The structure: a pure-black `<section>` with a wrapper that paints the hero `<img>` with a rise (opacity 0 → 1) and a slow push-in (transform: scale(1) → scale(1.04)), then an absolutely-positioned block in front of it carrying eyebrow / wordmark (brand) / single line / action (CTA or Enter button), each fading in only when the `phase` reaches `'brand'`. Read content from the same `MainStreetContent['moment']` shape the existing `MomentStage` uses — the prompt's `story` array has length 1 in spotlight, so render `story[0]` as the single line. Use `typeRoleCss(roles(skin).brand)` for the wordmark and the existing role tokens for eyebrow / line / caption — never hard-code typography.

Borrow the timing constants from the legacy `components/storefront/layout/primitives/Spotlight.tsx` (RISE_DURATION 6s, RISE_DELAY 500ms, PUSH_DURATION 20s). Words fade in around 4-5s after the object lands. Respect `@media (prefers-reduced-motion: reduce)` by collapsing the rise to instant-on and skipping the push (mirror the existing `.ms-reveal` reduced-motion handling in `chrome.tsx`).

The `phase` prop reuses the existing `StoryPhase` shape but only `'rising' | 'brand'` are meaningful here (the video story phases `'line'` and `'gap'` are irrelevant — spotlight has no multi-line story). Define `phase: { kind: 'rising' | 'brand' }` locally if needed. The legacy component held content visible immediately after the rise; here the convention should match `MomentStage` so the intro overlay handoff is consistent.

Component signature:

```tsx
export function SpotlightStage({
  moment,
  skin,
  phase,
  action,
}: {
  moment: MainStreetContent['moment'];
  skin: ArchetypeTheme;
  phase: { kind: 'rising' | 'brand' };
  action: ReactNode;
}) { ... }
```

Use inline styles or a small `<style>` block scoped to a `data-spotlight-*` attribute selector. Keep the file under ~140 lines.

- [ ] **Step 4: Run — verify they pass**

Run: `npx vitest run lib/archetypes/main-street/SpotlightStage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/SpotlightStage.tsx lib/archetypes/main-street/SpotlightStage.test.tsx
git commit -m "feat(main-street): SpotlightStage — pure black, rise, push-in, words fade in"
```

---

## Task 7: MomentHero branches on kind

**Files:**
- Modify: `lib/archetypes/main-street/MomentHero.tsx`
- Modify: `lib/archetypes/main-street/MomentHero.test.tsx`

- [ ] **Step 1: Write the failing test**

In `lib/archetypes/main-street/MomentHero.test.tsx`, add:

```ts
it('renders the SpotlightStage when the moment kind is spotlight', () => {
  const spotlightMoment = { ...moment, media: { ...moment.media, kind: 'spotlight' as const } };
  const { container } = render(<MomentHero identity={identity} moment={spotlightMoment} skin={skin} />);
  expect(container.querySelector('[data-spotlight-stage]')).not.toBeNull();
});

it('renders MomentStage (video/image) when the moment kind is video', () => {
  const { container } = render(<MomentHero identity={identity} moment={moment} skin={skin} />);
  expect(container.querySelector('[data-spotlight-stage]')).toBeNull();
});
```

(The existing `moment` fixture is a video by default — confirm by reading the file.)

- [ ] **Step 2: Run — verify it fails**

Expected: FAIL — MomentHero doesn't render SpotlightStage for any kind today.

- [ ] **Step 3: Branch the rested hero on kind**

In `lib/archetypes/main-street/MomentHero.tsx`, the `MomentHero` function currently always renders `<MomentStage … />` inside the `<header>`. Wrap it:

```tsx
{moment.media.kind === 'spotlight'
  ? <SpotlightStage moment={moment} skin={skin} phase={{ kind: 'brand' }} action={<HeroCta moment={moment} skin={skin} />} />
  : <MomentStage moment={moment} skin={skin} phase={{ kind: 'brand' }} action={<HeroCta moment={moment} skin={skin} />} />
}
```

Add `import { SpotlightStage } from './SpotlightStage';` at the top.

- [ ] **Step 4: Branch the intro overlay on kind**

The `MomentIntro` component below also uses `MomentStage` to play the story-then-land sequence. For spotlight, the intro should also use `SpotlightStage` so the SAME visual rises from black during the cold-arrival overlay. The phase model differs: video has open / line / gap / brand phases; spotlight has rising / brand. Add a branch inside `MomentIntro` so that when `moment.media.kind === 'spotlight'`, the overlay renders `SpotlightStage` with a `phase` driven by a simpler timeline (rising → brand), and the `MomentStage` path keeps the existing multi-phase timeline.

Add a small helper next to `buildStoryTimeline` for the spotlight timeline:

```ts
export function buildSpotlightTimeline(): Array<{ kind: 'rising' | 'brand' }> {
  return [{ kind: 'rising' }, { kind: 'brand' }];
}

export function spotlightPhaseDurationMs(p: { kind: 'rising' | 'brand' }): number | null {
  // The rise itself runs ~6s in CSS; advance to brand once the object has settled
  // and the slow words can fade in over the top.
  return p.kind === 'rising' ? 6500 : null;
}
```

In `MomentIntro`, switch on `moment.media.kind` and use the appropriate timeline + stage. The `enter` click and `onExited` melt behavior are unchanged.

- [ ] **Step 5: Run — verify it passes**

Run: `npx vitest run lib/archetypes/main-street/MomentHero.test.tsx`
Expected: PASS.

- [ ] **Step 6: Full suite + tsc**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: green.

- [ ] **Step 7: Commit**

```bash
git add lib/archetypes/main-street/MomentHero.tsx lib/archetypes/main-street/MomentHero.test.tsx
git commit -m "feat(render): MomentHero branches on kind — spotlight uses SpotlightStage"
```

---

## Task 8: Pipeline + crew log updates

**Files:**
- Modify: `lib/onboarding/crew/pipeline.ts`
- Modify: `lib/onboarding/crew/log-choices.ts` (only if it already logs `momentKind`-related data; otherwise leave)

- [ ] **Step 1: Read `pipeline.ts` and confirm `trajectory` already flows to copywriter + cinematographer**

Open and scan `lib/onboarding/crew/pipeline.ts`. Currently it does:

```ts
const trajectory = await direct(brief);
const rolls = rollTreatments(rand);
const copy = await writeCopy(brief, trajectory, rolls);
const moment = await shootMoment(trajectory, copy.moment.story);
```

If `shootMoment` already receives `trajectory`, no change. Verify by reading.

- [ ] **Step 2: Add a small assertion test (optional)**

In `lib/onboarding/crew/pipeline.test.ts`, with the existing mocked stages, assert that the `cut` returned from `directAndProduce` carries a `kind` consistent with the trajectory's `momentKind`. The exact test depends on the mocking style already in this file — mirror it. If the test is awkward to wire in cleanly, skip and rely on integration coverage from earlier tasks.

- [ ] **Step 3: Run full suite + tsc**

Run: `npx vitest run` then `npx tsc --noEmit`
Expected: green.

- [ ] **Step 4: Commit (only if you changed something)**

```bash
git add lib/onboarding/crew/pipeline.ts lib/onboarding/crew/pipeline.test.ts
git commit -m "test(crew): pipeline carries momentKind end-to-end"
```

If nothing changed in this task, skip the commit and move on.

---

## Verification (live, after the suite is green)

This is previewable. After the tasks land, the user runs a real build for a niche likely to land on spotlight (a sticker maker, a jewelry maker, a print maker) and confirms in the browser:

1. The cold-arrival overlay plays a spotlight scene — pure black, the object rises out, slow push-in, the words fade in over the top, "Enter site" appears.
2. After clicking Enter, the overlay fades and the rested hero shows the same spotlit object with the wordmark + tagline + CTA.
3. A niche with natural motion (candle, bakery) still gets a video Moment.

User runs the dev server themselves and reports back.

---

## Self-review

- **Spec coverage:** schema widens to accept spotlight (Task 5 ✓); director picks kind from the inventing-motion criterion (Task 2 ✓); copywriter writes one tagline for spotlight, multi-line for video (Task 3 ✓); cinematographer designs the right scene per kind (Task 4 ✓); renderer paints the rise / push / words for spotlight (Task 6, 7 ✓); intro overlay handles both kinds (Task 7 ✓); legacy `'image'` stays renderable (Task 5: schema retains; Task 7: video/image both flow through `MomentStage`).
- **Type consistency:** `momentKind: 'video' | 'spotlight'` is the same shape in trajectory, director tool schema, and cinematographer prompt. `MediaSlot.kind` is the wider `'video' | 'image' | 'spotlight'` because it must read legacy data. The cinematographer NEVER produces `'image'` from this point.
- **Placeholders:** none — every step is concrete code or a concrete command.
- **Open dependency:** the legacy `components/storefront/layout/primitives/Spotlight.tsx` is not deleted by this plan. It's untouched; can be retired in a later cleanup task once we're confident no other system path renders it.
