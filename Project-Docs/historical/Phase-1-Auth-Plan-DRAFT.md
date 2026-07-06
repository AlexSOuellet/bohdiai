# Phase 1 Auth Plan — DRAFT

**Status:** DRAFT — ready to execute tomorrow. Expands Part 1 of `Phase-1-Backend-Plan-DRAFT.md`.

**Written:** 2026-06-18 (Session 46), after a long design conversation that settled the identity model. The model decision below is the load-bearing part; the build steps follow from it.

---

## The decision: ONE login system

A single global login for everyone — makers and (eventually) customers. One account per email, the way Supabase's built-in login already works. A person's *roles* are per shop, carried on the existing `tenant_members` bridge table.

Why we landed here (the short version of a long talk):
- We chased a per-shop / hide-the-platform model for a while, on the goal that a customer should never know two shops share a platform.
- That goal turned out to cost a lot — it would have meant building our own per-shop login system and it created a real support-and-friction problem (a fresh account at every shop).
- The deciding realization: two privacy questions were tangled together. (1) Does a *customer* see all the shops they buy from? (2) Does a *maker* see that their customer shops elsewhere? They're separable. We only actually care about (2) — and (2) stays locked shut regardless. Alex decided (1) doesn't matter.
- With (1) dropped, the single login is simplest, kills the friction, uses Supabase as-is, and — importantly — fits the database we already have. The model is Etsy-like underneath (one login across shops) but each storefront still looks like the maker's own brand on the surface.

What we give up: full "nobody can tell there's a platform" autonomy for a storefront. That's an edge want (and arguably outside the "concentrate on your craft, not the tech" audience). It can become a later premium; it does not drive the foundation.

How multi-shop works (it falls out for free): one login linked to each shop the person owns or helps run. Log in at bohdiai.com with more than one shop → a shop picker. Log in on a specific shop's own site → straight into that shop's dashboard (the address says which shop). Each shop is its own subscription. Same pattern as Shopify.

Customer accounts are still **Phase 2** (guest checkout at launch). When they come, they join this *same* login system — no separate customer auth to build. The `customer_profiles` / `tenant_members(role='customer')` tables already assume exactly this (global identity + per-shop membership + per-shop profile), so no schema rework.

---

## What's already in place (verified in the codebase this session)

- `lib/supabase-server.ts` and `lib/supabase-browser.ts` — the `@supabase/ssr` clients (anon key + session cookie, RLS-respecting). Built.
- `app/auth/callback/route.ts` — the PKCE code exchange for magic links / OAuth. Built.
- `app/auth/error` — referenced by the callback (confirm it exists / is adequate).
- `tenant_members` table — bridges `auth.users` → `tenants` with `role` (admin / customer) and `status`. RLS enabled. This is the per-shop roles table.
- `customer_profiles` / `customer_addresses` / `wishlist_items` — per-shop customer data, keyed to `tenant_members` + `tenant_id` + `user_id`. RLS enabled. For Phase 2.
- RLS policies migration exists (`20260522000020_rls_policies.sql`) — policies are written; the app currently drives everything through the service-role key, so they aren't exercised yet.
- `proxy.ts` — the subdomain → tenant resolver (Next's renamed middleware). Sets `x-tenant-id`, sanitizes forged tenant headers. This is where session refresh hooks in. It does NOT touch auth cookies today.

So the foundation is further along than the backend plan assumed. The clients and the callback exist; the data model exists. What's missing is the live wiring.

---

## Build steps for tomorrow (ordered)

1. **Session refresh in `proxy.ts`.** Add the Supabase SSR session-refresh step so login tokens are refreshed and written back on each request. Without it sessions silently expire. Slots in alongside the existing tenant resolution; keep the header-sanitize behavior intact.

2. **Sign-up + sign-in.** The pages/forms plus server actions calling `signUp` / `signInWithPassword` (and `signInWithOtp` for magic link — the callback already handles the code exchange). Confirm/seed `app/auth/error`. Plain email/password first; magic link is mostly already wired via the callback.

3. **Route gating.** A logged-out visitor to the maker dashboard (app.bohdiai.com) is redirected to sign-in. Storefronts stay public; only the dashboard and (later) admin gate. The check reads the session and redirects on no-user. The owner-login entry from a storefront routes to the central sign-in, then back into the dashboard (don't hold a maker session on the storefront subdomain).

4. **Wire signup → tenant ownership.** This is the real connective step. When a maker finishes onboarding and the store is built, write one `tenant_members` row: this `user_id` is `admin` of this `tenant_id`. That row is what every later "are you the owner of this shop?" check reads. The shop-ownership check = (session user) × (tenant the URL resolved to) → an active admin membership.

5. **Shop picker / landing.** On dashboard login: if the user has one shop, land them in it; if more than one, show a picker. (Most makers have one — keep the picker simple.)

6. **Exercise RLS as the dashboard comes online.** Authenticated dashboard reads should go through the authed client so the database enforces isolation, not just hand-written `tenant_id` filters. This is also the audit's security launch-gate (Phase C) — it starts being satisfiable now that auth exists.

---

## Onboarding sequencing change (decided this session)

Alex's call: **sign up → enter card → then the site is built.** Account exists *before* the build, so ownership links cleanly at publish.

Today's onboarding is Name → Niche → Mood → Trial → Build (after the Session-46 logo cut). The change: account creation comes up front, and the trial/card step (Stripe) gates the build. The `tenant_members` admin row is written at publish time (step 4 above). The exact re-sequencing of the onboarding screens is a related task (it touches the onboarding flow, not just the auth machinery) — flag it, don't silently fold the whole onboarding redesign into the auth build.

---

## Open questions to resolve at the start tomorrow

- **Sign-up surface:** embedded as onboarding step 1, or a separate `/signup` that flows into onboarding? (Leaning embedded — it's one continuous flow for the maker.)
- **Owner login on a storefront:** confirm the "one door, routes owner to central sign-in, password only entered on the trusted domain" approach for the password-entry location, so a maker's global password is never typed into another maker's storefront HTML.
- **`app/auth/error`:** does it exist and is it adequate, or build it.
- **Email/password only at launch, or also magic link?** The callback supports magic link already; decide whether to expose it day one.

## Tests

- Session refresh keeps a logged-in user logged in across requests.
- Logged-out visitor to the dashboard is redirected; storefront stays public.
- Onboarding writes exactly one admin `tenant_members` row linking the new user to the new tenant.
- The ownership check denies a user with no admin membership for a given tenant (the "Tenant A at Shop B's owner door gets nothing" case).
- Multi-shop user gets the picker; single-shop user lands directly.

Everything ships with tests + tsc green per the standing "ship complete, not partial" rule.
