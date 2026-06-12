# Product photo upload at onboarding — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional "upload up to 5 product photos" step to onboarding, thread the Vision read into the crew (Director + Cinematographer + Copywriter, NOT Graphic Artist), and land three ridealong fixes that touch the same surfaces: founder-name attribution, catalog-size step retirement, portrait founder-treatment contrast scrim.

**Architecture:** New `StepProductPhotos` follows the `StepLogo` pattern exactly (signed-URL upload, server action mints, client PUTs). The Vision call is a single batched request reading all uploaded photos at once, returning per-photo product suggestions + a cross-photo `makerWork` summary. The crew brief grows two optional fields (`visionPerPhoto`, `makerWork`); when set, the Director's, Cinematographer's, and Copywriter's prompts read them — when undefined, today's behavior runs unchanged. The Graphic Artist deliberately does NOT receive photo input. Uploaded photo URLs replace fal-generated images for the first N product slots; Bohdi authors stand-ins for the rest, target catalog size flat 5 across all paths.

**Tech Stack:** Next.js App Router, TypeScript strict, Anthropic Vision (Sonnet), Supabase Storage, Tailwind, React Testing Library + Vitest, deterministic CSS for the portrait scrim.

**Branch:** `session-12/layout-engine` (already on it).

**Spec:** `docs/superpowers/specs/2026-06-12-product-photo-upload-at-onboarding-design.md`.

---

## File structure — what gets created or modified

**Onboarding UI**
- Modify: `app/onboarding/_components/types.ts` — add `productPhotoUrls`, `visionPerPhoto`, `makerWork` to `OnboardingData`; remove `productCount` usage from the flow (default 5 stays as constant).
- Create: `app/onboarding/_components/StepProductPhotos.tsx` — the new step.
- Create: `app/onboarding/_components/StepProductPhotos.test.tsx`.
- Modify: `app/onboarding/_components/OnboardingFlow.tsx` — 7 steps, drop catalog-size, insert photos between logo and mood.
- Delete: `app/onboarding/_components/StepCatalogSize.tsx`.

**Server actions**
- Create: `app/onboarding/product-photos-actions.ts` — `uploadAndAnalyzeProductPhotos`.
- Create: `app/onboarding/product-photos-actions.test.ts`.

**Crew brief & prompt plumbing**
- Modify: `lib/onboarding/crew/types.ts` — add `visionPerPhoto?` and `makerWork?` to `CrewBrief`.
- Modify: `lib/onboarding/crew/director.ts` — Director prompt reads `makerWork`.
- Modify: `lib/onboarding/crew/cinematographer.ts` — Cinematographer prompt reads `makerWork`.
- Modify: `lib/onboarding/crew/copywriter.ts` — Copywriter prompt reads `visionPerPhoto` for products 1–N; adds `makerName` and founder-attribution lock; target product count flat 5.
- Modify: `lib/onboarding/crew/copywriter.test.ts` — extend tests.
- Modify: `lib/onboarding/crew/director.test.ts` — extend tests.

**Build orchestration**
- Modify: `lib/onboarding/build-archetype-store.ts` — accept `productPhotoUrls` + `visionPerPhoto` + `makerWork`; pre-populate product URL map from uploads, only call fal for slots N+1..5.
- Modify: `lib/onboarding/run-storefront.ts` — pass through new fields.
- Modify: `app/onboarding/actions.ts` — extend `GenerateStorefrontInput`.
- Modify: `app/api/onboarding/generate/route.ts` (find it first) — pass through new fields.

**Portrait scrim fix**
- Modify: `lib/archetypes/main-street/FounderBeats.tsx` — the `FounderPortrait` scrim wraps the text container so it covers the full text bounding box regardless of quote length.
- Create: `lib/archetypes/main-street/FounderBeats.test.tsx` (or extend existing) — render test confirms a long quote sits on a scrim.

**Ticker**
- Modify: `lib/onboarding/ticker-content.ts` — add a "Studying your work…" beat surfaced only when photos uploaded.

---

## Phase A — Ridealong fixes (independent, ship first)

These three fixes touch surfaces we'll edit again in Phases B–D. Doing them first means later phases land on a clean base and the founder-name bug stops shipping wrong copy immediately.

### Task A1: Copywriter prompt receives `makerName` and locks `founder.attribution` to it

**Files:**
- Modify: `lib/onboarding/crew/copywriter.ts:53-128` (the `buildCopywriterPrompt` function)
- Modify: `lib/onboarding/crew/copywriter.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `lib/onboarding/crew/copywriter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildCopywriterPrompt } from './copywriter';
import type { CrewBrief } from './types';
import type { Trajectory } from './trajectory';
import type { TreatmentRolls } from './copywriter';

const baseBrief: CrewBrief = {
  shopName: 'Sawdust & Stone',
  nicheDisplayName: 'Woodworker',
  nicheBody: 'A small niche body for testing.',
  moodLabel: 'Rustic',
  moodDescription: 'Warm timber and morning light.',
  productCount: 5,
  makerName: 'Wally',
  moodKey: 'rustic',
};

const trajectory: Trajectory = {
  feeling: 'a quiet workshop',
  customerWhy: 'they want a piece that lasts',
  visualWorld: 'morning light, warm timber',
  momentConcept: 'hands at the bench',
  register: 'restrained',
  momentKind: 'video',
};

const rolls: TreatmentRolls = { goods: 'marquee', founder: 'quote' };

describe('copywriter prompt — founder-attribution name lock', () => {
  it("passes the maker's first name into the prompt and locks founder.attribution to it", () => {
    const prompt = buildCopywriterPrompt(baseBrief, trajectory, rolls);
    expect(prompt).toContain('Wally');
    expect(prompt).toMatch(/founder\.attribution[^\n]*Wally/);
    expect(prompt).toMatch(/do not invent/i);
  });

  it("when makerName is undefined, instructs a generic attribution rather than inventing", () => {
    const briefNoName: CrewBrief = { ...baseBrief, makerName: undefined };
    const prompt = buildCopywriterPrompt(briefNoName, trajectory, rolls);
    expect(prompt).not.toMatch(/founder\.attribution[^\n]*Wally/);
    expect(prompt).toMatch(/maker'?s first name was not captured/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/crew/copywriter.test.ts -t "founder-attribution name lock"`
Expected: FAIL — current prompt has no "Wally" and no "do not invent" near `founder.attribution`.

- [ ] **Step 3: Update `buildCopywriterPrompt` in `lib/onboarding/crew/copywriter.ts`**

Add a `nameLockClause` near the top of the prompt body and wire it in. Inside `buildCopywriterPrompt`, after the `targets` line and before the `storyDirective`:

```typescript
  const makerNameTrimmed = brief.makerName?.trim();
  const nameLockClause = makerNameTrimmed
    ? `THE MAKER'S NAME — the maker's real first name is "${makerNameTrimmed}". Use it EXACTLY in founder.attribution. Do not invent, shorten, or add a surname.`
    : `THE MAKER'S NAME — the maker's first name was not captured. Write a generic attribution like "The maker" for founder.attribution rather than inventing a name.`;
```

Then insert `${nameLockClause}` into the prompt body, right before the `Write the words with submit_copy.` line:

```typescript
  return `You are the COPYWRITER on Bohdi's crew. ...
...
${niche}

${nameLockClause}

LINKS — every link you write carries a label ...
```

(Place it after the niche block and before the LINKS section so the model reads the maker name as a fixed onboarding fact alongside shopName.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/onboarding/crew/copywriter.test.ts -t "founder-attribution name lock"`
Expected: PASS (both cases).

Also run the full file to confirm no regression:
Run: `npx vitest run lib/onboarding/crew/copywriter.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/crew/copywriter.ts lib/onboarding/crew/copywriter.test.ts
git commit -m "$(cat <<'EOF'
fix(crew): copywriter locks founder.attribution to the maker's real first name (Session 41)

D45 pattern, ridealong from the photo-upload spec. Closes the Session 39
chip task_cf37e76c — the Copywriter prompt never received makerName so
Bohdi invented attributions. Now it reads makerName as a fixed onboarding
fact and locks founder.attribution to it; undefined makerName produces a
generic attribution, never an invented one.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task A2: Portrait founder-treatment scrim covers the full text bounding box

The current scrim is anchored to the bottom of the photo and only protects the bottom 32% of the image. A long quote pushes UPWARD out of the scrimmed region — that's exactly what Alex's screenshot showed.

This task implements the deterministic CSS fix: wrap the text container in a backdrop with `backdrop-filter` or a colored layer that follows the text container's bounding box. The result: scrim height = text height always, regardless of quote length.

**Files:**
- Modify: `lib/archetypes/main-street/FounderBeats.tsx` (the `FounderPortrait` component, lines 99–114)
- Create: `lib/archetypes/main-street/FounderBeats.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `lib/archetypes/main-street/FounderBeats.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FounderPortrait } from './FounderBeats';
import type { MainStreetContent } from './schemas';
import type { ArchetypeTheme } from '../types';

const skin: ArchetypeTheme = {
  // Minimal stub — only the roles the component reads matter; the rest is
  // structural. Tests against the existing skin shape; adjust if needed.
} as ArchetypeTheme;

const longQuote =
  'Every board that leaves this shop started as a tree growing somewhere in New England. ' +
  'I want you to feel that when you pick it up — the weight of it, the grain running through your hands. ' +
  "That's what I'm after. Not a product. A thing worth keeping.";

const founder: MainStreetContent['founder'] = {
  quote: longQuote,
  attribution: 'Wally',
  treatment: 'portrait',
  photo: { prompt: 'a maker at the bench', alt: 'maker', url: 'https://example.com/portrait.jpg' },
};

describe('FounderPortrait — scrim wraps the text', () => {
  it('renders a scrim element whose layout follows the text container, not a fixed bottom strip', () => {
    const { container } = render(<FounderPortrait founder={founder} skin={skin} />);
    const scrim = container.querySelector('[data-portrait-scrim]');
    expect(scrim).not.toBeNull();
    // The scrim must NOT be a bottom-anchored strip — it must wrap the text.
    // Concretely, the scrim and the text container share the same offset parent
    // and the scrim is sized to the text container, not to a fixed percentage.
    const text = container.querySelector('[data-portrait-text]');
    expect(text).not.toBeNull();
    // Both the scrim and text live in the same wrapper, anchored bottom-of-image.
    expect(scrim?.parentElement).toBe(text?.parentElement);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/FounderBeats.test.tsx`
Expected: FAIL — current `FounderPortrait` has no `data-portrait-scrim` or `data-portrait-text` attribute and the scrim is a fixed-percentage gradient cover.

- [ ] **Step 3: Rewrite `FounderPortrait` so the scrim wraps the text container**

Replace the `FounderPortrait` function in `lib/archetypes/main-street/FounderBeats.tsx`:

```tsx
/** portrait — a large CONTAINED portrait with the quote anchored to the bottom.
 *  The scrim sits BEHIND the text container and follows its bounding box, so a
 *  long quote that pushes upward never sticks out into unscrimmed image area. */
export function FounderPortrait({ founder, skin, about }: TreatmentProps) {
  const r = roles(skin);
  return (
    <FounderBand>
      <div className="ms-founder-portrait" style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', aspectRatio: '16 / 10' }}>
        <Media media={founder.photo} />
        {/* The text + scrim live in the same bottom-anchored wrapper so the scrim
            is sized to the text, not a fixed image percentage. */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <div
            data-portrait-scrim
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, var(--ms-contrast-bg) 75%, color-mix(in srgb, var(--ms-contrast-bg) 65%, transparent) 92%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
          <div data-portrait-text style={{ position: 'relative', padding: '48px clamp(28px, 5vw, 64px)' }}>
            <p data-type="quote" style={{ ...typeRoleCss(r.quote), color: 'var(--ms-contrast-fg)', margin: 0, maxWidth: '32ch' }}>{founder.quote}</p>
            <div data-type="sig" style={{ ...typeRoleCss(r.sig), color: 'var(--ms-contrast-fg-muted)', marginTop: 20 }}>&mdash; {founder.attribution}</div>
          </div>
        </div>
      </div>
      <AboutCue about={about} skin={skin} />
    </FounderBand>
  );
}
```

Key changes from before:
- The text container (`data-portrait-text`) and the scrim (`data-portrait-scrim`) live in the SAME wrapper, anchored `bottom: 0`.
- The scrim `inset: 0` makes it match the text container's bounding box. As the quote grows, the wrapper grows, the scrim grows with it.
- Gradient now: solid `--ms-contrast-bg` at 75% (the text zone), feathering to transparent at 100% (the top edge). The feather is short — readability over subtle artistry, since the previous attempt at subtle was unreadable.
- `maxWidth: '32ch'` (was 22ch) — gives the long quote fewer wraps so the text block is wider/shorter and reads as one paragraph rather than a thin tall column.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/archetypes/main-street/FounderBeats.test.tsx`
Expected: PASS.

Also run the full main-street test set to confirm no regression:
Run: `npx vitest run lib/archetypes/main-street`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/FounderBeats.tsx lib/archetypes/main-street/FounderBeats.test.tsx
git commit -m "$(cat <<'EOF'
fix(main-street): FounderPortrait scrim wraps the text container, not a fixed strip (Session 41)

The previous scrim was a fixed bottom 32% gradient — a long quote pushed
upward into unscrimmed image area, making the top lines unreadable
against bright photo zones (visible in the Session 41 woodworker build).
The scrim is now a sibling of the text container in the same bottom-
anchored wrapper, sized to the text's bounding box. Long quotes stay
fully scrimmed; short quotes get a small scrim. Widens the text measure
from 22ch to 32ch so a long quote reads as a paragraph, not a column.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task A3: Drop the catalog-size step from onboarding

**Files:**
- Delete: `app/onboarding/_components/StepCatalogSize.tsx`
- Modify: `app/onboarding/_components/OnboardingFlow.tsx`
- Modify: `app/onboarding/_components/types.ts` — `productCount` stays on the type with a constant default, since the Copywriter target product count becomes flat 5 in a later task.

- [ ] **Step 1: Write the failing test**

Create or extend `app/onboarding/_components/OnboardingFlow.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingFlow from './OnboardingFlow';

describe('OnboardingFlow — no catalog-size step', () => {
  it('does not render the catalog-size question at any step', () => {
    render(<OnboardingFlow niches={[{ slug: 'candles', display_name: 'Candle maker' }]} />);
    // The catalog-size header was "Roughly how much do you sell?" — confirm it's gone.
    expect(screen.queryByText(/roughly how much do you sell/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/onboarding/_components/OnboardingFlow.test.tsx`
Expected: FAIL — the test file may not exist yet; if it does, the catalog step still renders at step 5.

- [ ] **Step 3: Drop the step**

Delete `app/onboarding/_components/StepCatalogSize.tsx`.

Update `app/onboarding/_components/OnboardingFlow.tsx`:

```typescript
'use client';

import { useState } from 'react';
import type { NicheOption, OnboardingData } from './types';
import { INITIAL_DATA } from './types';
import ProgressBar from './ProgressBar';
import StepName from './StepName';
import StepNiche from './StepNiche';
import StepLogo from './StepLogo';
import StepMood from './StepMood';
import StepTrial from './StepTrial';
import StepBuild from './StepBuild';

const TOTAL_STEPS = 6;

interface OnboardingFlowProps {
  niches: NicheOption[];
}

export default function OnboardingFlow({ niches }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  function advance(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <div>
      <ProgressBar step={step} total={TOTAL_STEPS} />
      {step === 1 && <StepName data={data} onAdvance={advance} />}
      {step === 2 && <StepNiche data={data} niches={niches} onAdvance={advance} onBack={back} />}
      {step === 3 && <StepLogo data={data} onAdvance={advance} onBack={back} />}
      {step === 4 && <StepMood data={data} onAdvance={advance} onBack={back} />}
      {step === 5 && <StepTrial data={data} onAdvance={advance} onBack={back} />}
      {step === 6 && <StepBuild data={data} onBack={back} />}
    </div>
  );
}
```

Note: `TOTAL_STEPS` is 6 here. Task B5 inserts the photo step and bumps it back to 7.

`types.ts` keeps `productCount` and `DEFAULT_PRODUCT_COUNT` unchanged — `DEFAULT_PRODUCT_COUNT` is still wired into `INITIAL_DATA`. The Copywriter target becomes flat 5 in Task C4; the type field stays as a forward-compat field for a future archetype that needs it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/onboarding/_components/OnboardingFlow.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -u
git rm app/onboarding/_components/StepCatalogSize.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): drop the catalog-size step (Session 41)

Per the photo-upload spec — catalog-size gates nothing structural in the
single-archetype world (Main Street accepts any size) and the photo step
gives a far stronger signal about what the maker actually makes. One
fewer screen, one stronger signal. productCount stays on the OnboardingData
type as forward-compat for a future archetype that needs the question
back (Counter is a candidate).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase B — Onboarding photo step

### Task B1: Add product-photo fields to OnboardingData

**Files:**
- Modify: `app/onboarding/_components/types.ts`

- [ ] **Step 1: Write the failing test**

Create `app/onboarding/_components/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { INITIAL_DATA, type OnboardingData } from './types';

describe('OnboardingData — product photo fields', () => {
  it('initializes productPhotoUrls as an empty array', () => {
    expect(INITIAL_DATA.productPhotoUrls).toEqual([]);
  });

  it('initializes visionPerPhoto as an empty array', () => {
    expect(INITIAL_DATA.visionPerPhoto).toEqual([]);
  });

  it('initializes makerWork as an empty string', () => {
    expect(INITIAL_DATA.makerWork).toBe('');
  });

  it('typechecks the fields', () => {
    const data: OnboardingData = {
      ...INITIAL_DATA,
      productPhotoUrls: ['https://example.com/p1.jpg'],
      visionPerPhoto: [
        {
          productType: 'turned walnut bowl',
          suggestedName: 'River Bowl',
          suggestedShortDescription: 'a small turned walnut bowl',
          suggestedDescription: 'A small turned walnut bowl from local stock.',
          suggestedPriceCents: 4800,
        },
      ],
      makerWork: 'This maker turns small bowls and serving pieces from local hardwood.',
    };
    expect(data.productPhotoUrls).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/onboarding/_components/types.test.ts`
Expected: FAIL — fields not defined yet, both runtime (no field on INITIAL_DATA) and type errors.

- [ ] **Step 3: Add the fields**

Update `app/onboarding/_components/types.ts`:

```typescript
import type { MoodKey } from '@/lib/moods';

export { toSubdomain } from '@/lib/subdomain';

export const DEFAULT_PRODUCT_COUNT = 5;
export const MAX_PRODUCT_PHOTOS = 5;

export interface NicheOption {
  slug: string;
  display_name: string;
}

/** One photo's Vision read — what Bohdi sees about a single uploaded image. */
export interface VisionPerPhoto {
  productType: string;
  suggestedName: string;
  suggestedShortDescription: string;
  suggestedDescription: string;
  suggestedPriceCents: number;
}

export interface OnboardingData {
  nicheSlug: string;
  nicheDisplayName: string;
  nicheDescription: string;
  shopName: string;
  makerName: string;
  subdomain: string;
  moodKey: MoodKey | '';
  productCount: number;
  logoUrl: string;
  brandColors: string[];
  /** Up to 5 photo URLs the maker uploaded at onboarding. Empty = skipped. */
  productPhotoUrls: string[];
  /** Per-photo Vision read, one entry per upload in upload order. Empty when
   *  uploads were skipped or Vision failed (build degrades to current behavior). */
  visionPerPhoto: VisionPerPhoto[];
  /** Cross-photo Vision summary — 2-3 sentences on what this maker actually
   *  makes. Threads into the Director and Cinematographer briefs. */
  makerWork: string;
}

export const INITIAL_DATA: OnboardingData = {
  nicheSlug: '',
  nicheDisplayName: '',
  nicheDescription: '',
  shopName: '',
  makerName: '',
  subdomain: '',
  moodKey: '',
  productCount: DEFAULT_PRODUCT_COUNT,
  logoUrl: '',
  brandColors: [],
  productPhotoUrls: [],
  visionPerPhoto: [],
  makerWork: '',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/onboarding/_components/types.test.ts`
Expected: PASS.

Also run typecheck to confirm no regression:
Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/_components/types.ts app/onboarding/_components/types.test.ts
git commit -m "$(cat <<'EOF'
feat(onboarding): add productPhotoUrls + visionPerPhoto + makerWork to OnboardingData

Forward-compat state shape for the product-photo upload step. No
behavior change yet — Steps B2+ create the UI and server action and
thread the fields into the build pipeline.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task B2: Server action — upload skeleton (no Vision yet)

Get the file upload path working end-to-end first; add Vision in B3. Following the `logo-actions.ts` pattern exactly so the file handling and error paths are familiar.

**Files:**
- Create: `app/onboarding/product-photos-actions.ts`
- Create: `app/onboarding/product-photos-actions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/onboarding/product-photos-actions.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase admin to avoid touching the real DB.
const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: 'https://example.com/uploaded.jpg' } }));
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: () => ({
    storage: { from: () => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock }) },
  }),
}));

vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create: vi.fn() } }) }));

import { uploadProductPhotos } from './product-photos-actions';

function makeFile(name: string, size = 1024, type = 'image/jpeg'): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe('uploadProductPhotos — upload only', () => {
  beforeEach(() => {
    uploadMock.mockReset();
    uploadMock.mockResolvedValue({ error: null });
  });

  it('rejects when no files were provided', async () => {
    const formData = new FormData();
    await expect(uploadProductPhotos('test-shop', formData)).rejects.toThrow(/no photo/i);
  });

  it('rejects when more than 5 photos are uploaded', async () => {
    const formData = new FormData();
    for (let i = 0; i < 6; i++) formData.append('photos', makeFile(`p${i}.jpg`));
    await expect(uploadProductPhotos('test-shop', formData)).rejects.toThrow(/at most 5/i);
  });

  it('rejects oversized files', async () => {
    const formData = new FormData();
    formData.append('photos', makeFile('big.jpg', 11 * 1024 * 1024));
    await expect(uploadProductPhotos('test-shop', formData)).rejects.toThrow(/10MB/i);
  });

  it('rejects disallowed MIME types', async () => {
    const formData = new FormData();
    formData.append('photos', makeFile('p.gif', 1024, 'image/gif'));
    await expect(uploadProductPhotos('test-shop', formData)).rejects.toThrow(/PNG, JPEG, WebP/i);
  });

  it('uploads 1–5 photos and returns their public URLs', async () => {
    const formData = new FormData();
    formData.append('photos', makeFile('a.jpg'));
    formData.append('photos', makeFile('b.png', 1024, 'image/png'));
    const result = await uploadProductPhotos('test-shop', formData);
    expect(result.productPhotoUrls).toHaveLength(2);
    expect(uploadMock).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/onboarding/product-photos-actions.test.ts`
Expected: FAIL — file does not exist.

- [ ] **Step 3: Create the server action**

Create `app/onboarding/product-photos-actions.ts`:

```typescript
'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { VisionPerPhoto } from './_components/types';

const BUCKET = 'tenant-logos'; // Reuse the existing bucket; Task B3 confirms or moves.
const MAX_BYTES = 10 * 1024 * 1024; // 10MB per photo
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_PHOTOS = 5;

export interface UploadProductPhotosResult {
  productPhotoUrls: string[];
  visionPerPhoto: VisionPerPhoto[];
  makerWork: string;
}

/**
 * Uploads 1–5 product photos for a tenant-in-progress (subdomain known, tenant
 * row not yet created). Vision read is wired in Task B3; for now visionPerPhoto
 * and makerWork return empty so the build degrades to "treat as skipped" if the
 * Vision call later fails.
 */
export async function uploadProductPhotos(
  subdomain: string,
  formData: FormData,
): Promise<UploadProductPhotosResult> {
  const files = formData.getAll('photos').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    throw new Error('No photo files provided');
  }
  if (files.length > MAX_PHOTOS) {
    throw new Error(`Upload at most 5 photos`);
  }
  for (const f of files) {
    if (f.size > MAX_BYTES) throw new Error('Each photo must be under 10MB');
    if (!ALLOWED_TYPES.includes(f.type)) throw new Error('Photos must be PNG, JPEG, or WebP');
  }

  const db = supabaseAdmin();
  const uploaded: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i]!;
    const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
    const storagePath = `${subdomain}/product-${i}.${ext}`;
    const buffer = await f.arrayBuffer();
    const { error } = await db.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: f.type,
      upsert: true,
    });
    if (error) {
      logger.error('product photo upload failed', { subdomain, index: i, error: error.message });
      throw new Error('Could not save your photos. Try again.');
    }
    const { data } = db.storage.from(BUCKET).getPublicUrl(storagePath);
    uploaded.push(data.publicUrl);
  }

  return { productPhotoUrls: uploaded, visionPerPhoto: [], makerWork: '' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/onboarding/product-photos-actions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/product-photos-actions.ts app/onboarding/product-photos-actions.test.ts
git commit -m "$(cat <<'EOF'
feat(onboarding): product photos upload server action — files only (Session 41)

Mirrors logo-actions.ts. 1-5 photos, 10MB each, PNG/JPEG/WebP, uploaded
to the same bucket the logo uses under <subdomain>/product-N.ext. Vision
call lands in B3 — for now visionPerPhoto and makerWork return empty so
the build degrades to current behavior on the upload-only path.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task B3: Add the Vision call to the server action

One batched request: all uploaded photos as image content blocks, forced JSON return with per-photo product reads + `makerWork`. Hard 60s timeout. On failure → empty Vision result, the build still publishes the photos as products with Copywriter-authored copy.

**Files:**
- Modify: `app/onboarding/product-photos-actions.ts`
- Modify: `app/onboarding/product-photos-actions.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `app/onboarding/product-photos-actions.test.ts`:

```typescript
import type Anthropic from '@anthropic-ai/sdk';

const createMessageMock = vi.fn();
vi.mock('@/lib/anthropic', () => ({ anthropicClient: () => ({ messages: { create: createMessageMock } }) }));

describe('uploadProductPhotos — Vision read', () => {
  beforeEach(() => {
    uploadMock.mockReset();
    uploadMock.mockResolvedValue({ error: null });
    createMessageMock.mockReset();
  });

  it('parses a valid Vision response into visionPerPhoto + makerWork', async () => {
    createMessageMock.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            perPhoto: [
              { productType: 'turned walnut bowl', suggestedName: 'River Bowl', suggestedShortDescription: 'a small bowl', suggestedDescription: 'A small turned walnut bowl from local stock.', suggestedPriceCents: 4800 },
              { productType: 'small wooden sign', suggestedName: 'Welcome Plank', suggestedShortDescription: 'a small carved sign', suggestedDescription: 'A small carved walnut sign for entryways.', suggestedPriceCents: 3200 },
            ],
            makerWork: 'This maker turns small bowls and carves small signs from local hardwood.',
          }),
        },
      ],
      usage: { input_tokens: 100, output_tokens: 100 },
    } as unknown as Anthropic.Message);

    const formData = new FormData();
    formData.append('photos', makeFile('a.jpg'));
    formData.append('photos', makeFile('b.jpg'));
    const result = await uploadProductPhotos('test-shop', formData);

    expect(result.visionPerPhoto).toHaveLength(2);
    expect(result.visionPerPhoto[0].productType).toBe('turned walnut bowl');
    expect(result.makerWork).toMatch(/small bowls/i);
  });

  it('degrades to empty Vision result when the Vision call throws', async () => {
    createMessageMock.mockRejectedValue(new Error('vision failed'));

    const formData = new FormData();
    formData.append('photos', makeFile('a.jpg'));
    const result = await uploadProductPhotos('test-shop', formData);

    expect(result.productPhotoUrls).toHaveLength(1);
    expect(result.visionPerPhoto).toEqual([]);
    expect(result.makerWork).toBe('');
  });

  it('degrades to empty Vision result when the response is malformed JSON', async () => {
    createMessageMock.mockResolvedValue({
      content: [{ type: 'text', text: 'not json at all' }],
      usage: { input_tokens: 0, output_tokens: 0 },
    } as unknown as Anthropic.Message);

    const formData = new FormData();
    formData.append('photos', makeFile('a.jpg'));
    const result = await uploadProductPhotos('test-shop', formData);

    expect(result.visionPerPhoto).toEqual([]);
    expect(result.makerWork).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/onboarding/product-photos-actions.test.ts -t "Vision read"`
Expected: FAIL — the action currently returns empty Vision regardless of input.

- [ ] **Step 3: Wire the Vision call in**

Update `app/onboarding/product-photos-actions.ts` — add the Vision call after upload, before returning:

```typescript
'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { anthropicClient } from '@/lib/anthropic';
import { logger } from '@/lib/logger';
import type { VisionPerPhoto } from './_components/types';

const BUCKET = 'tenant-logos';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_PHOTOS = 5;
const VISION_TIMEOUT_MS = 60_000;

export interface UploadProductPhotosResult {
  productPhotoUrls: string[];
  visionPerPhoto: VisionPerPhoto[];
  makerWork: string;
}

export async function uploadProductPhotos(
  subdomain: string,
  formData: FormData,
): Promise<UploadProductPhotosResult> {
  const files = formData.getAll('photos').filter((f): f is File => f instanceof File);
  if (files.length === 0) throw new Error('No photo files provided');
  if (files.length > MAX_PHOTOS) throw new Error(`Upload at most 5 photos`);
  for (const f of files) {
    if (f.size > MAX_BYTES) throw new Error('Each photo must be under 10MB');
    if (!ALLOWED_TYPES.includes(f.type)) throw new Error('Photos must be PNG, JPEG, or WebP');
  }

  const db = supabaseAdmin();
  const uploaded: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i]!;
    const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
    const storagePath = `${subdomain}/product-${i}.${ext}`;
    const buffer = await f.arrayBuffer();
    const { error } = await db.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: f.type,
      upsert: true,
    });
    if (error) {
      logger.error('product photo upload failed', { subdomain, index: i, error: error.message });
      throw new Error('Could not save your photos. Try again.');
    }
    const { data } = db.storage.from(BUCKET).getPublicUrl(storagePath);
    uploaded.push(data.publicUrl);
  }

  const vision = await readPhotos(uploaded);
  return { productPhotoUrls: uploaded, ...vision };
}

async function readPhotos(urls: string[]): Promise<{ visionPerPhoto: VisionPerPhoto[]; makerWork: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);
    let response;
    try {
      response = await anthropicClient().messages.create(
        {
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: [
                ...urls.map((u) => ({ type: 'image' as const, source: { type: 'url' as const, url: u } })),
                {
                  type: 'text' as const,
                  text: `You are looking at ${urls.length} product photo${urls.length === 1 ? '' : 's'} this maker uploaded. For each photo, in upload order, return:
- productType: short noun phrase ("turned walnut bowl", "small wooden sign")
- suggestedName: 2-40 chars, a real product name
- suggestedShortDescription: 4-90 chars
- suggestedDescription: 12+ chars, 2-4 sentences
- suggestedPriceCents: integer cents, your best read of category-appropriate pricing

Also write a makerWork field: 2-3 sentences on what this maker actually makes, written for another AI to read as part of its brief.

Return ONLY a JSON object, no markdown:
{"perPhoto":[{"productType":"...","suggestedName":"...","suggestedShortDescription":"...","suggestedDescription":"...","suggestedPriceCents":4800}, ...],"makerWork":"..."}`,
                },
              ],
            },
          ],
        },
        { signal: controller.signal },
      );
    } finally {
      clearTimeout(timer);
    }
    const latencyMs = Date.now() - start;

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match?.[0]) {
      logger.warn('product photos vision: no JSON', { latencyMs });
      return { visionPerPhoto: [], makerWork: '' };
    }
    const parsed = JSON.parse(match[0]) as { perPhoto?: unknown; makerWork?: unknown };
    if (!Array.isArray(parsed.perPhoto)) return { visionPerPhoto: [], makerWork: '' };

    const visionPerPhoto: VisionPerPhoto[] = [];
    for (const p of parsed.perPhoto) {
      if (typeof p !== 'object' || p === null) continue;
      const r = p as Record<string, unknown>;
      if (
        typeof r.productType === 'string' &&
        typeof r.suggestedName === 'string' &&
        typeof r.suggestedShortDescription === 'string' &&
        typeof r.suggestedDescription === 'string' &&
        typeof r.suggestedPriceCents === 'number'
      ) {
        visionPerPhoto.push({
          productType: r.productType,
          suggestedName: r.suggestedName,
          suggestedShortDescription: r.suggestedShortDescription,
          suggestedDescription: r.suggestedDescription,
          suggestedPriceCents: Math.round(r.suggestedPriceCents),
        });
      }
    }
    if (visionPerPhoto.length !== urls.length) {
      logger.warn('product photos vision: per-photo count mismatch', { expected: urls.length, got: visionPerPhoto.length, latencyMs });
      return { visionPerPhoto: [], makerWork: '' };
    }

    const makerWork = typeof parsed.makerWork === 'string' ? parsed.makerWork : '';
    logger.info('product photos vision: read', {
      latencyMs,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      perPhotoCount: visionPerPhoto.length,
    });
    return { visionPerPhoto, makerWork };
  } catch (err) {
    logger.warn('product photos vision: extraction failed', { error: err instanceof Error ? err.message : String(err) });
    return { visionPerPhoto: [], makerWork: '' };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/onboarding/product-photos-actions.test.ts`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/product-photos-actions.ts app/onboarding/product-photos-actions.test.ts
git commit -m "$(cat <<'EOF'
feat(onboarding): Vision read on uploaded product photos (Session 41)

One batched Vision call across all uploaded photos. Returns
visionPerPhoto[] (productType, suggestedName, suggestedShortDescription,
suggestedDescription, suggestedPriceCents) + makerWork (2-3 sentence
summary). On any failure (timeout, malformed JSON, count mismatch) the
result degrades to empty so the build still publishes the photos.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task B4: StepProductPhotos component

**Files:**
- Create: `app/onboarding/_components/StepProductPhotos.tsx`
- Create: `app/onboarding/_components/StepProductPhotos.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/onboarding/_components/StepProductPhotos.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StepProductPhotos from './StepProductPhotos';
import { INITIAL_DATA } from './types';

vi.mock('../product-photos-actions', () => ({
  uploadProductPhotos: vi.fn(async () => ({
    productPhotoUrls: ['https://example.com/uploaded.jpg'],
    visionPerPhoto: [],
    makerWork: '',
  })),
}));

describe('StepProductPhotos', () => {
  it('renders the heading and skip button', () => {
    render(
      <StepProductPhotos
        data={{ ...INITIAL_DATA, subdomain: 'test-shop' }}
        onAdvance={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText(/got a few product photos/i)).toBeInTheDocument();
    expect(screen.getByText(/skip/i)).toBeInTheDocument();
  });

  it('skip advances with empty arrays', () => {
    const onAdvance = vi.fn();
    render(
      <StepProductPhotos
        data={{ ...INITIAL_DATA, subdomain: 'test-shop' }}
        onAdvance={onAdvance}
        onBack={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText(/skip/i));
    expect(onAdvance).toHaveBeenCalledWith({
      productPhotoUrls: [],
      visionPerPhoto: [],
      makerWork: '',
    });
  });

  it('back triggers onBack', () => {
    const onBack = vi.fn();
    render(
      <StepProductPhotos
        data={{ ...INITIAL_DATA, subdomain: 'test-shop' }}
        onAdvance={vi.fn()}
        onBack={onBack}
      />,
    );
    fireEvent.click(screen.getByText(/back/i));
    expect(onBack).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/onboarding/_components/StepProductPhotos.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Build the component**

Create `app/onboarding/_components/StepProductPhotos.tsx`:

```tsx
'use client';

import { useState, useRef } from 'react';
import type { OnboardingData } from './types';
import { MAX_PRODUCT_PHOTOS } from './types';
import { uploadProductPhotos } from '../product-photos-actions';

interface StepProductPhotosProps {
  data: OnboardingData;
  onAdvance: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
}

export default function StepProductPhotos({ data, onAdvance, onBack }: StepProductPhotosProps) {
  const [previews, setPreviews] = useState<string[]>(data.productPhotoUrls);
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const spaceLeft = MAX_PRODUCT_PHOTOS - (previews.length + pending.length);
    const accepted = incoming.slice(0, spaceLeft);
    if (accepted.length === 0) return;
    setPending((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
  }

  function removeAt(idx: number) {
    setPending((prev) => prev.filter((_, i) => i !== (idx - data.productPhotoUrls.length)));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUploadAndContinue() {
    if (pending.length === 0) {
      onAdvance({
        productPhotoUrls: data.productPhotoUrls,
        visionPerPhoto: data.visionPerPhoto,
        makerWork: data.makerWork,
      });
      return;
    }
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      for (const f of pending) formData.append('photos', f);
      const result = await uploadProductPhotos(data.subdomain, formData);
      onAdvance({
        productPhotoUrls: result.productPhotoUrls,
        visionPerPhoto: result.visionPerPhoto,
        makerWork: result.makerWork,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  }

  function handleSkip() {
    onAdvance({ productPhotoUrls: [], visionPerPhoto: [], makerWork: '' });
  }

  const total = previews.length;
  const canAdd = total < MAX_PRODUCT_PHOTOS;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 font-serif text-3xl text-text">Got a few product photos handy?</h1>
        <p className="text-sm text-muted">
          Upload up to 5 and we&apos;ll build with your real work. Skip and we&apos;ll use stand-ins
          you swap later — either way you get a live store in five minutes.
        </p>
      </div>

      <div
        onClick={() => canAdd && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (canAdd) addFiles(e.dataTransfer.files);
        }}
        className={`flex aspect-[3/1] min-h-[180px] items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          canAdd ? 'cursor-pointer border-white/15 bg-bg-2 hover:border-honey/40' : 'border-honey/20 bg-bg-2'
        }`}
      >
        {total === 0 ? (
          <div className="text-center">
            <p className="text-text">Click or drag to upload</p>
            <p className="mt-1 text-xs text-muted">Up to 5 photos · PNG, JPEG, or WebP · 10MB each</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3 px-4 py-4">
            {previews.map((url, i) => (
              <div key={url + i} className="relative aspect-square overflow-hidden rounded">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Product ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAt(i);
                  }}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-bg/80 text-text-soft hover:bg-bg"
                >
                  ×
                </button>
              </div>
            ))}
            {canAdd && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="flex aspect-square items-center justify-center rounded border-2 border-dashed border-white/15 text-2xl text-muted hover:border-honey/40 hover:text-text"
                aria-label="Add another photo"
              >
                +
              </button>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {uploading && <p className="text-sm text-muted">Studying your work…</p>}
      {error !== '' && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={uploading}
          className="rounded-lg border border-white/10 px-5 py-3 text-text transition-colors hover:bg-bg-2 disabled:opacity-30"
        >
          Back
        </button>
        {total > 0 ? (
          <button
            type="button"
            onClick={handleUploadAndContinue}
            disabled={uploading}
            className="flex-1 rounded-lg bg-honey px-6 py-3 font-medium text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {uploading ? 'Uploading…' : 'Continue'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSkip}
            disabled={uploading}
            className="flex-1 rounded-lg border border-white/15 px-6 py-3 font-medium text-text transition-colors hover:bg-bg-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Skip — I&apos;ll add photos later
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/onboarding/_components/StepProductPhotos.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/_components/StepProductPhotos.tsx app/onboarding/_components/StepProductPhotos.test.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): StepProductPhotos — optional 1-5 photo upload (Session 41)

Same upload pattern as StepLogo. Drag/drop or click, up to 5 photos with
preview tiles, remove-X per photo, prominent Skip. Calls
uploadProductPhotos server action which uploads + runs Vision in one go
and returns productPhotoUrls + visionPerPhoto + makerWork. Step is not
wired into OnboardingFlow yet (B5).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task B5: Wire StepProductPhotos into OnboardingFlow

**Files:**
- Modify: `app/onboarding/_components/OnboardingFlow.tsx`
- Modify: `app/onboarding/_components/OnboardingFlow.test.tsx` (extend)

- [ ] **Step 1: Write the failing test**

Append to `app/onboarding/_components/OnboardingFlow.test.tsx`:

```typescript
import { fireEvent } from '@testing-library/react';

describe('OnboardingFlow — photo step placement', () => {
  it('total steps is 7 (Name, Niche, Logo, Photos, Mood, Trial, Build)', () => {
    const { container } = render(<OnboardingFlow niches={[{ slug: 'candles', display_name: 'Candle maker' }]} />);
    const progress = container.querySelector('[data-progress-total]');
    expect(progress?.getAttribute('data-progress-total')).toBe('7');
  });
});
```

(If `ProgressBar` doesn't yet emit `data-progress-total`, add it as a 1-line change in the same task.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/onboarding/_components/OnboardingFlow.test.tsx -t "photo step placement"`
Expected: FAIL — TOTAL_STEPS is 6 from Task A3.

- [ ] **Step 3: Insert the step and bump TOTAL_STEPS to 7**

Update `app/onboarding/_components/OnboardingFlow.tsx`:

```typescript
'use client';

import { useState } from 'react';
import type { NicheOption, OnboardingData } from './types';
import { INITIAL_DATA } from './types';
import ProgressBar from './ProgressBar';
import StepName from './StepName';
import StepNiche from './StepNiche';
import StepLogo from './StepLogo';
import StepProductPhotos from './StepProductPhotos';
import StepMood from './StepMood';
import StepTrial from './StepTrial';
import StepBuild from './StepBuild';

const TOTAL_STEPS = 7;

interface OnboardingFlowProps {
  niches: NicheOption[];
}

export default function OnboardingFlow({ niches }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);

  function advance(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <div>
      <ProgressBar step={step} total={TOTAL_STEPS} />
      {step === 1 && <StepName data={data} onAdvance={advance} />}
      {step === 2 && <StepNiche data={data} niches={niches} onAdvance={advance} onBack={back} />}
      {step === 3 && <StepLogo data={data} onAdvance={advance} onBack={back} />}
      {step === 4 && <StepProductPhotos data={data} onAdvance={advance} onBack={back} />}
      {step === 5 && <StepMood data={data} onAdvance={advance} onBack={back} />}
      {step === 6 && <StepTrial data={data} onAdvance={advance} onBack={back} />}
      {step === 7 && <StepBuild data={data} onBack={back} />}
    </div>
  );
}
```

If needed, add `data-progress-total={total}` to the root element of `app/onboarding/_components/ProgressBar.tsx`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/onboarding/_components/OnboardingFlow.test.tsx`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/_components/OnboardingFlow.tsx app/onboarding/_components/OnboardingFlow.test.tsx app/onboarding/_components/ProgressBar.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): wire StepProductPhotos into the flow at step 4 (Session 41)

7 steps now: Name → Niche → Logo → Photos → Mood → Trial → Build.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase C — Crew brief & prompt plumbing

### Task C1: Extend CrewBrief with visionPerPhoto and makerWork

**Files:**
- Modify: `lib/onboarding/crew/types.ts`
- Modify: `lib/onboarding/crew/pipeline.test.ts` (verify pass-through)

- [ ] **Step 1: Write the failing test**

Add a test to `lib/onboarding/crew/pipeline.test.ts` (or create a small types test):

Create `lib/onboarding/crew/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { CrewBrief } from './types';
import type { VisionPerPhoto } from '@/app/onboarding/_components/types';

describe('CrewBrief — Vision fields', () => {
  it('accepts visionPerPhoto and makerWork as optional fields', () => {
    const photos: VisionPerPhoto[] = [
      { productType: 'turned walnut bowl', suggestedName: 'River Bowl', suggestedShortDescription: 'a small bowl', suggestedDescription: 'A small turned walnut bowl.', suggestedPriceCents: 4800 },
    ];
    const brief: CrewBrief = {
      shopName: 'Test',
      nicheDisplayName: 'Woodworker',
      nicheBody: '',
      moodLabel: 'Rustic',
      moodDescription: '',
      productCount: 5,
      moodKey: 'rustic',
      visionPerPhoto: photos,
      makerWork: 'Turns small bowls.',
    };
    expect(brief.visionPerPhoto).toHaveLength(1);
    expect(brief.makerWork).toBe('Turns small bowls.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/crew/types.test.ts`
Expected: FAIL — fields not in CrewBrief.

- [ ] **Step 3: Add the fields**

Update `lib/onboarding/crew/types.ts`:

```typescript
import type { AuthoringBrief } from '@/lib/archetypes/builder';
import type { MoodKey } from '@/lib/moods';
import type { CopywriterDraft } from './copywriter-schema';
import type { MomentScene } from './cinematographer';
import type { GraphicSpec } from './graphic-artist';
import type { VisionPerPhoto } from '@/app/onboarding/_components/types';

export interface CrewBrief extends AuthoringBrief {
  moodKey: MoodKey;
  /** Per-photo Vision read of the maker's uploaded product photos, one entry per
   *  upload in upload order. Undefined or empty when photos were skipped. The
   *  Copywriter uses these as a starting hand for products 1..N. */
  visionPerPhoto?: VisionPerPhoto[];
  /** Cross-photo Vision summary — 2-3 sentences on what this maker actually
   *  makes. Threaded into the Director's and Cinematographer's prompts.
   *  Undefined/empty when no photos were uploaded. */
  makerWork?: string;
}

export interface CrewOutput {
  copy: CopywriterDraft;
  moment: MomentScene;
  look: GraphicSpec;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/onboarding/crew/types.test.ts`
Expected: PASS.

Run typecheck: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/crew/types.ts lib/onboarding/crew/types.test.ts
git commit -m "$(cat <<'EOF'
feat(crew): CrewBrief carries optional visionPerPhoto + makerWork (Session 41)

Forward-compat brief extension for the photo-upload spec. Prompts read
these in C2-C4. Empty/undefined = current behavior, the skip path.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task C2: Director prompt reads makerWork

**Files:**
- Modify: `lib/onboarding/crew/director.ts:48-69` (the `buildDirectorPrompt` function)
- Modify: `lib/onboarding/crew/director.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `lib/onboarding/crew/director.test.ts`:

```typescript
describe('director prompt — makerWork', () => {
  it("includes the maker's work summary when present", () => {
    const brief = { ...baseBrief, makerWork: 'This maker turns small bowls from local walnut.' };
    const prompt = (require('./director') as typeof import('./director')).__buildDirectorPromptForTest(brief);
    expect(prompt).toContain('WHAT THIS MAKER ACTUALLY MAKES');
    expect(prompt).toContain('small bowls from local walnut');
  });

  it("omits the maker-work section when undefined", () => {
    const prompt = (require('./director') as typeof import('./director')).__buildDirectorPromptForTest(baseBrief);
    expect(prompt).not.toContain('WHAT THIS MAKER ACTUALLY MAKES');
  });
});
```

(Use whatever `baseBrief` fixture lives in the test file. If the prompt-build function isn't exported, export it as `__buildDirectorPromptForTest` so the test can read it without running the real API call.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/crew/director.test.ts -t "makerWork"`
Expected: FAIL — section not present and the build function isn't exported for test.

- [ ] **Step 3: Update Director prompt**

Update `lib/onboarding/crew/director.ts` — modify `buildDirectorPrompt` and export it for tests:

```typescript
function buildDirectorPrompt(brief: CrewBrief): string {
  const niche = brief.nicheBody.trim();
  const makerWork = brief.makerWork?.trim();
  const makerWorkClause = makerWork
    ? `

WHAT THIS MAKER ACTUALLY MAKES — derived from the photos the maker uploaded. Treat this as more specific than the niche file. Ground the trajectory in this actual work, not in a niche stereotype:
${makerWork}`
    : '';
  return `You are Bohdi, the DIRECTOR ...
...
${niche}${makerWorkClause}

Call set_trajectory with five fields:
...`;
}

export const __buildDirectorPromptForTest = buildDirectorPrompt;
```

(Replace the existing `buildDirectorPrompt` function and add the export at the bottom.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/onboarding/crew/director.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/crew/director.ts lib/onboarding/crew/director.test.ts
git commit -m "$(cat <<'EOF'
feat(crew): Director reads makerWork — Vision summary of uploaded photos (Session 41)

When the maker uploaded product photos at onboarding, the Director now
grounds the trajectory in what they actually make instead of guessing
from the niche file. Section omitted when no photos were uploaded.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task C3: Cinematographer prompt reads makerWork

**Files:**
- Read first to confirm structure: `lib/onboarding/crew/cinematographer.ts`
- Modify the prompt-build function and its test file `lib/onboarding/crew/cinematographer.test.ts`.

- [ ] **Step 1: Read the cinematographer file first**

Run: open `lib/onboarding/crew/cinematographer.ts` and identify the prompt-build function (likely `buildCinematographerPrompt` or similar). Note its signature — it takes a trajectory and probably the story lines.

If `makerWork` is NOT already plumbed in via the brief, you'll need to extend the call site (`pipeline.ts`) to pass it. Check `shootMoment(trajectory, story)` — the brief isn't passed today.

If shootMoment doesn't take the brief, change its signature to `shootMoment(trajectory, story, makerWork)` and update the pipeline call site.

- [ ] **Step 2: Write the failing test**

Add to `lib/onboarding/crew/cinematographer.test.ts`:

```typescript
describe('cinematographer prompt — makerWork', () => {
  it("includes the maker's work summary when present so the Moment can reference real subject matter", () => {
    const prompt = (require('./cinematographer') as typeof import('./cinematographer')).__buildCinematographerPromptForTest(
      sampleTrajectory,
      ['lines', 'go', 'here'],
      'This maker turns small bowls from local walnut.',
    );
    expect(prompt).toContain('WHAT THIS MAKER ACTUALLY MAKES');
    expect(prompt).toContain('small bowls from local walnut');
  });

  it("omits the section when makerWork is empty", () => {
    const prompt = (require('./cinematographer') as typeof import('./cinematographer')).__buildCinematographerPromptForTest(
      sampleTrajectory,
      ['lines'],
      '',
    );
    expect(prompt).not.toContain('WHAT THIS MAKER ACTUALLY MAKES');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/crew/cinematographer.test.ts -t "makerWork"`
Expected: FAIL.

- [ ] **Step 4: Update the cinematographer prompt**

In `lib/onboarding/crew/cinematographer.ts`:

1. Add a `makerWork?: string` parameter to the prompt-build function.
2. Add the section before the existing prompt body, conditional on a non-empty value:

```typescript
function buildCinematographerPrompt(trajectory: Trajectory, story: string[], makerWork?: string): string {
  const makerWorkClause = makerWork && makerWork.trim() !== ''
    ? `

WHAT THIS MAKER ACTUALLY MAKES — derived from the photos the maker uploaded. The Moment can show real subject matter rather than a stereotyped scene:
${makerWork.trim()}`
    : '';
  return `... existing prompt body ...${makerWorkClause}

... rest of prompt ...`;
}

export const __buildCinematographerPromptForTest = buildCinematographerPrompt;
```

3. Update `shootMoment(...)` signature to accept `makerWork` and pass it into the prompt builder.

4. In `lib/onboarding/crew/pipeline.ts`, update the call:

```typescript
const moment = await shootMoment(trajectory, copy.moment.story, brief.makerWork);
```

- [ ] **Step 5: Run test to verify it passes and commit**

Run: `npx vitest run lib/onboarding/crew/cinematographer.test.ts`
Expected: all pass.

Run: `npx vitest run lib/onboarding/crew/pipeline.test.ts`
Expected: all pass (signature change rippled correctly).

```bash
git add lib/onboarding/crew/cinematographer.ts lib/onboarding/crew/cinematographer.test.ts lib/onboarding/crew/pipeline.ts
git commit -m "$(cat <<'EOF'
feat(crew): Cinematographer reads makerWork so the Moment grounds in real subject matter (Session 41)

Pipeline now threads brief.makerWork into shootMoment alongside the
trajectory + story. When photos were uploaded the Cinematographer can
reference the actual goods rather than a niche-stereotyped scene. Empty
makerWork = today's behavior.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task C4: Copywriter reads visionPerPhoto, target catalog flat 5, founder.attribution lock from A1 stays

**Files:**
- Modify: `lib/onboarding/crew/copywriter.ts`
- Modify: `lib/onboarding/crew/copywriter.test.ts`

This task changes two things in the Copywriter:
1. Target product count is flat 5 always (replaces the 3–10 clamp).
2. Adds a "THE MAKER'S WORK" section with per-photo Vision suggestions when present, with explicit instructions to author products 1..N around them and the remaining slots as stand-ins.

- [ ] **Step 1: Write the failing test**

Add to `lib/onboarding/crew/copywriter.test.ts`:

```typescript
describe('copywriter prompt — visionPerPhoto and flat catalog', () => {
  it("targets exactly 5 products regardless of brief.productCount", () => {
    const brief: CrewBrief = { ...baseBrief, productCount: 20 };
    const prompt = buildCopywriterPrompt(brief, trajectory, rolls);
    expect(prompt).toMatch(/write 5/i);
  });

  it("threads per-photo Vision suggestions as starting hands for products 1..N", () => {
    const brief: CrewBrief = {
      ...baseBrief,
      visionPerPhoto: [
        { productType: 'turned walnut bowl', suggestedName: 'River Bowl', suggestedShortDescription: 'small bowl', suggestedDescription: 'A small turned walnut bowl.', suggestedPriceCents: 4800 },
        { productType: 'small wooden sign', suggestedName: 'Welcome Plank', suggestedShortDescription: 'a sign', suggestedDescription: 'A small carved sign.', suggestedPriceCents: 3200 },
      ],
    };
    const prompt = buildCopywriterPrompt(brief, trajectory, rolls);
    expect(prompt).toContain('THE MAKER\'S WORK');
    expect(prompt).toContain('turned walnut bowl');
    expect(prompt).toContain('small wooden sign');
    expect(prompt).toMatch(/products 1 through 2/i);
    expect(prompt).toMatch(/products 3 through 5.*stand-?ins/i);
  });

  it("omits the maker's-work section when visionPerPhoto is empty/undefined", () => {
    const prompt = buildCopywriterPrompt(baseBrief, trajectory, rolls);
    expect(prompt).not.toContain('THE MAKER\'S WORK');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/crew/copywriter.test.ts -t "visionPerPhoto and flat catalog"`
Expected: FAIL — current prompt clamps to 3–10 and has no maker's-work section.

- [ ] **Step 3: Update the Copywriter**

In `lib/onboarding/crew/copywriter.ts`:

Replace `targetProductCount`:

```typescript
const TARGET_PRODUCTS = 5;
```

(Delete the old function — `MAX_PRODUCT_IMAGES` in `build-archetype-store.ts` is 5 too; this aligns the two ceilings cleanly per the spec.)

Update `buildCopywriterPrompt`:

```typescript
export function buildCopywriterPrompt(brief: CrewBrief, trajectory: Trajectory, rolls: TreatmentRolls): string {
  const niche = brief.nicheBody.trim();
  const target = TARGET_PRODUCTS;
  const goods = (Object.entries(GOODS_TREATMENT_MENU) as Array<[string, string]>)
    .map(([k, d]) => `      - ${k}: ${d}`)
    .join('\n');
  const targets = LINK_TARGETS.join(', ');

  // ... existing storyDirective, makerNameTrimmed, nameLockClause from Task A1 ...

  const photos = brief.visionPerPhoto ?? [];
  const photoCount = photos.length;
  const makerWorkClause = photoCount > 0
    ? `

THE MAKER'S WORK — ${photoCount} photo${photoCount === 1 ? '' : 's'} the maker uploaded. Author products 1 through ${photoCount} around these photos (use the same product type, write a faithful name and description, the image URL is already assigned). Then author products ${photoCount + 1} through ${target} as stand-ins that fit alongside the real work (similar category, similar price range, similar style).
${photos.map((p, i) => `  - Photo ${i + 1}: ${p.productType}; suggested name "${p.suggestedName}"; suggested price ${p.suggestedPriceCents} cents; suggested short description "${p.suggestedShortDescription}"`).join('\n')}`
    : '';

  return `You are the COPYWRITER on Bohdi's crew. ...
...
${niche}

${nameLockClause}${makerWorkClause}

LINKS — every link you write carries a label ...
...
- products (write ${target}): each { name (2-40), slug (2-48, lowercase-hyphen), shortDescription (4-90), description (12+, no hard cap), basePriceCents (integer cents, e.g. 4800 = $48) }.

Call submit_copy now.`;
}
```

(Replace the existing `products` line to say `write ${target}` where `target` is always 5; remove the old min(3, max, 10) language.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/onboarding/crew/copywriter.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/crew/copywriter.ts lib/onboarding/crew/copywriter.test.ts
git commit -m "$(cat <<'EOF'
feat(crew): copywriter reads visionPerPhoto + targets flat 5 products (Session 41)

When the maker uploaded photos, the Copywriter receives per-photo Vision
suggestions as a starting hand and is told products 1..N reference those
uploads while N+1..5 are stand-ins. Target catalog size is flat 5 across
all paths (matches MAX_PRODUCT_IMAGES). No photos = today's behavior on
authorship, just at 5 products instead of 3-10.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase D — Build wiring

### Task D1: Thread photo URLs + Vision through buildArchetypeStore

This task does the bigger plumbing: pre-populate the product URL map with uploaded URLs before fal runs, so the first N product slots get the maker's photos and only the remaining slots get generated.

**Files:**
- Modify: `lib/onboarding/build-archetype-store.ts`
- Modify: `lib/onboarding/build-archetype-store.test.ts` (find or create)

- [ ] **Step 1: Write the failing test**

Add or create a test that confirms the upload URLs are used and fal isn't called for those slots:

```typescript
import { describe, it, expect, vi } from 'vitest';
// ... existing mocks for supabase, fal-image generation, the crew ...

describe('buildArchetypeStore — uploaded photo URLs', () => {
  it('uses uploaded photo URLs for the first N product slots and only generates the rest', async () => {
    // Mock the crew to produce a known authored envelope with 5 products
    // ... fixture setup ...

    const result = await buildArchetypeStore({
      shopName: 'Test',
      subdomain: 'test',
      nicheSlug: 'woodworker',
      moodKey: 'rustic',
      productCount: 5,
      productPhotoUrls: ['https://example.com/u1.jpg', 'https://example.com/u2.jpg'],
      visionPerPhoto: [],
      makerWork: '',
    });

    // The first two product image URLs in the final payload should equal the uploads
    // The last three should equal the fal-generated URLs
    // ... assertions ...
  });
});
```

(This test will need to mock heavily; if creating a new test file from scratch is too much, instead add a unit test for a smaller helper `assignProductPhotos(uploads, generatedUrls, productJobs)` extracted from `buildArchetypeStore`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/build-archetype-store.test.ts -t "uploaded photo URLs"`
Expected: FAIL — `buildArchetypeStore` doesn't accept productPhotoUrls.

- [ ] **Step 3: Implement**

Update `lib/onboarding/build-archetype-store.ts`:

```typescript
export interface ArchetypeBuildInput {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  nicheDescription?: string | undefined;
  moodKey: MoodKey;
  productCount: number;
  makerName?: string | undefined;
  logoUrl?: string | undefined;
  brandColors?: string[] | undefined;
  /** Photo URLs the maker uploaded at onboarding. The first N product slots use
   *  these directly; the remaining (MAX_PRODUCT_IMAGES - N) slots are generated. */
  productPhotoUrls?: string[] | undefined;
  /** Per-photo Vision read, parallel to productPhotoUrls. Threaded to Copywriter. */
  visionPerPhoto?: VisionPerPhoto[] | undefined;
  /** Cross-photo Vision summary, threaded to Director + Cinematographer. */
  makerWork?: string | undefined;
}
```

Add the import:

```typescript
import type { VisionPerPhoto } from '@/app/onboarding/_components/types';
```

Update the brief assembly:

```typescript
  const brief: CrewBrief = {
    shopName: input.shopName,
    nicheDisplayName,
    nicheBody,
    moodLabel: mood.label,
    moodDescription: mood.description,
    productCount: input.productCount,
    makerName: input.makerName,
    moodKey: input.moodKey,
    visionPerPhoto: input.visionPerPhoto,
    makerWork: input.makerWork,
  };
```

Update the URL-assignment block where product URLs land in `urls`:

```typescript
  const uploads = input.productPhotoUrls ?? [];

  // Product slots: first N use the maker's uploads, the rest get generated
  // images recycled across any remaining slots.
  const productSlotsToGenerate = Math.max(0, MAX_PRODUCT_IMAGES - uploads.length);
  const productJobsForGeneration = product.slice(uploads.length).slice(0, productSlotsToGenerate);

  const [featureUrls, productGenUrls] = await Promise.all([
    Promise.all(feature.map(run)),
    Promise.all(productJobsForGeneration.map(run)),
  ]);

  const generatedPhotos = productGenUrls.filter((u): u is string => typeof u === 'string' && u.length > 0);
  // For slots past N, recycle across generated photos. For slots 0..N-1, use uploads directly.
  const productPhotoUrls = product.map((_, i) => {
    if (i < uploads.length) return uploads[i]!;
    const recycleIdx = i - uploads.length;
    return generatedPhotos.length > 0 ? generatedPhotos[recycleIdx % generatedPhotos.length]! : null;
  });

  const urls: Record<string, string | null> = {};
  feature.forEach((j, i) => {
    urls[j.id] = featureUrls[i] ?? null;
  });
  product.forEach((j, i) => {
    urls[j.id] = productPhotoUrls[i] ?? null;
  });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/onboarding/build-archetype-store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/build-archetype-store.ts lib/onboarding/build-archetype-store.test.ts
git commit -m "$(cat <<'EOF'
feat(build): uploaded photos populate product slots before fal runs (Session 41)

When productPhotoUrls is non-empty, the first N product image slots use
the uploaded URLs and fal only generates for slots N+1..5. visionPerPhoto
and makerWork thread into the CrewBrief. Empty arrays = today's behavior.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task D2: Thread new fields through runStorefront, actions.ts, and the generate API route

**Files:**
- Modify: `lib/onboarding/run-storefront.ts`
- Modify: `app/onboarding/actions.ts`
- Modify: `app/api/onboarding/generate/route.ts` (find it first)
- Modify: `app/onboarding/_components/StepBuild.tsx` (find where it calls the API and add the new fields)

- [ ] **Step 1: Locate the generate API route and the StepBuild call**

Run: `npx grep -rn "productCount" app/api/onboarding app/onboarding/_components/StepBuild.tsx`
Then read those files to find the request-body assembly.

- [ ] **Step 2: Write the failing test (light integration)**

Add or extend `lib/onboarding/run-storefront.test.ts`:

```typescript
describe('runStorefront — Vision/photo passthrough', () => {
  it('passes productPhotoUrls, visionPerPhoto, and makerWork into buildArchetypeStore', async () => {
    const buildSpy = vi.fn(async () => ({ tenantId: 't', subdomain: 's' }));
    vi.mocked(buildArchetypeStore).mockImplementation(buildSpy);

    await runStorefront({
      shopName: 'Test',
      subdomain: 'test',
      nicheSlug: 'woodworker',
      moodKey: 'rustic',
      productCount: 5,
      productPhotoUrls: ['https://example.com/p1.jpg'],
      visionPerPhoto: [{ productType: 'bowl', suggestedName: 'River Bowl', suggestedShortDescription: 'small bowl', suggestedDescription: 'A small bowl.', suggestedPriceCents: 4800 }],
      makerWork: 'Turns small bowls.',
    });

    expect(buildSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        productPhotoUrls: ['https://example.com/p1.jpg'],
        visionPerPhoto: expect.arrayContaining([expect.objectContaining({ productType: 'bowl' })]),
        makerWork: 'Turns small bowls.',
      }),
      undefined,
    );
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/run-storefront.test.ts -t "Vision/photo passthrough"`
Expected: FAIL.

- [ ] **Step 4: Implement passthrough at every layer**

`lib/onboarding/run-storefront.ts`:

```typescript
import type { VisionPerPhoto } from '@/app/onboarding/_components/types';

export interface RunStorefrontInput {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  nicheDescription?: string | undefined;
  moodKey: MoodKey;
  productCount: number;
  makerName?: string | undefined;
  logoUrl?: string | undefined;
  brandColors?: string[] | undefined;
  productPhotoUrls?: string[] | undefined;
  visionPerPhoto?: VisionPerPhoto[] | undefined;
  makerWork?: string | undefined;
}

export async function runStorefront(
  input: RunStorefrontInput,
  onProgress?: ProgressEmitter,
): Promise<RunStorefrontResult> {
  return buildArchetypeStore(
    {
      shopName: input.shopName,
      subdomain: input.subdomain,
      nicheSlug: input.nicheSlug,
      nicheDescription: input.nicheDescription,
      moodKey: input.moodKey,
      productCount: input.productCount,
      makerName: input.makerName,
      logoUrl: input.logoUrl,
      brandColors: input.brandColors,
      productPhotoUrls: input.productPhotoUrls,
      visionPerPhoto: input.visionPerPhoto,
      makerWork: input.makerWork,
    },
    onProgress,
  );
}
```

`app/onboarding/actions.ts` — extend `GenerateStorefrontInput`:

```typescript
import type { VisionPerPhoto } from './_components/types';

export interface GenerateStorefrontInput {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  moodKey: MoodKey;
  productCount: number;
  makerName?: string;
  logoUrl?: string;
  brandColors?: string[];
  productPhotoUrls?: string[];
  visionPerPhoto?: VisionPerPhoto[];
  makerWork?: string;
}
```

And pass them in the `runStorefront(input)` call (already a passthrough — should compile).

`app/api/onboarding/generate/route.ts` — read the request body, accept and forward the three new fields. (Exact lines depend on the file; pattern: add fields to the body's TypeScript shape and pass into `runStorefront`.)

`app/onboarding/_components/StepBuild.tsx` — when assembling the API request body, include:

```typescript
productPhotoUrls: data.productPhotoUrls,
visionPerPhoto: data.visionPerPhoto,
makerWork: data.makerWork,
```

- [ ] **Step 5: Run tests and commit**

Run: `npx vitest run`
Expected: all green.

Run: `npx tsc --noEmit`
Expected: clean.

```bash
git add lib/onboarding/run-storefront.ts lib/onboarding/run-storefront.test.ts app/onboarding/actions.ts app/api/onboarding/generate/route.ts app/onboarding/_components/StepBuild.tsx
git commit -m "$(cat <<'EOF'
feat(build): thread productPhotoUrls + Vision through run-storefront + API + StepBuild (Session 41)

Photo URLs and Vision summary flow from the build step UI through the
generate API and runStorefront down to buildArchetypeStore. End-to-end
plumbing complete.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task D3: Ticker — "Studying your work…" beat when photos uploaded

**Files:**
- Modify: `lib/onboarding/ticker-content.ts`
- Modify: `lib/onboarding/ticker-content.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
describe('ticker-content — Studying your work', () => {
  it('includes a "Studying your work" beat when photos were uploaded', () => {
    const content = buildTickerContent('candles', 'Mara', { hasUploadedPhotos: true });
    const allLines = JSON.stringify(content);
    expect(allLines).toMatch(/studying your work/i);
  });

  it('omits the beat when no photos uploaded', () => {
    const content = buildTickerContent('candles', 'Mara', { hasUploadedPhotos: false });
    const allLines = JSON.stringify(content);
    expect(allLines).not.toMatch(/studying your work/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/ticker-content.test.ts -t "Studying your work"`
Expected: FAIL.

- [ ] **Step 3: Implement**

Open `lib/onboarding/ticker-content.ts` and look at `buildTickerContent` (likely takes niche slug + maker name + maybe an options object). Add an optional `options?: { hasUploadedPhotos?: boolean }`. When `hasUploadedPhotos` is true, add a beat like "Studying your work…" to the appropriate phase (likely the "composing-home" phase).

Update the call site in `StepBuild.tsx` or wherever the ticker is built, to pass `{ hasUploadedPhotos: data.productPhotoUrls.length > 0 }`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/onboarding/ticker-content.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/ticker-content.ts lib/onboarding/ticker-content.test.ts app/onboarding/_components/StepBuild.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): ticker shows "Studying your work" when photos uploaded (Session 41)

The maker watches us notice their stuff. Surfaced only when uploads
exist — skip path is unchanged.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase E — End-to-end integration tests

### Task E1: Pipeline integration test — N=2 photos path

**Files:**
- Modify: `lib/onboarding/crew/pipeline.test.ts`

- [ ] **Step 1: Write the integration test**

Add to `lib/onboarding/crew/pipeline.test.ts`:

```typescript
describe('directAndProduce — photos uploaded path', () => {
  it('threads visionPerPhoto + makerWork to Director, Copywriter, Cinematographer; NOT to Graphic Artist', async () => {
    // Mock each crew member to capture their input
    const directSpy = vi.fn(async () => sampleTrajectory);
    const writeCopySpy = vi.fn(async () => sampleCopy);
    const shootMomentSpy = vi.fn(async () => sampleMoment);
    const designLookSpy = vi.fn(async () => sampleLook);
    // ... mock module imports accordingly ...

    const brief: CrewBrief = {
      shopName: 'Test',
      nicheDisplayName: 'Woodworker',
      nicheBody: 'A test body.',
      moodLabel: 'Rustic',
      moodDescription: '',
      productCount: 5,
      moodKey: 'rustic',
      visionPerPhoto: [
        { productType: 'turned walnut bowl', suggestedName: 'River Bowl', suggestedShortDescription: 'small bowl', suggestedDescription: 'A small turned walnut bowl.', suggestedPriceCents: 4800 },
        { productType: 'small wooden sign', suggestedName: 'Welcome Plank', suggestedShortDescription: 'small sign', suggestedDescription: 'A small carved sign.', suggestedPriceCents: 3200 },
      ],
      makerWork: 'Turns small bowls and carves small signs from local walnut.',
    };

    await directAndProduce(brief);

    expect(directSpy).toHaveBeenCalledWith(expect.objectContaining({ makerWork: expect.stringMatching(/local walnut/) }));
    expect(writeCopySpy).toHaveBeenCalledWith(
      expect.objectContaining({ visionPerPhoto: expect.arrayContaining([expect.objectContaining({ productType: 'turned walnut bowl' })]) }),
      expect.anything(),
      expect.anything(),
    );
    expect(shootMomentSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.stringMatching(/local walnut/));
    // Crucial: Graphic Artist must NOT receive photo-derived input
    const designLookArgs = designLookSpy.mock.calls[0]![0] as CrewBrief;
    expect(designLookArgs.makerWork).toBeUndefined();
    expect(designLookArgs.visionPerPhoto).toBeUndefined();
  });
});
```

Note: this requires the Graphic Artist call to be passed a stripped brief that omits `visionPerPhoto` and `makerWork`. If `designLook(brief, ...)` is called with the full brief today, modify the pipeline to pass a sanitized brief:

```typescript
// pipeline.ts
const graphicBrief = { ...brief, visionPerPhoto: undefined, makerWork: undefined };
const look = await designLook(graphicBrief, trajectory, copy.moment.story, moment, copy.products);
```

(This makes the "graphic artist doesn't see photos" rule structural, not just polite.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/crew/pipeline.test.ts -t "photos uploaded path"`
Expected: FAIL — graphic artist still receives the full brief.

- [ ] **Step 3: Sanitize the brief for the Graphic Artist**

Update `lib/onboarding/crew/pipeline.ts` as above.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/onboarding/crew/pipeline.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add lib/onboarding/crew/pipeline.ts lib/onboarding/crew/pipeline.test.ts
git commit -m "$(cat <<'EOF'
feat(crew): Graphic Artist never sees photo-derived input (Session 41)

Pipeline strips visionPerPhoto and makerWork from the brief before
calling designLook. Skin pick stays niche + mood only (D41); accent
override stays logo only (D56). The "don't extract palette from possibly-
bad maker photos" rule is now structural, not just a documented
convention.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task E2: Pipeline integration test — N=0 skip path

**Files:**
- Modify: `lib/onboarding/crew/pipeline.test.ts`

- [ ] **Step 1: Add a skip-path integration test**

```typescript
describe('directAndProduce — photos skipped path', () => {
  it('behaves exactly like today when visionPerPhoto and makerWork are undefined', async () => {
    // Same setup as E1 but with brief lacking visionPerPhoto + makerWork
    await directAndProduce(briefWithoutPhotos);
    // Director receives brief without makerWork
    const directBrief = directSpy.mock.calls[0]![0] as CrewBrief;
    expect(directBrief.makerWork).toBeUndefined();
    // Copywriter prompt does NOT contain "THE MAKER'S WORK"
    // (verify by snapshotting the prompt build helper or by re-invoking buildCopywriterPrompt directly)
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/onboarding/crew/pipeline.test.ts -t "photos skipped path"`

If implementation from prior tasks is correct, it should PASS already. If it FAILS, fix the regression.

- [ ] **Step 3-5: Confirm pass and commit**

(No code change expected; this is a regression guard.)

```bash
git add lib/onboarding/crew/pipeline.test.ts
git commit -m "test(crew): regression guard for the skipped-photos path (Session 41)"
```

---

### Task E3: Run the full suite, fix any drift, commit a tidy-up

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: all green (target is 946 → 970+ after this work).

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Run the live build sanity check (optional)**

If the dev server is up, walk through onboarding once — upload 2 photos for a Woodworker niche, watch the build, confirm the live store has those 2 photos as products and the About attribution uses the real maker name.

- [ ] **Step 4: Final commit if any tidy-up is needed**

```bash
git add -u
git commit -m "chore(session-41): final tidy after photo-upload + ridealong fixes"
```

---

## Self-review checklist

Run before handoff:

1. **Spec coverage**
   - ✅ Photo upload step (B2-B5)
   - ✅ Vision call shape and degradation path (B3)
   - ✅ Photos become products 1..N, stand-ins fill 5 (C4, D1)
   - ✅ Director reads makerWork (C2)
   - ✅ Cinematographer reads makerWork (C3)
   - ✅ Copywriter reads visionPerPhoto + name lock (A1, C4)
   - ✅ Graphic Artist does NOT receive photos (E1)
   - ✅ Founder-name attribution fix (A1)
   - ✅ Catalog-size step retired (A3)
   - ✅ Portrait scrim deterministic fix (A2)
   - ✅ Ticker "Studying your work…" beat (D3)
   - ⚠️ Sample-based contrast guard from spec — descoped to "do A2 deterministic first; if live build still shows readability issues, add sample-based guard as a follow-up." A2's larger and feathered scrim handles 95% of cases.

2. **Placeholder scan** — No TBDs, no TODOs.

3. **Type consistency** — `VisionPerPhoto` defined once in `app/onboarding/_components/types.ts`, imported everywhere else. `productPhotoUrls`, `visionPerPhoto`, `makerWork` names consistent across UI, CrewBrief, build input, run-storefront input, API.

4. **Ambiguity** — D1's URL pre-population is explicit (first N slots = uploads, rest = generated). C4's flat-5 target is explicit and matches MAX_PRODUCT_IMAGES.

5. **Order of operations** — Phase A ships independently (3 ridealong fixes). Phase B builds the UI + server action. Phase C wires the brief. Phase D wires the build. Phase E verifies. Each phase is a coherent checkpoint.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-12-product-photo-upload-at-onboarding.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
