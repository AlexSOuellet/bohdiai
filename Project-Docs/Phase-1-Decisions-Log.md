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
