# Other-niche: describe-and-build (throwaway test)

**Date:** 2026-06-10
**Status:** Approved, ready to plan
**Owner:** Claude (Lead Developer)
**Approver:** Alex

## Why

We are about to hand-write ~20 niche files so the launch maker audience has their
category in onboarding. Before paying for that, we want to know whether Bohdi even
needs a pre-written niche file. If a maker can simply *describe* what they make and
Bohdi builds a good store from that description plus their chosen feeling, then both
the on-the-fly research pass (designed in the Phase-1 decisions log) and the
file-writing effort come into question.

This is a **test**, delivered as the real Other-path so we can run it live. It is
deliberately the cheapest version: no research, nothing saved or reusable.

## What it does

When a maker picks **Other** in the onboarding niche step, they get a short textarea
("Tell us what you make"). Bohdi builds the store from that free-text description plus
the feeling they pick — using his own knowledge, with no research pass and no niche
file. The store publishes as a normal, lookable tenant.

## Scope

In scope:

- An "Other — something else" entry in the niche dropdown, always visible (including
  while filtering), pinned at the bottom.
- A "Tell us what you make" textarea shown only when Other is selected.
- The build path skips the database niche lookup for Other and feeds the maker's
  description to the crew in place of a niche file's prose body.
- The tenant persists with the typed text in `tenants.niche_description`,
  `niche_from_list = false`, and `primary_niche` left null.
- Tests for the build branch and the onboarding-step gating.

Explicitly **out of scope** (deferred; supersedes the logged Other-path design for now):

- The on-the-fly research pass.
- Any saved/reusable niche row, admin approval, or niche-table write.
- The adjacent-niche route and novel-product branch from the decisions log
  (the earlier D15/D16 design). If this test lands, we write the simplification up
  as a new decision.
- Mood is unchanged — the maker still picks a feeling and Bohdi still receives it.

## Design

### 1. Onboarding niche step (`app/onboarding/_components/StepNiche.tsx`)

- Add a sentinel option with slug `other`, label "Other — something else", rendered as
  the last item in the dropdown list and not filtered out by the search query.
- When `selectedSlug === 'other'`, render a textarea bound to a new
  `nicheDescription` state, with a plain-English prompt ("Tell us what you make —
  a sentence or two is plenty"). Otherwise the step behaves exactly as today.
- `canContinue` for the Other path requires: a non-empty trimmed description, a
  non-empty shop name, and `status === 'available'`. For a real niche pick, the gate
  is unchanged.
- On submit for Other, advance with `nicheSlug: 'other'`, `nicheDisplayName: ''`,
  and `nicheDescription: <trimmed text>`. For a real niche, `nicheDescription` stays
  empty.

### 2. Onboarding state (`app/onboarding/_components/types.ts`)

- Add `nicheDescription: string` to `OnboardingData` and `INITIAL_DATA` (default `''`).

### 3. Carry the description to the build

- Thread `nicheDescription` from onboarding state through the generate call
  (`StepBuild` → the `/api/onboarding/generate` route and the `generateStorefront`
  server action → `runStorefront` → `buildArchetypeStore`) as an optional field.

### 4. Build engine branch (`lib/onboarding/build-archetype-store.ts`)

- When `nicheSlug === 'other'` (carrying a `nicheDescription`), skip the
  `niches` table query. Build the `CrewBrief` with:
  - `nicheBody` = the maker's description (the material vocabulary the crew reads).
  - `nicheDisplayName` = a light generic label (e.g. derived from the description or
    a neutral fallback) — the point of the test is to see what Bohdi does with the
    description as the substance, so we keep this minimal rather than clever.
- For a real niche slug, the existing lookup path is unchanged (still throws
  "Niche not found" if an approved row is missing — that invariant stays for
  list-picked niches).

### 5. Persistence (`lib/generation/write-archetype-storefront.ts`)

- Extend the writer to accept `nicheFromList: boolean` and an optional
  `nicheDescription`.
- For Other: write `primary_niche = null`, `niche_from_list = false`,
  `niche_description = <text>`. `tenantTypes` falls back to `['seller']`
  (the existing default).
- For a list-picked niche: `primary_niche = slug`, `niche_from_list = true`,
  `niche_description = null` — current behavior preserved.

## Testing (alongside the code, per Engineering Standards)

- `build-archetype-store` test: with `nicheSlug = 'other'` and a description, the
  build does **not** query the `niches` table and constructs the brief from the
  description; with a real slug, the lookup path is exercised as today.
- `StepNiche` test (if component tests exist for it; otherwise a focused unit test of
  the gating logic): selecting Other reveals the textarea and Continue stays disabled
  until the description and an available subdomain are present.
- `tsc` clean and the suite green before commit.

## Definition of done

- A maker can pick Other, type what they make, pick a feeling, and watch a real store
  build and publish on a subdomain — with no niche file involved.
- The typed description lands in `tenants.niche_description`; no niches-table row is
  created.
- Tests cover the build branch and the step gating; suite green, `tsc` clean.

## After the test

If Bohdi's description-only builds are good, we capture a decision that the Other path
needs no research and revisit whether the 20 hand-written niche files are worth it.
If they're weak, that's the evidence that the niche files (or research) earn their keep.
