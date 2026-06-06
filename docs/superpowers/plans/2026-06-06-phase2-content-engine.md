# Phase 2 — Content Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Bohdi author rich, niche-specific content by feeding him the full niche file (not a 1,600-char slice), widening the slots so real writing fits, enforcing image rules (photo-realistic + maker-name-matched people), and adding a draft-then-deepen pass that rewrites weak copy before anything renders.

**Architecture:** All authoring runs through `lib/onboarding/build-archetype-store.ts` → `authorStore()` (the Bohdi tool loop) → `spec.mediaJobs()` → media generation → persist. Five changes: (1) the per-archetype `authoringSpec(brief)` embeds the full niche body; (2) a new pure `lib/onboarding/image-directives.ts` appends a photorealism directive to every image prompt and a gender phrase (via the existing `lib/name-gender.ts`) to person images; (3) `MediaJob` gains a `subjectIsPerson` flag the archetype sets; (4) the Main Street content schema widens its tightest slots and the `authoringSpec` prompt demands niche-specific depth + a story arc; (5) `authorStore()` runs one deepen round after the first valid draft. Testable on the home page via a fresh onboarding before any sub-pages exist.

**Tech Stack:** TypeScript (strict), Anthropic SDK (`@anthropic-ai/sdk`), Zod, Vitest.

---

### Task 1: Image directives module (photorealism + name-matched people)

**Files:**
- Create: `lib/onboarding/image-directives.ts`
- Test: `lib/onboarding/image-directives.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/onboarding/image-directives.test.ts
import { describe, it, expect } from 'vitest';
import { withImageDirectives } from './image-directives';

describe('withImageDirectives', () => {
  it('appends a photorealism directive to every prompt', () => {
    const out = withImageDirectives('a leather belt on oak', { isPerson: false });
    expect(out).toMatch(/a leather belt on oak/);
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out.toLowerCase()).not.toMatch(/woman|man\b/);
  });

  it('adds a female phrase for a person image when the maker name reads female', () => {
    const out = withImageDirectives('portrait at the bench', { isPerson: true, makerName: 'Abigail Stone' });
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out.toLowerCase()).toContain('woman');
  });

  it('adds a male phrase for a person image when the maker name reads male', () => {
    const out = withImageDirectives('portrait at the bench', { isPerson: true, makerName: 'Samuel Reed' });
    expect(out.toLowerCase()).toContain('man');
  });

  it('still renders a person directive with no name (helper defaults), never crashes', () => {
    const out = withImageDirectives('portrait', { isPerson: true });
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out.length).toBeGreaterThan('portrait'.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/image-directives.test.ts`
Expected: FAIL — `withImageDirectives` not defined.

- [ ] **Step 3: Implement**

```ts
// lib/onboarding/image-directives.ts
/**
 * Image-prompt directives enforced by the engine (not left to Bohdi's free text):
 *  - every generated image is photo-realistic (never illustrated/3D/render);
 *  - a person in the image matches the maker's name (female name → a woman, etc.),
 *    via the shared name→gender helper. A heuristic with a known failure mode
 *    (unisex names, the maker isn't the face) — a sensible default the maker can
 *    override later in the editor; it never blocks a build.
 */
import { inferGenderFromName, personPhrase } from '@/lib/name-gender';

const PHOTO_REAL = 'photorealistic photograph, natural lighting, real materials and textures, no illustration or 3D render';

export interface ImageDirectiveOpts {
  isPerson?: boolean | undefined;
  makerName?: string | undefined;
}

/** Append the enforced directives to an authored image prompt. */
export function withImageDirectives(prompt: string, opts: ImageDirectiveOpts): string {
  const parts = [prompt.trim()];
  if (opts.isPerson) {
    const phrase = personPhrase(inferGenderFromName(opts.makerName));
    parts.push(`the person is ${phrase.noun}`);
  }
  parts.push(PHOTO_REAL);
  return parts.join('. ');
}
```

- [ ] **Step 4: Confirm `personPhrase` returns a `.noun`**

Run: `grep -n "noun\|return {" lib/name-gender.ts | head`
Expected: `personPhrase` returns an object with a `noun` field (e.g. `woman`/`man`). If the field is named differently (e.g. `subject`), use that field name in Step 3 instead and re-run.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/onboarding/image-directives.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/onboarding/image-directives.ts lib/onboarding/image-directives.test.ts
git commit -m "Content engine: image directives — photorealism + name-matched people"
```

---

### Task 2: Mark which media jobs depict the maker

**Files:**
- Modify: `lib/archetypes/builder.ts` (add `subjectIsPerson?: boolean` to `MediaJob`)
- Modify: `lib/archetypes/main-street/builder.tsx` (`mediaJobs` marks the portrait)
- Test: `lib/archetypes/build-specs.test.ts` (add a case)

- [ ] **Step 1: Write the failing test**

Add to `lib/archetypes/build-specs.test.ts` inside `describe('MAIN_STREET_SPEC', ...)`:

```ts
  it('marks the founder portrait as a person image and the hero/products as not', () => {
    const r = MAIN_STREET_SPEC.parseSubmission({ content: msContent, products: msProducts });
    if (!r.ok) throw new Error('expected ok');
    const jobs = MAIN_STREET_SPEC.mediaJobs(r.authored);
    expect(jobs.find((j) => j.id === 'portrait')?.subjectIsPerson).toBe(true);
    expect(jobs.find((j) => j.id === 'hero')?.subjectIsPerson ?? false).toBe(false);
    expect(jobs.filter((j) => j.group === 'product').every((j) => !j.subjectIsPerson)).toBe(true);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/archetypes/build-specs.test.ts`
Expected: FAIL — `subjectIsPerson` undefined on the portrait job.

- [ ] **Step 3: Add the flag to the MediaJob interface**

In `lib/archetypes/builder.ts`, in the `MediaJob` interface, add after `group`:

```ts
  group: 'product' | 'feature';
  /** True when the image depicts the maker (or a person standing in for them),
   *  so the engine can match the subject to the maker's name. */
  subjectIsPerson?: boolean;
```

- [ ] **Step 4: Mark the portrait in Main Street's mediaJobs**

In `lib/archetypes/main-street/builder.tsx`, in `mediaJobs`, change the portrait job to set the flag:

```ts
    { id: 'portrait', kind: 'still', prompt: a.content.founder.photo.prompt, aspect: '1:1', group: 'feature', subjectIsPerson: true },
```

(Leave `hero` and the product jobs unflagged — the hero subject is ambient by the authoring rules, products are objects.)

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run lib/archetypes/build-specs.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/archetypes/builder.ts lib/archetypes/main-street/builder.tsx lib/archetypes/build-specs.test.ts
git commit -m "Content engine: MediaJob.subjectIsPerson; Main Street marks the founder portrait"
```

---

### Task 3: Apply the image directives in the build engine

**Files:**
- Modify: `lib/onboarding/build-archetype-store.ts` (export a pure prompt-prep helper; use it before generating)
- Test: `lib/onboarding/build-archetype-store.test.ts` (add a case)

- [ ] **Step 1: Write the failing test**

Add to `lib/onboarding/build-archetype-store.test.ts`:

```ts
import { prepareJobPrompt } from './build-archetype-store';
import type { MediaJob } from '@/lib/archetypes/builder';

describe('prepareJobPrompt', () => {
  const base: MediaJob = { id: 'x', kind: 'still', prompt: 'a wallet on stone', aspect: '1:1', group: 'product' };

  it('adds photorealism to a product image and no person phrase', () => {
    const out = prepareJobPrompt(base, 'Abigail Stone');
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out.toLowerCase()).not.toContain('woman');
  });

  it('adds the matched person phrase to a portrait', () => {
    const portrait: MediaJob = { ...base, id: 'portrait', prompt: 'the maker at the bench', subjectIsPerson: true };
    expect(prepareJobPrompt(portrait, 'Abigail Stone').toLowerCase()).toContain('woman');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/onboarding/build-archetype-store.test.ts`
Expected: FAIL — `prepareJobPrompt` not exported.

- [ ] **Step 3: Add the helper and use it**

In `lib/onboarding/build-archetype-store.ts`:

Add the import near the top:

```ts
import { withImageDirectives } from '@/lib/onboarding/image-directives';
```

Add the exported helper (near `recycleProductPhotos`):

```ts
/** Apply the engine's enforced image directives to a job's authored prompt. */
export function prepareJobPrompt(job: MediaJob, makerName?: string): string {
  return withImageDirectives(job.prompt, { isPerson: job.subjectIsPerson, makerName });
}
```

Then in `buildArchetypeStore`, change `run` to use the prepared prompt:

```ts
  const run = (j: MediaJob) => {
    const prompt = prepareJobPrompt(j, input.makerName);
    return j.kind === 'video'
      ? generateMomentVideo(prompt, { subdomain: `${input.subdomain}/${j.id}`, aspect: j.aspect, ...(j.durationSec !== undefined ? { durationSec: j.durationSec } : {}) })
      : generateMomentStill(prompt, { subdomain: `${input.subdomain}/${j.id}`, aspect: j.aspect });
  };
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/onboarding/build-archetype-store.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/onboarding/build-archetype-store.ts lib/onboarding/build-archetype-store.test.ts
git commit -m "Content engine: enforce image directives on every generated asset"
```

---

### Task 4: Feed the full niche body into authoring

**Files:**
- Modify: `lib/archetypes/main-street/builder.tsx` (`authoringSpec` embeds the niche body)
- Test: `lib/archetypes/main-street/builder.niche.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
// lib/archetypes/main-street/builder.niche.test.ts
import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SPEC } from './builder';
import type { AuthoringBrief } from '../builder';

const SENTINEL = 'SENTINEL_NICHE_DETAIL_beeswax_tallow_double_boiler';

const brief: AuthoringBrief = {
  shopName: 'Test Co',
  nicheDisplayName: 'Candle Maker',
  nicheBody: `Intro paragraph.\n\n${SENTINEL}\n\n` + 'x'.repeat(5000),
  moodLabel: 'cozy',
  moodDescription: 'warm and homey',
  productCount: 6,
};

describe('Main Street authoringSpec — niche source', () => {
  it('embeds niche detail well past the old 1600-char menu slice', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief);
    expect(spec).toContain(SENTINEL);
  });

  it('instructs Bohdi to mine the niche source for specifics', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toMatch(/niche|source material|this maker/);
    expect(spec).toMatch(/specific|concrete|real/);
  });
});
```

(The SENTINEL sits ~20 chars into the body but the old code never put `nicheBody` in `authoringSpec` at all, so the test fails until we embed it. The 5000-char padding proves we embed well beyond 1600.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/builder.niche.test.ts`
Expected: FAIL — the spec string contains no niche body.

- [ ] **Step 3: Embed the niche body in `authoringSpec`**

In `lib/archetypes/main-street/builder.tsx`, at the top of `authoringSpec(b)`, build a niche-source block and prepend it to the returned string. Add before the `return`:

```ts
  const nicheSource = b.nicheBody.trim().slice(0, 12000);
```

Then insert this section near the top of the returned template literal (right after the `MAIN STREET — ...` opening paragraph, before `GOODS TREATMENT`):

```
NICHE SOURCE — this is how makers in this niche actually talk, what they sell, the materials and techniques they use, and who buys from them. MINE IT. Name real products, real materials, real processes from it. The copy must sound like THIS ${b.nicheDisplayName.toLowerCase()}, not a generic shop. Do not invent niche facts that contradict it.

${nicheSource}

---
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/archetypes/main-street/builder.niche.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/builder.tsx lib/archetypes/main-street/builder.niche.test.ts
git commit -m "Content engine: feed the full niche body into Main Street authoring"
```

---

### Task 5: Strengthen the voice + story-arc instructions

**Files:**
- Modify: `lib/archetypes/main-street/builder.tsx` (`authoringSpec` VOICE block + the moment story line)
- Test: `lib/archetypes/main-street/builder.niche.test.ts` (add cases)

- [ ] **Step 1: Write the failing test**

Add to `lib/archetypes/main-street/builder.niche.test.ts`:

```ts
describe('Main Street authoringSpec — voice and story arc', () => {
  it('asks the moment story to tell one arc across its lines', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toMatch(/story.*(arc|tells|one story|builds)/);
  });

  it('bans the named AI-tell platitudes', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toContain('crafted with care');
    expect(spec).toContain('every piece tells a story');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/builder.niche.test.ts`
Expected: FAIL — the story-arc instruction marker isn't present yet (the platitude ban already is; the arc phrasing is the new requirement).

- [ ] **Step 3: Strengthen the prompt**

In `authoringSpec`, update the `moment.story` field description to demand an arc, e.g. change the `story (...)` clause to:

```
story (2-4 strings, each 4-48, NO punctuation at all): the four lines together TELL ONE STORY that builds line to line and lands on the brand — not four disconnected slogans. Draw the specifics from the niche source.
```

And extend the closing `VOICE:` block with:

```
 Write like THIS maker in THIS niche: name real materials, techniques, and product types from the niche source. Concrete beats abstract every time. If a line could appear on any shop's site, rewrite it.
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/archetypes/main-street/builder.niche.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/builder.tsx lib/archetypes/main-street/builder.niche.test.ts
git commit -m "Content engine: demand a story arc and niche-specific, concrete voice"
```

---

### Task 6: Widen the tightest content slots

**Files:**
- Modify: `lib/archetypes/main-street/builder.tsx` (`ProductSchema.description` cap)
- Modify: `lib/archetypes/main-street/builder.tsx` (`authoringSpec` product field cap text to match)
- Test: `lib/archetypes/build-specs.test.ts` (add a case)

**Note:** The home founder quote stays a teaser (≤280) by design (the full About story is Phase 3). The product `description` is the slot most starved today (≤300) and shows on the product page, so it widens to 600.

- [ ] **Step 1: Write the failing test**

Add to `lib/archetypes/build-specs.test.ts` inside `describe('MAIN_STREET_SPEC', ...)`:

```ts
  it('accepts a rich product description up to 600 chars', () => {
    const longDesc = 'A '.padEnd(560, 'x') + ' finish.'; // ~568 chars, was over the old 300 cap
    const products = msProducts.map((p, i) => (i === 0 ? { ...p, description: longDesc } : p));
    const r = MAIN_STREET_SPEC.parseSubmission({ content: msContent, products });
    expect(r.ok).toBe(true);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/archetypes/build-specs.test.ts`
Expected: FAIL — description exceeds the current `.max(300)`.

- [ ] **Step 3: Widen the cap**

In `lib/archetypes/main-street/builder.tsx`, change the `ProductSchema` description field:

```ts
  description: z.string().min(12).max(600),
```

And in `authoringSpec`, update the products field text from `description (12-300)` to `description (12-600, write real substance — materials, use, what makes it specific; not one thin line)`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/archetypes/build-specs.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/builder.tsx lib/archetypes/build-specs.test.ts
git commit -m "Content engine: widen the product description slot to 600 for real substance"
```

---

### Task 7: The deepen pass

**Files:**
- Modify: `lib/onboarding/build-archetype-store.ts` (export `authorStore`; run one deepen round after the first valid draft)
- Test: `lib/onboarding/deepen.test.ts` (create — mocks the Anthropic client)

**Design:** After the first valid `submit_store`, instead of returning immediately, push a deepen instruction into the SAME message thread (so Bohdi still has the full niche source and his own draft in context), and keep looping. The next valid `submit_store` is the final, deepened draft. Deepen runs at most once; if no valid deepened draft arrives within the remaining turns, fall back to the first valid draft.

- [ ] **Step 1: Write the failing test**

```ts
// lib/onboarding/deepen.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const create = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create } }) }));

import { authorStore } from './build-archetype-store';
import type { AuthoringBrief } from '@/lib/archetypes/builder';

const brief: AuthoringBrief = {
  shopName: 'Tannery Row', nicheDisplayName: 'Leatherworker',
  nicheBody: 'Leatherworkers cut full-grain hides and saddle-stitch by hand.',
  moodLabel: 'rustic', moodDescription: 'warm and worn', productCount: 3,
};

// A minimal valid Main Street submission (content + 3 products).
const draft = {
  content: {
    shopName: 'Tannery Row',
    identity: { wordmark: 'Tannery Row', nav: ['Shop', 'About'] },
    moment: { media: { kind: 'image', prompt: { composition: 'bench', subject: 'a wallet', environment: 'a workshop', atmosphere: 'warm', camera: 'still', lighting: 'amber', style: 'photographic' }, alt: 'the bench' }, story: ['cut by hand', 'stitched to last'], eyebrow: 'Made in the workshop', brand: 'Tannery Row', ctaLabel: 'See the work' },
    goods: { title: 'The bench', treatment: 'procession' },
    founder: { quote: 'I would rather make one belt that lasts thirty years than ten that do not at all.', attribution: 'Sam, founder', photo: { prompt: 'the maker at the bench with a knife roll', alt: 'the maker' } },
    close: { label: 'Come by', headline: 'Built to outlast us', ctaLabel: 'Order yours' },
  },
  products: [
    { name: 'Belt', slug: 'belt', shortDescription: 'A full-grain belt', description: 'A belt cut from one hide.', basePriceCents: 9800, imagePrompt: 'a belt on wood' },
    { name: 'Wallet', slug: 'wallet', shortDescription: 'A bifold', description: 'Saddle-stitched bifold.', basePriceCents: 6800, imagePrompt: 'a wallet on stone' },
    { name: 'Tote', slug: 'tote', shortDescription: 'A tote', description: 'A roomy tote.', basePriceCents: 22000, imagePrompt: 'a tote on a bench' },
  ],
};
const deepened = { ...draft, content: { ...draft.content, eyebrow: 'Saddle-stitched in the workshop' } };

function toolMsg(name: string, input: unknown) {
  return { content: [{ type: 'tool_use', id: `t_${name}_${Math.random()}`, name, input }], stop_reason: 'tool_use' };
}

beforeEach(() => create.mockReset());

describe('authorStore deepen pass', () => {
  it('runs one deepen round and returns the deepened draft', async () => {
    create
      .mockResolvedValueOnce(toolMsg('choose_format', { archetypeKey: 'main-street', lookKey: 'main-street-ember' }))
      .mockResolvedValueOnce(toolMsg('submit_store', draft))
      .mockResolvedValueOnce(toolMsg('submit_store', deepened));
    const { authored } = await authorStore(brief);
    expect((authored as typeof draft).content.eyebrow).toBe('Saddle-stitched in the workshop');
    expect(create).toHaveBeenCalledTimes(3); // choose, draft, deepened
  });

  it('falls back to the first valid draft if the deepen round never yields a valid resubmit', async () => {
    create
      .mockResolvedValueOnce(toolMsg('choose_format', { archetypeKey: 'main-street', lookKey: 'main-street-ember' }))
      .mockResolvedValueOnce(toolMsg('submit_store', draft))
      .mockResolvedValue({ content: [{ type: 'text', text: 'no change needed' }], stop_reason: 'end_turn' });
    const { authored } = await authorStore(brief);
    expect((authored as typeof draft).content.eyebrow).toBe('Made in the workshop');
  });
});
```

(Use `main-street-ember` if that key exists; otherwise the first key from `MAIN_STREET_SPEC.looks[0].key` — adjust in Step 1 if the look key differs.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/onboarding/deepen.test.ts`
Expected: FAIL — `authorStore` is not exported, and there is no deepen round (it returns the first draft).

- [ ] **Step 3: Implement the deepen round in `authorStore`**

In `lib/onboarding/build-archetype-store.ts`:

1. Export `authorStore` (change `async function authorStore` → `export async function authorStore`).

2. Add a deepen-instruction builder above `authorStore`:

```ts
function deepenInstruction(brief: AuthoringBrief): string {
  return `Good — that draft is valid. Now make it EXCELLENT. Re-read the niche source you were given and your own draft, then rewrite every weak part and resubmit with submit_store. Check, line by line:
- Could this copy appear on ANY ${brief.nicheDisplayName.toLowerCase()}'s site, or is it specific to THIS maker? Make it specific — name real materials, techniques, and product types from the niche source.
- Does the founder quote and each product description say something concrete, or is it adjectives? Replace platitudes ("crafted with care", "every piece tells a story") with real detail.
- Do the moment story lines tell ONE story that builds and lands on the brand?
- Any banned punctuation (terminal punctuation in headlines/brand; ANY punctuation in story lines)? Remove it.
Resubmit the improved store with submit_store. Keep the same structure and your archetype/look choice.`;
}
```

3. Rework the submit handling so the first valid draft triggers a deepen round instead of returning. Replace the `submit_store` success branch and the loop tail with deepen-aware logic:

```ts
  let firstValid: unknown = null;   // fallback if deepen yields nothing valid
  let deepenRequested = false;
```

In the `submit_store` branch, replace the `if (parsed.ok) { ... return ... }` block with:

```ts
        if (parsed.ok) {
          if (!deepenRequested) {
            firstValid = parsed.authored;
            deepenRequested = true;
            logger.info('archetype-build: first valid draft, requesting deepen', { archetype: chosen.spec.key, turn: turn + 1 });
            results.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify({ ok: true }) });
            // After pushing tool results below, inject the deepen instruction.
          } else {
            logger.info('archetype-build: deepened draft accepted', { archetype: chosen.spec.key, turn: turn + 1 });
            return { chosen, authored: parsed.authored };
          }
        } else {
          results.push({ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ ok: false, issues: parsed.issues.slice(0, 14) }) });
        }
```

Then change the loop tail (after `messages.push({ role: 'user', content: results });`) so that when a deepen was just requested, the deepen instruction is appended as the next user turn:

```ts
    messages.push({ role: 'user', content: results });
    if (deepenRequested && firstValid !== null && !messages.some((m) => typeof m.content === 'string' && m.content.startsWith('Good — that draft is valid'))) {
      messages.push({ role: 'user', content: deepenInstruction(brief) });
    }
```

4. After the loop, fall back to the first valid draft instead of throwing if we got one:

```ts
  if (firstValid !== null && chosen) {
    logger.info('archetype-build: deepen did not yield a valid resubmit; using first valid draft', { archetype: chosen.spec.key });
    return { chosen, authored: firstValid };
  }
  throw new Error(`Bohdi did not submit a valid store within ${MAX_TURNS} turns`);
```

(Note: the guard string `'Good — that draft is valid'` must match the start of `deepenInstruction`. Keep them identical.)

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/onboarding/deepen.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/onboarding/build-archetype-store.ts lib/onboarding/deepen.test.ts
git commit -m "Content engine: deepen pass — Bohdi critiques and rewrites his draft against the niche file"
```

---

### Task 8: Full green check

- [ ] **Step 1: Typecheck, lint, full suite**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: 0 type errors, 0 lint errors, all tests pass.

- [ ] **Step 2: Commit any stragglers**

```bash
git add -A && git commit -m "Content engine: final check" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:** Implements spec §2 (full niche body → Task 4; wider slots → Task 6; story arc + voice → Task 5; deepen pass → Task 7) and §3 (image rules → Tasks 1–3). The richer About-page *story* field is intentionally deferred to Phase 3 (the About page doesn't exist yet); spec §8 scopes Phase 2 to "testable on the home page alone," which this satisfies.

**Placeholder scan:** No TBD/TODO. Field-name assumptions are verified before use: `personPhrase().noun` (Task 1 Step 4), the look key for the deepen test (Task 7 Step 1 note). Code is shown in full for every code step.

**Type consistency:** `withImageDirectives(prompt, opts)` (Task 1) is consumed by `prepareJobPrompt` (Task 3); `MediaJob.subjectIsPerson` (Task 2) is read by both `prepareJobPrompt` and the test in Task 3; `authorStore` is exported in Task 7 and imported by its test. The deepen guard string matches `deepenInstruction`'s opening exactly.

**Risk:** the deepen round adds one Claude pass (accepted — the design budget freed by Bohdi not composing). It is bounded by `MAX_TURNS` and falls back to the first valid draft, so it can never fail a build that would otherwise succeed.
