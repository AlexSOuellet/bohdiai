# Phase 1 Decisions Log

Running log of product calls made during Phase 1 planning.

**Authority:** Rank 3 (alongside Phase docs, below Master Spec). Tech Arch Spec and downstream docs cite these decisions directly.

**Protocol:** Claude drafts each entry in chat. Alex reads back and corrects drift before the entry lands here. No silent edits — every change is run by Alex first.

---

## 2026-05-20 — first Phase 1 planning conversation

### D1. Foundation-first phasing rule

Phasing controls which features we BUILD AND SHIP, not what the foundation supports. The foundation has to support every kind of business BohdiAI will ever serve. Later phases only ADD on top — never restructure. If a later-phase feature forces a Phase 1 table rewrite, the foundation is wrong.

### D2. Who BohdiAI is for

> "I see BohdiAI as the solution for very small (1-5) business."

Examples: bakers, crafters, electricians, plumbers, restaurants, tattoo, dog grooming. Crafters mostly, handmade items, maybe digital items. Not customers with 500 products. Not what the industry calls "small business" (500 employees). Not manufacturers with massive inventory tracking. Specialty workflows for one customer = paid add-on service, not part of the automatic build.

### D3. Tenant types

Seller and Doer. Two types. Multi-type is expected (a restaurant is both). Every tenant advertises by virtue of having a storefront — Advertiser is not a separate type. A pure business-card tenant is a Seller or Doer who has chosen to only advertise online (on a tier where sales or bookings aren't enabled).

### D4. Sellers' product variations

Etsy-style.

> "We need to give sellers descriptors or variations they can define for their products. It can be an open amt."

Variations table linked by product ID and tenant ID. Maybe a bundle field (qty for discount) and a promo field.

### D5. Niche schema, revised

Niche schema is NOT a definitive answer. Many niches share schema. The form was originally Claude's framing, not Alex's. Schema serves as starting input the AI uses at onboarding; the customer iterates from there.

### D6. Design driven by mood, not niche

Customer picks a mood descriptor at onboarding (e.g., "dark and stormy," "rustic," "warm and cozy," "summer afternoon," "autumn landscape"). NOT abstract design words like warm/cool or traditional/modern. An occult candle maker picks "dark and stormy"; a beach baker picks "summer afternoon." The mood the customer picks drives the design, not the niche stereotype.

### D7. Curated list, not free text

> "We need to control it in initial build. They can iterate later."

Customer picks the mood from a curated list at onboarding. Free-text and open refinement come later via the editor (Vibe Slider + the three editor modes per Master Spec §6.4 and §10).

### D8. Block assembly matches the mood

> "The blocks also need to define different structures, not just what the hero section and grid look like."

The whole page composition — which blocks appear, in what order, how composed — is mood-driven, not just the variants of individual sections. This is a layer above Master Spec §6.3, which only addresses variants within sections.

### D9. More than 3-4 variants

> "My plan has always been for way more than 3-4 variants."

The 3-4 figure in Master Spec §6.3 was a starting estimate, not the target. Agents build out many more variants over time per Master Spec §6.6.

### D10. AI does the design — needs the right data

> "AI absolutely does the design, we just need to train it to do it right."

Quality depends on the data fed to the AI. Without good data, AI defaults to two looks (dark/purple or cream/pastel). Niche knowledge is one input among many; the customer's chosen mood and their own assets (photos, brand) matter more.

### D11. Customer types under Seller and Doer (still to define)

Define as many specific customer types as make sense within Seller and Doer. Won't be nearly as long as the earlier 19-shape list. Tenants map to one or more types; the type determines the broad mechanics. The specific list of types is still to be defined.

### D12. Things that are NOT types

- Subscription is a payment model.
- Advertiser is a behavior every tenant does (every storefront is advertising), not a type.
- Display is a tier/feature level (freemium landing-page-only).
- Teaching, hosting, and scheduling appointments are things Doers do.

None of these need their own type.

### D13. Future feature roadmap — all in scope eventually

Every bucket from the e-commerce feature audit is on the BohdiAI roadmap, even if not at launch:

- Shop organization (sections, search/filter on storefront)
- Storefront content pages (about, policies, FAQ, custom URL)
- Customer accounts (saved address, order history, wishlist)
- Marketing tools (coupons, email, social media links)
- Fulfillment tooling (shipping labels, tracking, returns)
- In-platform customer messaging
- Customer reviews (customer-left, tied to purchases — different from seller-curated testimonials)
- Gift cards
- Analytics for the seller (sales, traffic, conversion)
- Outbound integrations (POD, accounting, email tools)

Per D1, the foundation must support all of these as additive features even if their UI ships later.

### D14. Phase 1 / launch features (from the e-commerce list)

- Shop organization
- Storefront content pages
- Customer accounts
- Customer reviews
- Promos / discount codes
- Gift cards
- Analytics for the seller
- Social media links

### D15. On the roadmap but post-launch

- Marketing (beyond promos and social links — e.g., email marketing tools)
- Fulfillment tooling (shipping labels, tracking, returns)
- In-platform customer messaging
- Integrations with Quickbooks and Mailchimp
- POD integration

Per D1, the foundation must support all of these as additive features now.

---

## Open items (not yet decided)

- **Specific customer types under Seller and Doer.** Per D11.
- **What a niche schema actually looks like in form.** Per D5.
- **How AI training/data flow works.** Per D10. What data goes in, where it comes from (customer-provided, niche reference library, product photos, etc.).
- **The mood list itself** — which mood descriptors are in the curated set, how many, and how they map to design tokens and block assembly. Per D6 and D8.
- **The database schema.** Pending the above.
- **The variations table structure** (what columns, what types, how bundle/promo fields work). Per D4.

---

## Process notes (banked from this session)

- **Decision capture protocol:** Decisions get drafted in chat in Alex's language, Alex reads back and corrects drift before they land here. This addresses the drift problem where Claude's restatement sounds faithful but contains embedded interpretations Alex didn't make.

- **Specific drift patterns to watch for** (raised by Alex in this session): adding examples Alex didn't give, picking specific interpretations of vague terms, declaring categories or thresholds Alex didn't set, turning "maybe" into "yes," and presenting interpretations as faithful echoes when they contain extra inference.

- **Make intent visible before acting.** When Claude is filling in unknowns, say so explicitly and surface the gap rather than baking the guess into a polished-sounding response.
