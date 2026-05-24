# Phase 1 Spec — BohdiAI MVP Launch

**Status:** ACTIVE — ready to build  
**Owner:** Claude (Lead Developer)  
**Approver:** Alex (Founder / Product Owner)  
**Date written:** 2026-05-24  
**Authority rank:** 3 (Phase Doc). Golden Rules and Master Spec override anything here. Decisions Log (D1–D18) refines this spec where it has spoken.

---

## 1. What Phase 1 delivers

A working SaaS that a maker can sign up for, get an AI-generated storefront, sell products, log in-person sales, and track which craft shows are worth doing. One subscription tier. Subdomain-only. Makers who sell things — physical products, digital products, custom order commissions. No pure service trades at launch.

The test: a kitchen-table candle maker can go from "I heard about BohdiAI" to "my store is live and I just got my first order" without calling us.

---

## 2. What is explicitly out of scope

Per D18, these are **not** in Phase 1. Any request to add them is a scope change requiring Alex's approval.

- Custom domains (subdomain only at launch)
- Customer accounts on storefronts (no saved addresses, no order history, no wishlists)
- Customer reviews
- Gift cards
- Promos and discount codes
- Shipment tracking UI (the schema supports it; the maker-facing UI doesn't ship)
- Freemium tier
- Multi-tier pricing (one tier only)
- Pure service trade niches and their Doer-specific UI (booking calendars, availability management)
- AI Image Studio
- Finances / income tracking dashboard
- Messages / customer inbox
- Full Market Mode mobile UI
- Blog at bohdiai.com/blog
- Stripe Tax automation
- Migration tools (CSV import)

---

## 3. Subscription and billing

**One tier, one price.** Launch price is **$25/month** (D19). Deliberate launch pricing for the kitchen-table maker audience — not a floor, a choice. Use `$25/month` in all UI copy and database seeds.

**7-day trial, card required.** No card, no trial. Auto-charge on day 8 unless cancelled. One trial per tenant, ever (D10).

**Implementation:** Stripe subscription with `trial_period_days: 7`. Webhook handler writes `subscriptions` table on every state change. `tenants.tier` is the fast-path cache; `subscriptions` is the source of truth.

**No Freemium.** If a maker wants to try BohdiAI, they start a trial. Freemium is Phase 2.

---

## 4. Audience and niches

**Launch audience:** makers who sell things. Physical products, digital products, custom-order commissions (a jeweler who makes to order, a baker who does custom cakes). The "request a custom order" widget handles commission-taking without requiring booking infrastructure.

**Out of audience at launch:** plumbers, electricians, dentists, dog groomers, tattoo artists, photographers, pure service businesses. The schema supports them; the onboarding, niche library, blocks/widgets, and marketing do not target them.

**Niche launch set:** the candles niche is the first approved row in the niches table. The full launch set covers the core maker categories from `content/niches/_queue.yaml` — enough to give a first-time maker a real niche option when they sign up. Target: 20–30 approved niches covering the most common maker categories before first beta signups.

**Adding niches:** use the niche-writer skill. Each niche is written as a markdown file following the candles template, then seeded into the niches table with `status = 'approved'`.

---

## 5. Onboarding flow

Five screens per Master Spec §5. The goal: wow moment before the maker has time to second-guess.

**Screen 1:** Your name.

**Screen 2:** Pick your niche from a visual grid. Confirm or edit your auto-suggested shop name. "Other" path follows D15 and D16 (adjacent niche or novel-product branch).

**Screen 3:** Choose your mood from a curated list. Mood drives design tokens and block assembly (D6). The curated list is an open item — needs to be designed before this screen can be built.

**Screen 3b (optional):** Any sites you love or want to feel adjacent to? Paste up to three URLs. Skip is the default path.

**Screen 4:** Start your 7-day free trial. Card required. Stripe checkout embedded or redirected.

**Screen 5:** Watch your store build. AI generates tagline, about copy, placeholder product descriptions, and assembles a full page using niche + mood + the tenant's stated context. Site is live on the subdomain when this screen ends.

**Post-onboarding:** dashboard opens showing the live store. First guided step: "Add your first real product."

**Fallback content:** every niche has a fallback content package for when the AI API is slow or unavailable. The fallback is pre-written, on-brand, and functional — not a blank page.

---

## 6. AI generation pipeline

The engine that turns a mood pick, a niche, and optional inspiration URLs into a real storefront.

**Inputs:**
- Niche: `body_markdown` from the approved niches row, plus `tenant_type_fit` and `related_niches`
- Mood: the maker's pick from the curated list
- Tenant answers: shop name, business name, optional inspiration URLs
- Optional: specialization chips selected on the onboarding niche screen

**Outputs:**
1. A `design_tokens` row — the full token set (colors, typography, spacing, layout preferences) calibrated to the mood
2. A set of `content_pages` rows — storefront home, about, FAQ, basic policies
3. A set of `page_blocks` rows — the actual block composition for each page, with blocks chosen from the manifest and content filled in
4. AI-generated copy: tagline, about-page prose, placeholder product names and descriptions, FAQ answers
5. `tenants` row updates: design token snapshot set active, onboarding state recorded

**How the AI assembles a page:**
1. Load the blocks manifest and widgets manifest (built at compile time from `/blocks/**/*.tsx` and `/widgets/**/*.tsx`)
2. Load the niche body_markdown and the mood's token/layout guidance
3. Prompt the AI to select which blocks appear on the storefront home page, in what order, given the mood and niche — this is block assembly per D6
4. For each block, prompt the AI to select appropriate widgets for any functional slots
5. For each block + widget combination, generate the actual content (headlines, copy, image placeholder references)
6. Write all of the above to the database in a single transaction

**Cowork agents:** the lead developer builds the first foundational variant of each block type and each widget type. Cowork agents replicate the pattern to add more variants per Master Spec §6.7 and Roles-Workflow §2.1.

---

## 7. AI editor

Three editing modes, all active from day one (non-negotiable per D18):

**AI chat** — The maker types a request ("make the hero darker and more dramatic"). The AI interprets the request, makes the change, reads it back in plain English, and writes an `editor_history` row.

**Highlight-and-transform** — The maker selects text on their live site, right-clicks or uses a toolbar, and asks the AI to transform it ("make this shorter," "make this sound more handmade"). The AI rewrites in place.

**Click-to-edit** — Direct editing of text fields without AI involvement. The maker clicks a headline and types. No AI call, just a direct write to the `page_blocks` content JSONB.

**Vibe Slider** (non-negotiable per D18) — Located in the My Website section of the dashboard. Moving the slider from one end to the other shifts all design token values in a coordinated way. The maker cannot break their site — all changes stay within safe design boundaries. Saves a new `design_tokens` snapshot on commit.

**Editor history:** every change writes an `editor_history` row with before_state and after_state. The maker can undo any change from the history panel.

---

## 8. Storefront

**Subdomain routing:** `[shop].bohdiai.com` → Next.js middleware resolves subdomain to tenant_id → all page and API handlers receive tenant_id in context.

**Pages at launch:**
- Storefront home (AI-assembled at onboarding)
- About page
- FAQ page
- Shipping/returns policy stub
- Privacy policy stub
- Listing detail pages (`/listings/[slug]`)
- Collection pages (`/collections/[slug]`)
- Cart and checkout
- Order confirmation page

**Customer experience:**
- Guest checkout only at launch (no customer account creation)
- Cart is server-persisted (session token based per Tech-Arch-Spec §15)
- Checkout collects name, email, shipping address, payment
- Payment routes to maker's own Stripe or Square account
- Order confirmation email sent via Resend after webhook confirms payment

**SEO:** every storefront page is server-rendered. Semantic HTML, one `<h1>` per page, Open Graph tags, JSON-LD for product structured data. AI-generated meta descriptions at onboarding; maker can edit via the dashboard.

---

## 9. Listings

**Listing types at launch:** `product` and `digital_product`. All other listing types (`service`, `class`, `event`, `appointment`) are in the schema but not in the launch UI.

**Seller-defined variations (D4):** open vocabulary. The maker defines their own attributes and options per listing. No pre-built field list per niche.

**Custom order request widget:** a "Request a Custom Order" widget ships at launch. When a maker enables it, a form appears on their storefront letting customers describe what they want. The maker receives the request by email (and in a simple dashboard inbox). No booking infrastructure required — it's a glorified contact form scoped to custom orders.

**Collections:** the maker organizes listings into collections. Each collection has a name, description, and featured image. Collections appear in the nav (if the maker enables it) and on collection pages.

**Product images:** the maker uploads photos via the dashboard. Claude Vision analyzes photos and generates a suggested title, description, and price (Pro-tier perk — but since there's one tier at launch, all makers get it).

---

## 10. Market Mode (Log a Sale)

**Log a Sale:** the maker taps a product from a photo grid, enters quantity, and the sale is recorded as a `market_mode` order. Inventory decrements immediately. The live storefront reflects the updated inventory.

**Event tagging:** when logging a sale, the maker can optionally tag it to an event. The event picker shows upcoming events from the events table.

**Storefront calendar widget:** a widget that reads upcoming events and displays them on the storefront. Makers use this to show customers where to find them in person.

**Event log (dashboard):** the maker can create, edit, and view events in the dashboard. Each event can have expense lines (booth fee, gas, supplies). The event detail view shows sales tagged to that event minus expenses — per-event profitability.

**Migrations needed before building Market Mode:** events table, event_expenses table, event_id column on orders. These are all described in Tech-Arch-Spec §20 and pending application.

---

## 11. Maker dashboard

Five sections at launch:

**Home** — Recent orders. Revenue this week. Guided next steps for new users (add your first real product, connect your payment processor, complete your about page).

**My Website** — The AI editor. Live preview of the storefront alongside the editing tools. Block reordering (drag or up/down). Vibe Slider. History panel showing recent changes with undo buttons.

**Listings** — Add, edit, archive listings. Set variations, pricing, inventory. Organize into collections.

**Orders** — Order list with status. Order detail with customer info and items. Mark as fulfilled (enters tracking number or marks done without tracking). Market Mode "Log a Sale" lives here or as its own section.

**Settings** — Account (email, password, business name). Subscription and billing (current plan, next charge date, cancel). Payment processor (guided Stripe or Square setup walkthrough). Social media links (shown in storefront footer/nav).

---

## 12. Founder admin

Three screens at launch, minimal:

**User Management** — list of all tenants, searchable and filterable. Support actions: view tenant details, extend trial, suspend account, add a free month.

**Revenue Dashboard** — MRR, active subscribers, trials, churn. Connected to Stripe data.

**Niche Management** — list of all niche rows with status. Approve/reject draft niches. Edit body_markdown of existing niches. (Full niche CRUD; this is the production workflow for getting new niches into the approved state.)

---

## 13. Build sequence

The order of build is driven by dependencies, not by feature priority. Nothing that depends on auth can be built before auth. Nothing that depends on the resolver can be built before the resolver. Work that has no dependencies can be parallelized.

**Layer 1 — Foundation (no code dependencies)**
- Pending migrations: events, event_expenses, event_id on orders
- Storefront resolver middleware (subdomain → tenant_id)
- Supabase Auth wiring (email/password + magic link)

**Layer 2 — Core plumbing (depends on resolver + auth)**
- Onboarding flow scaffold (screens, routing, state management)
- Blocks manifest build script + first hero block
- Widgets manifest build script + first CTA widget
- Mood vocabulary definition
- Niche seeding (launch set, starting with candles)

**Layer 3 — AI generation (depends on manifests + niches)**
- Design token generation from mood
- Block assembly from mood + niche
- Content generation (copy, product stubs)
- Onboarding "watch it build" screen

**Layer 4 — Storefront (depends on generation pipeline)**
- Storefront page rendering against design tokens
- Listing detail pages
- Collection pages
- Cart and checkout
- Order confirmation + Resend email

**Layer 5 — Dashboard (depends on auth + storefront)**
- Maker dashboard home
- My Website editor (click-to-edit first, AI chat second, vibe slider third)
- Listings management
- Orders management
- Market Mode log-a-sale
- Event calendar and log
- Settings

**Layer 6 — Billing (depends on dashboard + auth)**
- Stripe subscription creation at onboarding
- Webhook handler (subscription state → subscriptions table)
- Billing section in Settings

**Layer 7 — Founder admin (depends on billing + auth)**
- User management
- Revenue dashboard
- Niche management UI

**Cowork agents come online when:** the first foundational block and widget variants are built and the pattern is documented. Agents then build additional block and widget variants in parallel while the lead developer continues with Layer 3+.

---

## 14. Technical notes

**Stack:** Next.js (App Router) · Supabase (Postgres + RLS + Auth + Storage) · Vercel · Cloudflare · Anthropic API · Resend · Stripe · Square · Sentry · PostHog · Tailwind CSS · TypeScript (strictest config per Engineering Standards).

**No custom domain infrastructure at launch.** Cloudflare for SaaS (automatic SSL for custom domains) is not in Phase 1. Every tenant is on `[shop].bohdiai.com`. The `custom_domain` column exists in the tenants table per D1 (foundation-first); the provisioning infrastructure waits for Phase 2.

**Migration runner:** `node scripts/db-migrate.mjs`. Write the `.sql` file under `supabase/migrations/`, run the script, done.

**RLS:** all writes from the application layer use the service role key. Client-side reads use the anon key for public storefront content. Authenticated makers use the authed role via Supabase client in the dashboard.

**Error monitoring:** Sentry. Every uncaught exception and API failure surfaces in the Sentry dashboard. No silent failures.

**Analytics:** PostHog. Pageviews, onboarding funnel, feature usage. Every Phase 1 feature is instrumented before it ships.

---

## 15. Definition of Done for Phase 1

Phase 1 ships when a real maker can complete this journey without help:

- [ ] Sign up, enter card, start trial
- [ ] Complete 5-screen onboarding, see their store build live
- [ ] Add 3 real products with photos
- [ ] Share their store URL with a friend and have the friend successfully check out
- [ ] Receive an order notification in the dashboard
- [ ] Log an in-person sale with Market Mode
- [ ] Create an event, add it to the public calendar, log a sale tagged to that event
- [ ] Make an edit via AI chat and see it reflected on the live site
- [ ] Use the vibe slider and see coordinated design changes
- [ ] View their subscription and know their next billing date

All Phase 0 Definition of Done criteria still apply to the marketing site layer.

---

## 16. Open items before build can start

1. **Exact price point** — $35, $39, $45, or $49/month. Alex decides. Needed before the billing flow is built.

2. **Mood vocabulary** — the full curated list of moods for onboarding screen 3. Examples exist; the complete launch set doesn't. Can be designed in parallel with early build layers.

3. **Niche launch count** — how many niches need to be approved before first beta signups? Recommendation: 25 minimum, covering the highest-priority maker categories from the queue.

---

*BohdiAI Phase 1 Spec — Confidential | 2026-05-24*
