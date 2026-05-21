# Phase 1 Decisions Log

A running record of the product calls made while planning Phase 1. Each entry is written to stand on its own — a person who wasn't in the conversation should be able to read any entry and understand what was decided, why, and what it replaces from the Master Spec.

**Authority:** Rank 3 (alongside Phase docs). The Master Spec wins where this log is silent. This log wins where it has spoken.

**Capture protocol:** Claude drafts each entry in chat. Alex reads it and corrects drift before it lands here. No silent edits — every change is run by Alex first.

---

## 2026-05-20

These nine decisions were captured during the first Phase 1 planning conversation.

### D1. Foundation-first phasing

The principle that governs every other decision in this log: phasing controls which features we **build and ship**, not what the **foundation supports**.

The foundation — the database schema, the security model, the core abstractions — has to support every kind of business and every feature on the BohdiAI roadmap, even ones that won't ship for years. Later phases only **add** on top of the foundation. They never restructure it. If a feature in Phase 3 forces us to rewrite a Phase 1 table, the foundation was wrong.

In practical terms: we design the database now to accept multi-currency, customer messaging, POD integration, and gift cards even though only some of those ship at launch. We don't write the UI for the post-launch ones, but the data model accepts them as new tables and new rows when the time comes.

This is why we are designing the database in detail before writing application code.

### D2. Who BohdiAI is for

Alex's words: *"I see BohdiAI as the solution for very small (1-5) business."*

The target customer is a business with one to five people running it — bakers, crafters, electricians, plumbers, restaurants, tattoo artists, dog groomers, magnet makers. Crafters are the bulk of the audience. They sell handmade items, sometimes digital items, with small catalogs.

BohdiAI is **not** for:

- What the industry calls "small business" — the SBA definition goes up to 500 employees, which is far bigger than the target.
- Customers with 500-product catalogs.
- Manufacturers with complex inventory tracking (bills of materials, work orders, lot tracking).
- Industries that need a dedicated industry tool (restaurant POS systems, HVAC dispatch software, salon scheduling at scale, e-commerce warehouses) — where the next customer who signs up would need custom code.

A specific business may have its own workflow that doesn't fit the platform's standard features — a magnet maker who needs a special print processing step, for example. That kind of customization is a **paid add-on service**, not something the automatic build covers.

### D3. Tenant types: Seller and Doer

Every BohdiAI tenant is a Seller, a Doer, or both. Those are the only two types.

A **Seller** sells things. Products, digital items, gift cards — anything where money is exchanged for an item or for stored value.

A **Doer** does things for customers. Services, classes, appointments, events, contractor work — anything where the business is delivering work or time rather than handing over a thing.

Multi-type is expected and normal. A restaurant is both — they sell food (Seller) and take reservations (Doer). A tattoo artist is both — they sell merch and gift cards (Seller) and do tattoo appointments (Doer). A pure baker might only be a Seller. A pure plumber might only be a Doer.

A few things we considered as separate types and decided **aren't** types:

- **Advertiser** is not a type — every tenant advertises by virtue of having a storefront. A pure "business card" tenant (a handyman who just wants a landing page) is still a Doer underneath, on a freemium tier that doesn't enable bookings or sales.
- **Subscription** is a payment model on a listing, not a type. A baker selling a monthly recipe newsletter is a Seller selling a subscription product.
- **Display** (portfolio-driven business like a photographer) is a tier/feature setting, not a type. Photographers are Doers who lean on display.
- **Teacher**, **Host**, **Schedule** are things Doers do, not separate types. A pottery teacher is a Doer who happens to deliver classes. A gallery owner running events is a Doer who happens to host gatherings.

We will not be building sub-types under Seller and Doer. The two-type model is the final answer.

### D4. Seller product variations are Etsy-style

For Sellers, we will not pre-define what fields a product can have based on the niche. Instead, the seller defines their own variations per product, the same way Etsy works.

Alex's words: *"We need to give sellers descriptors or variations they can define for their products. It can be an open amt."*

In the database, that means a variations table linked to a product and to the tenant. The seller adds whatever variations they need — scent, size, color, wax type, burn time, anything. No hard-coded list of acceptable fields per niche.

We're also likely to need a bundle field (a quantity-for-discount option, like "buy 3 candles, save $5") and a promo field (a discount or sale on a specific product).

This decision replaces a big chunk of what Master Spec §8 originally said about niche schemas — specifically, the part where niche schemas defined the fields each niche could have. That whole pre-built field-definition idea is gone. Sellers define their own.

### D5. Niche schema, revised

The original Master Spec §8 described niche schemas as structured documents that pre-defined five things per niche: the product fields, the badge rules, the AI generation prompts, the design token boundaries, and the component variant preferences. That was Claude's framing of how to solve a real problem Alex raised (candle makers want to display burn time, soap makers don't), but Alex never fully agreed with the structured-document framing.

What we landed on instead: niche schemas are **starting input data for the AI**, not a structured database object that defines fields. Most niches share schema with other niches — a plumber and an electrician have very similar needs. So the original idea of "build 100 niche schemas before designing the database" is gone. The actual number of distinct schemas is much smaller.

The niche-as-data-for-AI idea solves the parts of the original §8 that still matter:

- **AI generation prompts** — the AI still needs to know "this seller is a candle maker" to write good descriptions. That's prompt content, not a database structure.
- **Design starting suggestions** — the AI still benefits from knowing what visual direction works for the niche. But this is a starting point only, not a constraint (see D6).
- **Component preferences** — the AI still benefits from knowing which block variants tend to work for which kinds of businesses.

None of those need a structured database table. They live as AI input data and the seller iterates from there.

What the niche schema literally **looks like** in practice — whether it's a JSON document, a markdown file, a prompt template, a row in a database — is still open and hasn't been decided.

### D6. Design is driven by mood, not by niche

The original Master Spec §6.2 said that niche schemas define design token boundaries — candle makers get warm tones, jewelry makers get cool tones, etc. Alex pushed back hard on this, because a maker who runs an occult candle business doesn't want warm honey-and-amber tones. Locking design to the niche stereotype undermines BohdiAI's whole philosophy about makers owning their brand.

The replacement: the customer picks a **mood** at onboarding from a curated list. Examples of moods: "dark and stormy," "rustic," "warm and cozy," "summer afternoon," "autumn landscape." Notably, these are **not** abstract designer words like "warm," "cool," "traditional," or "modern" — Alex specifically called those out as gibberish that makers don't understand and that don't carry concrete meaning. The mood vocabulary is evocative human language that the AI also understands.

The mood the customer picks drives both:

1. **Design tokens** — colors, fonts, spacing, shapes. The AI generates token values matching the mood.
2. **Block assembly** — which sections appear on the storefront, in what order, with what spacing. A "dark and stormy" storefront might lead with the maker's story; a "summer afternoon" storefront might lead with products front-and-center.

This is a step deeper than Master Spec §6.3, which only talks about variants within sections. The mood doesn't just pick which hero variant — it picks which sections appear and in what order.

The mood selection happens at onboarding from a **curated list**, not free text. Alex's words: *"We need to control it in initial build. They can iterate later."* After onboarding, the customer iterates through the editor (Master Spec §6.4 Vibe Slider, §10's three editor modes) to refine the design however they want.

### D7. Many variants, not 3-4

Master Spec §6.3 talks about "3-4 hero variants, 3 product grid variants, 2-3 about variants" and so on, totaling roughly 15-18 components. Alex's words: *"My plan has always been for way more than 3-4 variants."*

The 3-4 number was a placeholder. The real plan is many more variants over time, built by Cowork agents replicating the pattern after Claude builds the first foundational variant of each type (per Master Spec §6.6 and Roles-Workflow §2.1).

The database design for blocks and variants needs to accommodate this — not assume a small fixed set.

### D8. AI does the design, but the AI needs the right data

Alex's words: *"AI absolutely does the design, we just need to train it to do it right."*

The premise of AI-generated design (Master Spec §6.2) stays — we're not building curated templates like Squarespace or Shopify. But Alex's experience is that AI design generation defaults to one of two looks regardless of input ("dark background with purple highlights" or "cream background with pastels"). The variety only comes when you feed the AI enough specific data.

That data has several possible sources. The customer's mood pick is one (D6). The customer's own assets — their product photos, their existing brand if they have one, references they admire — are probably more important. Niche knowledge is another input, but it's only one input among many, and it's not the dominant one. The customer matters more than the niche.

How exactly that data flows into the AI — what goes in, where it comes from, what format it takes — is **still open**.

### D9. The full e-commerce feature roadmap is in scope, with a launch subset

Standard e-commerce features that Etsy and Shopify offer are all on the BohdiAI roadmap eventually. The Master Spec only documents the architectural pillars and misses many of these — they were on Alex's mental list but never written down.

The full roadmap includes:

- Shop organization (sections and categories, search and filter on the storefront)
- Storefront content pages (about, shipping/returns policies, FAQ, custom URL)
- Customer accounts (saved addresses, order history, wishlists)
- Marketing tools (coupons, email marketing, social media links)
- Fulfillment tooling (shipping label printing, tracking numbers, returns workflow)
- In-platform customer messaging
- Customer reviews (customer-left, tied to purchases — distinct from seller-curated testimonials)
- Gift cards
- Analytics for the seller (sales, traffic, conversion)
- Outbound integrations (POD providers, accounting software, email marketing tools)

**At launch**, BohdiAI ships:

- Shop organization
- Storefront content pages
- Customer accounts
- Customer reviews
- Promos and discount codes
- Gift cards
- Analytics for the seller
- Social media links

**On the roadmap but not at launch** (the foundation must support these even though the UI ships later):

- Marketing beyond promos and social links (email marketing tools)
- Fulfillment tooling (shipping labels, tracking, returns)
- In-platform customer messaging
- Integrations with Quickbooks, Mailchimp, and others
- POD integration

D1 (foundation-first) governs all of these — the database has to absorb every roadmap feature as additive tables and columns without rewriting what exists.

---

## 2026-05-21

### D10. Paid tiers include a 7-day trial, card required

Freemium is too restrictive to function as a trial — it's essentially a landing page. Makers can see how a BohdiAI site gets built but can't actually run a business on it (no products, no commerce, no editor). Asking someone to enter a credit card to experience the actual product is too much friction, especially for an audience that's been burned by Etsy fees.

When a maker picks Basic or Pro at onboarding, they get a 7-day trial of that tier with deferred payment. Card on file is required to start the trial. Auto-charge runs on day 8 unless they cancel.

Three calls bundled into this decision:

**Card required.** No card, no trial. Card-required converts dramatically better than no-card trials because the day-8 charge is the default and cancelling requires action. The framing in the UI is soft — "no charge today, cancel anytime before [date]" — not aggressive.

**One trial per tenant, forever.** If a tenant trials Pro for 7 days, downgrades to Basic on day 4, they don't get a fresh Basic trial. If they cancel mid-trial and come back six months later, no new trial. Otherwise serial trial-hopping turns into a free permanent Pro tier.

**Seven days.** Long enough for a maker to load products, play with the editor, and see what the dashboard does over a weekend plus weekdays. Short enough to force the decision. Shopify settled on 3 after years of testing; Squarespace runs 14. Seven splits the difference and matches the rhythm of an evening or weekend project.

The Tech Arch Spec subscriptions table (§3) already has `trial_start`, `trial_end`, and a `status` value of `trialing` — no schema change needed. The behavior lives in the Stripe subscription creation call (`trial_period_days: 7`) and in the webhook handler that updates the subscription row.

### D11. Niche content lives in files, blocks library lives in code

Two architectural calls bundled together because the reasoning is the same. Both override what the Master Spec implied (database tables editable from the founder admin).

**Niches as markdown files.** Niche content is prose the AI consumes — descriptions of how candle makers describe their products, what tone resonates for tattoo artists, common variations sellers in this niche use. Prose belongs in markdown, not JSON-in-a-database-column. Files live at `/content/niches/<slug>.md` with YAML frontmatter for structured metadata and markdown body for prose. Loaded at build time into a typed manifest. Niches change rarely (a few at launch, a few more over time), so the "every change is a deploy" cost is near zero. PR review is better quality control than admin-form-input anyway.

**Blocks library as code.** Each block is a React component file whose exported metadata constant describes the block (key, section type, content schema, tier required, tenant type fit, status). A build script collects every meta export into a single typed manifest the AI reads. Keeping component and metadata in the same file eliminates the drift bugs that come from storing metadata separately in a database — a row for a deleted component is a runtime crash, a component without a row is invisible to the AI.

The unifying principle: things that are tightly coupled to code, change rarely, and are platform-wide rather than tenant-specific belong in code or files, not the database. Things that are tenant-specific, change at runtime, or need row-level security stay in the database. Niche schemas and the blocks catalog hit all the "belongs in code" criteria.

What this costs: the founder admin screen for niche management implied by Master Spec §11 becomes "list of niches in repo" rather than an editable form. Adding niches and blocks happens by opening a PR, not by inserting database rows. Cowork agents adding niches or block variants do it the same way. This is a workflow change, not an engineering downside — PR review is a feature.

Reversible if we're wrong: migrating markdown files to a database table is an afternoon of work (parse files, INSERT rows, repoint the loader). Nothing about the file-based approach locks us in.

The Tech Arch Spec §6 and §7 reflect this — both sections describe where the content lives and why, without database tables.

### D12. Shipments as a first-class table from day one

Fulfillment tracking lives in its own table at launch, not as columns on the orders table. Every order has at least one shipments row; multi-shipment orders (a maker splits a five-item order into two boxes shipped on different days) work the day a maker needs them, with no migration.

The alternative was keeping tracking columns on the orders table for the simple "one shipment per order" launch case and adding a shipments table later when multi-shipment became a real need. That would have created a dual-source-of-truth period — some orders tracked via columns on the order row, some via shipments rows, with application code reading from both during a transitional period.

Doing it now is free because the spec hasn't been built. Doing it later would have required a real data migration with real customer data. Foundation-first applies — the schema absorbs every future feature additively, and shipments was the one place in the audit where deferring would have forced a costly migration.

The Tech Arch Spec §14 now includes shipments and shipment_items tables. The orders table no longer carries `tracking_number`, `tracking_url`, `shipping_method`, `shipped_at`, or `delivered_at`. Order-level status values `shipped` and `delivered` are aggregate states derived from shipment states.

---

## Open items still to be decided

These are things we discussed but did not lock down, or things we haven't gotten to yet. The Tech Arch Spec drafting process will surface most of them as they come up.

### Master Spec amendments needed

Several sections of the Master Spec are now inconsistent with the decisions above and need to be amended:

- **§2 (Target Audience)** — currently says service providers are "future." We've decided Doers are in Phase 1 (D3). Section needs to update.
- **§6.2 (AI-Generated Variation)** — currently says niche boundaries constrain design. We've decided mood drives design and the customer can override anything (D6). Section needs to update.
- **§6.3 (Modular Component Assembly)** — currently says 3-4 variants per section, 15-18 components total. We've decided much more than that, built over time (D7). Section needs to update.
- **§8 (Niche Specialization)** — currently describes niche schemas as structured documents with field definitions, badge rules, AI prompts, design boundaries, and component preferences. We've decided most of that is replaced by seller-defined variations (D4) and the rest becomes AI input data (D5). Section needs significant rewrite.
- **§17 (Phasing Summary)** — currently scoped Phase 1 to products-only. We've decided Phase 1 includes Doer-type listings (D3) and the full e-commerce feature subset in D9. Section needs to update.

These amendments haven't been written yet.

### Product-design open items

- **What a Doer's storefront actually looks like.** A tattoo artist's page is different from a plumber's page. Does it lead with portfolio? Show available appointment times? Just have a contact form? We haven't settled this.
- **How a multi-type tenant renders.** A restaurant is both Seller (menu) and Doer (reservations) — what does that look like on one storefront? Is it a single page with both kinds of blocks, or are there distinct sections? We haven't settled this.
- **What a niche schema actually is in practice.** Per D5 it's "AI input data," but we haven't said whether that's a JSON document, a prompt template, a database row, a markdown file, or something else.
- **The actual mood list.** Per D6 we have examples ("dark and stormy," "rustic," "warm and cozy," "summer afternoon," "autumn landscape") but not the full curated list that ships at launch. How many moods, what the names are, how each one maps to design tokens and block assembly — all open.
- **How AI training/data flow works** — per D8 the AI needs the right data, but we haven't said what data, from where, or in what format.
- **The variations table structure.** Per D4 sellers define their own variations. The literal columns, types, and structure of that table is open.

### Tech Arch Spec open items

The Tech Arch Spec at `project-docs/Tech-Arch-Spec.md` is in progress. Sections completed: tenants (§1), tenant members (§2). Next sections to draft, in order: subscriptions, design tokens, niche schemas, listings, variations, collections, customer profiles, orders/payments, reviews, gift cards, content pages, uploads, and a final group of future-supported tables for the post-launch features.

---

## Process notes (banked from this session)

A few patterns we've learned about how this conversation works best:

- **Decisions get drafted in chat in Alex's words, Alex reads back, then they land here.** Claude has a documented pattern of restating Alex's words back faithfully while embedding interpretation underneath. The readback is supposed to catch drift before it gets baked in.

- **Specific drift patterns to watch for** (called out by Alex in this session): adding examples Alex didn't give (SBA 500-employee reference, restaurant POS as out-of-scope example, BOMs and lot tracking as inventory examples), picking specific interpretations of vague terms (deciding that "magnet maker print processing" is a field on each product when it might be a workflow), declaring thresholds Alex didn't set (1-chair salon yes, 10-chair salon no), turning "maybe" into "you want" (treating tentative ideas as locked decisions), and inventing sub-types and architecture that Alex never asked for.

- **Plain English in chat. Documents can have structure.** Chat replies that read like sectioned documentation feel like over-complication. Conversational prose lands better. The CLAUDE.md file has a hard rule about this — bullet lists in chat are reserved for genuinely parallel items, no headings or section dividers in chat, no decision IDs or spec section references in chat, no designer or engineer jargon unless Alex used it first.

- **Claude is the lead developer and should drive technical decisions.** Repeatedly asking Alex "where should I start" on database tables is wrong — he's the founder, not the architect. He sets vision and approves; Claude drives implementation. Alex called this out specifically and it should not happen again.

- **The Master Spec is partial.** Many obvious e-commerce features (customer accounts, gift cards, coupons, shipping labels, POD integration) were on Alex's mental list but not in the documented spec. A new session won't see those unless they're documented. Anything not in the docs is invisible to Claude. That's why this log and the Tech Arch Spec exist.
