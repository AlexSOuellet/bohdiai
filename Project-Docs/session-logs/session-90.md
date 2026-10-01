# Session 90 — 2026-09-30: backend auto sign-out

## Done
- **Auto sign-out for the backend, live.** Every `/manage` request on the app host is checked in `middleware.ts`. A session ends 8 hours after the last activity, and always 7 days after sign-in (makers use shared/public devices; Supabase's own timeouts are paid-plan).
  - 7-day limit: the sign-in time Supabase signs into the login token (`amr`), read with `getClaims()`. A token with no sign-in time or session id is ended, not trusted.
  - 8-hour limit: `bk_seen` cookie on the app host only, HMAC-signed and bound to the session id (`lib/backend/session-limits.ts`). Missing or forged cookie → idle counted from sign-in, so tampering can only make it stricter.
  - Missing/short `BACKEND_SESSION_SECRET` is logged and falls back to that strict rule (signed out 8h after sign-in even while active).
  - On sign-out: local-scope Supabase sign-out, then redirect to `/signin?ended=idle|max`, which says why.
- Alex chose the signed cookie (my recommendation) and added `BACKEND_SESSION_SECRET` to the Worker's top-level Variables and Secrets. Local `.env.local` has its own, different value.
- Verified: real sign-in on app.localhost lands in the backend (real tokens carry `amr`); live after deploy: the sign-in note renders, `/manage` → sign-in when signed out, `/admin` on Classic Loafs → backend, bohdiai.com and Cut-Pro 200.
- Full suite: one failure on the first run, the known flaky `SectionEditor.test.tsx`; passes alone and on the re-run. tsc + lint clean.

## Not covered
- A server action posted after the session ended gets the sign-in redirect as its response; the next page load shows sign-in. Fine for now.

## Next
- Maker backend 1b — Catalog: write the plan from the piece-1 spec, then build.

---

## 2026-10-01 — Maker backend 1b Catalog, built and LIVE

**Plan:** `docs/superpowers/plans/2026-10-01-maker-backend-1b-catalog.md` (17 tasks, built batch by batch with a separate review after each). Alex OK'd the visible calls: option limits (3 options / 30 choices / 100 combinations / 12 photos), "from $X" and "Sold out" on cards, option dropdowns on the product page, archive not delete, Penny's look with one-form editors.

**What owners get (app.bohdiai.com/manage):**
- Products list (find, filter, photo/price/stock/status) with a **Home column**: tick up to 5 products for the home page; saves on click; the DB enforces 5 (`set_listing_on_home`, errcode P0010). With nothing ticked the home shows the first five as before.
- Product editor: basics, several photos (reorder, main photo), price and stock, options with a combinations table (own price/stock/available per combination; renaming an option keeps typed values), downloads per choice when `digital_products` is on (private `tenant-files` bucket), collections, status; Save returns to the list with "Saved …" (Alex: otherwise it looks unsaved); Duplicate; two-step Archive. Sample (placeholder) photos are shown with a note.
- Collections list (add, order) and editor (products and their order, cover, status).
- Home screen: product/collection tiles + Needs attention (no photo, drafts, sold out).

**Shop side:** every photo; option picker with each combination's price and sold-out/not-available marks; "from $X" / "Sold out" on all 10 card price spots via `priceLabel`; collections read from `listing_collections` in the owner's order; drafts/archived never render; reads throw instead of showing a wrong shop; contractor sites skip the catalog (`usesCatalog` on archetype specs).

**Database (production):** migrations 20261001000001–06: per-choice kind/file, private bucket, narrowed uploads read rule, `listing_collections` backfill (55), transactional `save_product` / `save_collection` / `order_collections` (security invoker, admin check, type guard, clears `is_preview`, home limit), `listings.on_home`, `set_listing_on_home`. Each function exercised as the real Classic Loafs owner inside rolled-back transactions.

**Other fixes along the way:** `@supabase/ssr` 0.5.2 → 0.10.3 (removes a type cast; auth responses now no-cache); auth callback `next` open-redirect closed; build script (`run-build.ts`) now writes `listing_collections`; **scroll-in reveals never fired for sections taller than the screen** (phones / narrow windows showed an empty "Fresh from the kitchen" on the live site) — fixed for all four observers.

**Deploy incident:** Cloudflare switched on "Builds for Preview branches" overnight; pushes to main ran `npx wrangler preview` and failed (this morning's plan push included). Alex switched it off; an empty commit redeployed. Live checks: Classic Loafs home/shop/collections/product 200, prices "$16", collections show products, Cut-Pro + bohdiai.com 200, backend pages redirect signed-out visitors, `/admin` works.

**Test data:** the walk-through's "Test" product soft-deleted; Classic Loafs' home ticks cleared (back to its five breads, first five on home).

**Checks:** 2024 tests, typecheck clean, lint 0 errors, coverage gate passing.

**Next:** 1c Video (confirm Cloudflare Stream cost first), then 1d Custom domains. Options get a real test with the first client who sells sizes/scents. Piece 2 note: download delivery must force `Content-Disposition: attachment` (SVG).
