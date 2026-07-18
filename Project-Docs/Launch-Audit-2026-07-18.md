# Launch Readiness Audit — 2026-07-18

**Purpose.** Every item the Master Spec puts in the launch scope, checked against the code as it exists today. This is the input the rewritten plan gets built from. The existing `Full-Plan.md` is not a plan to launch — it is a plan to prove two things work (onboarding quality, and the editor) — so it is silent on most of what follows.

**Method.** Each line below was verified against the repository or the database on 2026-07-18, not against a checkbox. Where an item is partial, the specific missing piece is named. Where a claim rests on a file, the file is cited.

**Source of the launch scope.** Master Spec §17 (Phase 1 MVP), §5 (onboarding flow), §7 (commerce), §9 (Market Mode), §10 (tenant dashboard), §11 (founder admin), §12 (marketing site), §13 (Skool).

---

## Summary

The storefront engine is the finished part of the product. Everything a customer sees on a maker's store — the generation, the family system, the page set — is built and has been run live many times.

Almost everything a *maker* does after onboarding is not built. Four of the six dashboard sections are missing. There is no way to add a product, take an order, take a payment, or log a sale. The founder admin does not exist in any form.

The database is fully built out for all of it — 38 tables including orders, payments, shipments, variations, promos, and gift cards. The foundation-first discipline held. What is missing is application surface, not schema. That materially lowers the cost of everything in the "not started" list below, because none of it needs a migration to begin.

---

## Complete

| Item | Evidence |
|---|---|
| AI onboarding — name, niche, mood, build, account | `app/onboarding/` — six step components, run live across all six families |
| Storefront generation via the crew | `lib/onboarding/crew/` — director, copywriter, cinematographer, graphic artist, director's cut |
| Family layer — six families drive every section variant, stack, palette, type | `lib/archetypes/main-street/families.ts` |
| Storefront page set — home, shop, product, about, collections, collection detail, events, testimonials, contact, privacy, terms | `app/storefront/` — 13 routes |
| Public event calendar on the storefront | `lib/archetypes/main-street/FindUsCalendar.tsx` + six find-us treatments |
| Collections — rendering and persistence | `persistCollections` in the build runner; `collections` + `listing_collections` tables |
| Subdomain hosting | Cloudflare Worker + `x-bohdi-shop` header routing |
| Authentication — sign-in, OAuth, callback, membership, owner assignment | `lib/auth/` — actions, oauth, membership, assign-owner |
| Editor Door 1 — change the feeling | `app/dashboard/website/` + `commitLook` |
| Family wallpaper control — keep, mute, set strength; persists and re-applies live | `lib/editor/texture.ts` (Session 74) |

---

## Partially built

### The AI editor — the largest gap against the spec

Master Spec §10 describes the editor as three editing modes plus a slider: AI chat for complex requests, highlight-and-transform for targeted rewrites, direct click-to-edit for quick manual changes, and the Vibe Slider (§6.5).

What exists is a single door: pick a different feeling, and keep or mute the family wallpaper. Content is not editable by the maker at all — not by chat, not by clicking it, not by highlighting it.

None of the three named editing modes exist. The Vibe Slider does not exist.

This gap is not visible in `Full-Plan.md`, which reframes the editor as three "doors" (mood, colors, products). Those three doors do not add up to the editor the Master Spec promises. **The plan rewrite has to reconcile these two descriptions — they are not the same product.**

### Maker dashboard — two of six sections

Built: Dashboard Home (`app/dashboard/page.tsx`), My Website (`app/dashboard/website/page.tsx`).

Missing: Listings, Orders, Log a Sale, Settings.

### Onboarding trial step — a shell

`app/onboarding/_components/StepTrial.tsx` renders a trial screen but collects no card and takes no payment; submitting simply advances. There is no Stripe call behind it.

**Defect found during this audit:** the same screen's heading reads "7 days free, then $35/mo" while the badge beside it reads "14-day trial." One of the two is wrong. D10 sets the trial at seven days.

### Marketing site — still the Phase 0 version

`app/page.tsx` is the coming-soon page with the waitlist and founder cap. Master Spec §12's launch version (pricing section, Get Started into onboarding, beta section converted to testimonials) is not built.

### Niche content

15 approved, 4 in draft, 38 unwritten from the Session-45 batch. Cowork has not advanced these since Session 67.

Note: `SESSION-BRIEF.md` currently lists "bulk-approve niches so the picker shows more than 2 options" as a next action. The database shows 15 already approved — that action appears stale, or the picker is filtering on something other than status. Worth one look before spending time on it.

---

## Not started

Nothing below exists in the repository today.

| Item | Spec source | Note |
|---|---|---|
| Cart — line items, quantities | §7 | `app/storefront/cart/page.tsx` is a 42-line empty-state stub with a comment saying real cart ships with the commerce build |
| Checkout | §7 | — |
| Stripe integration | §7 | No payment code anywhere in the repo |
| Square integration | §7 | — |
| Order management + webhook capture | §7, §10 | `orders`, `order_items`, `payments` tables exist and are unused |
| Guided payment-processor setup walkthrough | §7 | — |
| Listings management — add / edit / archive | §10 | A maker cannot create a product today |
| Seller-defined variations UI | §8, D4 | `variation_attributes`, `variation_options`, `listing_variants` tables exist and are unused |
| Claude Vision photo auto-fill | §10 | — |
| Log a Sale / Market Mode | §9 | — |
| Internal event log, expenses, per-event profitability | §9 | `events`, `event_expenses` tables exist and are unused |
| Social media links | §17 | No field in the content schema, no rendering |
| Subscription billing — one tier, 7-day trial, card required | §4, D10, D19 | — |
| Founder admin — user management | §11 | `app/admin/` and `app/api/admin/` are empty directories, nothing tracked in git |
| Founder admin — revenue dashboard | §11 | — |
| Founder admin — niche management | §11 | — |
| Founder invite flow — approve, comp, emailed set-password | D61 | Depends on the admin existing |
| Skool link in the maker dashboard | §13 | Skool link exists in the waitlist confirmation email and confirmed page only |
| `learn.bohdiai.com` redirect | §3, §13 | — |
| FAQ content | Full Plan §1.0 item 6 | No `faq` field in the content schema; the plan assumed one in the footer |

---

## Explicitly Phase 2 in the Master Spec — not launch blockers

Worth stating so the rewritten plan does not carry them as gates:

- Custom domains (§4, §10). `Full-Plan.md` §6.3 puts Cloudflare for SaaS before beta. The Master Spec puts custom domains in Phase 2. These disagree — the plan appears over-scoped here.
- Customer accounts, reviews tied to verified purchases, gift cards, promos and discount codes, wishlists.
- Migration / CSV import.
- Full Market Mode mobile UI (the lightweight log-a-sale is launch; the dedicated mobile view is not).
- AI Image Studio, finances, messages, multi-tier pricing.

---

## Security and hardening carried forward

`Full-Plan.md` §6.1 holds twelve security findings from the July 5th audit. One (admin Try-On) was retired with the feature in Session 70. The remaining eleven are unaddressed and are correctly placed before any real signup opens. They carry into the rewritten plan unchanged.

---

## What this means for the plan

Three things the rewrite has to settle, none of which the current plan answers:

1. **What "launch" means.** Founding members from the waitlist on comped accounts, or public signup with people paying. The first defers subscription billing, the trial, and the pricing page entirely. The second makes them blockers.
2. **What the editor is at launch.** The Master Spec's four editing modes, or the narrower door model the current plan describes. This is the single biggest scope question in the product.
3. **Whether commerce is in the first launch.** Cart, checkout, Stripe, and orders are a substantial build that has not started. A store that cannot take money is a different product promise than the marketing site currently makes.

---

*Audited by Claude, 2026-07-18. Verified against the working tree at commit `e2f921a` and the production database.*
