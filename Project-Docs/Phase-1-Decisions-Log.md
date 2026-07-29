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

### D11. Blocks library lives in code

*Note added 2026-05-22: This decision originally bundled niches and blocks together. The niches half is superseded by D17 — niches now live in a database table. The blocks half stands. The original combined reasoning is preserved below for the record; read it as applying to blocks only.*

(Originally written as: Niche content lives in files, blocks library lives in code.)


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

## 2026-05-22

### D13. Widgets as a first-class concept, separate from blocks

> **⚠ SUPERSEDED (2026-07-05).** Widgets as a catalog no longer exist. The whole blocks/widgets/layout-engine model was replaced by the single storefront engine (`lib/archetypes/main-street/`) composed by family. See `Full-Plan.md` §1.


The platform has two distinct catalogs, not one. Blocks are visual containers — a hero, a feature section, a listing grid, a footer — each with declared slots. Widgets are the functional pieces that fill the slots — a booking calendar, a contact form, a price display, an add-to-cart, a product card, a testimonial, a map, a "book now" CTA.

The AI assembles a storefront by picking blocks (driven by mood and niche), then threading widgets into the slots those blocks expose (driven by what the tenant sells, what their niche needs, and what content the AI generates). A booking calendar isn't a block; it's a widget that fits any block exposing a large enough primary slot. A "book now" button is a widget that fits any block with a CTA slot. Without a widget catalog, blocks are empty frames and the AI has nothing to thread in.

This decision matters because the original framing — every functional thing is a block — would have produced a sprawling catalog of capability-widgets (booking blocks, contact blocks, listing blocks) where the question for each niche is which widgets it needs. That's the Squarespace model. BohdiAI is not that. Blocks here are layout shapes that the AI picks for visual variety; the functional and content layer is separate and threads through.

Widgets follow the same rules as blocks (D11): tightly coupled to code, change rarely, platform-wide rather than tenant-specific. They live in the repo, each one a React component with an exported meta describing what slot shapes it fits, what content it accepts, what tier it requires, what tenant type it applies to. A build script collects all widget meta into a typed manifest the AI reads. Same machinery as blocks, parallel structure.

The Master Spec §6 didn't name widgets and the Tech Arch Spec §7 only described blocks. Both updated to reflect this separation: Master Spec §6 introduces widgets alongside blocks, Tech Arch Spec §7 renamed to cover both libraries with parallel subsections, page_blocks (§8) describes how a block's content references the widgets threaded into its slots.

### D14. Niche files anchor against the full range of the category; tenants add their own references on top

The bias to avoid in a niche file is the monolithic generalization — "candle makers tend to be X," "the candle genre has converged on Y," "the typical buyer is Z." That kind of statement collapses a wide category into a single profile and tilts every storefront the AI generates toward that profile. A niche file should never make blanket claims about who the makers are, what aesthetic the genre prefers, or what demographic the buyers belong to.

What a niche file should do is anchor against the full range of the category by naming real brand exemplars spread across different positionings. For candles that means showing P.F. Candle Co. (California-casual artisanal) alongside Harlem Candle Co. (luxury storytelling) alongside Boy Smells (playful, named-as-character) alongside a devotional candle maker alongside a folk-vintage Etsy shop — because the variety is the antidote to bias. The maker reading the file sees what's achievable across the range, not what a single archetype looks like. Every maker wants their site to feel like a million-dollar brand; the file's job is to show what that looks like in their direction, not in one default direction.

The tenant's inputs at onboarding — mood pick, inspiration URLs, their own assets — add to this research, they do not replace it. The platform does the heavy lifting of grounding each niche in the full range of the category; the tenant adds their flavor on top. Skipping the inspiration URLs is fine — the mood pick and the niche file are enough on their own. The point of letting the tenant supply links is to give them voice in the direction, not to outsource the research.

Implications:

The tenants table needs an `inspiration_urls` column (text array, nullable, max 3 entries) to store what the tenant pastes at onboarding. The Tech Arch Spec tenants section is updated to add it.

The onboarding flow needs an optional step for inspiration links. Plain-English prompt — something like "any sites you love or want yours to feel like? Paste up to three." Skip is the default path.

When researching and writing a niche file, the agent should deliberately pull exemplars across positioning — at least three or four brands at different points in the category's range — so the file shows what success looks like in multiple directions, not one. The file should never assert a single dominant aesthetic, demographic, or buyer profile.

Price ranges, market vocabulary (notes, throw, scent families), variation axes, and other category-level facts belong in the file when they're true across the category. What does not belong is any sentence that starts "most candle makers are…" or "the typical candle buyer wants…" — those are the monolithic generalizations the file has to avoid.

### D15. Novel-product onboarding is a branch with its own language

When a maker picks Other and types in a niche, the platform does a research pass to ground the build. Most Other-pickers will fall into a niche that's slightly outside the launch list but adjacent to something the AI can work with — the research pass finds enough material to build a thinner-than-curated but still grounded site. Those tenants get the normal flow.

A small share of Other-pickers are in genuinely novel territory — they've invented something, they're three years ahead of a category, or they sit in such a narrow intersection that the web has nothing to anchor against. The research pass returns nothing usable. For those tenants, the normal flow doesn't fit.

The platform detects this case and branches onboarding. The maker sees plain-English language acknowledging their situation rather than a generic "building your site" experience that's silently producing a weaker first generation. The language frames it as a feature: "What you're making is unusual enough that we don't have a reference for it. We'll build a preliminary version using what you tell us, then work with you to refine it."

The branch then asks the maker a couple of targeted grounding questions — the 30-second pitch (what they'd tell a customer at their booth) and the negative space (what they don't want it to feel like) being the two that pull the most signal. The maker's answers, plus the mood pick, plus any inspiration URLs they pasted, plus their own assets, become the inputs the AI generates from. The site that comes out is treated explicitly as a preliminary draft, not a finished site, with the maker dropped into the editor under "let's fine-tune this together" framing.

The graceful failure mode behind this branch is human concierge help. If the preliminary draft plus chat iteration still doesn't land for a maker, the platform offers a paid concierge path — Pro-tier service included, Basic-tier paid add-on, or founder-handled at launch volumes. That's the safety valve for the rare cases the AI stack can't catch.

Implications:

The onboarding flow needs a detection step on Other entries — run the research pass, and if it returns below a quality threshold, branch into novel-product mode. The threshold and what "below quality" means is design work that happens when we write the onboarding spec.

The novel-product branch needs its own copy in plain English, set during onboarding spec drafting. The principle is locked here: honest acknowledgment, preliminary framing, collaborative refinement, concierge safety net.

The tenants table could carry a flag indicating the tenant went through the novel-product path — useful for proactively offering concierge help and for analytics on how the path performs. To be added when implementation gets to onboarding.

The maker's grounding answers (30-second pitch and negative space) should be captured somewhere — probably on the tenant or in a related onboarding-answers table — so the AI can reference them later when the maker iterates via chat.

### D16. Other-path has an adjacent-niche route before the novel branch

The Other onboarding path is not one flow, it's two. The adjacent-niche route handles most Other-pickers cleanly; the novel-product branch (D15) handles the rare cases where adjacency doesn't apply.

When a maker picks Other, onboarding asks them to pick the closest secondary niche from the list — the niche that comes nearest to what they do, even if it's not exact — and to type a short description of what they make. The AI then uses the secondary niche file as the grounding base (vocabulary, customer patterns, variation axes, visual range) and uses the maker's description to specialize from there. The site that comes out has real grounding from an adjacent file plus the maker's own voice. Better than a generic Other-path; it lets the platform add value to a niche it doesn't have a file for without having to write a new file.

The onboarding question for the secondary pick also includes an honest "none of these are close" option. That's the gate to the D15 novel-product branch. A maker who can identify a closest secondary stays on the adjacent route. A maker who genuinely can't get sent into the novel-product flow with the targeted grounding questions and the preliminary-draft framing.

Worth saying directly: this gives us three paths total, not two. List-picked tenants get their niche file straight. Adjacent Other-pickers get the closest secondary file plus their description. Truly novel Other-pickers get the novel-product branch. Each path produces a usable site; the quality of grounding scales with how close to a known niche the maker actually is.

Implications:

The tenants table needs two new columns. `secondary_niche` (text, nullable) holds the slug of the closest secondary niche when the maker picked Other and identified an adjacent one. `niche_description` (text, nullable) holds the short description the maker typed about what they make. Both null for list-picked tenants. `secondary_niche` also null for novel-product tenants (who took the "none of these" path).

The onboarding flow now has three branches downstream of the niche question, not two. The Other branch becomes itself a branch: secondary pick succeeds (adjacent route) or fails into the novel-product flow (D15).

When the AI generates a storefront for an adjacent Other-picker, the prompt-build step includes both the secondary niche file and the maker's description, clearly distinguished so the AI uses the file as context and the description as the tenant-specific specialization rather than treating them as the same kind of input.

### D17. Niches live in a database table

Niches move out of markdown files in the repo and into a dedicated database table. Blocks stay in code (D11 still applies to them). The original D11 bundled both because they felt similar — platform-wide reference content — but they are different things and the storage call is different.

The mechanism that made code-based storage right for blocks does not apply to niches. A block is two halves of the same thing — the React component you see on the page and the metadata that describes it — and the two halves have to live together or the platform breaks. A niche has no code half. It is pure content the AI reads. Nothing about it needs to be paired with a code artifact.

Putting niches in a database makes the things we actually want to do easy. The founder admin can add or edit a niche through a form without a deploy. The Other-path can save a new niche row on the fly when a maker types one in and the AI builds it; the next maker who types the same thing reuses what the platform already has. Cowork agents — when they come online and start producing niches in volume, which is the plan — write directly to the database via the same Supabase API they would use for anything else, instead of opening pull requests that have to be merged before they take effect.

Quality control moves from pull-request review to an admin-side approval workflow. Each niche row has a status — draft, in review, approved, retired. The AI only grounds tenant generations against approved rows. New rows from the Other-path or from agents start in draft and require a human approval before they become reachable. This replaces the natural code-review gate that the file model had with a deliberate workflow gate that fits the use case.

The niches table shape: slug (primary key), display_name, tenant_type_fit (array of seller/doer), aliases (array of alternative names), related_niches (array of related slugs), status (draft / in_review / approved / retired), body_markdown (the prose the AI reads), created_at, updated_at, created_by, last_updated_by. A separate niche_versions table holds row history — who edited what, when, what changed — designed for this use case rather than inherited from git.

The Tech Arch Spec is updated to describe the niches table in detail and to remove the file-based niche infrastructure from §6. The existing markdown niche file at content/niches/candles.md becomes a draft reference; its prose becomes the body_markdown of the candles row when we seed the table at implementation time.

This decision was reached after the file-based approach was stress-tested and the case for it weakened. The original D11 reasoning that applied genuinely to niches — change rarely, platform-wide, no code coupling — turned out to be wrong on the "no code coupling" part (niches have no code coupling, but that's an argument for the database, not against it) and overweighted on "change rarely" once Cowork agents producing volume entered the picture. The case for the database holds on its own merits.

---

## 2026-05-24

### D18. We stay a SaaS with a narrowed v1 scope

A long conversation today walked through whether BohdiAI should pivot from a SaaS to a one-time generator product — build the site, hand it over, no recurring relationship. The generator model had real appeal on cost and operational weight, but it had two problems we couldn't get past. The kitchen-table maker the Master Spec was designed for can't self-install a Vercel-plus-database-plus-Stripe stack no matter how clean we make it; the audience that can self-install is a different audience entirely. And a SaaS with a real subscriber book sells for several times annual recurring revenue, while a generator-plus-concierge business essentially doesn't sell, which matters when you're building something you may want to exit someday.

What was real and worth taking seriously was the feeling of being on the hook to support a SaaS forever. That feeling isn't something to push through — it's data about what the SaaS has to look like to be runnable by one person. So we stayed with SaaS but narrowed launch scope to what makes the product distinct and what's defensible to support.

**What stays for launch.** The AI generation that builds a maker's site at onboarding from mood and niche. The AI editor — chat, highlight-and-transform, click-to-edit. The vibe slider. These are the wedge against Squarespace and Shopify; without them there's no reason for the product to exist. Storefronts on subdomains. Listings as products and digital products. Cart and checkout. Order capture via webhooks from the maker's own Stripe or Square. The maker dashboard scoped to home, the website editor, listings, orders, log a sale, and settings. Founder admin scoped to user management, revenue dashboard, and niche management. A public calendar widget on the storefront so makers can show where to find them in person. An internal event log in the dashboard with expense tracking. Sales attribution that ties Market Mode log-a-sale entries to specific events, so the maker can see which craft shows were profitable.

**What gets cut from launch.** Custom domains, deferred to Phase 1.5 or Phase 2. The advanced commerce surface — gift cards, customer accounts on storefronts, reviews tied to verified purchases, wishlists, promos, multi-shipment tracking UI — none of that ships at launch. Multi-tier pricing — one tier, one price. The full Doer surface — appointment booking, real-time availability, portfolio-led layouts for pure service trades — deferred. Plumbers, electricians, dentists, dog groomers, tattoo artists are not the launch audience. The launch audience is makers who sell things, including makers who take custom orders or commissions. A "request a custom order" widget covers the commission case without dragging in real booking infrastructure.

**One tier at launch, priced higher than $20.** Twenty was the original placeholder and on reflection it's low for what the product actually does. The honest range for an AI-built storefront with a working editor and the vibe slider is somewhere around $35-$49 a month. Squarespace charges $23-$36 for less. The exact number is still open. The principle locked here is that pricing reflects value, not what feels safest to charge. One tier also removes a whole category of billing edge cases.

**No cap on growth.** We considered capping the maker count to make support manageable for one person. Rejected. If we're building it, we're building it as a business that can grow and that can be sold later, and a closed cap undercuts both. Support burden gets managed instead by scope discipline — narrower product, fewer support categories — and by setting explicit expectations (async support, two business day response, not realtime).

**Maker audience refined.** The launch audience is makers who sell things — physical products, digital products, custom-order commissions. Multi-type makers (a baker who also teaches classes, a jeweler who also takes commissions) are included. Pure service trades — plumbers, electricians, dentists, dog groomers, tattoo artists — are deferred. The schema fully supports Doers; the launch UI, onboarding options, and marketing do not target them. A "request a custom order" form widget handles the commission case for makers who take them without requiring booking-calendar infrastructure.

**Craft show calendar and event tracking added to launch scope.** Makers can show a public calendar of upcoming events (craft shows, markets, popups) on their storefront. Internally, they can log event details and expenses. Market Mode log-a-sale entries can be tagged to a specific event, giving the maker a per-event profitability view (sales minus expenses per show). The storefront calendar widget and internal event log ship at launch. The sales-to-event attribution UI ships at launch because Market Mode is already in launch scope.

**Schema decision worth recording.** When Market Mode's sales table gets built, the orders table gets an optional `event_id` column from day one, even though the full attribution UI is also part of launch. If we ever want to add deeper analytics later, no schema change is needed. The principle generalizes: nothing about the narrowed launch scope simplifies the schema. The schema still has to absorb every Phase 2 and Phase 3 feature additively. What changes is which UI we ship, not which tables exist.

**Master Spec amendments this requires.** Section 2 tightens to makers-who-sell at launch with pure service trades explicitly deferred. Section 4 becomes one tier at the higher price point, with the multi-tier table flagged as Phase 2. Section 7 cuts to cart, checkout, orders, and Market Mode at launch. Section 9 adds the event-tracking and attribution capability to Market Mode. Section 10 shrinks the dashboard to the listed sections only. Section 17 gets rewritten — much of what was Phase 1 moves to Phase 2, funded by revenue once paying customers are real.

The principle behind all of this is keep-it-simple for launch and prove there's a winning product before pouring more work into surface area. Once paying customers are real, every cut comes back as a deliberate Phase 2 add, funded by revenue, with usage data from real makers telling us which to add first.

---

## 2026-05-24 (build session start)

### D19. Launch price is $35–$39/month (revised 2026-05-25)

**Original decision ($25/month) is superseded.**

Launch price is $35–$39/month. Exact number to be confirmed before Stripe wiring, but the range is locked. Rationale: Shopify Basic is $39/month and takes an additional 2.9% + $0.30 per transaction. BohdiAI takes no cut of sales ever. A maker doing $1,500/month on Etsy pays $110–$130/month in combined fees — BohdiAI at $35–$39 is still an obvious win. The product now includes AI-generated images (fal.ai FLUX Pro), cinematic hero blocks, and a full design system that makes $25 an undersell.

AI usage: 100 AI calls/month included. Additional 100 calls for $5. Onboarding generation is explicitly excluded from the cap. Cap applies to dashboard AI actions only (image regeneration, copy rewrites, token changes). At ~$0.07/call average, 100 calls costs ~$7 against $35–$39 revenue — healthy margin.

Use `$35/month` as the working number in UI copy until the exact price is confirmed.

---

## 2026-05-27 (session 8)

These six decisions came out of an audit of how much control the generation pipeline exerts on the AI. The conversation walked through every layer where we encode design opinions — prompt instructions, mood definitions, block metadata, post-processing, schema constraints, downstream code coupling — and landed on a different operating principle for the platform. Each of the six entries below is a piece of that shift, written in the order it makes most sense to apply them.

### D20. We say WHAT, the AI says HOW

The throughline principle that informs everything else in this session. We hand the AI raw materials — the niche, the mood, the available blocks, the available fonts, the available textures — and the role it plays. The AI decides how to express it: which hues play which roles, which fonts pair, which blocks compose the page, how the images frame themselves. Anywhere we encode HOW, we've substituted our judgment for the model's, and ours is fixed at code-write time while the AI's is responsive to the specific context in front of it. We lose every time we substitute.

The corollary is that only structural HOWs survive in our prompts and metadata. Things the rendering pipeline literally requires for the output to be valid — hex codes, the JSON output shape, "no text in images" because image models can't render legible text, routes that either exist or 404. Everything that isn't physics is design opinion and belongs to the AI.

This sharpens Master Spec §6.2 (AI-generated variation) and §6.6 (AI generation pipeline) by treating the AI's expressive freedom as the design, not a problem to be managed. Every "should" or "must" or "always" in our generation prompts is now suspect and should be challenged against whether it's physics or opinion.

### D21. Niche × mood is two style sheets the AI intersects, not prose hints we prescribe

This builds on D6 (design is driven by mood, not niche) and D14 (niche files anchor against the full range without dictating outcomes). Both stand. D21 adds the structural shape that makes them work together.

A niche carries a structured style sheet alongside its prose body — a palette of named hues with hex codes, a roster of fonts with category labels, a list of textures the niche pulls from. A mood carries the same shape. Neither sheet assigns roles. The palette is just hues; the fonts are just letterforms; the textures are just materials.

When the AI generates tokens for a tenant, it reads both sheets and intersects them. Items that appear in both get priority — they're the agreement between niche and mood. Where there's no overlap, the AI leans toward the mood without leaving the niche entirely. The AI assigns roles (which hue plays background, which font plays heading, which texture flavors the imagery) based on the design intent, not a pre-coded mapping.

This replaces the four `tokenHints` sentences per mood in `lib/moods.ts`, which prescribed role assignments inside the mood definition. It also replaces the "visual direction range" sections of existing niche files when those sections dictated specific aesthetic outcomes. A working test shipped in session 8 for leatherworker × dark-and-stormy only, gated through JSON files in `tmp/style-sheets/`. Other niche × mood pairs keep the old prescriptive pipeline until their style sheets are authored and the gating can be removed.

### D22. Block definitions are pure shape, not feel

> **⚠ SUPERSEDED (2026-07-05).** Block definitions no longer exist. Same reason as D13 — the whole block model was replaced by family-composed section treatments.


Block metadata today carries fields that encode platform opinions about each block — `moodFit` (which moods this block works in), `tenantTypeFit` (which tenant types it fits), `tier` (which subscription tier unlocks it), and descriptions written in feel-laden language ("editorial hero with image and headline" rather than "two-column layout with photo left, heading and CTA right"). When the AI reads `moodFit`, it's reading our pre-decided judgment rather than making one itself. When it reads a feel-laden description, it's pattern-matching on the language rather than evaluating the shape.

Block definitions going forward describe what the block IS structurally — geometry, content fields, slot shapes — and nothing about feel or fit. `moodFit`, `tenantTypeFit`, and `tier` come out of block metadata. The AI judges fit by reading the structural description against the design intent (niche, mood, style sheets), the same way a designer would. Tier becomes a billing concern surfaced elsewhere (at render time or admin time), not a property of the block. Tenant type fit either disappears entirely or moves to widgets, which do have tenant-type-dependent function in some cases.

This change ripples to every block in `blocks/**/meta.ts` and to `buildBlocksContext` in `lib/generation/generate-page.ts`, which currently feeds `moodFit` to the AI as an advisory signal.

### D23. Generation is reframed as agents — stateless for Phase 1, two agents to start

The generation pipeline moves from one-shot prompt-to-JSON calls into agent collaborations. Two agents at the start: a **Lead Designer** that handles tokens, page composition, copy, and the brief to the Image Agent; and an **Image Agent** that takes the brief, generates photos via fal, reviews them against the brief, and returns them. Copy stays with the Lead Designer because copy is part of design — splitting it off into a separate Copy Agent recreates the disconnect we just removed between images and design.

For Phase 1 these agents are ephemeral. Each onboarding or editor session instantiates a fresh agent, loads the current DB state as its working context, does its work, persists results, and disposes. No conversation history is kept between sessions. The agent has no memory of past edits except what's visible in the design tokens, page blocks, listings, and decision log (see D25).

Persistent agent memory — an agent that remembers the maker across sessions and accumulates relationship context — is a future-state pattern. Useful, well-understood, deferred. Phase 1 ships the stateless version because it's simpler, cheaper, and sufficient. The Master Spec §6.6 implied agentic generation without specifying the shape; D23 specifies it.

### D24. Self-deliberation: minimum two candidates with reasoning, agent decides the ceiling

For any meaningful design decision the agent makes — block selection, palette role assignment, font pairing, copy direction, image brief — it generates at least two candidates with reasoning before committing, then evaluates them against the design intent and commits to one with reasoning. The reasoning gets logged (see D25).

The minimum of two prevents the agent from defaulting to a single-pass habit. The lack of upper cap trusts the agent to know when a choice deserves more deliberation. Picking between hero-cinematic and hero-editorial might warrant three candidates; picking the exact heading letter-spacing value warrants one. A fixed N (always three, always five) was considered and rejected — it invites theater (agent generates the required count to satisfy the rule when the choice was obvious) and wastes tokens on trivial decisions.

The expected cost variance is small relative to the quality lift. If the deliberation turns out to be theater rather than real thought, an A/B test of minimum-2 against single-pass against maker satisfaction is the validation tool.

### D25. design_choices logging table is built in Phase 1

A new database table called `design_choices` is added in Phase 1 alongside the agent layer. It captures every meaningful decision the agent makes — what the candidates were, what got picked, why, in what niche-mood context. Columns include `tenant_id`, `decision_type` (block-pick, palette-role-assignment, font-pairing, copy-headline, image-brief, etc), `candidates` (JSONB), `picked` (JSONB), `reasoning` (text), `niche_slug`, `mood_key`, `created_at`.

No dashboards built on top of this yet — that's a Phase 2 concern. The point of building the table now is that data only starts accumulating from the moment the table exists. Skipping it means six months from now we have no record of what the agent does, and we lose the ability to spot bias ("agent picks Cormorant Unicase 78% of the time for dark moods — taste or rut?"), dead inventory (blocks never picked), success patterns (which choices correlate with retention), and training material for an eventual self-hosted model.

Implementation footprint is small: one migration for the table, one logging helper called from each agent decision point, no UI work in this phase. The value compounds with every site generated.

---

## 2026-05-28 (session 9)

These six decisions came out of building Bohdi the agent and watching him produce real storefronts. The first one finalizes the mood lineup; the second supersedes part of D23 (the two-agent split collapses into one); the rest articulate how the prompt and brand positioning should constrain his work.

### D26. Mood lineup is seven plain category labels

The mood list at launch is **DARK · RUSTIC · COZY · BOTANICAL · SUNSET · SIMPLE · MODERN**. Plain category labels, not poetic ("Sunday Morning" → SIMPLE). bright-bazaar removed from the lineup because it doesn't fit makers — its bold/maximalist energy belongs to SaaS or pattern textiles, not to artisan storefronts. summer-afternoon retargeted from "bright midday" to golden-hour and renamed SUNSET, occupying a visual territory (amber, terracotta, dusky violet, gold leaf) that no other mood covered. MODERN is new — Swiss-design assertive, Bauhaus primary colors, geometric display type. Fills the gap between "minimal-quiet" (SIMPLE) and "bold-loud" by being minimal-LOUD.

The category-label naming is a maker UX decision. Evocative names like "Sunday Morning" require the maker to interpret what they're picking; plain labels like SIMPLE tell them directly. Eventually the picker should show sample storefronts per mood so the maker sees what they're choosing, but the labels alone should at least be unambiguous.

Each mood now carries a structured style sheet — 15 named hex colors, 14 named fonts with structural taxonomy categories (no feel words), 13 named textures. Stored at `tmp/style-sheets/mood-*.json` for now; will move to a database column at some point.

Existing tenant rows migrated by `20260528000002_mood_keys_renamed.sql`. Old keys (dark-and-stormy, warm-and-cozy, wild-meadow, summer-afternoon, sunday-morning) mapped to new ones. bright-bazaar tenants mapped to MODERN as the closest replacement (none existed in production at the time).

### D27. Bohdi is the agent — single contractor, internal employees we don't surface

D23 specified two agents (Lead Designer + Image Agent). D27 collapses that to a single named agent: **Bohdi**. He's the contractor the platform hires. Internally he may have employees (sub-agents, specialist roles) — that's his org, not exposed to the maker, not part of the product surface. The maker sees Bohdi. We brief Bohdi. Bohdi delivers.

The two-agent split from D23 was an implementation detail that leaked into the architecture. Naming a contractor with private internals lets us reshape the internal split (one model, two agents, ten agents) without ever touching the maker-facing identity. Bohdi as the name also matches the product brand (BohdiAI) cleanly.

In Phase 1 Bohdi is a single tool-using agent loop. Tools: read_niche, read_mood, list_blocks, list_widgets, log_decision, generate_image, set_tokens, set_home_page, set_secondary_pages_copy, add_collection, add_listing, add_subscription, set_hero_image, set_about_image, finalize. He runs sequentially with prompt caching on the system prompt + tools list. A leatherworker × any-mood onboarding takes 3-4 minutes and costs ~$0.50-0.80 in Claude + ~$0.25 in fal images.

D23 still stands on statelessness — Bohdi has no memory between sessions. The `design_choices` log (D25) is the only persistent record of what he did.

The legacy one-shot generation pipeline stays in place for non-leatherworker niches until each niche has a style sheet authored.

### D28. Tell Bohdi how to think. Don't tell him what to choose.

A clear distinction baked into how Bohdi's system prompt is written. Telling him **how to think** is fair — deliberation method (generate 2+ candidates with reasoning), mental models (mood is the visual world, niche is the material vocabulary inside it), meta-awareness (LLMs rationalize anything, so reasoning is fluency, not proof), self-checks (if two moods produce the same visual identity, the axes flipped). Telling him **what to choose** is not — "pick the boldest variant," "safe is the failure mode," "prefer hero-lava over hero-cinematic" all crossed the line.

The discipline exists because every prompt change reaches for the next test case's failure. That's whack-a-mole. The reasoning quality improves with prompt direction but the output quality doesn't — Bohdi just defends the new direction more fluently. Real output quality comes from inputs (materials, catalog) and mechanics (deliberation, output review), not from telling him which way to lean.

### D29. WOW is the job, within the constraints of the mood the maker picked

Bohdi's quality bar is articulated as WOW — a storefront the maker would text to their friends because they can't believe it's theirs, not a competent or polished site. The bar is not "fits the maker." It's "stops someone mid-scroll."

The constraint that keeps WOW honest: WOW happens **inside** the mood the maker picked. The mood is the customer's choice, not negotiable. A WOW SIMPLE shop is the most distinctive SIMPLE shop you can build, not a redefined-as-bold shop wearing SIMPLE's label. The mood is the boundary; how Bohdi makes it WOW inside that boundary is up to him.

This pairs with D28 — "WOW is the job" is a quality bar (how-to-think), not a selection rule (what-to-choose). It tells him the success criterion without dictating which inventory choices satisfy it.

### D30. Mood is the visual world. Niche is the material vocabulary inside that world.

D6 said design is driven by mood, not niche. D30 sharpens that with the framing Bohdi reads in his prompt. Mood defines the visual character — palette, type system, mood textures, the gestalt. Niche provides the material vocabulary inside that gestalt — the words real practitioners use, the products they make, the customers they serve.

A leatherworker × SIMPLE shop is a SIMPLE shop that happens to work with leather. A leatherworker × DARK shop is a DARK shop that happens to work with leather. The mood is what the shop **looks like**; the niche is what the shop **sells and talks about**. Flipping the axes — making the niche carry visual character — produces sites where every leatherworker shop looks the same regardless of mood, which is the failure mode session 9 actually observed before this principle landed.

The collapse diagnostic baked into Bohdi's prompt: if two shops in the same niche but different moods would read as the same visual identity, the niche has eaten the mood.

### D31. Visibly not AI slop is the brand position that informs catalog choices

Every AI site builder in the industry — Wix AI, Squarespace AI, Shopify Magic — has converged on a recognizable visual pattern. Clean nav, hero with stock-feeling photo, three-column grid of cards, testimonials row, footer. That pattern is the noise floor; sites that fit it are pattern-matched as "another AI builder" within seconds.

BohdiAI's strategic position is being **visibly not that**. A maker who lands on a BohdiAI storefront should be able to tell within two seconds it wasn't generated by Wix. Looking like every other AI builder is competitive death because it removes any reason for a maker to pick us.

This is a brand-positioning decision that informs catalog choices, not Bohdi's day-to-day prompt. Every block variant we build should make the question "does this make a BohdiAI site harder to confuse with an AI-builder site, or easier?" answer "harder." Adding a sixth product grid that's slightly different from the existing five is competitive death by a thousand papercuts. The block-variant roadmap leans toward geometry that the industry doesn't do — asymmetric, overlapping, scroll-driven, image-bleed, non-rectangular. The Block-Variants-Roadmap doc at `project-docs/Block-Variants-Roadmap.md` is the working list.

---

## 2026-06-06 (session 30)

These came out of a long design conversation that reworked the archetype direction from Sessions 22–29 and settled how a maker's storefront shape gets chosen. Full design detail, the four shapes' looks, and mockups live in `docs/superpowers/specs/2026-06-06-archetype-catalog-and-the-moment-design.md`.

### D32. The archetype catalog is four storefront shapes plus two shapes that travel

> **⚠ SUPERSEDED (2026-07-05).** Multi-archetype was collapsed to Main Street only (D36 → D37), then to families. There is no archetype catalog and no "shapes that travel." The current model is one storefront engine + six families. See `Full-Plan.md` §1.


The storefront catalog is four whole-business *shapes*. **The Shop** (Main Street) — the deep-catalog maker; the workhorse most makers land on. **The Counter** — fresh/seasonal/batch makers who sell a rotating "what's available now" (bakers, farms, preserves), with preorder, pickup, and sold-out mechanics. **The Find** — curated one-of-a-kind (vintage, antique), where every piece is sold once and provenance/condition is the copy. **The Body of Work** — image-first art where the work is beheld and acquired and commerce is kept quiet.

An archetype is now a *business shape*, not a skin. That is the change from Sessions 22–29, where Main Street and Gallery were two looks for the same maker. Because the shape is now structural, the archetype is no longer Bohdi's aesthetic call (see D35).

**Gallery is retired as a standalone archetype.** It lost head-to-head to Main Street for a real maker (Session 29), and the dense salon-wall is a physical-gallery technique that successful online stores deliberately avoid. Its one good bone — the dense visual wall — survives as a *page treatment* (a catalog or portfolio page) inside other archetypes, especially The Find and The Body of Work.

Two pieces are **shapes that travel**, not whole storefronts: the dense wall (above) and **The One** (D34). Commission/made-to-order stays a "request a custom order" CTA mode, not an archetype.

### D33. The Moment is BohdiAI's signature front door, shared across every storefront

> **⚠ SUPERSEDED BY D54 (2026-06-14).** The portable-Moment concept was retired. The Main Street hero IS the front door; the play-through happens in the hero surface. See D54 for the current model.


The hero is no longer welded bespoke into each archetype — this reverses the Session-24 "each archetype owns its hero" decision. Instead there is one portable **Moment** — a cinematic brand intro, the same engine on every storefront — and it is **BohdiAI's signature**: the thing every BohdiAI site does that a Wix or Squarespace site never would. It is the wow, and it embodies the "visibly not AI slop" position.

Behavior. The Moment plays on a front-door visit only. On Main Street it *melts into the page as the hero* — you scroll past it into the shop. On shapes with no hero surface to become (Counter, Find, Body of Work) it is a *gate* that plays, then dismisses ("enter shop") to reveal the shape. A per-shop cookie marks it seen; a returning front-door visitor skips straight to the shape. Any deep link or QR code bypasses the Moment and leaves the cookie unset, so that visitor still gets their Moment the next time they come through the front door. The handoff from Moment to shape is always a slow **cinematic transition** that resolves into the shape — it rests into the hero on Main Street and dissolves into the board / cabinet / artist statement on the others — never a hard cut. Every storefront footer carries an **"Intro"** link that replays the Moment on demand. Any maker can turn it off; default on. A **custom cinematic video Moment is a paid upsell**.

### D34. "The One" is a launch-page feature, not a storefront archetype

True one-product shops barely exist — authors write more books, the hot-sauce maker adds a hot honey — so a single-product *storefront* archetype would serve almost nobody. The One is instead a **launch / landing page**: a single-hero poster page (the offer, the proof, the buy, with detail spilling into sub-pages) that a maker deploys on top of their real store for a drop, then retires. Because almost every maker has something to spotlight at some point, this is broadly useful.

It is a backend feature where the maker picks how loud the launch is. **As the Moment** — the launch takes over the front door for the run of the drop; temporary by default but the maker owns the dial, and this is where the paid custom-video Moment attaches. **A clickable link** in the store — the store stays the front door, the launch is one click in. **Total standalone** — its own URL for a QR, an email blast, or an ad; this is a deep link, so it bypasses the Moment consistent with D33. The launch playbook (Christmas collectible, once-in-a-lifetime, scarcity as a hook) is also a natural Skool / Witsend Breakthroughs training module.

### D35. Onboarding always builds Main Street; the catalog is a post-build suggestion engine, and Bohdi never picks the archetype

**Onboarding always builds Main Street.** We can't reliably tell a weekly baker from a catalog baker, or a curator from a shopkeeper, at onboarding without interrogating the maker — and a wrong auto-build ships a wrong store. Main Street renders every maker acceptably, so everyone starts there. **Bohdi never selects an archetype**, which removes the mis-pick risk and ends the steering question for archetype choice (his freedom stays in the skin, treatments, copy, and the Moment).

The rest of the catalog is a **post-build, content-loaded suggestion engine**, delivered by the Session-29 try-on tool. The sequence is load-bearing: the maker adds their real products and content *first*, then we *actively* suggest a more business-specific look and show it with their own content already inside it — "this is how a shop like yours actually sells." The maker recognizes their own fit and chooses; because it's their call it can't be wrong, and the personalized try-on (their pieces in the Find, their loaves in the Counter) is the moment the subscription justifies itself. Active suggestion also beats the default-gravity problem — non-explorers get walked to their fit instead of having to discover it.

The niche still carries a *loose hint* of which shapes to suggest (the Find to a vintage seller, the Counter to a baker), but it drives a suggestion, not a build, so it can be heuristic — a wrong suggestion costs nothing. An archetype earns a best-fit *default* (built at onboarding in place of Main Street) only when it is shown to beat Main Street for a niche — by functional fit (the Counter's preorder/pickup transaction model is the first candidate, because a rotating-stock maker's business runs on mechanics Main Street can't express) or by real conversion evidence once live. "Different" or "thematically apt" does not earn a default; the burden of proof is on the new shape, not on Main Street.

---

### D36. Gallery is deleted; Main Street is the only archetype (Session 31)

Gallery is removed from the codebase entirely — no registry entry, module, tests, or routes. Every onboarding builds Main Street (consistent with D35). The dense salon-wall survives only as a possible future catalog/portfolio *page treatment* inside an archetype, not as a standalone storefront. Stale published Gallery tenants were unpublished so nothing renders a deleted archetype. (The legacy block-system "gallery" page type and the `hero-split-gallery` block are a different system and were left untouched.)

### D37. Main Street is a complete multi-page storefront painted from one content envelope (Session 31)

Main Street is not a home page bolted onto legacy sub-pages. One stored archetype envelope (on the tenant's `/` row) carries the content for every fixed page; the catalog comes from product rows; the renderer is page-aware. Every storefront route — Home, Shop, Product detail, About, Events, Contact, Privacy, Terms, Collections (index + detail), Subscriptions, Cart — resolves that envelope and paints the right page in Main Street chrome. The legacy `StorefrontPage`/`LayoutPage` system is now only the fallback for non-archetype tenants. Real checkout (line items + payment) remains the separate commerce build. Maker-added custom pages render through a generic content-page template.

### D38. The home About beat is the maker only; find-us is its own beat (Session 31)

Alex's call: the About/founder beat and the market calendar must not be fused. The About beat is a Bohdi-picked menu of maker-only looks (quote / portrait / letter / card — the "Meet June" card from the Counter mockup), with a teaser cue to the full About page. The find-us calendar is its own home beat, shown only when the maker has dates. Treatment selection never reads market-date count — we don't know dates at onboarding, so Bohdi seeds plausible sample dates that the maker edits or turns off (placeholder content, like placeholder products).

### D39. Bohdi authors rich, niche-specific content via the full niche file + a deepen pass (Session 31)

"Claude has the best reputation for content, so let's prove it." The content engine was starving Bohdi (the niche file was sliced to 1,600 of ~15-28k chars and never re-fed at authoring; slots were tiny). Now: the full niche body goes into the authoring step with an instruction to use its specifics; slots are widened; the moment story must tell one arc; and after his first valid draft Bohdi does a **deepen pass** — re-reading his own draft against the niche file and a quality bar, rewriting the weak parts (with a safe fallback to the first draft). Affordable because the archetype owns design, so Bohdi's tokens go to copy. Two image rules are enforced at generation: every image is photo-realistic, and generated people match the maker's name (heuristic default, maker-overridable).

---

## 2026-06-07 (session 32)

### D40. Generation is a Director and a Crew, not one author

The single-pass authoring model (one Bohdi call writes the skin pick, every word, the Moment scene, the products, and the image prompts at once) is replaced. The problem it caused, seen across a live build: one model doing everything thinly produces a dull literal Moment, jargon copy, type that fights the video, and a mood that doesn't move the look — all symptoms of missing creative direction.

The new model makes Bohdi a **Director**. He reads niche + mood and emits a structured **Trajectory** — feeling (the one-line North Star), customer-why, visual-world (the look direction + light key), moment-concept (the cinematic idea), and register (loud vs restrained type). Three specialists then each execute their craft to that trajectory: a **Copywriter** (every word), a **Cinematographer** (the Moment video spec as JSON — 5-6s, 16:9, 720p, seamless loop, no loop-breaking human motion, atmospheric grade; video by default with an automatic still fallback), and a **Graphic Artist** (the skin selection + image lighting/grade direction). A short **Director's Cut** pass checks the pieces land as one feeling. The maker only ever meets Bohdi; the crew is his internal org (consistent with D27).

The orchestration is **deterministic pipeline code**, not the model deciding control flow — director → copywriter → cinematographer → graphic artist → cut, run sequentially for coherence (the cinematographer sees the story; the graphic artist sees both the story and the video, so the type serves the footage). Each specialist is its own focused, independently-tunable prompt. The pipeline replaces `authorStore` and assembles the SAME `MainStreetAuthored` content envelope.

Crucially, the **static engine does not change** — the renderer, the archetype composition, the content schema, persistence, and the media-generation seam all stay. The crew produces DATA the existing engine consumes; it can never touch structure, layout, or type discipline. That is what keeps every build professionally composed (the whole reason for the archetype model, Sessions 21+). Cost is roughly +30-60s of orchestration and a few cents of Claude per build; media generation (the real cost) is unchanged.

Full design and build order: `docs/superpowers/specs/2026-06-07-director-and-crew-design.md`.

### D41. Skin selection is gated to the mood-aligned subset (wire the dormant tags)

`MAIN_STREET_SKIN_TAGS` already tags every one of the 29 skins with a world and a set of moods. That metadata was built to constrain skin choice to niche and mood — but it is **read by nothing in the selection path** (only a dev preview script and tests consume it). Bohdi free-picks a skin off the text descriptions with mood as a loose hint, which is why a "modern" candle shop landed on the cream-and-didone Atelier instead of a genuinely modern skin.

The fix wires the existing tags into selection: the Graphic Artist (D40) chooses only from the skins whose mood tags align with the trajectory's mood, and the pick is validated against that subset. This is the guardrail that was designed and then never connected. It is explicitly NOT a shelf rebuild — the shelf is genuinely diverse across nine worlds (dark, bold, modern, playful, rugged all exist); the gap was always selection, not the skins themselves. (Corrects the loose Session 28/29 read of the warm-craft Hearth skins as representative of the whole shelf.)

---

## 2026-06-07 (session 33)

### D42. The maker portrait is gender-neutral; gender is never asked or inferred

Generated maker imagery must not hinge on guessing the maker's gender. The name→gender lookup table (`lib/name-gender.ts`) is the wrong approach — a hand-typed list can't cover every name, it's culturally narrow, and it defaults unknowns to female, so a male maker named "Wally" got a woman's portrait. We will also **not** ask gender at onboarding. Instead the founder/About placeholder image is framed **gender-neutral** — the maker by their hands and their work, a figure at the bench, the workshop — until the maker uploads their own real photo. The name→gender table and its use in the image directives are to be removed (not extended).

### D43. The Moment plays first as a portable layer, then melts into the hero (clarifies D33)

> **⚠ SUPERSEDED BY D54 (2026-06-14).** The portable Moment layer was killed. The hero surface itself carries the play-through on a cold front-door arrival.


A live walk found the Moment was built welded in **as** the Main Street hero — the "each archetype owns its hero" approach D33 explicitly reversed. D33 stands and is clarified here so it can't be misread again: the Moment is ONE **portable front-door layer** that **plays first** on a front-door visit, then resolves via a slow cinematic transition — **melting into the hero on Main Street**, dismissing into the opening on heroless shapes. Playing first (not welded) is precisely what lets the same Moment travel to an archetype that has no hero. The play-once per-shop cookie, the footer "Intro" replay, and the deep-link bypass all belong to that layer. The current implementation must be rebuilt to this.

---

## 2026-06-08 (session 35)

### D44. The Moment autoplays cold at the front door, plays through, then waits for the customer to click "Enter site" before it melts in (refines D43)

> **⚠ REFINED BY D54 (2026-06-14).** The autoplay-cold-arrival, play-through-and-rest, per-shop seen cookie, and deep-link bypass all survive. What changed: no "Enter Site" click; the play happens in the hero surface, not on a portable overlay; the cookie is written when the timeline lands on the brand phase, not on a click.


D43 left the handoff reading as automatic — "plays first, then melts." It isn't. The customer crosses the threshold on purpose, and that click is the whole pivot. The corrected lifecycle:

- **It only plays on a cold front-door arrival.** The trigger is "this visit *landed* on the home page, and this visitor hasn't entered before (no cookie)." It is NOT "the visitor reached the home page somehow." Someone who follows a direct link or QR code to an inside page lands on that page with no Moment — and gets no Moment for the rest of that visit, even if they then navigate to the home page. The side door never opens the front-door show on the same trip. That person only gets the Moment on a future visit where they themselves arrive cold at the front door. (This sharpens D43's deep-link bypass: bypass holds for the entire visit, not just the entry request.)

- **It autoplays and plays all the way through, then rests.** No click is needed to start it — arriving cold is the trigger. The Moment runs its full sequence and comes to rest on its final frame.

- **The "Enter site" invite appears AFTER the play, not during.** Once the Moment has rested, the invite shows. The Moment holds there indefinitely. Nothing transitions until the customer clicks it — there is no timed auto-dismiss.

- **The click melts it in — "melts" means a fade.** The full page is already rendered underneath. On Main Street the Moment fades into the hero; on a layout with no hero it fades out and the whole site fades in. Never a hard cut.

- **Clicking Enter writes the do-not-replay cookie.** Crossing the threshold is what marks the shop seen; from then on that visitor skips straight to the site. The "Enter site" invite and the cookie are not alternatives — the invite is the threshold, and clicking it is what sets the cookie.

Everything else from D43 stands: the Moment is one portable layer (not welded to any hero), the footer "Intro" link replays it on demand, it's default-on and the maker can turn it off, and a custom cinematic-video Moment is a paid upsell.

### D45. The shop name is a fixed onboarding fact — the crew never reinvents it (DONE, session 35)

A live build named "Evening Shadow Candles" published as "Still Burn Co." because the Copywriter's schema *required* it to author `shopName`, `wordmark`, and `brand`. The shop name is the one literal thing onboarding captures and confirms; the crew has no business renaming it. The pipeline now forces the maker's real shop name into the shopName, the nav wordmark, and the hero brand, discarding anything the model proposed (the copywriter is also told the name is fixed). General principle: an onboarding fact the maker gave us (their name, their niche, their mood) is an input the crew builds *around*, never a field it gets to overwrite. Implemented and validated live this session.

### D46. The crew authors each link's DESTINATION, not just its label (next session)

Across every live build the CTAs were wrong because the label was authored freely but the destination was hardcoded in the renderer — a "Shop now" close button went to /contact, an "Our story" hero button went to /shop. The nav was worse: the copywriter authored a nav ("Breads / Order / Classes") that the renderer threw away entirely in favor of a fixed Shop/About/Events/Contact list. The fix: the crew picks each link's destination from the real pages (shop, about, events, contact, a product) and writes the label to match, so what a button SAYS and where it GOES always agree — and the maker's authored nav is actually used (mapped to real routes), not discarded. Alex: "I would like to see the crew build the links with the pages they suggest."

### D47. The Moment cinematographer always reaches for video; a still is the last resort (next session)

> **⚠ SUPERSEDED BY D55 (2026-06-15).** "Always reach for video" produced tangential invention (candles next to yarn). The current framing: video vs still is an honest judgment with no default; the failure mode named + refused is tangential invention.


Two of three live builds (the baker, the ceramicist) got a STILL Moment when motion was the obvious win (steam off fresh bread). Cause: when the crew was built (D40), the cinematographer's video-vs-still choice was made deliberately *neutral* to avoid bias — the prompt just says "video or image" and the only thing it says about video is its loop RESTRICTIONS, so the model reads video as risky and plays safe with a still. But the Moment IS motion — that is its signature wow (D33) — so a strong preference for video is core product intent, not taste-bias. The cinematographer must always reach for video and choose a still ONLY when it genuinely cannot think of a simple ambient motion to capture. Alex: "always reach for video and only do stills if it truly cannot think of a simple motion to capture." (A lesson rides along: over-neutralizing to avoid bias can strip a load-bearing product decision — neutrality and intent are not the same thing.)

---

## 2026-06-09 (session 37)

These came out of the mood-overhaul follow-through. Session 36 had already inverted the original plan — there is no mood→treatment mapping, the real bug is the crew converging on one treatment every build — and left one question open: does handing Bohdi a random "roll" count as the crew choosing, or is that too close to coding the pick. We resolved that, then built it.

### D48. The crew picks each converging treatment off a code-dealt roll it can override

The copywriter chose the same goods body and almost always "quote" for the About beat on every build, so shops in one niche read alike. The honest diagnosis: a model's free, taste-driven pick *is* the convergence. Asked to choose what "fits this shop," Bohdi reaches for the same answer every time, because that's his genuine read of best-fit. So "let the crew choose freely AND give me variety" has a contradiction inside it — his free choice is the sameness. Any mechanism that produces variety is, by definition, leaning on the pick. The question was never whether to nudge, but how, while keeping the choice with Bohdi.

The mechanism: each build, code rolls a treatment for each of the two converging beats — a uniform random draw from the real set — and deals it to the copywriter as his starting hand. He plays his draw unless it genuinely fights the shop, in which case he picks another from the menu and notes why in one line. Code supplies the entropy; Bohdi keeps the veto. This is the difference from the thing Alex rejected (a seeded code-side pick that decides the treatment behind Bohdi's back): code isn't choosing, it's dealing a card he can play or fold. Alex's words from Session 36 stand — "find a way to get the crew to choose randomly is NOT coding it" — and a roll satisfies that because the dice only break the rut; the decision is still his. Alex was good with this and explicitly reserved the right to change his mind once he sees real builds.

Two specifics. For the About beat, the roll is dealt *before* the copywriter writes, because the richer About treatments need more authored content (the "card" needs an eyebrow and heading) — part of why it always defaulted to the cheap "quote." If we rolled the treatment only at render time, a rolled "card" would find its fields empty and fall back to quote, fixing nothing. So for About the roll drives the writing, not just the rendering. And every build logs what was dealt, what was played, and whether Bohdi overrode (into `design_choices`), so reconvergence — Bohdi overriding back to one body — shows up in the data instead of being invisible. The roll source is injectable, so the pipeline is deterministic in tests.

The prompt asks Bohdi for a one-line reason when he overrides, but the build does not yet capture that text — only the rolled/played/overrode fact. Storing the reason would mean a new schema field; deferred until the override rate tells us we want to read his reasoning.

The maker being able to override the treatment from the dashboard is the natural complement to this, but it rides on the website editor, which isn't built yet, so it lands when the editor does. The treatment is already a stored per-shop field, so nothing here blocks it.

### D49. There is no mood→treatment mapping — any treatment fits any mood

Established conversationally in Session 36 and acted on here. The goods treatments (marquee / constellation / switcher / slideshow) and the About treatments (quote / portrait / letter / card) are structural and kinetic — how many pieces show at once, whether it scrolls or fades, how much it asks of the shopper. That is tempo and attention-pattern, not mood. Mood lives in the skin, palette, type, and light, all of which wrap around whichever treatment is chosen. So any treatment can wear any mood and still read as that mood, which is exactly why there is no mapping to build and why the roll (D48) is safe — letting the treatment vary freely never produces a mood mismatch.

The leftover mood→treatment rules in the code were deleted: the goods selector picked slideshow-vs-switcher off a "cinematic mood" list, and the About selector leaned card/portrait off intimate/cinematic mood lists. Both gone. The two selectors are now pure legacy fallbacks for rows authored before the treatment field existed — goods is size-only, About is pick-or-quote — and the now-unused `mood` plumbing was removed from the beats, MainStreet, and the builder. (One honest caveat surfaced and is worth remembering: the treatments aren't perfectly mood-*neutral* either, because they carry tempo, and a busy marquee vs a hands-off slideshow do carry a faint emotional lean. But all four were built to be composed and motion-bearing — none frantic, none funereal — so free variation never tips into a real mismatch.)

### D50. The Main Street procession is rebuilt as the Constellation

The old procession was one product per full-width row, the image settling out of a zoom as it scrolled in — it ran about three screens and felt long. It is replaced by a Constellation: the 3–5 sampled pieces (the home is a sampling, not the catalog) scattered across about a screen-and-a-half in a composed, asymmetric field — varied sizes, a little vertical drift, a whisper of rotation. When the section scrolls into view the cards fade in one at a time in a random order, as if the space is building itself, then rest. Once landed they hold still: the wow is the assembly, not a loop, and a resolved section is shoppable.

The chosen shape is deliberately asymmetric rather than the symmetric "four corners and a centre" first sketched, because perfect corner symmetry reads as a grid of a different kind and the empty middle reads sparse; varied sizes and offset placement read as designed. On a phone the scatter goes vertical — cards hug left then right, vary in width, and overlap, art-directed for the narrow screen rather than collapsed to a centred stack of identical cards (which is the AI-builder pattern we avoid). Reduced-motion shows the cards at once. The design was settled against a throwaway HTML mockup Alex viewed in Chrome (three scatters plus a phone frame); "Constellation" won, with a slower build than the mockup's.

Alongside this the slideshow was sped up — the per-slide dwell dropped from 5s to 3.2s and the cross-fade from 1.1s to 0.8s, because it read as sluggish. The slow Ken Burns drift stays; its slowness is intentional.

### D51. The mood lineup is seven feelings; color is a layer under the mood, not a mood

> **⚠ REFINED (2026-07-05).** The seven-feelings lineup is being collapsed to six families in the Family layer (Full-Plan §1.0 open decision — which mood retires). "Playful" was renamed "Cheerful" (D58). Color-as-a-layer-under-mood: still open — decides in Editor Door 2 (Full-Plan §4).


The maker-facing moods change from the old seven (Dark, Rustic, Cozy, Botanical, Sunset, Simple, Modern) to seven *feelings*: **Dark, Rustic, Cozy, Modern, Elegant, Playful, Industrial** — plus **Templated** as a deliberate eighth, built later. This was planned in the Session-34 design conversation but never implemented; the code still carried the old lineup, which is what Alex caught when the onboarding picker still showed Botanical/Sunset/Simple. This supersedes D26.

The change of principle: **color stops being a mood.** Botanical (green) and Sunset (golden) were really colors wearing a mood's clothes; Simple was a near-duplicate of restraint. They retire. A mood is now a *feeling* the maker picks, and the specific color is a layer Bohdi chooses *inside* that feeling — the maker never picks color (Alex's call). The reason most of the old moods folded: in practice they all collapsed toward Cozy. Romantic was considered and rejected (it can't be separated from Cozy) — Claude pushed for it across sessions and Alex held the line; it stays out.

Descriptions are rewritten feel-first — what the store *feels and looks like* (Dark = "low light and deep shadow, moody and a little mysterious") — never a list of crafts. The old descriptions named niches ("Dark is for occult candles, gothic jewelry…"), which is the exact niche-stereotype the platform rejects (a candle maker shouldn't be herded into Cozy). 

The skins are re-tagged directly with the feelings they wear (a skin can wear several — Ember reads both rustic and cozy), and the old descriptive-word → mood bridge collapses to a direct membership test. Every feeling has 6+ skins and every skin is reachable, so no mood is left without a shelf; no new skins were needed. The treatment mechanism stays the roll (D48) — there is still no mood→treatment mapping (D49); the new feelings just feed the roll. A migration remapped existing tenants and stored envelopes (sunset→cozy, simple→elegant, botanical→rustic). The dead legacy layout-engine path (`lib/bohdi/*`, the legacy `lib/generation` writers, the old per-mood style-sheet JSON, the broadsheet archetype, the probe pages) was deleted as part of this, since it was the last place the old mood keys and color-as-mood style sheets lingered.

### D52. The Moment camera is locked — a moving camera breaks the seamless loop

The Moment video must hold the camera **static** and take its motion from *within the frame* (drifting light, rising steam, a slow flicker). A camera that moves — pans, push-ins, zooms, rack focus, drift — travels away from its start frame, so a seamless loop jumps on restart. This is physics, not taste, and it sharpens D33/D47 (the Moment is motion, prefer video): the motion is real, but it lives in the scene, not the lens. A live build had shot a rack-focus Moment that visibly broke the loop. The cinematographer prompt now locks the camera and directs in-frame motion, with a guard that rejects camera-movement wording on a video.

### D53. No hard caps on body prose — the design carries any length; the build never fails or trims on copy

A string of live builds died on copy length (an over-long alt, a quote 8 characters over, a description 3 over). The lesson, in Alex's framing: an imposed cap is suspect, and "who's to say next time it generates larger" — no cap is ever big enough because model output length is unbounded. So **the build must never fail because copy ran long, and it must never trim the copy to fit** (Claude built a trim-on-final-attempt backstop; Alex stopped it — the copy is the good part, the cap was the arbitrary part). 

The resolution: the body-prose fields the responsive design absorbs at any length — product description, founder quote, About paragraphs, contact intro — have **no hard cap** (minimums stay as a quality floor). Hard caps remain *only* where length is structural and shapes the layout: the Moment story lines that cross-fade, the headlines that set large, the short card description, labels and names. To keep generation fast and copy punchy without a gate, the prompt carries a *soft* length nudge ("write punchy, not padded") — guidance the build never enforces. (Removing the caps made the model write longer and a build timed out; the soft nudge bounds generation length the right way, where cranking the timeout would have been the same band-aid as a bigger cap.) Two smaller rules rode along: headings are phrases, not sentences (no terminal/sentence punctuation — the "One potter. One wheel." slop), and the crew's length-aware retry feedback now reports a field's real length and how much to cut so the remaining capped fields converge.

---

---

## 2026-06-14 (session 42)

### D54. Kill the portable Moment; the Main Street hero becomes the surface; still heroes are scenes, not products on black

Across multiple live builds this session the spotlight Moment landed badly: dark product on a dark void, the still-from-pure-black framing turned every front door dark regardless of mood, the Moment-as-portable-layer carried a Wix/Squarespace product-hero look it was supposed to avoid, and the click-through Enter Site step felt like extra friction in front of the actual store. The lighting fix (the cinematographer's separation directive added earlier this session) made the picture better but didn't fix the structural problems — a great photograph of one product on black is still a product photograph, not a brand intro. And by design spotlight forced the entire first impression onto pure black, hiding whatever mood the maker had picked.

**Correction added 2026-06-15 (session 43):** as originally written, this entry over-killed the Moment. What Alex actually agreed to was retiring the *separate portable layer that plays first and melts in*, and retiring the Enter Site click — not killing the play-through itself. The corrected D54 below; the original list of "what dies" had three items that were mine, not his (play-once-then-rest lifecycle, cookie, footer Intro link), and they come back. The hero IS the front door — that part stands.

The fix is structural, not a tuning pass. The portable Moment concept retires as a separate surface above the page. The Main Street hero becomes the front door — same surface, no separate layer that plays first and melts in, no Enter Site click-through, no SpotlightStage component. What stays from the old Moment behavior: on a cold front-door arrival the hero's story lines fade in one at a time within the hero surface (held media + scrim + each story line crossing in and out in turn), settling on the brand+CTA at rest. A per-shop cookie marks the play-through seen, so a returning visitor lands directly on the resting hero with no timeline. Deep-link / inside-page arrivals get the resting hero for the rest of the visit (no Moment until they cold-arrive at home on a future visit). A footer "Intro" link replays the timeline on demand. The director still picks heroKind from the same motion criterion, but it now drives the hero directly. Video heroes work exactly as they do today — locked camera, in-frame motion only, fal-generated, seamless loop. Still heroes get a redesigned treatment: a cinematic SCENE composition (the product in its world — soap on a stone by a sink with morning light, candle on a windowsill with curtains, jewelry on a dressed table with an open book) rendered as a single fal still, with a very subtle CSS push-in at render time (gentle scale, slow, barely perceptible — not the slideshow's Ken Burns). The "rise out of pure black" framing is dead. The scene shows the maker's world; the skin's colors get to be visible because there's a room around the product instead of a void.

For the three other archetypes (Counter, Find, Body of Work — D32, none built yet), the Moment goes away with no replacement. Each shape opens with its own native chrome when those are built (cabinet, board, artist statement). BohdiAI's "visibly not AI slop" differentiation (D31) no longer leans on a shared signature wow layer; it leans on the Constellation procession, the marquee, the founder beat with the portrait scrim, the skin and type system, and the crew's authored voice — all of which are already distinctive. The bet behind this call is that a cinematic still scene OR a real-motion video hero, sitting in the right mood's skin, with the page-down treatments below already distinctive, doesn't need a front-door layer on top to be "not AI slop."

Cost: the still treatment is much cheaper than video (one fal image vs. one fal video). The static-product savings spotlight gave us are preserved and extended.

What this supersedes: **D33** (Moment as BohdiAI's signature shared as a portable layer across every storefront — survives in spirit at the Main Street hero, retires for other archetypes), **D43** (Moment plays first as portable layer, then melts), **D57** (two-treatment Moment as a portable layer concept; the still-vs-video kind selection itself stays, just at the hero), **D58** (spotlight tagline + rise-as-arc framing — replaced by the still-scene framing). **D44** is *refined*, not killed: the autoplay-cold-arrival, the play-through-and-rest, the per-shop seen cookie, and the deep-link bypass all survive — what changes is that there's no Enter Site click and the play happens in the hero surface, not on a portable overlay; the cookie is written when the timeline lands on the brand phase, not on a click. **D52** (locked camera for video) STAYS because video heroes still loop, and a moving camera still can't loop seamlessly. **D47** (prefer real motion; never invent motion) was further refined by **D55** (no default; tangential invention is the refused failure mode) — that refinement governs heroKind selection.

Live tenants currently carrying spotlight content are test stores and get wiped; the schema drops the spotlight legacy path entirely, and `momentKind` is renamed to `heroKind` with values `video` and `still`.

---

## 2026-06-15 (session 43)

### D55. Video vs still is an honest judgment with no default; a tangential video is AI slop and the still is first-class

Yesterday's Session-42 "DEFAULT TO VIDEO" framing (restored in response to a baker landing on a still when steam off bread was the textbook video case) overcorrected. Applied without judgment, it produced inventory like a candle sitting next to yarn on a knitter shop — a tangential subject brought in to satisfy a video bias on a niche whose world is at rest. That is AI slop, not cinema. It also bloated build times by paying for video generation on niches that didn't earn it.

The corrected criterion: the director picks 'video' or 'still' by asking honestly whether THIS maker's own world contains real ambient motion the camera can film and whether that motion belongs to THIS subject. Steam off bread for a baker, a flame for a candle maker, water on soap, hands in fabric for a fiber maker, light across a stained-glass piece — yes, video. A finished sweater on a wooden bench, jewelry on a dressed table, a pattern PDF — no honest motion to film; still. Neither side defaults. The still hero is not a fallback — it renders as a cinematic SCENE per D54 (the product in its real world, lit naturally, with depth and air) and carries the front door on its own.

The failure mode the prompt now explicitly names and refuses: a video that has to introduce something tangential to fill the motion — a candle next to a knitter's yarn, a wind machine on a static subject, a flame "for atmosphere" on a niche that has nothing to do with flame. If the only way to land a video is to bring in a subject that isn't the maker's craft, the answer is still. The discipline is: refuse to invent.

Supersedes **D47** ("always reach for video, a still is the last resort"). D47's intent — don't play it safe with a still when there's a real video to be made — survives in the new framing's "if the maker's world contains real ambient motion that belongs to the subject, film it." What D47 got wrong was framing it as a default rather than as a test of honesty.

The ride-along lesson: trying to encode a default by language ("DEFAULT TO X. Only Y when...") still produces bias-induced invention when the niche genuinely doesn't fit. The cleaner discipline is to name and refuse the failure mode (tangential invention), which biases the model against AI slop without biasing it for any one heroKind. That belongs in the standing lessons.

### D57. Schema validates shape only — no length caps on any string, no punctuation rejections; the build NEVER fails on copy

A live build died because a product's shortDescription was 92 characters against a 90 cap, and the 4-attempt retry loop didn't converge — the model kept rewriting and landing at 90-92 instead of dropping to under 90. Alex: "I want a fix that is going to stop this error from happening on ANY field. It is not an acceptable outcome in production." This sharpens D53. The original D53 said "the build never fails or trims on copy" AND kept hard caps on a few "structural" fields (the moment story lines, headlines, the short card description, labels and names). Those two clauses contradict the moment a model can't converge, and we hit it.

The resolution: the schema layer validates SHAPE only — the right fields exist, the right types, the right enums. No `.max()` on any string anywhere. Punctuation rules (the headline-no-sentence-punctuation rule, the story-line-no-punctuation rule) become server-side normalize transforms that strip the bad characters server-side; they do not reject. Slugs are slugified, not validated. Required strings keep a `.min(1)` floor because an empty button label or blank wordmark is a broken page, but nothing else is enforced.

A new module `lib/onboarding/crew/normalize-copy.ts` runs after every successful copywriter parse (and after every revised-copy parse in the Director's Cut). It trims whitespace, strips terminal punctuation from headlines, strips forbidden punctuation from story lines, and slugifies product slugs. Accepting transforms only — never throws, never adds a retry. The build moves forward.

The renderer takes responsibility for absorbing any length: product cards line-clamp shortDescription to three lines so a verbose description never pushes the goods grid out of rhythm. Other surfaces (headlines, story lines, body prose) wrap naturally; long ones look a bit longer, never broken. This is the same accept-or-coerce-never-fail discipline the maker dashboard will need anyway when makers post-edit their copy with whatever lengths they want.

What disappears: the length-feedback path on length-only failures (no length failures possible), the retry budget spent on string trimming, the "still-capped field" tests, the byte-for-byte resubmit instruction for length convergence. Retries still exist — for shape failures (wrong enum, missing required field) — but those are rare with forced-tool output, and we hit the attempt cap only when the model is producing genuinely malformed structure, not when it's writing slightly-too-long copy. The standing lesson "don't mutilate content to satisfy an arbitrary constraint; remove the constraint" gets generalized: a constraint that can cause a non-recoverable production failure on a non-physical property (length, formatting) is itself the bug, not the model that violated it. Renderers carry visual discipline; schemas carry shape only.

Supersedes the cap-keeping half of D53. The body-prose half of D53 (no hard caps, design absorbs any length) is now the rule for the entire schema rather than a few specific fields.

### D56. Genuinely-dark skins carry the `dark` tag only — no padding non-dark subsets

A live test produced near-black heroes on two non-dark moods: a Cozy candle shop landed on Hearthstone ("candlelit dark with ember amber"), an Elegant candle shop landed on Gild ("black and thin gold — the lit jewel case"). The D41 skin gate was wired and worked — the Graphic Artist picked from the mood-aligned subset on each build. The bug was upstream: four genuinely-dark skins were dual-tagged with non-dark moods (Hearthstone as `dark,cozy`, Gild as `dark,elegant`, Curiosity as `dark,elegant`, Darkroom as `dark,modern`), so the subset itself contained dark options. Bohdi's documented pull toward dark (going back to D8's "AI defaults to dark+purple or cream+pastel") did the rest.

The fix is the tags, not the prompt. Hearthstone, Gild, Curiosity, and Darkroom carry the `dark` tag only. A skin's mood tag(s) should reflect what the skin IS, not what world it lives in (Hearth, Fine, Studio, Relic). The dark register IS the look — a "candlelit dark with ember amber" skin is dark even though its world is warm-Hearth. Within the chosen mood, the Graphic Artist now picks from a subset that honestly fits the maker's feeling.

Counts after the fix: Dark 6, Rustic 7, Cozy 6, Modern 8, Elegant 4, Playful 6, Industrial 6. Elegant shrinks to four (porcelain/atelier/conservatory/celestine) — small but coherent, all genuinely refined-and-light. A padded shelf with two false-positive dark skins is worse than a smaller honest shelf. The `>=5 skins` floor in the test contract drops to `>=4`; the comment is updated to call out why.

The D41 gate's wiring is untouched. The subset filter still works the same way — it just operates on honest tags now. The Graphic Artist still picks freely within the subset; we're not encoding HOW (D20), we're correcting the input data.

Modern still contains genuinely-bold dark options (Anvil "near-black with one blood red, butcher-sign bold"; Marquee "black with one neon-lime") that are intentionally Modern, not miscategorized. If Modern starts landing dark on niches where the maker wanted bright-loud-modern, that's a follow-up — not what surfaced today.

---

## 2026-06-17 (session 44)

### D58. The Playful mood is renamed Cheerful

A live build of Bloated Bellys (herbalist × playful) landed cleanly on the Confetti skin — butter-cream background, poppy and grape accents, the rounded Unbounded display. The build is bright, sunlit, color-positive. Alex's read: "this site is bright, but I would not call it playful."

He's right. In plain English "Playful" promises kid-energy, toy-store wink, humor — a register only one skin on the shelf (Bubblegum) actually delivers. The other five (Confetti, Sprout, Wildflower, Pantry, Pigment) are bright and cheerful but not playful in the toy-store sense. A herbalist picking "Playful" sets a wrong expectation for what they're about to see; a herbalist picking "Cheerful" sees exactly what the word said.

The fix is the label, not the shelf. Cheerful is what the bucket has always been — bright, lifted, full of color, a store that smiles back. The six skins all stay; their tags change from `playful` to `cheerful`. Bubblegum at the loud end is still cheerful, just turned up.

What changes: the mood key (`playful` → `cheerful`), the mood label (Playful → Cheerful), the six skin tags, the onboarding picker card, the description copy, and a migration to remap existing tenants + design_choices + the stored archetype envelope's `mood` field. The mood description rewrites from "bright, joyful, and full of energy — color and fun" to "bright and lifted, color-positive — sun on the page, a store that smiles back."

What does NOT change: the shelf composition (Confetti / Bubblegum / Sprout / Wildflower / Pantry / Pigment all stay; the cozy crossovers on Pantry and Sprout stay), the D41 mood-gate wiring, the trajectory/director language at the prompt level (the model reads the current MOODS table, not the old key by name), and any other mood's name or shelf. The English-prose use of "playful" in niche body_markdown files describes a brand register the AI grounds against — it stays.

Supersedes the Playful naming in **D51** (the seven-feelings lineup); D51's principle (color is a layer Bohdi picks inside the feeling, not a mood; descriptions are feel-first) and the lineup itself (Dark, Rustic, Cozy, Modern, Elegant, Cheerful, Industrial) stand. The ride-along lesson: a mood label is a promise to the maker — when the label overpromises one corner of the shelf, the build that lands on a different corner reads "wrong," even when the build is correct. Name the bucket honestly.

---

## 2026-06-18 (session 46)

### D59. One global login for everyone; roles are per shop

BohdiAI uses a single login system, not a per-shop one. One account per email, the way Supabase's built-in login already works. A person's *roles* live per shop on the existing `tenant_members` bridge (admin / customer). A maker logs in once and reaches any shop they own or staff (a shop picker if more than one); each shop is its own subscription. Customers join the *same* system when customer accounts ship in Phase 2 — no separate customer auth to build, and the existing `customer_profiles` / `tenant_members` tables (global identity + per-shop membership + per-shop profile) already fit, so no schema rework.

How we got here: a long design conversation first chased a per-shop / hide-the-platform model, on the goal that a customer should never know two shops share a platform. That model would have meant building our own per-shop login system and it created a real support-and-friction problem (a fresh account at every shop). The unlock was separating two privacy questions that had been tangled together: (1) does a *customer* see all the shops they buy from, and (2) does a *maker* see that their customer shops elsewhere. They're independent. Only (2) actually matters, and (2) stays locked shut regardless — a maker only ever sees their own shop's data. Alex decided (1) doesn't matter. With (1) dropped, the single login is simplest, kills the friction, uses Supabase as-is, and fits the schema already built.

The model is Etsy-like underneath (one login works across BohdiAI stores) but each storefront still looks like the maker's own brand on the surface — the comparison Alex used to picture it. Shopify is the precedent for the operator side: one global account, per-store roles, a store switcher, separate billing per store; multi-shop falls out for free.

What we consciously give up: full "nobody can even tell there's a platform" storefront autonomy. A customer's one login working across stores means the platform isn't fully invisible to customers. We accept that — it's an edge want, and arguably outside the "concentrate on your craft, not the tech" audience. It can become a later premium for the few who ask; it does not drive the foundation. ("Looks like my brand" — store design + a custom domain — we still give every maker; "the platform is truly invisible" is the rarer ask.)

Supersedes the per-shop-accounts direction explored earlier the same session (never written down as a decision). The auth build plan that follows from this is `Project-Docs/Phase-1-Auth-Plan-DRAFT.md`.

---

## 2026-06-19 (session 47)

### D60. Storefronts publish live on build; checkout is gated on payment setup; the maker holds an online/offline switch

A long conversation re-opened the Master Spec §5 "the site is built and live immediately" call, worried that a public store full of AI-generated placeholder products could trouble a maker — and worse, trouble the first visitor they share the URL with. We walked it all the way to "park it until the maker publishes" and back. Where it landed: storefronts stay live-on-build as the Master Spec says, with two guards.

The reframe that settled it: **being live is not the wow.** The wow is the store Bohdi hands the maker and the fact that they can reshape it just by telling him what to change. Whether it's publicly live at that exact second adds nothing to that — so there's no wow to protect by auto-publishing, only risk to manage. Two guards manage it:

- **Checkout is disabled until the maker connects a payment processor (Stripe/Square).** You can't take money without a processor anyway, so this costs nothing — and it removes the one real failure mode: a shared visitor hitting placeholder products with a working-looking cart and trying to buy. With the cart off, the worst a visitor sees is nice products they can't purchase yet, which reads as "still setting up," not "broken."
- **The maker gets an online/offline toggle in the dashboard** to take the store private anytime (while swapping in real products, or whenever they want it down). Offline simply flips `tenants.status` off `active`; the resolver already serves only `active`, so it stops resolving. Default is live.

Placeholder products are **not** labeled "sample" — a label makes the whole polished store read as a demo and cheapens it. The cart-gate is what protects against fake-inventory purchases, not a label. The exposure worry is also thinner than it first seems: a brand-new store on a subdomain nobody has the URL for has no audience until the maker shares it.

"Live in minutes" stays honest, just repositioned: the *path* to live is short (Bohdi builds the look, the maker drops in real content and edits with him, then publishes), maker-initiated — not "auto-published with fake products" as the headline. "We give them the look, they sculpt the content."

A real, explorable **demo** for prospects is a **post-beta** build item. The marketing browser mockups can't serve as that — they're hand-built marketing art, not real generated stores, so there's nothing live behind them.

Marketing follows from this: the home "how it works" centers Bohdi as the maker's personal designer — the three steps are now *pick your craft and a mood → Bohdi builds your storefront → tell Bohdi what to change* (your designer on call, no tech, publish and keep 100%). The browser-demo "Live · url" pill became "Empowered By BohdiAI" (a made-with badge, not a link to a site that isn't there), and the trades marquee now lists only niches we've built or locked to build.

### D61. Beta/founder access — admin approval creates a comped account; password set via an emailed invite

The Phase-0 waitlist is email-capture only: a beta/founder enters an email, confirms a double-opt-in link, and reserves a spot. That is **not** an account — no password, no `auth.users` row, no way to log in. So the people who signed up to be founders currently can't get into the product. This entry sets how they do.

A beta/founder gets in through **founder-admin approval**. Approving them in the admin **creates their Supabase auth account** (keyed to their waitlist email), flagged **comped** (not billable). They receive an **emailed invite** to set their password — or use Google — on first login. The set-password step must run through the emailed link, never a cold "type a new password" at `/signin`: otherwise anyone who knew a founder's email could seize the account. Same one global login as everyone else (D59) — a founder is just a maker whose account was admin-created and comped.

The **comp flag travels with the account** so onboarding skips the card-required trial step (D10/D19) — a founder is never charged. During the closed beta, sign-up is gated to approved/invited accounts so the public can't self-serve before launch.

This depends on the founder admin (the approve action), billing/subscriptions (the comp flag), and the invite email — none built yet. This entry is the spec for that chunk when it's built.

**Open within this decision:** the exact shape of "comped" — free only *during* beta and then the maker rolls onto the locked-in founder rate the waitlist promised, vs. something longer or permanent. Settled here is the *mechanism* (admin-approval → comped account → emailed set-password invite); the comp *duration* and when founder pricing starts is still Alex's to set.

---

## 2026-06-21 (session 49)

### D62. Cloudflare for SaaS is the long-term hosting and SSL architecture

Cloudflare sits in front of the app, terminating SSL for both our own `*.bohdiai.com` subdomains (covered free by a single wildcard cert on our zone) and any custom domain a maker brings (Cloudflare Custom Hostnames, automatic issue + renewal, ~$0.10/domain/mo past the free 100), and proxies all traffic to a Vercel origin behind it.

Chosen over the alternative (letting Vercel own domains + certs directly) for four reasons that all matter more as we scale: it scales linearly and cheaply instead of hitting Vercel's per-project domain cap and the Enterprise cliff; Cloudflare's edge stays in front for DDoS protection, CDN, and caching, which shields the Vercel bill during a viral surge; it requires no nameserver move, so DNS and the alex@bohdiai.com email forwarding stay on Cloudflare untouched; and it keeps the app host *replaceable* — because Cloudflare owns the maker-domain-and-cert relationship, moving the app off Vercel later means repointing one origin, with zero maker-visible domain or cert migration. It also promotes the Session-47 Worker reverse-proxy hack (already live) to the supported, intended product rather than a re-architecture.

How this resolves the custom-domain question that opened the session: custom domains are additive on top of the beta product, not a rewrite. The app already resolves a request to a tenant by its incoming host; a custom domain is one more host → tenant mapping (a column/small table plus one resolver branch), and the renderer is unchanged (it paints by tenant_id regardless of how the visitor arrived). The only genuinely new work lives at the edge (the Cloudflare for SaaS layer), which is self-contained and does not reach into the storefront engine or schema.

Open and unproven: the path has not been stood up in our setup. Before any beta maker is hosted on it, it must be proven end-to-end with one real external domain (cert issues, auto-renews, store serves over HTTPS through the Vercel origin). This is the same Vercel+Cloudflare cert seam that failed in Session 47, so it's the part to prove early, not assume. Likely requires a paid Cloudflare plan; cost confirmed a non-issue. The before-beta test is tracked as a near-term task in the Session Brief Next Actions.

---

## 2026-07-17 (session 74)

### D63. The texture picker is unproven scaffolding; niche-writer texture curation is abandoned; a curated cross-family texture library is the direction to evaluate before launch

Two days across the last sessions went into niche textures and we are no closer to a shippable answer. This entry records where it actually stands so the prototype is not mistaken for a decision.

Having the niche writer curate a texture shelf per niche does not work and is abandoned. It put a sourcing-and-taste job on the wrong worker and produced a candle shelf that was never shown to look great.

The per-niche blended texture the picker offered last session — a transparent texture blended onto the maker's own background color, deepening it on light families and lifting it on dark ones — is unproven. It was never demonstrated to work and look great across families. That blend path (the future library would reuse it) stays in the tree but is endorsed by nothing and should not be assumed to be what ships.

What we did today: stripped the picker back to two honest choices — the family's own default wallpaper, and no texture at all — plus an opacity dial that drives the family wallpaper's strength. The candle prototype textures were removed (the processed images deleted; the candle style sheet kept, its texture list emptied).

One real, self-standing control came out of this and it now SAVES: the maker's choice of family wallpaper vs. no texture, and the wallpaper's strength, persists on the home envelope (`root.texture`) alongside the look, rides in on the same commit (the Publish button — see D64), and re-applies on the live site — not just in the editor preview. This is legitimate because the family wallpaper is already a proven, shipped thing; letting a maker keep or mute it and set how strong it reads is a normal editor control, separate from the unproven library question. (An earlier version of this entry said the picker stays preview-only with nothing worth saving; that was wrong — a live control with no save is half a feature, which is exactly the gap being closed here.)

The direction still to evaluate — not decided — is a single hand-curated texture library, tested to look great, available to every family from the editor, plus a set of niche-specific images a maker can choose as wallpaper. Curated and tested centrally, not sourced per niche by the niche writer.

Timing is undecided, most likely post-launch. It is parked in the final pre-launch phase as a gate to discuss before we launch, and will be planned out fully when we reach it.

### D64. The editor stages changes in-session and goes live on Publish; two buttons — Preview and Publish; no persisted draft yet

The editor's one button saved a look change straight to the live store on click, and a separate "View live site" header link secretly carried the maker's current try-on as URL params — so it showed the try-on, not what was actually live. Three overlapping ways to view or act on the store (the editor's cramped inline preview, "View live site", and the instant save) were confusing.

The model is now two buttons in the editor:

- **Preview** opens the maker's current staged look — feeling, skin, texture, saved or not — full-size in a reused browser tab (the inline pane is too small to judge a store on). When nothing is staged, Preview is just the live store, so it doubles as "see my store" and no separate view-live-site link is needed.
- **Publish** writes the staged look to the live store. It is enabled only when the staged look differs from what's live. The store is public throughout (live-on-build stands, D60); Publish is the go-live for look edits — there is no separate publish step beyond it.

The confusing "View live site" header link and its try-on carry are removed.

Staging is **session-only**: in-progress changes live in the editor session and reach the store only via Publish. Leaving the editor without publishing discards them — the maker returns to what's live. A saved draft that survives across sessions (a real draft-vs-published split in the store's data) was considered and deferred: it's overkill for a one-click, instantly-reversible look swap, and earns its place later when the editor also stages colors and products and a maker stacks several kinds of change before going live.

A known limitation, accepted for now: Preview shows the staged HOME page; navigating within the preview tab to a sub-page follows plain links and shows the currently-published look, not the staged one. A full staged-navigation preview is a later job.

---

## 2026-07-27 (session 76)

### D65. The image editor splits by cost: basic touch-ups ship at launch and are included; generative image work is a post-launch add-on at $5/month with a cap

Makers will not use AI-generated images for their real products — a real handmade item has to be photographed as itself, and a generated stand-in would be exactly the AI-slop the brand rejects (D31). (The onboarding image library is the one place generated images live, and it's onboarding-only.) So the image work a maker actually does in the editor is *enhancing their own real photos*, not generating new ones — a cheaper and more honest thing.

That enhancement splits cleanly by what it costs us to run, and the cost is the boundary:

**Basic — included in the base subscription, ships at launch.** Background removal, crop and straighten, brightness, warmth, color and sharpness cleanup, and simple lighting adjustments. These cost us next to nothing per operation, so they ride in the base price with no cap, no counter, nothing for the maker to think about. This moves the basic image editor *into launch (Beta)* — the previous plan parked all image editing in Growth. It earns the move on merit: clean product photos are a big part of whether a maker's store looks pro on day one, and bad kitchen-table photos are the single thing this audience is worst at.

**Generative — a post-launch add-on at $5/month, capped.** Anything that costs real generation money: lifestyle staging (putting the product into a styled scene), generative relighting, generative mockups. This stays after launch. It's its own $5/month line, not bundled into the base subscription, so the makers who generate are the ones paying for generation. Critically, the $5 buys a *monthly allowance*, not unlimited — a flat unlimited price just rebuilds the unbounded-cost problem at a lower number. Most makers stay well under the cap and never feel it; the heavy user self-funds.

The boundary is a principle, not a per-feature list: if an operation is cheap for us to run it is basic and included; if it needs real generation it is premium. Relighting sorts by this too — a brightness-and-warmth adjustment is basic and included; regenerating how light falls on the product is generative and premium. Every future image operation sorts itself the same way without re-litigating.

Still open: the exact cap number (calibrated against real fal costs during beta), and whether overflow past the cap is a hard stop or a pay-as-you-go pack — with packs worth considering because generative mockups are a bursty, seasonal need that may not fit a monthly subscription cleanly.

---

## 2026-07-29 (session 78)

### D66. A staging environment is a Beta prerequisite, not a Go Live nicety

Until now we deploy straight to production from the working tree, and that's correct while the site carries no real business — a bad deploy costs only our own noticing it. Beta changes that: Beta means real founding members running real stores with real money, so from the first live founding store a bad deploy can interrupt a stranger's income during their business hours, and because one codebase serves every tenant, it does so to every store at once. That combination is what makes a place-to-test-that-isn't-a-live-store a Beta requirement.

The test suite doesn't remove the need. It mocks everything outside our code — the database and its row-level security, Stripe, Square, the Cloudflare subdomain routing. The failures that hurt at launch live exactly there: a migration that passes in tests but locks a real table, a security policy that blocks a real query, a webhook whose signature doesn't verify against the real endpoint. The payments path is the sharpest case — a real customer paying and the money reaching the maker cannot be honestly proven with mocks.

Minimum shape: a separate Vercel project, its own database project so we never test against a real maker's data, Stripe and Square in test mode, a staging subdomain routed through Cloudflare the way production is, and the full environment set on it (including the preview-token secret — the second home that variable finally earns). It does not have to be an always-on full clone on day one; it must be standable-up-and-real before the deploys that can hurt someone.

The operating rule: schema migrations, anything touching checkout or payments, and renderer changes are proven on staging first, because those three can silently break a live store. Lower-stakes changes — copy, a niche file, a dashboard fix — still ship straight to production behind the test suite, because a maker who hits one of those reports it and we fix it while their store keeps selling.

This adds a Staging subsection to the Full Plan's Beta phase. It supersedes nothing; it fills a gap — the plan listed the security fixes but was silent on where we test.

---

## 2026-07-29 (session 78)

### D67. The maker can rewrite anything we generated; the "Make It Yours" walk replaces every placeholder — words and photos — built in phases

Two calls from the editor planning conversation, recorded so they don't drift back.

**The maker can rewrite ANYTHING we generated.** When we planned Bohdi's content editing, the first cut hand-picked a small "safe subset" of text he was allowed to touch. That was backwards. The maker owns their store; they can reword *anything* we wrote — every generated text field, down to the small labels. The editable set is comprehensive, not curated. The only things left out aren't "locked," they simply aren't ours to rewrite: the maker's own inputs (the shop name — it came from them; they change it by renaming, not by Bohdi rewording), images (handled by upload, not rewording), and the store's structure/treatments/link-destinations (the family's call — the content-only non-negotiable). Default to editable; when in doubt, it's editable.

**The walk replaces every placeholder, not just the words.** The "Make It Yours" first-run walk was originally meant — and is meant — to take the maker through replacing everything in the generated store that's ours: their words, their photos, and (later) their real products. An earlier draft narrowed the first build to words only; that narrowing is reversed. Photo *replacement* (the maker uploads their own hero image and founder photo) is in scope. Photo *editing* (touch-ups — D65) stays a later build. Product replacement is the whole listings side, genuinely its own large next build, with a step that slots into the same walk.

**Built in phases.** Because it's a big piece, the walk is built and shipped in phases, each a working increment that adds one more thing the maker can make theirs: Phase 1 Words → Phase 2 Photos → Phase 3 Sections on/off → Phase 4 Products (the listings build) → later, the editor deepens (touch-ups, free-form chat, click-to-edit, highlight-and-rewrite, reorder, use-my-colors). The scope-of-record is `Editor-Make-It-Yours-Phases.md`; the detailed tasks for Phases 1–3 are in `plans/2026-07-29-make-it-yours-walkthrough.md`. This refines the word-only scope in `Editor-Make-It-Yours-Design.md` (Session 76), which is now marked superseded on that point.

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
- **Inventory source of truth at the booth — our app vs. Square (and "build our own POS").** Master Spec §9 has Market Mode as lightweight log-a-sale *in our app* (the maker taps the item, we drop the count instantly), with payment at the booth being whatever the maker already uses — so we own inventory and Square is just a card reader, and there is no inventory sync from Square. That sidesteps the oversell/two-way-sync problem Gemini raised. The open question: a maker already deep in Square who rings everything on Square POS would face *double entry* (ring on Square AND log in our app). Two ways to remove that friction: (a) ingest Square's inventory webhooks and treat Square as a system of record (a real Square inventory integration; not launch scope), or (b) **build our own in-app POS** so the maker takes the card payment *inside our app* (Stripe Terminal incl. Tap-to-Pay on phone, or Square's Mobile Payments SDK) — one tap takes payment, logs the sale, decrements our inventory, tags the event. Option (b) collapses the sync problem entirely and deepens Market Mode into the whole booth experience, but it's a meaningful build beyond the current lightweight spec and must keep money flowing to the maker's own account (no Connect — Master Spec §7). Both are post-launch (full Market Mode UI is Phase 2). Decision deferred; flagged here so the commerce/Market-Mode build picks it up.

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
