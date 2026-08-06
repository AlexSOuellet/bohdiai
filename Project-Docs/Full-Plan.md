# The Plan to Launch

**Written 18 July 2026, Session 75. This is the operative plan. Every session reads it and ticks its boxes as work lands.**

The plan it replaces was written in July to prove two things worked — that onboarding builds a good store, and that the editor swaps the look. It did its job and both are true. But it was never a plan to reach launch, so it was silent on selling, on the maker's dashboard, on the admin, on getting paid. The old plan is kept at `historical/Full-Plan-2026-07-05.md` for the record of what was finished under it.

What's already built and what isn't is written up plainly in `Launch-Audit-2026-07-18.md`. Read that first if you're new to this.

---

## Three phases, named not numbered

**Beta.** Founding members from the waitlist run real stores. Real shoppers, real money, real inventory. They're comped, but nothing else about their store is a rehearsal. If it stops a maker running their business, it's in this phase.

**Go Live.** Signup opens to the public. Anyone can find us, pick a plan, and pay.

**Growth.** Everything after, funded by revenue, ordered by what real makers actually ask for.

We use these names and not numbers, because the Master Spec has its own Phase 1 and Phase 2 and mixing the two vocabularies will cost us an argument later.

---

## Where we are today

The storefront is done. Onboarding builds a complete, family-styled store and we've run it live through all six feelings. Every page a shopper sees works. Logging in works. The maker can swap the feeling of their store and keep or mute the wallpaper.

Everything else a maker does is missing. They can't add a product, take an order, take money, or log a market sale. Four of their six dashboard pages don't exist. The admin doesn't exist at all.

The database is fully built for every bit of what follows — all 38 tables. None of the work below needs a database change to begin.

---

# BETA

## The editor

Door one is built — the maker picks a different feeling and their store re-paints. The **editor's draft-and-publish** underneath it is now built too (Session 77): every edit writes to a persistent owner-only draft, the preview reliably shows the draft, and one Publish / one Reset promote or discard it — verified live across all six feelings. (The word *staging* is reserved for the test environment below, not this.) The three real editing modes still aren't.

- [ ] **Chat with Bohdi.** The maker tells him what to change in their own words and he changes it. This is the thing that makes him feel like someone they hired.
- [ ] **Click straight on something and edit it.** Tap a headline, type a new one, done.
- [ ] **Highlight and rewrite.** Select a paragraph, tell Bohdi to make it shorter or warmer, take his version or keep yours.
- [ ] Turn sections on and off, and reorder them.
- [x] Undo. Every change reversible, nothing that can break their site. *(Shipped on the editor's draft-and-publish — Undo/Reset/Publish, Session 77.)*

The Vibe Slider is dead and won't be built. It was designed for a world where a store's look was a pile of numbers you could slide between. Families aren't points on a line — they're six different layouts. Picking a feeling is the honest version of what the slider was reaching for. Dials survive where something genuinely has a strength, like the wallpaper control we shipped.

## Commerce

Nothing here exists. The cart is a placeholder page.

- [ ] Cart — multiple items, quantities, change your mind
- [ ] Checkout
- [ ] Stripe
- [ ] Square
- [ ] The walkthrough that helps a maker connect their own payment account, in our voice, without sending them off to Stripe's website
- [ ] Orders land in the maker's dashboard with the customer's details
- [ ] Confirmation email to the customer when they buy, including the maker's post-purchase note if they wrote one
- [ ] Stock comes down when something sells
- [ ] Mark an order shipped, paste a tracking number
- [ ] Sales tax
- [ ] Shipping and pickup options at checkout

Money goes customer to maker. We never hold it and never take a cut.

## Listings

*The **walk's** goods + collections steps got the simple half in Session 85: add/edit/remove real products (name, price, own photo, short + long copy — typed or Bohdi-drafted), photo upload (auto-downscaled + WebP), and real collections (name + assign real products, cover derived, real-or-off). Placeholders clear when the maker makes their store real; Publish is gated on them. The **standalone Listings admin** below — and the richer product (options, several photos + video, stock, digital, touch-ups, logo) — is the next build.*

- [~] Add, edit and archive products and digital products *(walk: add/edit/remove products ✓; archive, digital, and the standalone admin pending)*
- [ ] The maker defines their own product options — scent, size, burn time, whatever matters to them. No fixed list from us.
- [~] Pricing and stock *(price ✓ in the walk; stock pending)*
- [x] Photo upload *(walk — uploads to `tenant-media`, downscaled + WebP; accepts up to 30MB)*
- [ ] Basic image touch-ups on a maker's own photos — background removal, crop and straighten, brightness, warmth, colour and sharpness cleanup, simple lighting adjustments. Included in the base subscription, no cap; these cost us next to nothing to run. The generative side (lifestyle staging, generative relighting) is a post-launch add-on, not this. (D65)
- [~] Create and edit collections, assign products, pick a cover image *(walk: create/edit/remove + assign real products ✓, cover derived from products; a chosen cover image pending)*
- [ ] Upload a logo after onboarding and optionally update the store's accent colour from it

## The maker's dashboard

Two of six pages exist. These four don't.

- [ ] Listings
- [ ] Orders
- [ ] Log a Sale
- [ ] Settings — account, subscription, payment setup
- [ ] Link to the Skool community

## Market days

The maker's own POS. They take the card the way they always have, on their own reader. Our part is everything around it.

- [ ] Market screen — tap through several items, quantities, running total, record the sale
- [ ] Stock drops as they sell
- [ ] Tag each sale to the market it happened at
- [ ] Add upcoming markets; they show on the store's public calendar
- [ ] Log what a show cost — booth fee, gas, supplies
- [ ] See per-show profit, so they know which shows are worth the drive

This is the thing no big platform gives a craft-fair maker. It's the reason one of them picks us.

## The founder admin

Two empty folders today. Built early — nothing else in Beta can start without it, because it's how a founding member gets an account.

- [ ] Approve a waitlist signup, which creates their comped account and emails them a set-password invite
- [ ] See and search all users, with support actions — reset a password, extend a trial, comp a month, suspend
- [ ] Revenue view — what's coming in, who's subscribed, who left
- [ ] Manage niches — add, edit, approve, retire
- [ ] Report on how often Bohdi skipped writing something and the site filled in generic words for him

## Getting paid

Founders are comped, but they need to see what they'd be paying and what their founder rate is.

- [ ] Subscription plumbing with Stripe
- [ ] One tier at the launch price
- [ ] Seven-day trial, card required — and the comped flag that lets a founder skip it entirely
- [ ] The trial screen in onboarding actually does something. Today it takes no card and just advances.
- [ ] Fix the bug on that screen — the heading says seven days, the badge beside it says fourteen

## Niches

- [ ] Finish the niches we've committed to. 15 approved, 4 in draft, 38 unwritten.
- [ ] Check why the onboarding picker seems to show fewer than are approved

## Security

Eleven findings from the July audit. Fixed as we find them, not batched at the end. All closed before a single founding member is on there.

- [ ] Rate limiter — count properly, fail closed, trust only Cloudflare's identifier
- [ ] Set the real rate limit instead of the test one
- [ ] Lock down the onboarding endpoints so they need a login
- [ ] Close the redirect hole in the login callback
- [ ] Stop the app being reachable directly, bypassing Cloudflare
- [ ] Keep login cookies on the app subdomain only
- [ ] Rate-limit the contact, waitlist and notify forms
- [ ] Stop a double-submit at onboarding creating two stores
- [ ] Check the shape of a subdomain before accepting it
- [ ] Make the build-status endpoint only answer to the person who owns the build
- [ ] Stop the confirm route leaking whether anyone has confirmed

## Staging

Before a founding member is running a real store with real money, we need a place to test that isn't their live store. Today we deploy straight to production from the working tree, which is fine while no one's business depends on the site — but the moment a real maker is taking real orders, a bad deploy can break a stranger's checkout during their business hours, and because one codebase serves every store, it breaks all of them at once. The test suite can't catch the failures that matter most here: it mocks everything outside our code — the database, Stripe, Square, the Cloudflare routing — and those only break against the real thing.

- [ ] A separate Vercel project mirroring production
- [ ] Its own Supabase project, so we never test against a real maker's data
- [ ] Stripe and Square in test mode, so we can run a card all the way through without real money
- [ ] A staging subdomain routed through Cloudflare the same way production is
- [ ] The full environment set on it, including the preview-token secret
- [ ] The rule: schema migrations, anything touching checkout or payments, and renderer changes get proven on staging before production; low-risk changes can still ship direct behind the test suite
- [ ] In place before the first founding member is on a live store

## Small things that are actually broken

- [ ] There's no FAQ content anywhere, though we assumed there was
- [ ] No way to put social media links on a store — no field, nothing displayed
- [ ] Verify the contact form actually emails the maker. Untested.

## Beta is done when

A founding member you approved can log in, build their store, change their words by talking to Bohdi, add their real products, sell one to a real customer who pays by card, ship it, sell three more at a market on Saturday, and see at the end of the month what they made and what the show cost them. And nothing on that path is held together with tape.

---

# GO LIVE

Everything needed to open the doors to the public.

- [ ] Customer accounts on storefronts — saved addresses, order history
- [ ] Custom domains. Makers will ask for this on day one. Cloudflare for SaaS, proven end to end on one real domain before anyone's on it.
- [ ] Promos and discount codes, both cart-level and on a single product
- [ ] Real customer testimonials, including a way for a shopper to leave one
- [ ] The marketing site grows up — pricing, a Get Started button into onboarding, founding members' words as testimonials
- [ ] `learn.bohdiai.com` points at the Skool community

## Go Live is done when

A stranger can find bohdiai.com, understand what it costs, sign up, pay, build a store, point their own domain at it, and sell — without any of us touching anything.

---

# GROWTH

After launch, ordered by what real makers ask for.

- Gift cards
- The AI Image Studio (generative) — lifestyle staging, generative relighting, generative mockups. A $5/month add-on with a capped monthly allowance so price maps to cost — not bundled into the base subscription, not unlimited. The non-generative touch-ups already ship at launch (see Beta / Listings). (D65)
- "Use my own colors" in the editor — the maker's brand colours derived into a safe, readable palette over their chosen feeling. Dropped from Beta and moved here; not needed to prove a founding member can run a real store. How maker colour relates to the skins (takes over vs. tints) is still an open question to settle when it's built.
- Business tools — pricing calculator, cost worksheet, tax estimator
- Storefront filtering, like shop by scent
- Service trades and the whole booking side — plumbers, groomers, tattoo artists
- Shipping labels and a returns flow
- Pull market sales in from Square automatically, so the maker stops entering things twice
- A proper phone-optimised market app — big buttons, readable in daylight, end-of-day summary
- More niches, ongoing. Plus letting a maker tell us their niche with a few examples and we add it.
- Customer messages inbox

No blog.

---

# Parked

**Multi-tier pricing.** Needs its own conversation before it goes in a phase.

**Maybes, placed later.** The CSV importers from Shopify and Etsy — we can't honestly test them without a real user who has a real store to import from. Claude Vision filling in a product's title and description from its photo. The customer inbox, which may not be needed at all if the contact form emails work properly.

**The real POS.** Taking the card ourselves at a booth means a phone app and card-reader certification. That's its own project, and it's not what the market screen above is. Sitting in Growth unless something changes.

---

# How we work

- **Bohdi writes content only.** The shape of a store — its sections, its nav, its layout — comes from the family. Never from him.
- **The maker picks a mood. We call it a family internally and never say that word out loud.**
- **No hardcoded text in the renderer, no inline styles, no shortcuts.**
- **Tests are part of done.** A feature without tests isn't done, it's demoed.
- **Ship complete, not partial.** Code, tests, types and a real check before anyone says done.
- **Alex's eyes gate anything with visible output.** Tests passing proves it runs, not that it looks right.
- **Security gets fixed when found**, not saved up.
- **Every session ticks the boxes above.** The plan and reality don't drift.

---

# What was finished before this plan

Under the old plan: the codebase and database cleanup, the renderer sweep, the whole family layer, the six families rendering distinctly, Bohdi cut back to writing content only, the section stack, the nav, and editor door one. That record lives in `historical/Full-Plan-2026-07-05.md`.
