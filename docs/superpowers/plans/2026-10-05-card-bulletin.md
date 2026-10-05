# Card Site Bulletin Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the bulletin board as a second card-site design (spec `docs/superpowers/specs/2026-10-05-card-bulletin-design.md`), carried over from the mockup `tmp/mockups/flyer/a-bulletin.html` as closely as the rules allow.

**Architecture:** The card envelope's content gains an optional `design` (`pinned` by default). `CARD_SPEC.render` hands the same `CardData` to either `CardLanding` (pinned) or the new `BulletinLanding`. The bulletin page has its own stylesheet module (`bulletin-styles.ts`), copied from the mockup's CSS with every hard-coded word replaced by owner data or `CARD_STRINGS.bulletin`. One new profile column, `makes text[]`, feeds the strip.

**Tech Stack:** Next.js 16 App Router (server components plus two small client islands), Supabase Postgres, Vitest and Testing Library, Playwright for the side-by-side screenshots.

**Production safety:** The live code parses card content strictly, so writing `design` into Rustic Rhody's envelope before this code is deployed would 404 the live site. Verify on a hidden test tenant (`bulletin-test`) built from the Rustic Rhody module. Switch Rustic Rhody only after merge and deploy, then delete the test tenant.

---

### Task 1: `makes` column + profile form

**Files:** Create `supabase/migrations/20261005000001_site_profiles_makes.sql`. Modify `lib/backend/profile/profile-form.ts`, `lib/backend/profile/queries.ts`, `lib/database.types.ts` (generated), `lib/backend/profile/profile-form.test.ts`.

- [ ] Migration: `alter table site_profiles add column if not exists makes text[] check (makes is null or (cardinality(makes) between 1 and 3 and array_position(makes, null) is null))`.
- [ ] `ProfileForm.makes: string[]`; `ProfileRow.makes: string[] | null`; `EMPTY_PROFILE.makes = []`; `MAKES_LIMIT = 3`, `MAKE_MAX = 30`. `buildProfileRow` trims and collapses spaces, drops blanks, and errors on more than 3 or on any item over 30 ("“…” is 34 characters. Keep each thing you make to 30."). The row gets `null` when empty. `profileFormFromRow` maps `null` to `[]`. `PROFILE_COLUMNS` adds `makes`.
- [ ] Tests (write first): blanks dropped; four items rejected; a 31-character item rejected; round trip from row to form.
- [ ] Run `node scripts/db-migrate.mjs`, `npm run gen:types`, then `npx vitest run lib/backend/profile`.

### Task 2: About you inputs

**Files:** `app/manage/profile/ProfileEditor.tsx`, `app/manage/profile/ProfileEditor.test.tsx`.

- [ ] Below the headline field, add a group labeled "What I make" with three inputs (`p-make-0..2`). Hint: "Up to three short things, like “Carved signs”. They show on some designs." Editing input i sets `makes[i]`. The form keeps three slots padded with `''`, and save sends them as is (blanks are dropped by `buildProfileRow`).
- [ ] Test: typing into the second input and saving sends `makes` containing that text.

### Task 3: Design selection

**Files:** `lib/archetypes/card/builder.tsx`, `lib/archetypes/card/design.ts` (new: `CARD_DESIGNS = ['pinned','bulletin'] as const`, `cardDesign(content)`), `lib/archetypes/card/design.test.ts`, `scripts/build-card-site.ts`, `scripts/sites/rustic-rhody.ts`.

- [ ] `CardContentSchema = z.object({ design: z.enum(CARD_DESIGNS).optional() }).strict()`. `cardDesign` returns `'pinned'` for a missing design.
- [ ] `render` and `renderContentPage` switch on the design.
- [ ] `CardSiteModule.SITE.design?: CardDesign`. The build writes `content: site.SITE.design === undefined ? {} : { design }`, and its profile writes include `makes`. The Rustic Rhody module gets `design: 'bulletin'` (applied to the live site only after deploy) and `makes`.
- [ ] Tests: `{}` gives pinned, `{design:'bulletin'}` gives bulletin, and an unknown design fails to parse.

### Task 4: Bulletin helpers

**Files:** `lib/archetypes/card/bulletin.ts`, `lib/archetypes/card/bulletin.test.ts`.

- [ ] `nameLines(name)` splits on whitespace into words, and returns `{ lines, size }`. `size` is `'xl'` when the longest word is 7 characters or fewer, `'l'` at 10 or fewer, `'m'` at 14 or fewer, otherwise `'s'`.
- [ ] `tabTarget(profile)` returns `{ kind:'call', href:'tel:+1…', label: phone }` when there's a phone, otherwise `{ kind:'message', href:'#touch', label: S.bulletin.tab(signature) }`.
- [ ] `dateParts(d)` returns `{ day: 'Sat Oct 17', rest: 'Harvest Craft Fair', town: 'Wickford' }`, sharing the formatter with `marqueeDateLine`.
- [ ] Tests for each, including one-word names, empty signatures and dates with no town.

### Task 5: Bulletin page + styles + client islands

**Files:** `lib/archetypes/card/BulletinLanding.tsx`, `lib/archetypes/card/bulletin-styles.ts`, `lib/archetypes/card/BulletinTabs.tsx` ('use client', tear then navigate, respects reduced motion), `lib/archetypes/card/BulletinPhotos.tsx` ('use client'; renders the pinned trio and the wall, with the shared viewer split out of `CardGallery` into `PhotoViewer.tsx`), `lib/archetypes/card/strings.ts` (`bulletin` block), `lib/archetypes/card/BulletinLanding.test.tsx`.

- [ ] Copy the mockup CSS into `bulletinCss()` with the class prefix `bb-`, the per-photo angles as `nth-child` rules, and the name size classes. Add reduced motion and the 700px phone rules exactly as in the mockup.
- [ ] Markup matches the mockup section for section. Each section is left out when its data is empty, following the pinned page's rules. The contact form is reused (`CardContactForm`) and restyled under `.bb-card`.
- [ ] `BulletinContentPage` renders privacy and terms as a kraft sheet on the wall.
- [ ] Tests: the stamp equals the kicker; the h1 has one span per word; the strip shows makes and stars, and is gone when there are none; the first three photos are pinned and the rest are on the wall; the dates list shows the circled day; 9 tabs with one torn; tabs go to `tel:` with a phone and to `#touch` without; the about card shows the heading, bio and signature; the form is there; the footer has the credit; no `style=` attributes anywhere.

### Task 6: Verify side by side

- [ ] Run the full `npx vitest run`, `npx tsc --noEmit` and `npm run lint` (before starting the dev server, never alongside it).
- [ ] Build the hidden test tenant: `npx tsx --env-file=.env.local scripts/build-card-site.ts rustic-rhody-bulletin-test --media tmp/mockups/card-rusticrhody/photos` (a test module that re-exports Rustic Rhody with subdomain `bulletin-test`).
- [ ] Start `next dev` on port 3100. Screenshot `bulletin-test.localhost:3100` and the mockup at 1440×900 and 390×844, top and scrolled, and compare. Fix differences until they match.
- [ ] Commit on the branch. Merging, deploying, switching Rustic Rhody and deleting the test tenant wait for Alex's look.
