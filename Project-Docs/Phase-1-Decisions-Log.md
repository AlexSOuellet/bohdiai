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

The storefront catalog is four whole-business *shapes*. **The Shop** (Main Street) — the deep-catalog maker; the workhorse most makers land on. **The Counter** — fresh/seasonal/batch makers who sell a rotating "what's available now" (bakers, farms, preserves), with preorder, pickup, and sold-out mechanics. **The Find** — curated one-of-a-kind (vintage, antique), where every piece is sold once and provenance/condition is the copy. **The Body of Work** — image-first art where the work is beheld and acquired and commerce is kept quiet.

An archetype is now a *business shape*, not a skin. That is the change from Sessions 22–29, where Main Street and Gallery were two looks for the same maker. Because the shape is now structural, the archetype is no longer Bohdi's aesthetic call (see D35).

**Gallery is retired as a standalone archetype.** It lost head-to-head to Main Street for a real maker (Session 29), and the dense salon-wall is a physical-gallery technique that successful online stores deliberately avoid. Its one good bone — the dense visual wall — survives as a *page treatment* (a catalog or portfolio page) inside other archetypes, especially The Find and The Body of Work.

Two pieces are **shapes that travel**, not whole storefronts: the dense wall (above) and **The One** (D34). Commission/made-to-order stays a "request a custom order" CTA mode, not an archetype.

### D33. The Moment is BohdiAI's signature front door, shared across every storefront

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
