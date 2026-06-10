# Audit Fix Plan — 2026-06-10

**Companion to:** `Audit-2026-06-10.md`. That document is the findings. This is the plan to act on them, **re-prioritized for the actual situation: the site is not live, there are no real tenants or traffic, and admin has not been built yet.**

> **Progress — 2026-06-10**
> - **A1 DONE.** Types regenerated from the live DB, all three `as unknown as` casts removed, `tsc` clean, 885/885 tests pass. Root cause fixed too: there was no repeatable type-gen, so added `npm run gen:types` (`scripts/gen-types.mjs`, uses the linked project + the CLI's stored login — no Docker) and installed the Supabase CLI as a devDependency.
> - **Part of D5 DONE.** The two genuinely-dead legacy RPCs (`write_tenant_storefront`, `write_tenant_storefront_layout`) were dropped (migration `20260610000001_drop_legacy_storefront_rpcs.sql`) and are gone from the regenerated types. Verified: zero code references, zero DB dependents.
> - **Decision locked:** the **Try-On tool is in launch scope** (Alex, 2026-06-10). So `store_versions` and `lib/tryon/*` are keepers — NOT dead code. (Saved to memory `project_tryon_in_launch`.)
> - **Verified NOT droppable:** `store_versions` (used by Try-On) and `style_sheets` (still read by the legacy `StorefrontPage` fallback renderer). `style_sheets` can only go once that fallback is retired — a separate decision, see D5.
> - **Still open:** A2, A3, A4, B1, all of Phase C, and the rest of Phase D (the code-file cleanup below).

## What the new context changes

The audit was written worst-case, as if a live system with real customer data were exposed. It isn't. That reorders everything:

- **The security cluster is no longer urgent — it's a launch gate.** Nothing is exploitable with no traffic, no real data, and no attacker able to spend your AI budget. C1, C2, H1, H2, H3, H5 move from "fix now" to "must be green before launch."
- **The unauthenticated admin route (C2) is barely a finding.** It's an unfinished feature with a TODO, not a hole in shipped code. The auth that closes it *is* the work of building admin. The only rule: never deploy that route to a public host before it's gated.
- **What actually matters right now is the build loop**, because you're running live builds today. The pipeline timeout already caused a real failure; the missing transaction is leaving half-built stores in the DB; the silent errors hide failures behind a stuck "running" screen; the type drift is forcing casts. These degrade *your* work, not a customer's — so they're the real "now" list.
- **The proxy header-strip (C1) is the one security item worth doing now anyway** — not for threat reasons, but because the wrong isolation pattern is propagating into every new storefront route. Cheaper to fix the boundary while it's small.

---

## Phase A — Build-loop integrity (do now; helps current work)

These have nothing to do with launch. They make the build pipeline you're using today reliable.

- [x] **A1. Regenerate `lib/database.types.ts` from the live schema, then delete the `as unknown as` casts. — DONE 2026-06-10.**
  Regenerated (added `design_choices`, `style_sheets`, `store_versions`, `builds`, `tenants.logo_url`; removed nothing). All three casts removed (`build-store.ts`, `log-choices.ts`, `write-archetype-storefront.ts`). Honest fixes used instead of casts: `BuildInput` became a `type` (so it serializes into the jsonb column), build `status` is narrowed back to its union via a runtime check, and the one type-erased content payload is widened to `Json` at its boundary with a comment. `tsc` clean, 885/885 tests pass. Repeatable refresh added: `npm run gen:types`.

- [ ] **A2. Make the storefront write transactional + add its missing test** (audit H4).
  `lib/generation/write-archetype-storefront.ts:42-110` inserts `tenants` → `content_pages` → `listings` with no transaction. Wrap in a Postgres RPC, **or** insert the tenant as `status: 'draft'` and flip to `'active'` only after all writes land (simpler, no RPC). Add the integration test this file currently lacks, covering the partial-failure path (a mid-write failure must leave nothing `active`).
  *Done when:* a forced failure on the 2nd/3rd insert leaves no orphaned active tenant; test proves it.
  *Side task:* sweep the DB for orphans already left by past failed builds.

- [ ] **A3. Stop the build-status writes from failing silently** (audit Medium).
  `lib/onboarding/build-store.ts:50-73` — `markRunning` / `updateLabel` / `completeBuild` / `failBuild` discard `{ error }`. Check it, `logger` it, and make `failBuild` surface. A failed `completeBuild` is why a build can spin "running" forever.
  *Done when:* an injected DB error on each is logged and propagated; test asserts it.

- [ ] **A4. Fix the pipeline timeout budget** (audit Medium — already caused a real failure).
  Crew stages run sequentially up to ~510s against `maxDuration = 300`. Add a single overall pipeline deadline sized under 300s (wrap `directAndProduce` in `withTimeout`), **and** add a cheap guard test asserting the sum of stage timeouts stays under the route ceiling so this can't silently regress. Consider trimming the copywriter's 180s (60% of the budget).
  *Done when:* a slow run aborts cleanly under the route ceiling instead of being killed by Vercel; guard test in place.

---

## Phase B — Fix the boundary while it's cheap (do now; small)

- [ ] **B1. Strip `x-tenant-id` in the proxy + 404 unresolved `/storefront/*`** (audit C1).
  In `proxy.ts`, before any conditional `set`, unconditionally `requestHeaders.delete('x-tenant-id')` and `delete('x-tenant-subdomain')`. Return 404 for `/storefront/*` when no subdomain resolved. Three lines, but it converts tenant isolation from "a forgeable header" back into "a real boundary," and stops every future storefront route from inheriting the wrong pattern.
  *Done when:* a proxy test proves an inbound forged `x-tenant-id` is dropped and apex `/storefront/...` 404s.
  *Optional follow-on (defer):* centralize tenant reads behind one anon/RLS-scoped helper so app code stops being the only boundary — bigger change, not needed now.

---

## Phase C — Launch gate (defer until auth + admin are built)

Do **not** deploy to a public host with any of these open. They mostly depend on auth existing, which doesn't yet. Track as a pre-launch checklist.

- [ ] **C1. Wire Supabase Auth (sessions).** Prerequisite for everything below.
- [ ] **C2. Gate the admin route** (`app/api/admin/tryon/route.ts`) behind founder auth + allowlist — part of building admin. Until then, keep `admin.bohdiai.com` off any public deploy.
- [ ] **C3. Require an authenticated session on the AI generation endpoints** (`onboarding/generate`, `onboarding/start`, `onboarding/actions.ts`).
- [ ] **C4. Harden the rate limiter:** make it atomic (single upsert-with-count-guard or a Postgres fn), fail **closed** on the expensive endpoints, and reset the cap from 20 to its launch value (`lib/rate-limit.ts:6`).
- [ ] **C5. Add a rate limit to `/api/contact`** + a per-tenant cap.
- [ ] **C6. zod-validate the API request bodies** (`onboarding/generate`, `onboarding/start`) — schemas in `lib/validation.ts`, parse at the boundary, reject 400.
- [ ] **C7. Harden SVG logo upload** — drop SVG or sandbox it, validate the path segment, require a session.
- [ ] **C8. Add CSP + HSTS** to `next.config.js` (CSP needs care for the inline `<style>` sinks).

---

## Phase D — Hygiene & quick wins (anytime; low risk)

Independent cleanup. Several are one-liners and can be batched.

- [ ] **D1. Quick-wins batch:** fix the open redirect in `app/auth/callback/route.ts:15` (require a single leading `/`); fix the stale `'simple'` mood key in `lib/archetypes/main-street/index.tsx:26` (→ `elegant`); fix the raw `<a>` in `lib/archetypes/main-street/chrome.tsx:240`.
- [ ] **D2. Make lint actually gate CI** — add `--max-warnings 0` and ensure lint errors fail the build (currently `chrome.tsx:240` is an error but ESLint exits 0).
- [ ] **D3a. Delete the verified-dead `app/storefront/gallery/page.tsx`** — Gallery archetype was deleted; this route 404s for every tenant. Safe, mechanical.
- [ ] **D3b. Decide on `app/archetype-test/**` and `app/_reference/functional-studies`** — dev/preview routes that currently ship in the production bundle. These read like Alex's own preview harness, so **needs Alex's call:** delete, or gate behind a dev-only check so they don't ship. (Asked 2026-06-10, awaiting decision.)
- [ ] **D4. Repo hygiene — needs Alex's call on his scratch files:** `procession-mockup.html`, `_design-mocks/`, and the untracked `skin-shelf.html` look like design scratch. Untrack/gitignore or delete once Alex confirms they're throwaway. (Asked 2026-06-10, awaiting decision.)
- [x] **D5a. Drop the dead legacy RPCs — DONE 2026-06-10.** `write_tenant_storefront` / `write_tenant_storefront_layout` dropped (migration `20260610000001`); verified zero code refs and zero DB dependents.
- [ ] **D5b. `style_sheets` table — retire only after the legacy fallback goes.** It's still read by the `StorefrontPage` fallback renderer (`app/storefront/_components/StorefrontPage.tsx:226`), so it can't just be dropped. Decide whether any non-archetype tenant still needs that legacy content-page renderer; if not, retire the renderer first, then drop the table. **Not a mechanical drop — a real decision.**
- [x] **D5c. `store_versions` table — KEEP.** Used by the Try-On tool, which is confirmed launch scope. Not dead.
- [ ] **D6. `console.error` → `logger`** in the Phase-0 routes (waitlist, confirm, `app/page.tsx`) and add a `no-console` lint rule.
- [ ] **D7. Remove banned non-null assertions** (`!.`) where flagged — narrow with a guarded local const instead.
- [ ] **D8. `builds/[id]` ownership check** — rides on C1 (auth); do it when sessions land.

---

## Suggested sequence

1. **Phase A** (A1 → A2/A3/A4) — the build loop you're using right now. Biggest payoff today.
2. **B1** — cheap, stops the bad pattern spreading.
3. **Phase D quick wins (D1–D4)** opportunistically when touching nearby code.
4. **Phase C** as a single pre-launch push once auth/admin are real — it's a coherent chunk of work, not piecemeal.

Phase A + B is roughly the near-term scope. Everything in C is gated on work you haven't started, so it waits without cost. Each item ships with its test per the standards (tests are part of done), one change at a time, your sign-off on each.

---

*Plan dated 2026-06-10, branch `session-12/layout-engine`. Living tracker — updated 2026-06-10 after completing A1 and the dead-RPC drop (D5a). Remaining open items above are the backlog; the checked items are done.*
