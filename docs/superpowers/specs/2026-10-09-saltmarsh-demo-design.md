# Saltmarsh & Lace — the demo shop that moves between plans

**Date:** 2026-10-09 (Session 99)
**Status:** Stage one agreed with Alex ("yes", 2026-10-09). Stages two and three get their own design pass when stage one is live.
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

### The look: a cabinet of curiosities

One design that grows: at Showcase it is a single glass-fronted shelf; Lite adds drawers (one per line); Full opens a shop counter in front. It is a new design and shares no layout, sections or styling with the other Showcase designs (pinned prints, bulletin board, show reel, torch) or with Rose n' Cat. Its own fixed look; it does not come from the families. Built with the frontend-design skill; bold and specific, not template.

The page, top to bottom:

1. **The cabinet** against an old Narragansett Bay sea chart, with lace and gilt edges. The business name in gilt on the cabinet's crown, her tag line under it.
2. **The glass shelf**: up to 12 pieces, each with a handwritten specimen label (name and a line about it). Tapping a piece opens it full size (next, previous, Escape, focus returns), as on the other Showcase sites.
3. **The door card**: a card tucked into the cabinet door with her story, the "tested on every sealer" note, and her Facebook and Instagram.
4. **Find me at**: her market dates, set out like a tide table. Left out when there are none.
5. **Contact form**: the existing card-site form and route, restyled. Goes to the inbox.
6. **Footer**: © year and name, Privacy, Terms, "Empowered by BohdiAI". Privacy and terms pages render in the same look.

No opener repeats the label-over-headline pattern, no numbered lists, no headline ends in punctuation. All motion is CSS and slow; under reduced motion everything shows at rest; nothing waits on a scroll observer to become visible. All strings go through the design's strings file; styling through classes and CSS variables, no inline styles.

### The pieces are built to grow

The chart wall, the cabinet frame, the gilt, the shelf and the specimen label are separate pieces, so stage two adds drawers and stage three adds the counter without starting over.

### Where it lives

- A fourth Showcase design, `cabinet`, added to the card designs (`lib/archetypes/card/design.ts`), so the site module picks it the same way Rustic Rhody picks the bulletin board.
- Site module `scripts/sites/saltmarsh-and-lace.ts` (About you, up to 12 photos with captions), built with `scripts/build-card-site.ts`. Subdomain `saltmarsh-and-lace`. It carries the sample banner like the other samples.
- Its Facebook button points at BohdiAI's own page, like the other samples.
- Market dates: a handful of made-up dates at real-sounding Bristol and bay-area events, entered through the existing market dates.

### The Showcase backend

The four Showcase screens that already exist, switched on for this site: **About you**, **Gallery** (12 max), **Market dates**, **QR codes**. Plus one new screen:

- **Your plan**: shows the plan the site is on (Showcase) and what Lite and Full add, using the same plan list bohdiai.com's pricing pages use (`lib/site/plans.ts`) so wording and prices can't drift. In stage one it is information only; the switch arrives in stage two.

### Testing and checks

- Tests for the cabinet design (renders the shelf, labels, door card, Find me at, contact form; leaves out empty parts; photo viewer works), for the new design key, and for Your plan.
- tsc, lint, the full test suite, and the 90% branch-coverage gate on `lib/**/*.ts`.
- Alex looks at the real page on his own screen before it is committed to `main`.
