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
- **Checkout** (`/manage/plan/change?to=<plan>`): Upgrade opens it — the plan, monthly or yearly with today's total, what she gets, **Confirm upgrade**. Moving down opens the same page as a confirm: what gets put away, "Nothing is deleted", **Move down**, or stay. On a demo site (`demo_checkout` switch) Confirm switches at once with "Demo site: no card is charged" and returns to Your plan ("You're now on Maker Lite."). A real site has no billing yet, so its Upgrade still emails Alex and it shows no move down.
- **Build script**: a site module's `plan` is the starting plan, applied through the same switch only when the site has none (a re-run never undoes a change); `demo: true` turns on the demo checkout.

### Piece two — Lite's content on the shoreline page (next)

Same look, more content: a Shop page of every product as a print with its price, a page per product with "Ask about this", and the full market calendar. Lena gets about 15 products with prices.

### Piece three — the point of sale

The Rose n' Cat market tools switch on at Lite; check they cover what the Lite plan list promises.
