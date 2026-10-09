# Saltmarsh & Lace — the demo shop that moves between plans

**Date:** 2026-10-09 (Session 99)
**Status:** Stage one built (shoreline look approved by Alex, 2026-10-09; kept as a draft). Stage two (Lite + the plan switch + checkout) is next, in its own section below once agreed.
**Related:** `2026-10-02-tiers-and-pricing.md` (plans and switches), `2026-10-03-business-card-site-design.md` (Showcase sites), `2026-09-30-maker-backend-overview.md` (feature switches).

## Why

Alex's leads come from Penny's group: makers who decoupage her designs onto bottles, shells, ornaments, cutting boards and the like (mixed media). He needs one demo site, fully working, that he can record tutorials and walkthroughs on, showing the site and its whole backend at each plan **and** the move between plans in both directions. Makers are seasonal; moving down to Showcase in the off season is better than cancelling (Alex: "downgrading to showcase is better than churn"). The only thing that does not work is taking a card at checkout.

## The made-up maker (shared by every stage)

**Saltmarsh & Lace** — Lena Brightman, 41, runs the paint counter at a family hardware store in Bristol, Rhode Island. People ask her all day whether something will stick to glass, or wood, or survive the dishwasher. She bought a pack of decoupage papers to answer one of those questions properly, tested it on an empty bottle behind the counter, and the customer bought the bottle. She works after closing in the store's back room among the paint cans and tests every sealer on the shelf before it goes on her pieces: her finishes hold up, and that is her selling point.

She works across materials (never just shells): art bottles and apothecary jars, cutting boards and serving trays, keepsake boxes, Christmas ornaments, oyster dishes from the raw bars on the Bristol waterfront, and a red, white and blue line every summer for Bristol's Fourth of July, her biggest week. The salt marsh is the view from the end of the store's loading dock. At Full she also sells a sealing-and-finishing tutorial download.

Story rules (Alex, 2026-10-09): built from scratch, no stock maker-story pieces (a relative supplying materials, the kitchen table, retirement), no names already used on other sites (Ferreira is taken by True Coat).

## Photos

Alex has no real photos. They are **generated**, using two Etsy shops as models for style, objects and finish — IndigoMoonArtsShop and InspirationsFromSoul — **never copies** of their pieces or photos. Their shared world: altered art, vintage and a little dark-romantic, florals, aged paper, gold edges, apothecary bottles, heirloom ornaments, decorative boards. A first batch goes to Alex before the rest are made; his eye sets the bar. Every photo is looked at before it goes on the site.

## The stages

Each stage is built complete and working before the next starts.

1. **Showcase** — the site and the Showcase backend (this spec).
2. **Lite** — catalog with prices, "Ask about this", the market calendar, the point of sale, and the **plan switch** (up and back down, losing nothing). Alex is not sure Lite stays; decided when we get there.
3. **Full** — cart (checkout stops short of a card), orders, promotions, market shop and market results, product video, tutorial downloads. Pieces not built yet get built here so every line on the Full plan list works.

## Moving between plans (the rule all stages build toward)

One shop, one set of everything (story, photos, products, markets, orders). A plan is a set of the existing per-site feature switches. Moving down hides; it never deletes. Moving back up returns everything. Moving down to Showcase: products, orders and customers stay saved but hidden, the site becomes the one-page Showcase with up to 12 pieces, and market dates carry over (both plans read the same markets). The plan doc and FAQ gain this rule in stage two, when the switch exists.

## Stage one — Showcase

### The look: the shoreline

**2026-10-09:** the first design, a cabinet of curiosities, was built and dropped (Alex: "too cartoony", then "stretching too far to create a theme"). The look Alex chose: a photograph of a Rhode Island bay at dusk (salt marsh, still water, a lighthouse far off) **locked behind the page while everything scrolls in front of it**. Lightly nautical from the name, never costumed. One look for every plan: moving up only adds content (Alex: "Why does the look change? Should just be content").

The page, top to bottom:

1. **The sky**: the name large in Bodoni Moda, the ampersand in italic rust, set high in the open sky so it reads; the tag line and What I make under it with a soft light halo.
2. **The prints**: up to 12 pieces floating over the water as white-matted prints with handwritten captions, each at its own slight tilt and drop. Tapping one opens it full size (next, previous, Escape, focus returns).
3. **The card and the tide table**: a lace-edged card with the headline, story, signature and Facebook; beside it the market dates set out as a tide table (canceled ones struck through).
4. **The letter**: the contact form on lined letter paper with a wax seal of the initials, addressed "Write to Lena".
5. **Footer**: © year and name, Privacy, Terms, "Empowered by BohdiAI". Privacy and terms render on a paper sheet over the same bay.

The sea is a fixed layer (not background-attachment, which phones ignore); the photo lives in `public/designs/shoreline/`. Motion is CSS only and slow (the name and prints rise in once); reduced motion shows everything at rest. Strings go through the card strings; styling through classes and CSS variables, no inline styles.

### Where it lives

- A Showcase design, `shoreline`, added to the card designs (`lib/archetypes/card/design.ts`): `ShorelineLanding.tsx`, `shoreline-styles.ts`.
- Site module `scripts/sites/saltmarsh-and-lace.ts` (About you, 12 photos with captions, four made-up market dates, `plan: 'showcase'`), built with `scripts/build-card-site.ts`. Subdomain `saltmarsh-and-lace`, kept as a **draft** (private preview link) while the stages are built. The sample banner and the bohdiai.com samples entry are added when it goes public.
- Its Facebook button points at BohdiAI's own page, like the other samples.

### The Showcase backend

The four Showcase screens that already exist, switched on for this site: **About you**, **Gallery** (12 max), **Market dates**, **QR codes**. Plus one new screen:

- **Your plan** (`/manage/plan`, behind the `plan` switch; the plan itself is the new `tenants.plan` column, set by the build when the site module names one): a strip with the current plan, its price and what it includes; then each plan above it as a card (big price, "or $X a year, two months free", what it adds, Full as the dark walnut card) with an **Upgrade to …** button; and a line that moving down never deletes anything. Wording and prices come from `lib/site/plans.ts`, so they can't drift from the pricing pages. In stage one the button opens an email to Alex; stage two points it at the checkout page.

### Testing and checks

- Tests for the shoreline design (name, fixed sea, prints, card, tide table, letter, footer; leaves out empty parts; photo viewer works), for the new design key, and for Your plan.
- tsc, lint, the full test suite, and the 90% branch-coverage gate on `lib/**/*.ts`.
- Alex looks at the real page on his own screen before it is committed to `main`.

## Stage two — Lite and the plan switch (agreed 2026-10-09)

Built in three pieces, each working before the next.

### Piece one — the switch, checkout and downgrade (built)

- **A plan is a set of switches** (`lib/backend/plan/plan-features.ts`). Showcase: About you, Gallery, Market dates, QR codes, Your plan. Lite adds the catalog, market details and the point of sale (`market_shop`: the QR shop page, Getting paid, Today). Full adds the cart, promotions, new arrivals and **market records**. Moving flips only those switches (`applyPlan`); everything else (domain panel, demo checkout, video) is untouched. Moving down hides; nothing is deleted.
- **Markets step up by plan** (Alex): Showcase reports day, market and town only (plus a canceled tick), as the tiers spec has it. Hours, address, booth and website sit behind `market_details` (Lite up); Costs, Organizer, Notes and Review behind `market_records` (Full). Hidden values stay in the form and save untouched. Rose n' Cat keeps both on (migrations `20261009000002`, `…003`).
- **Checkout** (`/manage/plan/change?to=<plan>`): Upgrade opens it — the plan, monthly or yearly, the prorated working, what she gets, **Confirm upgrade**. Moving down opens the same page as a confirm: starts at renewal, no refund, what gets put away, "Nothing is deleted", **Move down**, or stay. On a demo site (`demo_checkout` switch) no card is taken ("Demo site: no card is charged"); she returns to Your plan with what happened. A real site has no billing yet, so its Upgrade still emails Alex and it shows no move down.
- **Billing** (Alex, 2026-10-09; `lib/backend/plan/billing.ts`, columns `plan_billing`, `plan_renews_on`, `plan_next`, `plan_credit_cents`): moving up is **prorated** — she pays the difference for what's left of the period already paid, renewal day unchanged; changing billing starts a new period today, less the unused part of the old one. **A yearly site can go monthly when it moves up** (Showcase to Lite, Lite to Full): the unused part of the year becomes **credit** that pays the next bills until it runs out (Alex chose this over "yearly stays yearly": a forced yearly upgrade feels like a trap). Credit on account is used before she pays. Checkout shows the working (plan for the rest of the period, credit, Today, credit left, then the price and renewal day). Choosing yearly shows: "Yearly plans aren't refunded. If you move down later, the change starts at your next renewal." **Moving down takes effect at the next renewal**, monthly or yearly, with no refund; Your plan shows "Changing to … on …" with Keep, and the demo has **Skip to renewal (demo)** to play it out on camera.
- **Build script**: a site module's `plan` is the starting plan, applied through the same switch only when the site has none (a re-run never undoes a change); `demo: true` turns on the demo checkout.

### Piece two — Lite's content on the shoreline page (built)

Same look, more content: a Shop page of every product as a print with its price, a page per product with "Ask about this", and the full market calendar. Lena gets about 15 products with prices.

### Piece three — the point of sale (built)

The Rose n' Cat tools (buyer QR page, Getting paid, Today) recorded one piece at a time and never showed her pay code, so **Sell at the table** was added (`/manage/markets/[id]/sell`): tap the pieces brought to that market, running total (sale prices applied), then a QR that opens Venmo or Cash App with the amount, her Zelle address, or the cash to take; Paid records every piece.

### Also built in stage two (2026-10-09)

- Upgrading from Showcase turns each gallery photo into a product named from its caption with **"Ask for price"** (a base price of 0, `NO_PRICE_CENTS`; the cart and market sales refuse it). At most five go on the home page (the backend's limit).
- The shoreline site has pages on Lite and Full: Home (tall sky, featured pieces on a **dusk band** under "From the shelf", story teaser, next markets), Shop (same band), product pages (photo in a **weathered window frame**, price or Ask for price, Ask about this starts the letter), About, Markets (hours, address with directions, booth, website), Contact. Same bay behind every page; footer has social icons and **Owner login**.
- Downgrading to Showcase lets her **pick up to 12 products** for the one page (`plan_next_gallery`), applied at renewal.
- Lite allows **one photo per product** (`product_photos` switch, on by default for sites without a plan); extras are kept and marked hidden.

## Stage three — Full (built 2026-10-09)

Cart and order letter on the shoreline site (Add to cart, cart page, discount code; no card taken); **testimonials** (`site_testimonials`, backend screen, three on the home page with See more, their own page); a running **sale** shows as a banner and on every price; **New** tags on new arrivals; **market results** (this year against last, best first); downloads (`digital_products`) switch on with Full — delivery is by hand until card payments exist.

`scripts/demo-reset.ts <site> showcase|lite|full` puts the demo back to a clean stage for a recording (refuses any site without the demo switch).

Not built, waiting on Alex: product video (Cloudflare Stream cost to confirm), private demo copies per visitor (only if the demo goes on bohdiai.com), Owner login on the other designs (touches live client sites), the demo on bohdiai.com's samples page, and merging to main.

## Known follow-ups (named 2026-10-09, before real billing)

- **Stripe owns proration.** The proration in `lib/backend/plan/billing.ts` is ours and runs the demo. When real billing connects, Stripe's proration is the source of truth (it can differ by cents); ours becomes a preview of it, or is replaced.
- **One source for prices.** Prices live in `lib/site/plans.ts` today. With Stripe they also live in Stripe; one must feed the other so they can't drift.
- **Private demo copies** (Alex agreed, to build after Full): each visitor gets their own copy of the demo shop, signed in automatically, deleted after idle time (sign-in ends when the browser closes); photos shared, visitor uploads deleted with the copy, emails caught ("Demo: not sent"), copies rate-limited. Until then the single shared demo is for Alex's recordings only.

## Stage four — the public demo on bohdiai.com (planned 2026-10-09, build 2026-10-10)

Alex, 2026-10-09: the demo goes on bohdiai.com, so personal copies are a go. Three pieces, built in this order because each needs the one before it.

### Piece one — a personal copy for each visitor

The design already agreed above (Known follow-ups, "Private demo copies"): each visitor gets their own copy of Saltmarsh & Lace at Full, made from the clean Full stage, on its own address (`demo-<code>.bohdiai.com`). Photos are shared, not copied, so a copy is only database rows. Anything the visitor uploads is deleted with the copy. Emails a copy would send are caught and shown as "Demo: not sent". Making a copy is rate-limited and there is a cap on live copies.

"Nothing is saved": the sign-in lasts until the browser closes, and a scheduled cleanup deletes any copy idle for a set time. A browser closing can't be detected directly, so idle time is what actually removes it. Alex's own shared demo stays as it is, for his recordings.

Open question for Alex: the welcome page lists a username and password. With one copy per visitor, a single shared login can't point at everyone's copy. Recommended: each copy gets its own throwaway login, shown on the welcome page, so the footer's Owner login works and teaches the real sign-in. The alternative is to show demo@bohdiai.com as a label only, while the copy signs the visitor in on its own.

### Piece two — the welcome page

Visitors land here first, from the samples page and anywhere else that links the demo. It says who Lena is and what the demo shows: her shop as customers see it, and her backend as she runs it. It says the shop starts on Full and can be downgraded to Lite or Showcase and upgraded again, that no payment is ever taken, and that nothing is saved: the copy is theirs alone and is erased afterwards. It lists the login (see the open question above) and has one button that makes the copy and opens it.

### Piece three — Learn

A Learn button on every backend page of a demo copy opens a short explainer for that page: what it does, which plan includes it, and what a customer sees because of it. The storefront gets one too, so a visitor can learn what each part of Lena's site is for. All words live in one strings file, nothing written into the pages. Undecided: whether real makers get Learn later as help. It's built so they could, and switched on only for demo copies for now.

### Piece four — Orders vs the market app (Alex, 2026-10-09)

An online sale is paid at checkout, so it never needs marking paid. Anything that needs attention (a market hold waiting on Venmo, Cash App, Zelle or cash) belongs in the market app only. The Orders page shows paid orders with only the steps after payment: mark it shipped (a physical piece, or a digital item sent by hand, as Penny's are), or cancel. Orders made at a market show there too, labeled with the market's name, as a record only, and only once they're marked paid in the market app. Mark paid, mark handed over and the "New and paid" view all come off it; confirming a market payment and handing a piece over happen in the market app.

Catch: card checkout isn't built yet, so today an online order arrives as a request and the maker collects payment by hand. Rose n' Cat uses Mark paid live for exactly that. So the change applies once card checkout exists; until then live sites keep Mark paid. The demo shows it the new way: its online orders arrive paid, since checkout is the one thing the demo doesn't run.

### Before it goes live

Both open branches (`feat/site-facebook-link`, `feat/saltmarsh-showcase`) merge to main first, once Alex has looked. The demo is then linked from the samples page.
