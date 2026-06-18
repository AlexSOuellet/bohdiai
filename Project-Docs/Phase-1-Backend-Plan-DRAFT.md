# Phase 1 Backend Plan — DRAFT

**Status:** DRAFT — parts will change. Nothing here is locked. Treat as a sketch of the work in front of us once the storefront engine is shipped (which it is, as of Session 45). The Phase 1 Spec and the Decisions Log still win over this doc where they speak.

**Written:** 2026-06-18 (Session 46), in chat with Alex. Promoted to disk so the next session can pick it up instead of re-deriving it.

---

## The shape of it

The backend work breaks into roughly five parts. The order matters because each part unlocks the next — auth is structurally first, billing rides on auth, the dashboard rides on both, the commerce layer rides on the dashboard, and the founder admin sits on top of all of it.

Two side items (the security launch-gate from the audit backlog, and the Phase D code cleanup) sit alongside and don't sequence inside the main flow.

## Part 1 — Auth

Supabase email/password plus magic link. Until this exists there's no concept of a logged-in maker, so nothing downstream can be built. The orphan column in the audit backlog (Phase C security launch-gate) has been waiting on exactly this.

Concrete pieces: sign-up + sign-in flows, password reset, magic-link redemption, the session cookie, the middleware that gates the dashboard routes, and the seam where a fresh signup links to the tenant onboarding creates.

## Part 2 — Billing

Stripe subscription created at the end of onboarding. One tier at $35–$39 per month, 7-day trial, card required (per D10 and D19). Webhook handler that writes the `subscriptions` table on every state change so the DB knows whether a maker is trialing, paid, lapsed, or cancelled. `tenants.tier` stays as the fast-path cache; `subscriptions` is the source of truth.

This depends on auth because the subscription belongs to a logged-in maker. Closely tied to the Settings section of the dashboard, where the maker sees their plan and next charge date.

## Part 3 — Maker dashboard

The biggest chunk by far. Six sections per the Master Spec:

- **Home** — recent orders, revenue snapshot, guided next steps for a new maker (add your first real product, connect your payment processor, complete your About page).
- **My Website** — the AI editor. Three modes per the Phase 1 Spec section 7 and D18: AI chat, highlight-and-transform, click-to-edit. Plus the Vibe Slider. **Click-to-edit: status quo for now. Alex flagged it 2026-06-18 — staying in, not certain it survives.** If it cuts later, that's a Decision Log entry superseding D18 on that point.
- **Listings** — add and edit products and digital products, organize into collections. The post-onboarding logo upload now lives here (Session 46 cut it from onboarding). Claude Vision photo upload at this point.
- **Orders** — order list, order detail, mark as fulfilled, optional tracking number.
- **Log a Sale + Events** — Market Mode log-a-sale (tap a product, enter quantity, inventory syncs), event tagging, the event calendar, expense tracking per event for the per-event profitability view.
- **Settings** — account (email, password, business name), subscription and billing, payment processor setup walkthrough (Stripe or Square), social media links.

The order WITHIN this part can flex. Listings is the natural first surface because the maker has to add real products before anything else matters. My Website is the second because it's the wedge against Squarespace and Shopify. The rest can land in any order that fits.

## Part 4 — Commerce layer on the storefront

The plumbing that turns the published storefront into something that takes money. Cart, checkout, the maker's connected Stripe or Square account, the webhook that creates `orders` rows when a payment lands, the Resend confirmation email.

The storefront rendering already exists. This adds the transactional layer on top. Depends on auth (the maker has to have connected their processor in Settings) and on Listings (there have to be real products to buy).

## Part 5 — Founder admin

Three screens at admin.bohdiai.com per Master Spec section 11: user management, revenue dashboard, niche management. Lighter than the maker dashboard. Depends on auth and billing being live so both surfaces have data to show.

---

## Side items (not in the main sequence)

- **Audit Phase C — security launch-gate.** Wired in once auth exists. Tracked in `Project-Docs/Audit-Fix-Plan-2026-06-10.md`.
- **Audit Phase D — code-file cleanup.** A handful of files awaiting Alex's keep/delete calls (the preview routes under `app/archetype-test/**` and `app/_reference/functional-studies`, the design scratch files `procession-mockup.html`, `_design-mocks/`, `skin-shelf.html`, and whether to retire the legacy `StorefrontPage` fallback so `style_sheets` can be dropped). Five-minute decisions, but they're Alex's. None of it structural.

## Things this plan deliberately doesn't say

- **No time estimates.** Per the standing rule, Claude's calibration on velocity has been off by ~7x. Sequence is by dependency, not weeks.
- **No "do this first, then that" inside each part.** The order WITHIN each part can flex with what Alex wants to test or ship first; only the order BETWEEN the five parts is dependency-driven.
- **No commitments on the Phase 2 features** (customer accounts on storefronts, gift cards, promos, reviews, custom domains, AI Image Studio, etc.). Those are explicitly out of scope per Phase 1 Spec section 2.

## Open questions to resolve before each part starts

These don't block writing this plan; they block STARTING the part.

- **Part 1 (Auth):** which sign-up surface ships first — embedded in onboarding (single flow) or separate at app.bohdiai.com/signup? And: do we keep onboarding's anonymous-tenant build, OR does sign-up move BEFORE the tenant is built?
- **Part 2 (Billing):** confirm the exact price ($35, $37, $39, …) before Stripe wiring. D19 locked the range; the exact number is open.
- **Part 3 (Dashboard):** the click-to-edit question above. And: is "guided next steps" on the dashboard Home an AI-driven onboarding helper or a static checklist?
- **Part 4 (Commerce):** Stripe-first or Square-first? Phase 1 Spec says both, but build order isn't locked.
- **Part 5 (Admin):** which user-management actions ship at launch (password reset, trial extend, suspend, comp a month) vs. wait for actual support load to demand them?

---

*This is a draft. When the open questions above get answered, the relevant section gets updated in place. When a part starts, the questions for that part get resolved into a feature spec under `Project-Docs/` and this plan points to it.*
