# BohdiAI — Master Product Specification

> "Your Business Online. Finally Made Easy."
>
> **Version 1.0 · May 2026 · Confidential — Internal Use Only**
>
> **Canonical original:** `BohdiAI-Master-Spec.docx` (do not edit the .md without updating the .docx). This file exists so Claude (and any future contributor) can load the spec quickly at session start.

---

## Contents

1. Strategic Vision & Positioning
2. Target Audience
3. Platform Ecosystem & URL Structure
4. Pricing & Business Model
5. Onboarding Flow
6. Design System (Tokens, Components, Uniqueness)
7. Commerce & Payments
8. Niche Specialization
9. Market Mode
10. Tenant Dashboard (Maker Experience)
11. Founder Admin
12. Marketing Site (bohdiai.com)
13. Education & Community (Skool)
14. Migration
15. Technical Architecture
16. Roles & Workflow
17. Phasing Summary
18. Open Items & Future Features

---

## 1. Strategic Vision & Positioning

BohdiAI is an AI-powered platform that gives small business owners, makers, and independent sellers a professional online presence in minutes. The platform uses artificial intelligence to generate unique, niche-aware storefronts, handle product management, and simplify every aspect of running an online business.

**Brand Architecture**
- Bohdi Software — the parent company
- BohdiAI — the platform product
- The Bohdi Way — the philosophy and educational framework

**Tagline:** "Your Business Online. Finally Made Easy."

**Core Philosophy**
BohdiAI empowers business owners to take themselves seriously as entrepreneurs. The platform makes things easy but does not do everything for them. It educates, equips, and removes barriers. The maker owns their business, their customers, their money, and their success. BohdiAI never takes a cut of their sales.

**Platform Scope**
BohdiAI is intentionally not limited to crafters. While artisans and makers are the launch audience, the architecture supports any type of small business: bakers, estate sale organizers, vintage sellers, service providers, farm stands, and more. The niche schema system allows expansion into any product or service category without code changes.

---

## 2. Target Audience

BohdiAI is for businesses with one to five people running them. Crafters are the bulk of the audience, but the platform also supports bakers, electricians, plumbers, restaurants, tattoo artists, dog groomers, photographers, and similar very-small businesses.

Every BohdiAI tenant is a Seller, a Doer, or both. A Seller sells things — products, digital items, gift cards. A Doer does things for customers — services, classes, appointments, events, contractor work. Multi-type is normal: a restaurant sells food and takes reservations; a tattoo artist sells merch and books appointments.

**The Kitchen Table Maker** — Makes something beautiful but has no online presence. Lowest possible barrier to entry. (Seller.)

**The Craft Fair / Popup Seller** — Already selling in person. Has a table at the local market, maybe a Venmo and a notebook. Between shows, their business does not exist online. (Seller.)

**The Frustrated Etsy / Platform Lister** — Tried Etsy and it did not work. Too much competition, too many fees, no control. Wants their own store on their own terms. (Seller.)

**The Service Provider** — Tattoo artists, plumbers, photographers, dog groomers, tutors, personal chefs. Needs a professional online presence to generate leads and, depending on the trade, book appointments or display a portfolio. (Doer.)

**The Hybrid Business** — Restaurants, bakeries with classes, jewelry makers who also do custom commissions. Sells things and does things. (Seller + Doer.)

BohdiAI is **not** for businesses with 500-product catalogs, manufacturers with bills-of-materials and lot tracking, or industries that need a dedicated industry tool (full restaurant POS, HVAC dispatch, salon scheduling at scale). A specific business whose workflow doesn't fit the standard build is a paid add-on, not an automatic onboarding result.

**What they have in common:** They are doers first. They did not get into this to learn web design, SEO, or payment processing. BohdiAI meets them where they are and makes the business side easy.

---

## 3. Platform Ecosystem & URL Structure

BohdiAI consists of five interconnected layers served by a single codebase and database using multi-tenant architecture:

| Layer | URL | Purpose |
|---|---|---|
| Marketing Site | `bohdiai.com` | Public landing page, SEO/AEO, email capture, beta applications |
| Founder Admin | `admin.bohdiai.com` | Private command center for managing users, revenue, and niches |
| Maker Dashboard | `app.bohdiai.com` | Where makers manage their site, products, orders, and tools |
| Storefronts | `[storename].bohdiai.com` | Individual business websites visible to customers |
| Community | `learn.bohdiai.com` | Redirect to Skool community for education and courses |

All layers share one codebase and one database. Tenant storefronts are rendered from shared templates with per-user data and design tokens. Infrastructure costs scale efficiently with user growth.

---

## 4. Pricing & Business Model

**Revenue Model**
Pure subscription revenue. BohdiAI never takes a percentage of maker sales. No transaction fees, no platform success fees. The only cost to the maker beyond the subscription is the standard payment processing fee from their chosen processor (e.g., Stripe's ~2.9% + $0.30).

**Marketing Message:** "No fees on your sales. Ever. Unlike Etsy, we never take a cut."

**Tier Structure**

| Feature | Freemium (Free) | Basic ($19.95/mo) | Pro ($29.95/mo) |
|---|---|---|---|
| AI Onboarding | One-time generation | Full niche theming | Full niche theming |
| Site Type | Single landing page | Full store | Full store |
| Products | None | 5–10 | Unlimited |
| Collections | None | 1–2 | Unlimited |
| Commerce (Cart/Checkout) | No | Yes | Yes |
| AI Editor | No (click-to-edit only) | Limited monthly cap | Higher monthly cap |
| Vibe Slider | No | Yes | Yes |
| Schema Fields & Badges | No | Yes | Yes |
| AI Image Studio | No | 3 generations/day | Higher daily cap |
| Custom Domain | No (subdomain only) | Yes (self-serve setup) | Yes (setup included) |
| Domain Setup Help | N/A | $10–$15 one-time fee | Included |
| Log a Sale (Market Mode) | No | Yes | Yes |
| Order Management | No | Yes | Yes |
| Component Library | Basic | Core set | Full library |
| Footer Branding | "Powered by BohdiAI" | None | None |
| Claude Vision Extraction | No | No | Yes (when available) |
| Priority New Features | No | No | Yes |

Specific caps (exact AI interaction limits, exact product counts for Basic) will be refined based on beta tester usage patterns and cost data.

**Paid Add-Ons (future)**
- Additional AI token packs
- One-time concierge setup services for Basic tier

---

## 5. Onboarding Flow

The onboarding is designed to get the maker to the wow moment as fast as possible. No photo uploads, no complex decisions, no payment setup. The site is built and live before they have time to second-guess.

**The Flow**

1. **Screen 1:** Your name.
2. **Screen 2:** Pick your craft/business niche from a visual grid. Confirm or edit your auto-suggested shop name.
3. **Screen 3:** Choose your tier (Freemium / Basic / Pro) with a clear comparison. Basic and Pro trigger Stripe subscription. Freemium skips payment.
4. **Screen 4:** How many products do you have? (Skipped for Freemium.) Simple selector: "Just a few (1–5)", "A solid collection (6–15)", "I've got a catalog (16+)".
5. **Screen 5:** Watch your store build in real time. AI generates a unique tagline, about page, placeholder products (at the stated count) with niche-appropriate descriptions and pricing, FAQ answers, and trust badges. The finished site is live on a subdomain immediately.

**Post-Onboarding: The First Five Minutes**
The dashboard opens and the first thing the maker sees is their beautiful, fully-built store. The guided next step is "Add your first real product" with Claude Vision photo upload.

**Key Principles**
- Zero friction to the wow moment. No uploads, no payment setup, no complex choices during onboarding.
- Fallback content packages exist for all niches in case the AI API is slow or unavailable.
- Every signup produces unique content and a unique visual design via design tokens.
- Payment processor setup happens later in the dashboard, not during onboarding.
- A friendly disclaimer recommends using a laptop or desktop for initial site setup.

---

## 6. Design System

BohdiAI uses a Dynamic Generation UI system to ensure every storefront looks unique while running on a single shared codebase. The system has four layers:

### 6.1 Design Tokens (The Skin)

Every visual choice is stored in the Supabase database as a JSON block of design tokens **per tenant**. When a customer visits a storefront, the Next.js engine pulls the tenant's tokens and injects them as CSS variables. The same layout code renders completely differently based on the token values.

**Token categories:**
- **Colors:** primary, accent, background, text, muted
- **Typography:** heading font, body font, heading weight, body size, letter spacing
- **Spacing and shape:** border radius, section padding, card gap
- **Layout preferences:** hero style, product grid style, footer style

### 6.2 AI-Generated Variation

At onboarding, the AI generates a unique set of design tokens for the tenant. The primary input is **mood**, picked by the customer from a curated list — evocative phrases like "dark and stormy," "rustic," "warm and cozy," "summer afternoon," "autumn landscape." The mood is concrete human language, not abstract designer terms like "warm," "cool," "traditional," or "modern."

The customer's own assets matter more than the niche. Their product photos, any existing brand, references they admire — these feed the AI alongside the mood pick and produce a design that fits the business rather than fitting the stereotype of the niche. An occult candle maker doesn't get amber-and-honey just because they're a candle maker; they get a palette that matches the mood they picked.

Niche knowledge is one input among several, not a constraint. The AI uses niche context to make sensible defaults — what kinds of products this seller likely shows, what tone resonates with their customers — but the customer can override anything.

The result: every storefront feels intentionally designed for the specific maker, not for an abstract category.

### 6.3 Modular Component Assembly (The Structure)

BohdiAI does not just swap colors. It changes the structural arrangement of the page. Each section type (hero, product grid, about, footer, product detail, and others) has many polished React component variants, with more added over time. The lead developer builds the first foundational variant of each type as the reference pattern; Cowork agents replicate the pattern to add additional variants.

The mood the customer picks at onboarding drives more than which hero variant gets used — it drives **which sections appear and in what order**. A "dark and stormy" storefront might lead with the maker's story; a "summer afternoon" storefront might lead with products front-and-center. Block assembly is part of the design, not separate from it.

Combined with design token variation, the number of unique site appearances is effectively unlimited.

### 6.4 Widgets — the functional layer

Blocks are visual containers with declared slots. Widgets are the functional pieces that fill those slots — a booking calendar, a contact form, a price display, an add-to-cart button, a product card, a testimonial, a map, a "book now" CTA, an image gallery, an availability list.

The AI assembles a storefront by picking blocks (for visual feel, driven by mood and niche) and then threading widgets into the slots those blocks expose (for function, driven by what the tenant sells and what their niche needs). A tattoo artist's storefront picks a feature block with a large primary slot and threads a booking-calendar widget into it. A candle maker's storefront picks the same kind of feature block and threads a featured-product widget into it. Same block, different widget — that's how Sellers and Doers share the visual library without needing tenant-type-specific blocks.

Widgets are a catalog separate from the blocks catalog. Each widget declares what slot shape it fits, what content it accepts, what tier it requires, and what kind of tenant it applies to. The AI reads the widget catalog the same way it reads the blocks catalog when generating a page.

### 6.5 The Vibe Slider

Located in the AI editor (My Website section of the dashboard). When a maker moves the slider from "Rustic" to "Modern," the AI mathematically shifts all token values in a coordinated way. Fonts change, corners sharpen, colors cool down. All changes remain balanced, elegant, and within safe design boundaries. The maker cannot break their own site.

### 6.6 Claude Vision Extraction (Post-Onboarding)

When a maker adds their first real product with photos, Claude Vision can analyze the product images, extract the color palette, and offer to update the site's design tokens to match. This happens **after** onboarding, not during it. Available to Pro tier users.

### 6.7 Build Approach

- Lead developer builds the token schema, the first foundational block of each section type, and the first foundational widget of each functional type.
- Cowork agents build additional block variants and additional widget variants following the established pattern.
- Cowork agents build niche content files in parallel.
- Founder reviews and approves all work.

---

## 7. Commerce & Payments

**Core Principle**
BohdiAI stays out of the money flow entirely. No Stripe Connect. No transaction fees. No platform fees. The maker owns their payment processing, their money, and their customer relationships. BohdiAI builds the cart, the checkout flow, and the order management.

**How It Works**
- BohdiAI builds the cart with quantity support and the checkout page.
- The maker connects their own payment processor account (Stripe or Square) through a guided in-dashboard walkthrough.
- The checkout sends the payment request to the maker's own processor account.
- BohdiAI captures full transaction data through the checkout flow and payment webhooks.
- Orders appear in the maker's dashboard with customer details, quantities, and fulfillment info.
- Refunds and disputes are the maker's responsibility in their own processor dashboard.

**Payment Processors at Launch**

| Processor | Integration Type | Notes |
|---|---|---|
| Stripe (Recommended) | Full checkout integration | Credit cards, Apple Pay, Google Pay, PayPal, Cash App — all through one Stripe integration. Maker enables payment methods in their Stripe dashboard. |
| Square | Full checkout integration | For makers already using Square at craft fairs. Positioned as an option, with Stripe recommended for more payment flexibility. |
| Venmo / Zelle / Cash App | Display only | Maker can show their handle on the storefront. Transactions happen outside BohdiAI. No automatic order tracking. |

**Guided Payment Setup**
The payment setup is built into the BohdiAI dashboard as a step-by-step walkthrough in the brand voice. The maker does not go to Stripe's or Square's website. They answer simple questions and BohdiAI guides them through the process. This is a dashboard task, not an onboarding step.

Stripe is positioned as the recommended option with a brief explanation of its advantages (more payment methods, same fees as Square). A note teases the upcoming Square product importer.

**Cart**
- Multi-item cart with quantity support at launch.
- No discount codes, shipping calculators, or saved carts at launch.
- Clean, simple checkout flow.

**Deferred to Phase 2**
- Stripe Tax automation
- Full multi-item cart enhancements (discount codes, shipping options)

---

## 8. Niche Specialization

**Seller-defined variations.** BohdiAI does not pre-define what fields a product can have based on the niche. Sellers define their own variations per product — scent, size, color, wax type, burn time, anything. A candle maker adds the fields that matter for candles; a woodworker adds the fields that matter for woodworking. No hard-coded list of acceptable fields per niche. This is the same pattern Etsy uses, and it scales to any kind of seller without code changes.

Products also support bundles (quantity-for-discount, like "buy 3, save $5") and product-level promos (a discount or sale on a specific product).

**Niche content as AI input.** Each niche has a content file that the AI reads when generating a tenant's site, product descriptions, and design tokens. The file describes how sellers in this niche talk about their work, what tone resonates with their customers, what variations they commonly use, and what visual direction tends to fit. This is starting input, not a constraint — the customer's mood pick (§6.2) and their own assets (§6.2) override anything the niche file suggests.

Niche content lives at `/content/niches/<slug>.md` in the repo. Markdown body holds the prose the AI reads; YAML frontmatter holds structured metadata. Files are loaded into a typed manifest at build time. Adding a niche is a PR, not a database insert — PR review catches quality issues that admin forms can't.

Most niches share content with neighboring niches. A plumber and an electrician have similar needs. The library is intentionally small — a handful of files covering broad categories, not a hundred files for every imaginable trade.

**Post-Purchase Notes.** Each product has an optional Post-Purchase Note the seller fills in. If populated, it is included in the order confirmation email. AI assistance helps draft it. The seller controls the messaging.

**Deferred to Phase 2**
- Storefront filtering by seller-defined variation values ("Shop by Scent Family")
- Advanced automated email content beyond post-purchase notes

---

## 9. Market Mode

**Concept**
Market Mode is a feature for makers who sell at craft fairs, farmers markets, and popup events. It lets them log in-person sales from their phone and keep their online inventory in sync.

**At Launch: Lightweight "Log a Sale"**
- Simple interface: tap a product from a photo grid, enter quantity, sale is recorded.
- Inventory deducts automatically — a sale at the booth immediately updates the live website.
- Payment processing is the maker's responsibility at the booth (they use whatever they already have).
- Market Mode tracks what sold, not how they got paid.

**Phase 2: Full Market Mode UI**
- Dedicated mobile-optimized view with high contrast for outdoor/bright light use.
- Big tap targets, minimal clutter.
- End-of-day craft fair summary: total sales, best sellers, inventory remaining.

---

## 10. Tenant Dashboard (app.bohdiai.com)

The maker's dashboard is designed for desktop/laptop as the primary setup experience. It works on a phone for day-to-day management (checking orders, logging sales). A friendly disclaimer during onboarding recommends using a desktop for initial setup.

**Launch Features**

| Section | Description |
|---|---|
| Dashboard Home | At-a-glance view: recent orders, revenue snapshot, guided next steps for new users. |
| My Website | The AI-powered site editor. Three editing modes: (1) AI chat for complex requests, (2) Highlight-and-transform for targeted rewrites, (3) Direct click-to-edit for quick manual changes. Includes the Vibe Slider for design adjustments. |
| Products | Add and edit products with niche schema fields. Organize into Collections. Claude Vision photo upload generates titles, descriptions, and suggests pricing from product images. |
| Orders | Order notifications, customer details, shipping info, fulfillment tracking. Populated automatically from cart/checkout transactions via webhooks. |
| Log a Sale | Lightweight Market Mode. Tap a product, enter quantity, inventory syncs. For craft fair and in-person sales. |
| Settings | Account management, subscription/billing, payment processor setup (guided Stripe/Square walkthrough), custom domain configuration. |

**Post-Launch Value-Add Rollouts**
- Finances — income/expense tracking, transaction history
- Tools — pricing calculator, COGS worksheet, shipping calculator, craft fair planner, tax estimator
- AI Image Studio — background removal, photo enhancement, lifestyle mockups
- Messages — customer inquiries inbox
- Full Market Mode UI
- Training tab (Skool integration beyond a simple link)

**Future Features**
- AI storefront chatbot — answers customer questions using the store's product data and FAQ
- AI platform FAQ chatbot — answers maker questions about how to use BohdiAI

---

## 11. Founder Admin (admin.bohdiai.com)

The founder admin is lean at launch. Three screens. The founder also has direct database access and Claude as a resource for anything the admin UI does not cover.

**Launch Features**

| Section | Description |
|---|---|
| User Management | View all users. Search and filter by niche, tier, signup date, activity status. Support actions: password resets, trial extensions, account suspensions, comped months. |
| Revenue Dashboard | MRR, subscriber count, churn rate, revenue by tier. Connected to Stripe with key metrics surfaced directly. |
| Niche Schema Management | Add new niches, define product fields, configure AI prompts, set design token boundaries. Create new categories on the fly without code changes. |

**Reserved for Future Addition**
- GMV tracking and transaction visibility across the platform
- AI usage monitoring (total spend, per-user averages, top users)
- Site oversight (view any maker's site for support/moderation)
- Marketing CMS (blog management, newsletters)
- Component library management
- Platform analytics (signup conversion, feature usage, retention)
- Support inbox

The admin is **agent-ready by default** via the Supabase REST API. When automation is needed, it works without building separate interfaces.

---

## 12. Marketing Site (bohdiai.com)

**Phase 0: Coming Soon**
The marketing site launches first, before the product is built. It captures leads and builds an audience during development.

- Hero section with tagline: "Your Business Online. Finally Made Easy."
- Brief teaser of what BohdiAI does — AI-powered, live in minutes, built for your business
- "Coming Soon" messaging
- Request Beta Access form (name, email, what they sell)
- Join the Waitlist (email capture)
- Community section — pitch for Skool with link to learn.bohdiai.com
- Login link in header (routes to app or admin at product launch)
- Ultra SEO and AEO optimized from day one
- No pricing section, no blog, no app functionality

**Three Engagement Paths**
- Beta Access — founding members and testers (deepest commitment)
- Waitlist — interested but passive (email only)
- Community — learning and connecting now via Skool

**At Product Launch (v2)**
- Full pricing section with three tiers
- "Get Started" button into onboarding flow
- Login link active
- Beta/founding member section converted to testimonials
- Blog added at bohdiai.com/blog when content is ready

This page is also the signup entry point. The "Get Started" button leads directly into the onboarding flow at app.bohdiai.com. The transition should feel seamless.

---

## 13. Education & Community (Skool)

Education and community live on Skool, a separate platform. BohdiAI does not build its own education system. Skool is already in progress as a pre-launch initiative.

**Integration Points**
- `learn.bohdiai.com` redirects to the Skool community
- Link in the BohdiAI maker dashboard under a "Community" or "Learning" section
- Community mentioned during onboarding as a resource
- No SSO at launch — separate logins, kept simple

**Role of Skool**
- Builds a warm audience before the product launches
- Teaches makers the business skills they need to succeed (pricing, photography, tax basics, craft fair strategy)
- Creates a social retention layer that reduces churn
- Establishes BohdiAI as an authority and trusted partner

Skool pricing and tier access to be defined separately.

---

## 14. Migration

**No migration tools at launch.** Migration is a Phase 2 feature.

**Phase 2 Plan**
- CSV upload import supporting Shopify, Etsy, and Square
- AI-powered mapping of imported products into BohdiAI niche schemas and collections
- Image re-hosting on BohdiAI storage for total platform independence
- Direct API connections (OAuth) as a later enhancement if demand warrants

The Square importer is teased on the payment setup page: "Already have products in Square? A one-click importer is coming soon." This tease is removed when the feature ships.

---

## 15. Technical Architecture

**Stack**

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js | Server-side rendering (SEO for storefronts), API routes, dashboard UI. Single codebase. |
| Database | Supabase (PostgreSQL) | Relational data, auth, storage, real-time subscriptions. Row-level security for tenant isolation. REST API for agent-readiness. |
| CDN / Edge | Cloudflare | CDN, SSL, custom domains, DDoS protection. Cloudflare for SaaS handles automatic SSL provisioning for custom domains. |
| Hosting | Vercel | Next.js deployment. Edge functions, seamless deployment. |
| AI | Anthropic API (Claude) | All AI features: onboarding generation, AI editor, product descriptions, schema field suggestions, Vision extraction. |
| Email | Resend | Transactional emails: order confirmations, welcome emails, password resets, post-purchase notes. |
| Image Storage | Supabase Storage | Product photos, site assets, imported images. Single service rather than a separate provider. |
| Payments | Stripe API + Square API | Checkout integration. Maker's own accounts, not Connect. Webhooks for order tracking. |

**Multi-Tenant Architecture**
- Single codebase serves all tenants
- PostgreSQL with row-level security isolates tenant data
- Dynamic routing resolves `[storename].bohdiai.com` to the correct tenant
- Design tokens stored per tenant and injected as CSS variables at render time
- Adding the 1,000th user costs almost nothing in additional infrastructure

**Database Key Tables**
- `tenants` — tenant identity, tier, design tokens JSON, settings
- `products` — keyed by tenant_id, includes schema field data as JSON
- `collections` — keyed by tenant_id, linked to a niche schema
- `orders` — keyed by tenant_id, populated from checkout webhooks
- `niche_schemas` — JSON definitions of fields, badges, AI prompts, design boundaries
- `components` — available component variants and tier access rules

Full database schema to be defined in the Technical Architecture Spec document.

---

## 16. Roles & Workflow

> Detailed in `BohdiAI-Roles-Workflow.md`. Summary here:

**Founder (Product Owner)** — final decision on all product, design, business decisions. Reviews and approves all work before it goes live. Defines priorities. Manages founding members and Skool community.

**Claude (Lead Developer)** — builds the core application. Architects the schema engine, design token system, component framework. Builds the first reference patterns. Reviews agent output. Flags decisions that need founder input.

**Agents (Production Workers)** — build niche schemas, component variants, design token boundaries, AI prompts per niche, niche research. Replicate the pattern.

**The Rule:** The lead developer builds the pattern. Agents replicate the pattern. The founder approves everything. Multiple agents can work in parallel on independent work streams.

---

## 17. Phasing Summary

**Phase 0: Marketing Foundation**
- Build and launch bohdiai.com (coming soon landing page)
- Beta access application and waitlist capture
- Skool community active and growing
- SEO and AEO optimization from day one
- Begin recruiting founding members / beta testers

**Phase 1: MVP Launch**
- AI-powered onboarding with mood-driven design and token generation
- Design token system and modular component assembly with many variants
- AI editor (chat, highlight-and-transform, click-to-edit) with Vibe Slider
- Listings for both Sellers (products, digital products, gift cards) and Doers (services, classes, appointments, events) — single unified listings model
- Seller-defined product variations, bundles, and per-product promos
- Collections for shop organization
- Storefront content pages (about, shipping/returns, FAQ, custom URLs)
- Customer accounts with saved addresses, order history, and wishlists
- Multi-item cart with quantity support and checkout (Stripe + Square)
- Order management with webhook-based transaction tracking
- Shipments and tracking (multi-shipment supported from day one)
- Customer reviews tied to verified purchases
- Promos and discount codes (cart-level and product-level)
- Gift cards
- Seller analytics (sales, traffic, conversion)
- Social media links
- Lightweight "Log a Sale" (Market Mode)
- Guided payment processor setup in dashboard
- Tenant dashboard: home, My Website, Listings, Orders, Log a Sale, Settings
- Founder admin: user management, revenue dashboard, niche file management (PR-based)
- Subdomain hosting (`[storename].bohdiai.com`)
- Custom domain support (self-serve for Basic, assisted for Pro)
- Three subscription tiers (Freemium, Basic with 7-day trial, Pro with 7-day trial)
- Niche content files covering the launch set of categories

**Phase 2: Growth Features**
- Full Market Mode UI (mobile-optimized, craft fair summary)
- Storefront filtering ("Shop by Scent Family", sort by attributes)
- Migration tools: CSV import for Shopify, Etsy, Square with AI mapping
- Claude Vision product photo extraction and site token refinement
- Stripe Tax automation
- Cart enhancements (discount codes, shipping options)
- AI Image Studio enhancements
- Financial tools (income/expense tracking, reporting)
- Business tools (pricing calculator, COGS worksheet, tax estimator)
- Expanded niche categories
- Blog at bohdiai.com/blog

**Phase 3: Scale & Deepen**
- AI-powered storefront chatbot (answers customer questions using store data)
- AI platform FAQ chatbot (answers maker questions about BohdiAI)
- Direct API migration connections (OAuth for Shopify, Etsy, Square)
- Advanced analytics and customer insights
- Marketing CMS in founder admin
- Full support ticketing system

Phase documents will be created as each phase is entered, with detailed scope, timelines, and development milestones. Each phase is modular and testable.

---

## 18. Open Items & Future Features

**Decisions to Finalize**
- Exact AI usage caps per tier (number of editor interactions per month)
- Exact product count for Basic tier (5 vs. 10)
- AI Image Studio daily generation caps per tier
- Skool pricing and tier access model
- Specific launch niche list (dependent on development timeline)

**Future Feature Ideas (Not Scheduled)**
- Paid add-on: additional AI token packs
- Paid add-on: one-time concierge setup services
- Estate sales, vintage, baked goods, farm products, services as niche categories
- Pickup vs. shipping fulfillment model options at checkout
- In-app domain purchasing
- Bank account integration for financial tracking
- SSO between BohdiAI and Skool

---

*BohdiAI — Your Business Online. Finally Made Easy.*

*Confidential | Version 1.0 | May 2026*
