# Phase 1 — Gallery Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Gallery archetype entirely so Main Street is the only archetype the engine can build, with the codebase compiling, all tests green, and no live tenant rendering a deleted archetype.

**Architecture:** Gallery is a self-contained archetype module (`lib/archetypes/gallery/`) wired into the engine only through the registry (`registry.tsx`). Removing the registry entry, the module, its tests, its test routes/fixtures, and its harness script — plus converting the one stale Gallery tenant to Main Street — fully retires it. The legacy block-system "gallery" (the `hero-split-gallery` block and the `'gallery'` `PageType`) is unrelated and stays untouched.

**Tech Stack:** TypeScript (strict), Next.js App Router, Vitest, Supabase.

---

### Task 1: Drop Gallery from the registry

**Files:**
- Modify: `lib/archetypes/registry.tsx`
- Test: `lib/archetypes/registry.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
// lib/archetypes/registry.test.ts
import { describe, it, expect } from 'vitest';
import { archetypeSpec, archetypeMenu } from './registry';

describe('archetype registry', () => {
  it('offers exactly one archetype — Main Street', () => {
    const menu = archetypeMenu();
    expect(menu.map((s) => s.key)).toEqual(['main-street']);
  });

  it('no longer resolves the Gallery archetype', () => {
    expect(archetypeSpec('gallery')).toBeUndefined();
  });

  it('still resolves Main Street', () => {
    expect(archetypeSpec('main-street')?.key).toBe('main-street');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/archetypes/registry.test.ts`
Expected: FAIL — `archetypeMenu()` returns two keys (`main-street`, `gallery`).

- [ ] **Step 3: Remove the Gallery import and entry**

Edit `lib/archetypes/registry.tsx` to:

```tsx
/**
 * Archetype registry — the menu Bohdi chooses from and the engine/render share.
 * Each entry is a fully self-describing build spec. Adding an archetype = one
 * import here; the engine and StorefrontPage never name an archetype.
 */
import type { ArchetypeBuildSpec } from './builder';
import { MAIN_STREET_SPEC } from './main-street/builder';

export const ARCHETYPE_SPECS: Record<string, ArchetypeBuildSpec> = {
  [MAIN_STREET_SPEC.key]: MAIN_STREET_SPEC as ArchetypeBuildSpec,
};

export function archetypeSpec(key: string): ArchetypeBuildSpec | undefined {
  return ARCHETYPE_SPECS[key];
}

export function archetypeMenu(): ArchetypeBuildSpec[] {
  return Object.values(ARCHETYPE_SPECS);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/archetypes/registry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/archetypes/registry.tsx lib/archetypes/registry.test.ts
git commit -m "Gallery deletion: drop Gallery from the archetype registry"
```

---

### Task 2: Remove Gallery from the shared archetype tests

**Files:**
- Modify: `lib/archetypes/build-specs.test.ts` (remove all Gallery cases + `galleryContent` fixture + Gallery imports)
- Delete: `lib/archetypes/handoff.test.ts` (it tests only `Gallery.handOff`; Main Street's handOff is covered elsewhere — confirm before deleting, see Step 1)

- [ ] **Step 1: Confirm handoff.test.ts is Gallery-only**

Run: `grep -n "MAIN_STREET\|main-street\|GALLERY\|gallery" lib/archetypes/handoff.test.ts`
Expected: only `GALLERY_SPEC` references. If Main Street is also tested there, do NOT delete — instead remove only the Gallery `describe` block. (As mapped, the file tests only `Gallery.handOff`.)

- [ ] **Step 2: Edit build-specs.test.ts**

Remove these from `lib/archetypes/build-specs.test.ts`:
- the imports `import { GALLERY_SPEC } from './gallery/builder';` and `import type { GalleryContent } from './gallery/schemas';`
- the `it('Gallery needs at least 8 pieces to fill the wall', ...)` case (lines ~49–53)
- the `const galleryContent = {...}` fixture (line ~96+)
- the entire `describe('GALLERY_SPEC', ...)` block (line ~122+)

Leave all Main Street cases intact.

- [ ] **Step 3: Delete the Gallery-only handoff test**

```bash
git rm lib/archetypes/handoff.test.ts
```

- [ ] **Step 4: Run the archetype test suite**

Run: `npx vitest run lib/archetypes/`
Expected: PASS — no references to `./gallery/*` remain in tests.

- [ ] **Step 5: Commit**

```bash
git add -A lib/archetypes/build-specs.test.ts
git commit -m "Gallery deletion: remove Gallery cases from archetype tests"
```

---

### Task 3: Delete the Gallery test routes, fixtures, and harness

**Files:**
- Delete: `app/archetype-test/gallery/page.tsx`
- Delete: `app/archetype-test/gallery/product/page.tsx`
- Delete: `app/archetype-test/gallery-fixture.json`
- Delete: `app/archetype-test/gallery-product-fixture.json`
- Delete: `scripts/test-gallery-archetype.ts`

- [ ] **Step 1: Confirm fixture paths**

Run: `ls app/archetype-test/gallery* app/archetype-test/gallery/ scripts/test-gallery-archetype.ts`
Expected: lists the route files, the two fixtures, and the harness. (Adjust deletions to the actual fixture filenames if they differ.)

- [ ] **Step 2: Delete them**

```bash
git rm -r app/archetype-test/gallery app/archetype-test/gallery-fixture.json app/archetype-test/gallery-product-fixture.json scripts/test-gallery-archetype.ts
```

- [ ] **Step 3: Verify no remaining import of the gallery test routes/fixtures**

Run: `grep -rn "gallery-fixture\|archetype-test/gallery\|test-gallery-archetype" --include=*.ts --include=*.tsx lib app scripts`
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Gallery deletion: remove Gallery test routes, fixtures, and harness"
```

---

### Task 4: Delete the Gallery module

**Files:**
- Delete: `lib/archetypes/gallery/` (entire directory)

- [ ] **Step 1: Confirm nothing outside tests/routes still imports the module**

Run: `grep -rn "archetypes/gallery\|from './gallery'\|from '../gallery'" --include=*.ts --include=*.tsx lib app scripts | grep -v "lib/archetypes/gallery/"`
Expected: no matches (registry, tests, routes, harness already removed in Tasks 1–3).

- [ ] **Step 2: Delete the directory**

```bash
git rm -r lib/archetypes/gallery
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS — no unresolved `./gallery` imports.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Gallery deletion: remove the Gallery archetype module"
```

---

### Task 5: Clean Gallery from comments and the now-moot catalog gate

**Files:**
- Modify: `lib/archetypes/builder.ts` (comments referencing Gallery)
- Modify: `lib/onboarding/build-archetype-store.ts` (comment + the `fitsCatalog` filter, now that only Main Street remains and it always fits)

- [ ] **Step 1: Update builder.ts comments**

In `lib/archetypes/builder.ts`, reword the two comments that cite Gallery as a live example so they no longer name a deleted archetype:
- The `RenderPayload` comment (line ~50): change "Products may be a separate catalog (Main Street) or already embedded in content (Gallery → empty here)." to "Products are a separate catalog of rows (the archetype never authors the catalog)."
- The `fitsCatalog` comment (line ~64): change the Gallery-wall example to a neutral one: "A STRUCTURAL gate, not aesthetic steering — an archetype can declare it needs a minimum catalog to be viable. Catalog size limits which shapes are on the menu; everything past that stays Bohdi's choice."

(Keep `fitsCatalog` on the interface — it is still part of the contract even though the only archetype returns `true`.)

- [ ] **Step 2: Simplify the onboarding comment**

In `lib/onboarding/build-archetype-store.ts` (~line 111), reword the comment that references "the Gallery wall needs density" to a neutral statement about the structural catalog gate. The `archetypeMenu().filter((s) => s.fitsCatalog(...))` call stays as-is (it now simply keeps Main Street, which always fits) — do not special-case it.

- [ ] **Step 3: Typecheck + the touched suites**

Run: `npx tsc --noEmit && npx vitest run lib/archetypes/ lib/onboarding/`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/archetypes/builder.ts lib/onboarding/build-archetype-store.ts
git commit -m "Gallery deletion: drop Gallery from comments; keep the structural catalog gate neutral"
```

---

### Task 6: Resolve the stale Gallery tenant

**Context:** `abigails-custom-creations` is stored with `archetypeKey: 'gallery'` (Session 29). With the Gallery renderer gone, its live route would fail. It is stale test data; re-enriching its content belongs to Phase 2. For Phase 1 the only requirement is that **no published tenant references a deleted archetype**.

**Files:**
- Create (throwaway): `scripts/retire-gallery-tenant.ts`

- [ ] **Step 1: Find any tenant whose stored envelope names the Gallery archetype**

Run this query (via the project's DB access — `mcp__postgres-bohdiai__query` or `scripts/db-*`):

```sql
SELECT t.subdomain, cp.slug, cp.layout_tree->'root'->>'archetypeKey' AS archetype_key
FROM content_pages cp
JOIN tenants t ON t.id = cp.tenant_id
WHERE cp.layout_tree->'root'->>'kind' = 'archetype'
  AND cp.layout_tree->'root'->>'archetypeKey' = 'gallery';
```

Expected: rows for `abigails-custom-creations` (and possibly try-on `store_versions`).

- [ ] **Step 2: Also check store_versions**

```sql
SELECT tenant_id, label, envelope->>'archetypeKey' AS archetype_key
FROM store_versions
WHERE envelope->>'archetypeKey' = 'gallery';
```

- [ ] **Step 3: Retire the stale records**

Since this is stale test data and Phase 2 will re-run real onboardings, set the affected `content_pages` rows to unpublished (so the route 404s cleanly instead of crashing) rather than rendering a deleted archetype:

```sql
UPDATE content_pages
SET status = 'draft'
WHERE layout_tree->'root'->>'kind' = 'archetype'
  AND layout_tree->'root'->>'archetypeKey' = 'gallery';

DELETE FROM store_versions WHERE envelope->>'archetypeKey' = 'gallery';
```

(Confirm column names against the live schema before running; `status` values are `published`/`draft` per `StorefrontPage`'s `.eq('status', 'published')`.)

- [ ] **Step 4: Verify no published Gallery tenant remains**

Re-run the Step 1 query filtered to `status = 'published'`.
Expected: zero rows.

- [ ] **Step 5: Commit the throwaway script (or note the manual SQL in the session log)**

```bash
git add scripts/retire-gallery-tenant.ts
git commit -m "Gallery deletion: retire the stale Gallery tenant + versions"
```

---

### Task 7: Full green check

- [ ] **Step 1: Typecheck, lint, full test suite**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: PASS — no `gallery` archetype references, all suites green.

- [ ] **Step 2: Final grep sweep**

Run: `grep -rni "archetypes/gallery\|GALLERY_SPEC\|galleryArchetype\|GalleryContent\|GalleryProduct" --include=*.ts --include=*.tsx lib app scripts`
Expected: no matches. (The legacy `hero-split-gallery` block, the `'gallery'` `PageType`, and "gallery wall" skin descriptions are unrelated and may remain.)

- [ ] **Step 3: Commit any stragglers**

```bash
git add -A && git commit -m "Gallery deletion: final sweep" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:** Implements spec §6 (Gallery deletion) in full — registry, module, tests, routes, harness, comments, and the stale tenant. The try-on reduction noted in spec §9 is deferred (try-on still resolves archetypes dynamically; with only Main Street registered it simply offers Main Street — no static Gallery import remains after Task 4, confirmed by Task 4 Step 1). 

**Placeholder scan:** No TBD/TODO; SQL and edits are concrete. Fixture filenames are verified at Task 3 Step 1 before deletion (mapped as `gallery-fixture.json` / `gallery-product-fixture.json`).

**Type consistency:** `archetypeSpec`/`archetypeMenu` signatures unchanged; `ArchetypeBuildSpec`/`fitsCatalog` kept on the contract. No new types introduced.
