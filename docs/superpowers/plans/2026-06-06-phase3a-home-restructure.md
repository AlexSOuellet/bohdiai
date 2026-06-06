# Phase 3a — Home Restructure (About menu + find-us split) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the Main Street home, separate the maker (About) from the market calendar (find-us): the founder beat becomes a Bohdi-picked menu of maker-only looks (including the "Meet June" card), and find-us becomes its own home beat that only shows when the maker has dates. Treatment selection never reads market-date count (we don't know it at onboarding; Bohdi seeds sample dates the maker can edit or turn off).

**Architecture:** `founder.treatment` joins the schema as a Bohdi pick (mirrors `goods.treatment`); `FounderBeats` lose the embedded calendar and gain a `card` treatment; a new `FindUsBeat` renders the calendar as its own section after the founder band; `MainStreet` composes it when `founder.findUs` has rows; `selectFounderTreatment` drops the `findUsRows` input and the calendar-led `findus` treatment. No visual hardcoding — every value stays a skin var or named role; the calendar markup moves verbatim, it isn't restyled.

**Tech Stack:** TypeScript (strict), React, Zod, Vitest.

---

### Task 1: Schema — About treatment is a Bohdi pick; add card eyebrow/heading

**Files:**
- Modify: `lib/archetypes/main-street/schemas.ts`
- Test: `lib/archetypes/main-street/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `lib/archetypes/main-street/schemas.test.ts` (import `MainStreetContentSchema` if not already):

```ts
import { describe, it, expect } from 'vitest';
import { MainStreetContentSchema } from './schemas';

function baseFounder() {
  return {
    quote: 'I started this with one secondhand wheel and a kiln in the garage that I rebuilt twice.',
    attribution: 'Mara, potter',
    photo: { prompt: 'the maker at the wheel', alt: 'the maker' },
  };
}

describe('founder schema — About treatment + card fields', () => {
  it('accepts an authored About treatment and optional eyebrow/heading', () => {
    // Build a minimal valid content object, then assert the founder additions parse.
    const founder = { ...baseFounder(), treatment: 'card', eyebrow: 'Since 2019', heading: 'Meet Mara' };
    const r = MainStreetContentSchema.shape.founder.safeParse(founder);
    expect(r.success).toBe(true);
  });

  it('still accepts a founder with no treatment (treatment optional)', () => {
    const r = MainStreetContentSchema.shape.founder.safeParse(baseFounder());
    expect(r.success).toBe(true);
  });

  it('rejects an unknown About treatment', () => {
    const r = MainStreetContentSchema.shape.founder.safeParse({ ...baseFounder(), treatment: 'findus' });
    expect(r.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/schemas.test.ts`
Expected: FAIL — `treatment`/`eyebrow`/`heading` not on the founder schema; `'findus'` currently has no enum to reject against.

- [ ] **Step 3: Add the fields**

In `lib/archetypes/main-street/schemas.ts`, inside the `founder: z.object({ ... })`, add after `attribution`:

```ts
    /** Which About look to wear — BOHDI's pick, the one that fits the maker.
     *  Maker-only treatments (the calendar is its own beat, never inside these).
     *  Optional so content authored before this field still parses. */
    treatment: z.enum(['quote', 'portrait', 'letter', 'card']).optional(),
    /** Small label above the heading on the card treatment, e.g. "Since 2019". */
    eyebrow: z.string().min(2).max(24).optional(),
    /** The card treatment's heading, e.g. "Meet Mara". */
    heading: z.string().min(2).max(28).optional(),
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/archetypes/main-street/schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/schemas.ts lib/archetypes/main-street/schemas.test.ts
git commit -m "Main Street: About treatment is a Bohdi pick; add card eyebrow/heading"
```

---

### Task 2: Selection — drop the market-date input; treatments are maker-only

**Files:**
- Modify: `lib/archetypes/main-street/founder.ts`
- Test: `lib/archetypes/main-street/founder.test.ts` (create if absent)

- [ ] **Step 1: Write the failing test**

```ts
// lib/archetypes/main-street/founder.test.ts
import { describe, it, expect } from 'vitest';
import { selectFounderTreatment, type FounderTreatment } from './founder';

describe('selectFounderTreatment', () => {
  it('honors an explicit Bohdi pick', () => {
    expect(selectFounderTreatment({ mood: 'cozy', pick: 'portrait' })).toBe('portrait');
  });

  it('never returns the removed calendar-led treatment', () => {
    const moods = ['cozy', 'rustic', 'dark', 'sunset', 'modern', undefined];
    for (const mood of moods) {
      const t: FounderTreatment = selectFounderTreatment({ mood });
      expect(['quote', 'portrait', 'letter', 'card']).toContain(t);
    }
  });

  it('leans card for intimate moods and portrait for cinematic, with no date input at all', () => {
    expect(selectFounderTreatment({ mood: 'cozy' })).toBe('card');
    expect(selectFounderTreatment({ mood: 'dark' })).toBe('portrait');
    expect(selectFounderTreatment({ mood: 'modern' })).toBe('quote');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/founder.test.ts`
Expected: FAIL — `selectFounderTreatment` takes `findUsRows`, returns `findus`, and has no `pick`.

- [ ] **Step 3: Rewrite founder.ts**

Replace `lib/archetypes/main-street/founder.ts` with:

```ts
/**
 * Main Street — About-beat (founder) treatment selection.
 *
 * Beat 3 is the maker, in their own voice. It has four MAKER-ONLY bodies; the
 * market calendar is its own separate beat, never inside these.
 *
 *  - quote    — portrait beside a pull-quote. Calm, authority-forward (default).
 *  - portrait — a large CONTAINED portrait, quote over a soft scrim. Cinematic.
 *  - letter   — the quote as a short signed note, small inset portrait. Intimate.
 *  - card     — the "Meet June" card: eyebrow, heading, round face, a handwritten
 *               pull-quote, a line of bio, and the about cue. Warm and personal.
 *
 * BOHDI picks the treatment (like the goods beat). When he doesn't, we lean on
 * mood only — NEVER on market-date count, which we don't know at onboarding.
 */

export type FounderTreatment = 'quote' | 'portrait' | 'letter' | 'card';

/** Intimate, homemade moods read as the personal card. */
const INTIMATE_MOODS = ['cozy', 'rustic', 'homey'];
/** Cinematic, image-led moods read as a portrait. */
const CINEMATIC_MOODS = ['dark', 'sunset', 'botanical'];

function matches(mood: string | undefined, set: string[]): boolean {
  if (!mood) return false;
  const m = mood.toLowerCase();
  return set.some((x) => m.includes(x));
}

/**
 * Pick the About treatment. Bohdi's explicit pick wins; otherwise mood chooses
 * how intimate or cinematic the band reads. No market-date input.
 */
export function selectFounderTreatment(opts: { mood?: string | undefined; pick?: FounderTreatment | undefined }): FounderTreatment {
  if (opts.pick) return opts.pick;
  if (matches(opts.mood, INTIMATE_MOODS)) return 'card';
  if (matches(opts.mood, CINEMATIC_MOODS)) return 'portrait';
  return 'quote';
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/archetypes/main-street/founder.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/founder.ts lib/archetypes/main-street/founder.test.ts
git commit -m "Main Street: founder selection drops market-date input; Bohdi pick + mood only"
```

---

### Task 3: FounderBeats — remove the embedded calendar, add the card

**Files:**
- Modify: `lib/archetypes/main-street/FounderBeats.tsx`
- Test: `lib/archetypes/main-street/FounderBeat.test.tsx`

**Note:** `FindUsList` moves to its own beat in Task 4. In this task, keep a copy of `FindUsList` exported from `FounderBeats.tsx` temporarily ONLY if a test imports it; otherwise remove it here and define it fresh in Task 4. Per the current code, `FindUsList` is internal to `FounderBeats.tsx`, so move it (Task 4 imports the moved version).

- [ ] **Step 1: Write/adjust the failing test**

Replace the calendar-coupled expectations in `lib/archetypes/main-street/FounderBeat.test.tsx`. The new contract: every founder treatment renders the maker (quote + attribution) and the about cue, and renders NO find-us rows (no `data-type="day"`). Add a card case. Example (adapt to the file's existing render helper / skin fixture):

```ts
import { render } from '@testing-library/react'; // or the project's existing util
import { FounderBeat } from './FounderBeat';
import { emberSkinForTest } from './__fixtures__'; // use whatever skin fixture the file already uses

const founder = {
  quote: 'I rebuilt the kiln twice before a single mug came out right and I have not stopped since.',
  attribution: 'Mara, potter',
  photo: { prompt: 'the maker at the wheel', alt: 'the maker', url: 'http://x/m.jpg' },
  eyebrow: 'Since 2019',
  heading: 'Meet Mara',
};

it('renders the card treatment with eyebrow + heading and no calendar', () => {
  const { container, queryByText } = render(
    <FounderBeat founder={founder} skin={emberSkinForTest} treatment="card" aboutHref="/about" />,
  );
  expect(queryByText('Meet Mara')).toBeTruthy();
  expect(queryByText('Since 2019')).toBeTruthy();
  expect(container.querySelector('[data-type="day"]')).toBeNull(); // calendar is its own beat now
});
```

(If the existing test file asserts find-us rows inside the founder band, delete those assertions — that behavior is intentionally gone.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/FounderBeat.test.tsx`
Expected: FAIL — no `card` treatment; founder still renders find-us.

- [ ] **Step 3: Edit FounderBeats.tsx**

In `lib/archetypes/main-street/FounderBeats.tsx`:
- Export `FindUsList` (change `function FindUsList` → `export function FindUsList`) so Task 4 can import it, and remove its `<FindUsList>` usage from `FounderQuote`, `FounderPortrait`, and `FounderLetter` (delete the `{founder.findUs && ( ... )}` blocks and the now-unused `eventsHref` prop from those treatments' signatures).
- Delete `FounderFindUs` entirely (the calendar-led treatment).
- Add `FounderCard`:

```tsx
/** card — the "Meet June" card: eyebrow, heading, a round face, a handwritten
 *  pull-quote, a line of bio, and the about cue. Warm and personal. */
export function FounderCard({ founder, skin, about }: { founder: Founder; skin: ArchetypeTheme; about?: FounderAbout | undefined }) {
  const r = roles(skin);
  return (
    <FounderBand>
      <div className="ms-founder-card" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        {founder.eyebrow && (
          <span data-type="eyebrow" style={{ ...typeRoleCss(r.eyebrow), color: 'var(--ms-accent)', display: 'block', marginBottom: 14 }}>
            {founder.eyebrow}
          </span>
        )}
        {founder.heading && (
          <h2 data-type="title" style={{ ...typeRoleCss(r.title), color: 'var(--ms-contrast-fg)', margin: '0 0 28px' }}>
            {founder.heading}
          </h2>
        )}
        <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 22px', position: 'relative', border: `1px solid ${HAIR}` }}>
          <Media media={founder.photo} />
        </div>
        <p data-type="quote" style={{ ...typeRoleCss(r.quote), fontStyle: 'italic', color: 'var(--ms-contrast-fg)', margin: 0, lineHeight: 1.4 }}>
          {founder.quote}
        </p>
        <div data-type="sig" style={{ ...typeRoleCss(r.sig), color: 'var(--ms-contrast-fg-muted)', marginTop: 22 }}>&mdash; {founder.attribution}</div>
        <AboutCue about={about} skin={skin} />
      </div>
    </FounderBand>
  );
}
```

(Update the `Founder` type usage — `founder.eyebrow`/`founder.heading` now exist on the schema from Task 1. Keep `AboutCue`, `FounderBand`, `HAIR`, `Media`, `roles`, `typeRoleCss` as-is. `FounderQuote`/`FounderPortrait`/`FounderLetter` keep `about` but drop `eventsHref`.)

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/archetypes/main-street/FounderBeat.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/FounderBeats.tsx lib/archetypes/main-street/FounderBeat.test.tsx
git commit -m "Main Street: founder treatments are maker-only; add the card, drop the calendar-led body"
```

---

### Task 4: The find-us beat (its own section)

**Files:**
- Create: `lib/archetypes/main-street/FindUsBeat.tsx`
- Modify: `lib/archetypes/main-street/FounderBeat.tsx` (dispatcher: drop `findus`, drop `eventsHref`, add `card`)
- Test: `lib/archetypes/main-street/FindUsBeat.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// lib/archetypes/main-street/FindUsBeat.test.tsx
import { render } from '@testing-library/react';
import { FindUsBeat } from './FindUsBeat';
import { emberSkinForTest } from './__fixtures__'; // reuse the project's skin fixture

const findUs = {
  label: 'Find us this month',
  eventsLabel: 'See all our markets',
  rows: [
    { day: 'Sat 6/7', where: 'Hope St Farmers Market', time: '9-11am' },
    { day: 'Sat 6/14', where: 'Armory Pop-Up', time: '10-1pm' },
  ],
};

it('renders the dates and an events cue', () => {
  const { queryByText, container } = render(<FindUsBeat findUs={findUs} skin={emberSkinForTest} eventsHref="/events" />);
  expect(queryByText('Hope St Farmers Market')).toBeTruthy();
  expect(queryByText(/See all our markets/)).toBeTruthy();
  expect(container.querySelectorAll('[data-type="day"]').length).toBe(2);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/FindUsBeat.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement FindUsBeat**

```tsx
// lib/archetypes/main-street/FindUsBeat.tsx
/**
 * Main Street — the FIND US beat. The market/appointment calendar as its OWN
 * section (split out of the founder beat). Shown only when the maker has dates;
 * links to the full Events page. On the base surface so it alternates after the
 * founder band. Structure only — every value is a skin var or named role; the
 * row markup is the calendar lifted verbatim from the old founder beat.
 */
import type { ArchetypeTheme } from '../types';
import type { MainStreetContent } from './schemas';
import { FindUsList } from './FounderBeats';

type FindUs = NonNullable<MainStreetContent['founder']['findUs']>;

export function FindUsBeat({ findUs, skin, eventsHref = '/events' }: { findUs: FindUs; skin: ArchetypeTheme; eventsHref?: string }) {
  return (
    <section data-ms-findus style={{ background: 'var(--ms-bg)', color: 'var(--ms-fg)', padding: '96px 40px' }}>
      <div className="ms-wrap" style={{ maxWidth: 760 }}>
        <FindUsList findUs={findUs} skin={skin} eventsHref={eventsHref} heading="title" onContrast={false} />
      </div>
    </section>
  );
}
```

**Note:** `FindUsList` currently colors its text with `--ms-contrast-fg*` (it lived on the contrast band). It now renders on the base surface too. In Task 3's edit, generalize `FindUsList` to take an `onContrast?: boolean` (default true for any remaining contrast use) that swaps `--ms-contrast-fg`/`--ms-contrast-fg-muted` for `--ms-fg`/`--ms-fg-muted` when false. Add that prop in Task 3 Step 3 when you export it. (If you prefer, render find-us on the contrast surface and pass nothing — but the composition alternates better on base.)

- [ ] **Step 4: Update the FounderBeat dispatcher**

In `lib/archetypes/main-street/FounderBeat.tsx`: drop the `findus` case and the `rows`/`eventsHref` logic; switch on the four maker-only treatments, taking the pick from `founder.treatment` then `selectFounderTreatment`:

```tsx
import { FounderQuote, FounderPortrait, FounderLetter, FounderCard, type FounderAbout } from './FounderBeats';
import { selectFounderTreatment, type FounderTreatment } from './founder';

const DEFAULT_ABOUT = 'Read the full story';

export function FounderBeat({
  founder, skin, mood, treatment, aboutHref = '/about',
}: {
  founder: MainStreetContent['founder'];
  skin: ArchetypeTheme;
  mood?: string | undefined;
  treatment?: FounderTreatment | undefined;
  aboutHref?: string | undefined;
}) {
  const chosen = selectFounderTreatment({ mood, pick: treatment ?? founder.treatment });
  const about: FounderAbout = { href: aboutHref, label: founder.aboutLabel ?? DEFAULT_ABOUT };
  switch (chosen) {
    case 'portrait': return <FounderPortrait founder={founder} skin={skin} about={about} />;
    case 'letter':   return <FounderLetter founder={founder} skin={skin} about={about} />;
    case 'card':     return <FounderCard founder={founder} skin={skin} about={about} />;
    default:         return <FounderQuote founder={founder} skin={skin} about={about} />;
  }
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run lib/archetypes/main-street/FindUsBeat.test.tsx lib/archetypes/main-street/FounderBeat.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/archetypes/main-street/FindUsBeat.tsx lib/archetypes/main-street/FounderBeat.tsx lib/archetypes/main-street/FounderBeats.tsx
git commit -m "Main Street: find-us is its own beat; founder dispatcher takes Bohdi's About pick"
```

---

### Task 5: Compose the find-us beat into the home

**Files:**
- Modify: `lib/archetypes/main-street/MainStreet.tsx`
- Test: `lib/archetypes/main-street/MainStreet.test.tsx` (create if absent — otherwise add a case)

- [ ] **Step 1: Write the failing test**

```tsx
// add to MainStreet.test.tsx (or create it)
import { render } from '@testing-library/react';
import { MainStreet } from './MainStreet';
import { emberSkinForTest } from './__fixtures__';
import { fullContentForTest } from './__fixtures__'; // a valid MainStreetContent; add findUs rows

it('shows a find-us beat when the maker has dates, and none when they do not', () => {
  const withDates = { ...fullContentForTest, founder: { ...fullContentForTest.founder, findUs: { label: 'Find us', rows: [{ day: 'Sat', where: 'Market', time: '9am' }] } } };
  const a = render(<MainStreet content={withDates} skin={emberSkinForTest} products={[]} />);
  expect(a.container.querySelector('[data-ms-findus]')).toBeTruthy();

  const noDates = { ...fullContentForTest, founder: { ...fullContentForTest.founder, findUs: undefined } };
  const b = render(<MainStreet content={noDates} skin={emberSkinForTest} products={[]} />);
  expect(b.container.querySelector('[data-ms-findus]')).toBeNull();
});
```

(If the file has no fixtures, build a minimal valid `MainStreetContent` inline from the `msContent` shape used in `build-specs.test.ts`.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/MainStreet.test.tsx`
Expected: FAIL — no `[data-ms-findus]` element.

- [ ] **Step 3: Compose it**

In `lib/archetypes/main-street/MainStreet.tsx`: import `FindUsBeat`, remove `eventsHref` from the `FounderBeat` call, and add the find-us beat (wrapped in `Reveal`) after the founder beat when dates exist:

```tsx
import { FindUsBeat } from './FindUsBeat';
// ...
      <Reveal>
        <FounderBeat founder={content.founder} skin={skin} mood={mood} treatment={founderTreatment} aboutHref={aboutHref} />
      </Reveal>
      {content.founder.findUs && content.founder.findUs.rows.length > 0 && (
        <Reveal>
          <FindUsBeat findUs={content.founder.findUs} skin={skin} eventsHref={eventsHref} />
        </Reveal>
      )}
      <Reveal>
        <Close close={content.close} skin={skin} />
      </Reveal>
```

(`eventsHref` prop stays on `MainStreetProps`; it now feeds `FindUsBeat` instead of `FounderBeat`.)

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/archetypes/main-street/MainStreet.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/MainStreet.tsx lib/archetypes/main-street/MainStreet.test.tsx
git commit -m "Main Street: compose the find-us beat after the founder when the maker has dates"
```

---

### Task 6: Authoring — Bohdi picks the About treatment and seeds find-us

**Files:**
- Modify: `lib/archetypes/main-street/builder.tsx` (`authoringSpec` founder fields)
- Test: `lib/archetypes/main-street/builder.niche.test.ts` (add a case)

- [ ] **Step 1: Write the failing test**

Add to `lib/archetypes/main-street/builder.niche.test.ts`:

```ts
describe('Main Street authoringSpec — About treatment + find-us', () => {
  it('offers the four About treatments and tells Bohdi to pick one', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toMatch(/about treatment|founder.*treatment/);
    expect(spec).toContain('card');
  });

  it('tells Bohdi find-us is its own section he can seed and the maker can turn off', () => {
    const spec = MAIN_STREET_SPEC.authoringSpec(brief).toLowerCase();
    expect(spec).toMatch(/find.?us/);
    expect(spec).toMatch(/own section|separate|seed|sample dates/);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/builder.niche.test.ts`
Expected: FAIL — no About-treatment menu / find-us-as-its-own-section guidance.

- [ ] **Step 3: Update authoringSpec**

In `lib/archetypes/main-street/builder.tsx`, update the founder field spec. Add an ABOUT TREATMENT menu block (near the GOODS TREATMENT block) and revise the `founder: { ... }` field line:

Add after the GOODS TREATMENT block:

```
ABOUT TREATMENT — pick the body the About/founder beat wears (founder.treatment). All show the maker only; the find-us calendar is its OWN separate section, never inside the About beat:
    - quote: portrait beside a pull-quote (calm, authority-forward)
    - portrait: a large contained portrait, the quote over a soft scrim (cinematic)
    - letter: the quote as a short signed note, small inset portrait (intimate)
    - card: the "meet the maker" card — eyebrow, heading, round face, a warm pull-quote (personal)
```

Revise the `founder: { ... }` field description to:

```
- founder: { quote (24-280, first person, ~2 sentences, specific, no AI-tell), attribution (4-60), treatment (one of: quote | portrait | letter | card — your pick from above), eyebrow (2-24, optional — for the card, e.g. "Since 2019"), heading (2-28, optional — for the card, e.g. "Meet Mara"), photo: { prompt (8-400): the maker, alt (4-120) }, aboutLabel (2-28, optional), findUs (optional, its OWN section on the home — seed 1-5 plausible sample dates the maker can edit or turn off later): { label (2-28), eventsLabel (2-28, optional), rows (1-5): { day (1-12), where (4-60), time (1-12) } } }
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/archetypes/main-street/builder.niche.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/builder.tsx lib/archetypes/main-street/builder.niche.test.ts
git commit -m "Main Street authoring: Bohdi picks the About treatment; find-us is its own seeded section"
```

---

### Task 7: Full green check + no-hardcode sweep

- [ ] **Step 1: Typecheck, lint, full suite**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: 0 type errors, 0 lint errors, all tests pass.

- [ ] **Step 2: No-hardcode sweep on the touched renderer files**

Run: `grep -nE "#[0-9a-fA-F]{3,6}\b|font-family|[0-9]{2,}px" lib/archetypes/main-street/FindUsBeat.tsx lib/archetypes/main-street/FounderBeats.tsx`
Expected: only px values that are spacing/geometry (layout), NO hex colors and NO `font-family` (colors come from `--ms-*` vars, fonts from named roles via `typeRoleCss`). If a hex or font-family appears, replace it with the skin var / role.

- [ ] **Step 3: Commit any stragglers**

```bash
git add -A && git commit -m "Phase 3a: final check" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:** Implements the home half of spec §5 (About is a Bohdi-pick menu of maker-only looks → Tasks 1,3,6; calendar pulled out → Tasks 3,4; selection never uses market dates → Task 2; find-us its own beat seeded by Bohdi, maker can edit/disable → Tasks 4,5,6; "Meet June" card → Task 3). The Events PAGE, About PAGE, and routing are Phase 3b.

**Placeholder scan:** Test fixtures reference `./__fixtures__` and `emberSkinForTest`/`fullContentForTest` — verify the actual fixture/util the existing `FounderBeat.test.tsx`/`beats.test.tsx` use at Task 3 Step 1 and import the real names (these test files already render Main Street components, so a skin fixture exists; reuse it). No TBD/TODO in code steps.

**Type consistency:** `selectFounderTreatment({ mood, pick })` (Task 2) is called by the dispatcher (Task 4) with `pick: treatment ?? founder.treatment`; `FounderTreatment` drops `findus` and gains `card` consistently across founder.ts, FounderBeats, FounderBeat, schema enum. `FindUsList` gains `onContrast?` (Task 3) consumed by `FindUsBeat` (Task 4). `founder.treatment/eyebrow/heading` added in Task 1 are read in Tasks 3,4,6.

**Risk:** existing `FounderBeat.test.tsx` / `beats.test.tsx` may assert old calendar-in-founder behavior; Task 3 Step 1 explicitly removes those assertions. Run the whole main-street suite at Task 7 to catch any missed coupling.
