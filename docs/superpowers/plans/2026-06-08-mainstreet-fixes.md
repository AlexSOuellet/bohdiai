# Main Street Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the six defects found on the Session 33 live walk of `wallys-wood` and `claires-candles` — the welded Moment, the oversized type, the gendered About image, the missing Contact form and dead CTA, the broken mobile layout, and single-image product pages.

**Architecture:** All fixes live in the Main Street archetype (`lib/archetypes/main-street/`) plus two shared helpers (`lib/onboarding/image-directives.ts`, `lib/name-gender.ts`). No schema, persistence, or renderer-contract changes except where a fix requires it (the Moment becomes a portable layer). Every change keeps the no-hardcode rule: colors are skin vars, type values are named roles.

**Tech Stack:** Next.js (App Router) · React · TypeScript (strict) · Vitest · Tailwind/inline-style hybrid as already used in the archetype.

**Ordering note:** Tasks 1–5 are independent and ready. Task 6 (the Moment rebuild) is the largest and has two design decisions called out inline — do it last, and confirm those decisions before starting it.

---

### Task 1: Gender-neutral About / maker image (D42)

Removes the name→gender table entirely. Generated maker imagery is framed by hands, work, and bench — never a guessed gender — until the maker uploads a real photo.

**Files:**
- Delete: `lib/name-gender.ts`
- Delete: `lib/name-gender.test.ts` (if present)
- Modify: `lib/onboarding/image-directives.ts`
- Test: `lib/onboarding/image-directives.test.ts`
- Check (consumers): `lib/fal.test.ts`, anything importing `name-gender`

- [ ] **Step 1: Find every importer of `name-gender`**

Run: `rg "name-gender" --type ts`
Expected: hits in `lib/onboarding/image-directives.ts` and test files only. If any other module imports it, add it to this task's file list before proceeding.

- [ ] **Step 2: Write the failing test for the new gender-neutral directive**

Replace the person-branch assertions in `lib/onboarding/image-directives.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { withImageDirectives } from './image-directives';

describe('withImageDirectives', () => {
  it('frames a person gender-neutrally, never by name', () => {
    const out = withImageDirectives('at the workbench', { isPerson: true, makerName: 'Wally' });
    expect(out.toLowerCase()).not.toContain('a woman');
    expect(out.toLowerCase()).not.toContain('a man');
    expect(out.toLowerCase()).not.toContain('she');
    expect(out.toLowerCase()).not.toContain('his');
    expect(out).toContain('at the workbench');
    expect(out.toLowerCase()).toContain('photorealistic');
  });

  it('leaves a non-person prompt photorealistic', () => {
    const out = withImageDirectives('a walnut slab', { isPerson: false });
    expect(out.toLowerCase()).toContain('photorealistic');
    expect(out).toContain('a walnut slab');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run lib/onboarding/image-directives.test.ts`
Expected: FAIL — current code emits "a woman"/"a man" and imports the deleted module.

- [ ] **Step 4: Rewrite `image-directives.ts` gender-neutral**

Replace the file body (keep the header comment, drop the gender craft note about gender and the `name-gender` import) with:

```ts
/** Positive realism cues — medium + lens, no negations. */
const REALISM = 'Natural light, true textures, fine real-world detail, shot on a full-frame camera';

export interface ImageDirectiveOpts {
  isPerson?: boolean | undefined;
  makerName?: string | undefined; // retained for callers; not used to guess gender
}

/** Compose ONE coherent prompt from the authored prompt + enforced directives.
 *  A person is framed gender-neutrally — by hands, work, and bench — never a
 *  guessed gender, until the maker uploads a real photo (D42). */
export function withImageDirectives(prompt: string, opts: ImageDirectiveOpts): string {
  const base = prompt.trim();
  if (opts.isPerson) {
    return `Photorealistic photograph of the maker at work — framed on their hands and their craft at the workbench, face not the subject. ${base}. ${REALISM} with a 50mm lens.`;
  }
  return `Photorealistic photograph. ${base}. ${REALISM}.`;
}
```

- [ ] **Step 5: Delete the table and its test**

Run: `git rm lib/name-gender.ts lib/name-gender.test.ts`
(If the test file does not exist, `git rm lib/name-gender.ts` only.)

- [ ] **Step 6: Run the full type + test sweep**

Run: `npx tsc --noEmit && npx vitest run lib/onboarding/image-directives.test.ts lib/fal.test.ts`
Expected: PASS. If `fal.test.ts` asserted gendered phrasing, update those assertions to match the neutral output.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix(images): gender-neutral maker imagery, remove name-gender table (D42)"
```

---

### Task 2: Shrink the type scale

The shared `makeType` ramp is calibrated too large, so every hero and the About quote read huge. Recalibrate the ramp down. This is a bone (the archetype owns type scale); only the numbers change, and they change for all skins at once.

**Files:**
- Modify: `lib/archetypes/main-street/skins.ts` (the `makeType` function, ~lines 92–110)
- Test: `lib/archetypes/main-street/skins.test.ts`

- [ ] **Step 1: Write a guardrail test for the ramp bounds**

Add to `lib/archetypes/main-street/skins.ts`'s test file:

```ts
import { describe, it, expect } from 'vitest';
import { MAIN_STREET_SKINS } from './skins';

describe('type scale', () => {
  it('keeps display sizes within a sane desktop range', () => {
    for (const skin of Object.values(MAIN_STREET_SKINS)) {
      const t = skin.type as Record<string, { size: number }>;
      expect(t.brand.size).toBeLessThanOrEqual(88);
      expect(t.storyline.size).toBeLessThanOrEqual(56);
      expect(t.closeHead.size).toBeLessThanOrEqual(68);
      expect(t.goodsHead.size).toBeLessThanOrEqual(48);
      expect(t.quote.size).toBeLessThanOrEqual(34);
    }
  });
});
```

(Adjust the import name to match the actual export of the skins map in `skins.ts`.)

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/skins.test.ts`
Expected: FAIL — brand is 124, storyline 76, etc.

- [ ] **Step 3: Recalibrate the ramp in `makeType`**

Change the display-role sizes in the `roles` object:

```ts
brand: d(84, 44, '-0.02em', 0.98),
storyline: d(52, 30, '-0.01em', 1.1),
goodsHead: d(44, 30, '-0.01em', 1.04),
title: d(30, 24, '-0.01em', 1.08),
quote: d(32, 24, '-0.01em', 1.2),
closeHead: d(64, 36, '-0.015em', 1.0),
```

(Leave `wordmark`, label/mono roles, `body`, `caption`, `where` as they are.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/archetypes/main-street/skins.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/skins.ts lib/archetypes/main-street/skins.test.ts
git commit -m "fix(type): recalibrate the Main Street type ramp down"
```

---

### Task 3: Contact form + wire the dead close CTA

The Contact page renders a heading and intro but no form, and the home Close CTA points at `href="#"`. Build a Main-Street-styled contact form that posts to the existing `/api/contact` endpoint, render it on the Contact page, and point the Close CTA at `/contact`.

**Files:**
- Create: `lib/archetypes/main-street/MainStreetContactForm.tsx` (client component)
- Modify: `lib/archetypes/main-street/pages.tsx` (the `ContactPage` component — render the form below the intro)
- Modify: `lib/archetypes/main-street/beats.tsx` (the `Close` component — change `href="#"` to `/contact`)
- Check: `app/api/contact/route.ts` (confirm the POST body shape it expects)
- Test: `lib/archetypes/main-street/contact-form.test.tsx`

- [ ] **Step 1: Read the endpoint contract**

Run: `cat app/api/contact/route.ts`
Note the exact JSON fields it expects (e.g. `name`, `email`, `message`, possibly `tenant`/`subject`). The form's POST body MUST match these field names. If it expects a tenant id, the form needs it passed as a prop from the page render.

- [ ] **Step 2: Write the failing render test**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MainStreetContactForm } from './MainStreetContactForm';
import { MAIN_STREET_SKINS } from './skins';

describe('MainStreetContactForm', () => {
  it('renders name, email, and message fields and a submit', () => {
    const skin = Object.values(MAIN_STREET_SKINS)[0]!;
    const { getByLabelText, getByRole } = render(<MainStreetContactForm skin={skin} />);
    expect(getByLabelText(/name/i)).toBeTruthy();
    expect(getByLabelText(/email/i)).toBeTruthy();
    expect(getByLabelText(/message/i)).toBeTruthy();
    expect(getByRole('button', { name: /send/i })).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/contact-form.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 4: Build the form component**

Create `lib/archetypes/main-street/MainStreetContactForm.tsx`:

```tsx
'use client';
import { useState } from 'react';
import type { ArchetypeTheme } from '../types';
import { typeRoleCss, roles } from './chrome';

export function MainStreetContactForm({ skin }: { skin: ArchetypeTheme }) {
  const r = roles(skin);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('sending');
    const data = new FormData(e.currentTarget);
    // Field names MUST match app/api/contact/route.ts (Step 1).
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'),
        email: data.get('email'),
        message: data.get('message'),
      }),
    });
    setState(res.ok ? 'sent' : 'error');
  }

  const field: React.CSSProperties = {
    width: '100%', padding: '12px 14px', marginTop: 6,
    background: 'var(--ms-bg)', color: 'var(--ms-fg)',
    border: '1px solid var(--ms-rule)', font: 'inherit',
  };
  const label = { ...typeRoleCss(r.eyebrow), color: 'var(--ms-fg)', display: 'block', marginTop: 18 } as React.CSSProperties;

  if (state === 'sent') {
    return <p data-type="body" style={{ ...typeRoleCss(r.body), color: 'var(--ms-fg)' }}>Thanks — your message is on its way.</p>;
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 520 }}>
      <label style={label}>Name<input name="name" required style={field} /></label>
      <label style={label}>Email<input name="email" type="email" required style={field} /></label>
      <label style={label}>Message<textarea name="message" required rows={5} style={field} /></label>
      <button
        type="submit"
        disabled={state === 'sending'}
        data-type="navLabel"
        style={{ ...typeRoleCss(r.navLabel), marginTop: 22, background: 'var(--ms-accent)', color: 'var(--ms-on-accent)', border: 'none', padding: '14px 28px', cursor: 'pointer' }}
      >
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      {state === 'error' && <p data-type="caption" style={{ ...typeRoleCss(r.caption), color: 'var(--ms-accent)', marginTop: 12 }}>Something went wrong — try again.</p>}
    </form>
  );
}
```

- [ ] **Step 5: Render the form on the Contact page**

In `lib/archetypes/main-street/pages.tsx`, import `MainStreetContactForm` and render `<MainStreetContactForm skin={skin} />` directly below the contact intro paragraph in `ContactPage`.

- [ ] **Step 6: Wire the close CTA**

In `lib/archetypes/main-street/beats.tsx`, find the `Close` component's CTA anchor with `href="#"` and change it to `href="/contact"`.

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run lib/archetypes/main-street/contact-form.test.tsx && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/archetypes/main-street/MainStreetContactForm.tsx lib/archetypes/main-street/pages.tsx lib/archetypes/main-street/beats.tsx lib/archetypes/main-street/contact-form.test.tsx
git commit -m "fix(contact): Main Street contact form + wire close CTA to /contact"
```

---

### Task 4: Mobile responsive pass

The product page uses a fixed two-column grid that never collapses, and several nav/beat paddings are desktop-sized inline styles. Move the offending fixed multi-column layouts to responsive CSS so they stack on small screens, and tighten nav padding on mobile.

**Files:**
- Modify: `lib/archetypes/main-street/chrome.tsx` (the `skinVarsCss`/global style block — add responsive rules; nav padding)
- Modify: `lib/archetypes/main-street/MainStreetProduct.tsx` (the product grid → responsive)
- Test: manual viewport check via the dev server (no unit test for pure layout)

- [ ] **Step 1: Add responsive CSS classes to the archetype style block**

In `chrome.tsx`, inside the existing injected `<style>` (the `.arch-main-street …` block), add:

```css
.arch-main-street .ms-product-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:var(--ms-section)}
.arch-main-street .ms-wrap{padding-left:40px;padding-right:40px}
@media (max-width: 768px){
  .arch-main-street .ms-product-grid{grid-template-columns:1fr;gap:28px}
  .arch-main-street .ms-wrap{padding-left:20px;padding-right:20px}
  .arch-main-street [data-ms-nav]{padding-left:20px;padding-right:20px}
}
```

- [ ] **Step 2: Use the class on the product grid**

In `MainStreetProduct.tsx`, replace the inline `style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', … }}` on the detail `<section>` with `className="ms-product-grid"` (move `alignItems: 'start'` into the CSS rule or keep it inline).

- [ ] **Step 3: Verify on the dev server at a phone width**

Start the dev server, open a built tenant home and a product page, set the viewport to 390px. Confirm: the product detail stacks to one column, the navbar isn't scrunched/overflowing, and the goods and founder beats don't overflow horizontally. Fix any beat that still overflows by giving it the same `@media` treatment.

- [ ] **Step 4: Commit**

```bash
git add lib/archetypes/main-street/chrome.tsx lib/archetypes/main-street/MainStreetProduct.tsx
git commit -m "fix(mobile): responsive product grid, nav, and wrap padding"
```

---

### Task 5: Product detail — more than one image

**DESIGN DECISION REQUIRED before building:** the crew writes one image prompt per product, and onboarding caps product images at `MAX_PRODUCT_IMAGES = 5` (recycled). Showing multiple *distinct* images per product means generating more (cost) or reusing the same image (pointless). Pick one before implementing:
- (a) Generate 2–3 angle variants for each product's detail page (raises per-build cost).
- (b) Keep one generated image but present it better — larger, full-bleed — and drop the empty thumbnail strip until the maker uploads their own.
- (c) Show the one generated image plus a tasteful skin-rendered placeholder set the maker is prompted to replace.

Recommended: (b) for launch — it's honest (no faked angles), costs nothing, and the maker fills the rest. The steps below implement (b); swap if you choose (a)/(c).

**Files:**
- Modify: `lib/archetypes/main-street/MainStreetProduct.tsx`
- Test: `lib/archetypes/main-street/MainStreetProduct.test.tsx`

- [ ] **Step 1: Write the failing test (one image → no empty thumb strip)**

```tsx
it('renders a single image full-width with no thumbnail strip', () => {
  const product = { /* ProductView fixture with media: [one image] */ } as ProductView;
  const { container } = render(<MainStreetProduct content={fixtureContent} product={product} skin={skin} />);
  // exactly one media element, no 3-up thumb grid
  expect(container.querySelectorAll('.archetype-photo').length).toBe(1);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/archetypes/main-street/MainStreetProduct.test.tsx`
Expected: FAIL (current code always renders the `rest` grid wrapper).

- [ ] **Step 3: Make the gallery degrade gracefully**

In `MainStreetProduct.tsx`, the `rest` grid already guards on `rest.length > 0`, so a single image renders only the primary — confirm the primary tile uses a generous aspect (`4 / 5`) and full column width. If the test fails because a placeholder counts as an image, adjust the gallery so that with one real image it shows just that one, larger.

- [ ] **Step 4: Run the test + typecheck**

Run: `npx vitest run lib/archetypes/main-street/MainStreetProduct.test.tsx && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/main-street/MainStreetProduct.tsx lib/archetypes/main-street/MainStreetProduct.test.tsx
git commit -m "fix(product): single-image detail renders cleanly without empty thumbs"
```

---

### Task 6: Rebuild the Moment as a portable, play-first front-door layer (D33/D43)

**DESIGN DECISION REQUIRED before building** — confirm the portable-layer contract:
- The Moment plays FIRST as a full-screen layer on a front-door visit, then melts (slow cinematic transition) into the Main Street hero beneath it.
- Play-once per shop: a cookie keyed by subdomain marks it seen; a returning front-door visitor skips straight to the page.
- Deep links / QR (any non-root path, or an explicit `?skipIntro`) bypass the Moment and do NOT set the cookie, so that visitor still gets it next time they enter through the front door.
- The footer carries an "Intro" link that replays it on demand.
- Decision to confirm: does "melt into the hero" mean the Moment overlay fades to reveal a *static* hero rendered beneath it, or does the current `MomentHero` (which already does the story→brand reveal and rests) stay as the hero and we only add the play-once gating + portability wrapper? The second is far less work; the first is closer to the portable-to-any-archetype intent in D33. Pick before starting.

**Files:**
- Create: `lib/archetypes/main-street/Moment.tsx` (the portable overlay layer — extracted/reworked from `MomentHero.tsx`)
- Create: `lib/moment/seen-cookie.ts` (read/set the per-shop play-once cookie; pure, testable)
- Modify: `lib/archetypes/main-street/MainStreet.tsx` (mount the Moment as a layer over the page hero)
- Modify: `lib/archetypes/main-street/chrome.tsx` (`MainStreetFooter` — add the "Intro" replay link)
- Test: `lib/moment/seen-cookie.test.ts`, `lib/archetypes/main-street/Moment.test.tsx`

- [ ] **Step 1: Write failing tests for the seen-cookie helper**

```ts
import { describe, it, expect } from 'vitest';
import { momentSeenCookieName, hasSeenMoment, markMomentSeen } from './seen-cookie';

describe('moment seen cookie', () => {
  it('names the cookie per subdomain', () => {
    expect(momentSeenCookieName('claires-candles')).toBe('moment_seen_claires-candles');
  });
  it('detects seen from a cookie string', () => {
    expect(hasSeenMoment('claires-candles', 'a=1; moment_seen_claires-candles=1')).toBe(true);
    expect(hasSeenMoment('claires-candles', 'a=1')).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/moment/seen-cookie.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the cookie helper**

```ts
export function momentSeenCookieName(subdomain: string): string {
  return `moment_seen_${subdomain}`;
}
export function hasSeenMoment(subdomain: string, cookieString: string): boolean {
  return cookieString.split(';').some((c) => c.trim().startsWith(`${momentSeenCookieName(subdomain)}=`));
}
export function markMomentSeen(subdomain: string): void {
  if (typeof document === 'undefined') return;
  // 1-year play-once marker.
  document.cookie = `${momentSeenCookieName(subdomain)}=1; path=/; max-age=31536000; samesite=lax`;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run lib/moment/seen-cookie.test.ts`
Expected: PASS.

- [ ] **Step 5: Extract the Moment into a portable overlay layer**

Create `lib/archetypes/main-street/Moment.tsx` as a client component that takes `{ identity, moment, skin, subdomain, forcePlay? }`. On mount it: reads `hasSeenMoment(subdomain, document.cookie)`; if seen and not `forcePlay`, renders nothing (the page hero shows immediately); otherwise plays the existing story timeline (lift the timeline logic from `MomentHero.tsx`), then on completion calls `markMomentSeen(subdomain)` and runs the melt transition (fade/scale the overlay out over ~1.2s) to reveal the page beneath. A `?skipIntro` query param or a non-root entry path forces the seen path without setting the cookie.

- [ ] **Step 6: Mount it as a layer in `MainStreet.tsx`**

The Moment becomes an overlay above the page, not the hero itself. Per the design decision: either render the page's resting hero in the normal flow and lay `<Moment …>` over it with `position: fixed; inset: 0; z-index: 80`, or keep `MomentHero` as the hero and wrap only the play-once gating. Thread `subdomain` into `MainStreetProps` and down from the render entry in `builder.tsx`.

- [ ] **Step 7: Add the footer "Intro" replay link**

In `chrome.tsx` `MainStreetFooter`, add an "Intro" link in the legal row that triggers a replay — simplest mechanism: link to `/?intro=1`, and have `Moment.tsx` treat `intro=1` as `forcePlay`.

- [ ] **Step 8: Write a render test for the gated layer**

```tsx
it('renders nothing when the shop cookie marks the moment seen', () => {
  document.cookie = 'moment_seen_test-shop=1';
  const { container } = render(<Moment identity={id} moment={m} skin={skin} subdomain="test-shop" />);
  expect(container.firstChild).toBeNull();
});
```

- [ ] **Step 9: Run all Moment tests + typecheck + lint**

Run: `npx vitest run lib/moment lib/archetypes/main-street/Moment.test.tsx && npx tsc --noEmit && npx eslint lib/archetypes/main-street lib/moment`
Expected: PASS.

- [ ] **Step 10: Verify on the dev server**

Load a built tenant front door in a fresh browser profile: the Moment plays, then melts into the hero. Reload: it does not replay. Open a product URL directly: no Moment, cookie still unset. Click footer "Intro": it replays.

- [ ] **Step 11: Commit**

```bash
git add lib/archetypes/main-street/Moment.tsx lib/moment/seen-cookie.ts lib/moment/seen-cookie.test.ts lib/archetypes/main-street/Moment.test.tsx lib/archetypes/main-street/MainStreet.tsx lib/archetypes/main-street/chrome.tsx lib/archetypes/main-street/builder.tsx
git commit -m "feat(moment): portable play-first front-door layer with play-once cookie, intro replay, deep-link bypass (D43)"
```

---

## Self-Review Notes

- Spec coverage: all six punch-list items map to Tasks 1–6.
- Two tasks carry an explicit design decision (Task 5 image approach, Task 6 melt contract) — these are flagged, not placeheld; confirm with the founder before building those two.
- Task 6 threads a new `subdomain` prop from `builder.tsx` render → `MainStreet` → `Moment`; verify the render entry has the subdomain available (it resolves the tenant, so it does) before wiring.
