# Archetype Catalog & The Moment — Design

**Date:** 2026-06-06
**Status:** Design agreed in conversation; mockups built for all four storefront shapes (plus two skins of The One). Not yet built into the engine.
**Authors:** Alex (product owner) + Claude (lead dev)

## What this supersedes

This reframes the archetype direction from Sessions 22–29. Specifically:

- **Retires Gallery as a standalone archetype.** Gallery lost head-to-head to Main Street for a real maker (Abigail, Session 29), and the research is clear that the dense salon-wall is a *physical gallery* technique that successful online stores deliberately avoid (they lead with a curated teaser and link to clean collection pages). The dense wall survives only as a **page treatment** (a catalog/portfolio page) inside other archetypes.
- **Reverses the Session-24 "each archetype owns its hero" decision.** The hero is no longer welded bespoke into each archetype. Instead there is **one portable Moment** — BohdiAI's signature front-door layer — reused across every storefront. This returns to the original Moments-Engine intent (Session 18–22) of a portable brand intro with first-visit-and-replay behavior.
- **Demotes "The One" from a storefront archetype to a launch-page feature.** True one-product shops barely exist (authors write more books; the hot-sauce maker adds a hot honey). The One's value is as a *landing/launch page* that rides on top of a real store, not as a whole site.

## The organizing principle

Two questions sort everything here:

1. **What is the star of the page?** Each storefront archetype is a different *center of gravity* — the shop, the fresh batch, the curated find, the body of work. This is a structural shape, not a niche or a mood.
2. **Is it a whole storefront, or a shape that travels?** Some pieces are full sites. Others are shapes deployed *on top of* a store — a launch page, a catalog-page treatment. Keeping these separate is what stops the catalog from bloating.

## Archetype selection — Main Street default + post-build suggestion engine

**Onboarding always builds Main Street.** We cannot reliably tell a weekly baker from a catalog baker, or a curator from a shopkeeper, at onboarding without interrogating the maker — and a wrong auto-build ships a wrong store. Main Street renders every maker acceptably, so everyone starts there.

**Bohdi never selects an archetype.** This removes the mis-pick risk entirely and ends the steering question for archetype choice — his freedom stays in the skin, the treatments, the copy, and the Moment, never the business shape.

**The rest of the catalog is a post-build, content-loaded suggestion engine**, delivered by the Session-29 try-on tool. Sequence matters: the maker adds their real products and content *first*; then we *actively* suggest a more business-specific look and show it with their own content already inside it — "this is how a shop like yours actually sells." The maker recognizes their own fit and chooses. Because it's their call, it can't be wrong; and the personalized try-on (their pieces in the Find, their loaves in the Counter) is the moment the subscription justifies itself. Active suggestion also beats the default-gravity problem — non-explorers get walked to their fit instead of having to discover it.

**The niche carries a loose suggestion hint**, not a deterministic selector — which shapes to *offer* the maker (the Find to a vintage seller, the Counter to a baker). It drives a suggestion, not a build, so it can be heuristic; a wrong suggestion costs nothing.

**Earning a default.** An archetype earns a best-fit *default* (built at onboarding instead of Main Street) only when it is shown to beat Main Street for a niche — by **functional fit** (the Counter's preorder/pickup/sold-out transaction model is the first candidate, because a rotating-stock maker's business runs on mechanics Main Street can't express) or by **real conversion evidence** once live. "Different" or "thematically apt" does not earn a default; the burden of proof sits on the new shape, not on Main Street. Note: this is a *product* test, independent of which archetype happens to be built first (a build-sequencing fact, not a design driver).

## The four storefront archetypes

A storefront archetype is a whole-business *shape*. The test each one passes (and that The One failed): a real maker's entire business genuinely *is* this shape — not "they sell one item."

### 1. The Shop — Main Street (built)
- **Who:** the fat middle of the maker queue — candles, soap, jewelry, ceramics, wood, leather, fiber (knit/crochet/quilt), polymer clay, resin, glass, stickers, pins, magnets, toys, plush, pet goods, personalized gifts. Also digital-download sellers (same shape, instant-delivery commerce).
- **The star:** the moment, leading into a real catalog of many goods. Atmosphere first, then the shop.
- **Moment behavior:** **melts in** — the Moment *is* Main Street's hero; you scroll past it into the shop.
- **Status:** built (`lib/archetypes/main-street`). Open work from Session 29: a fuller About beat + find-us, and selectable About variants.

### 2. The Counter
- **Who:** fresh / seasonal / batch makers who order ahead — baker, jam & preserves, honey, chocolatier, cheesemaker, charcutier, hot sauce, farmer/CSA, plant seller. Touchstone: June's Sourdough.
- **The star:** *what's available right now.* Inventory turns over weekly; things sell out and come back. The defining mechanics are preorder, pickup windows, sold-out-this-week, and a "next week's list" subscribe.
- **Look direction (agreed):** "The Stall Board" — the home page is this week's dated, hand-marked board; a *list with rhythm*, not a card grid; the special pulled out; a clock strip (orders close / pickup) carrying the urgency; the find-us calendar and the bake-list subscribe are first-class. Warm, market, hand-made.
- **Honest caveat:** the WOW does **not** have to come from the board. The wow is the Moment (same as every store). The board is a strong goods treatment, not a second wow engine. The first Counter mockup is tasteful, not yet wow — see "Open items."
- **Moment behavior:** **gates** (the board is not a single hero surface).
- **Mockup:** `public/counter-mockup.html` (June's Sourdough, Stall Board direction).
- **Status:** look drafted; not built.

### 3. The Find
- **Who:** curated one-of-a-kind sellers — vintage reseller, antique dealer, furniture flipper, estate, pawn. The seller is a *curator, not a maker*. Etsy's second-largest category by volume.
- **The star:** the individual unique piece — sold once, gone forever, chosen by a curator's eye. Provenance, era, and condition are the copy; scarcity is structural.
- **Look direction (agreed):** "The Curated Cabinet" — a *breathing* curated masonry (not the crammed salon wall), each piece an object with its **tag** (the signature device: era / origin / condition / a one-line curator note), prices, and visible **SOLD** stamps so scarcity reads. Moody, archival, generous space. The tag is to The Find what the tilted poster is to The One.
- **Moment behavior:** **gates** (a field of many treasures, no single hero). Confirmed: the Moment can't "melt into" a spotlighted product, because the Moment is its own thing, not the piece.
- **Mockup:** `public/find-mockup.html` (Marrow & Moth).
- **Status:** look drafted; not built.

### 4. The Body of Work
- **Who:** image-first art makers — fine artist, art-print seller, illustrator, printmaker, photographer-selling-prints, comic artist, sculptor, stained glass.
- **The star:** the work itself, seen as a collection — the maker's eye and the cohesion across pieces. **Commerce goes quiet:** you fall for the work first, then discover you can acquire it.
- **Portfolio vs selling is a false split.** For art, the portfolio *is* the sales tool — quiet commerce is how a $2,000 painting sells, not the absence of selling. The "Available / Inquire / Prints / Commissions" are real commerce, just presented softly.
- **The boundary with The Shop is posture, not niche:** *beheld and acquired* (slow, high-consideration, one piece at a time) is Body of Work; *browsed and bought* (many SKUs, scan-and-cart) is The Shop with great photography. A fine-art photographer with a few limited prints is Body of Work; a 200-image print-on-demand shop is The Shop.
- **The maker who's genuinely both** (beholdable work + real print volume) keeps the portfolio as the face and puts volume-selling in a "Prints" sub-page — a more shop-like catalog, even the dense-wall treatment. Portfolio out front, shop in a page.
- **Must stay distinct from The Find.** Both are "browse a collection," and risk becoming Gallery-but-nicer twice. The divergence is posture: The Find is *objects with stories* (tag, provenance, price up front; dense, dark, archival); Body of Work is *images to behold* (quiet commerce, cohesion over placards; light, airy, slow, full-size work with generous space).
- **Moment behavior:** **gates** (the opening is the work plus an artist statement, not a moment surface to melt into).
- **Mockup:** `public/bodyofwork-mockup.html` (Della Quist, painter).
- **Status:** look drafted. A limited-implementation slice (fewer makers) but a genuinely distinct posture, and nearly free to support since it reuses the engine and the same quiet-commerce pieces.

### Niche grounding (storefront archetype by maker)
- **Shop:** most made-goods sellers + digital downloads.
- **Counter:** food, farm, perishable, seasonal-batch.
- **Find:** vintage, antique, curated resale.
- **Body of Work:** painters, photographers, printmakers, illustrators — visual art where the work is the product.

## The Moment — BohdiAI's signature front door

The Moment is not a feature of any one archetype. It is **BohdiAI's signature** — the one thing every site does that a Wix or Squarespace store never would. It is the wow, the same engine on every shape, and the embodiment of the "visibly not AI slop" brand position. One portable engine (already proven by the June's-sourdough story-over-video moment), reused everywhere.

### Behavior

- **Front door only.** Landing on the home/root plays the Moment. 
- **Transition — always cinematic, never a cut.** When the Moment finishes it doesn't stop, it *cinematically transitions* (a slow fade / dissolve) into whatever rests behind it. What it rests into differs by shape: on Main Street it settles into the hero and stays as page content (so a returning front-door visitor still sees a hero, because Main Street's top is moment-shaped); on shapes with their own opening (Counter, Find, Body of Work) it dissolves into that opening — the board, the cabinet, the artist statement — and is gone on return. The Moment engine owns this transition as a designed beat, slow and deliberate per the motion rules. So "Main Street keeps it, the others don't" is not an arbitrary rule — Main Street's resting state simply *is* a hero, and the others' resting state is their own distinctive opening.
- **Cookie + replay.** A **per-shop** cookie marks the Moment seen. First front-door visit → it plays, cookie set. Returning front-door visit with the cookie → straight to the shape. Every storefront footer carries an **"Intro"** link that replays the Moment on demand, so a returning visitor can always see it again.
- **Deep links bypass.** Any direct link to a product or sub-page — a shared URL, a market QR code — **bypasses** the Moment and **leaves the cookie unset**, so that visitor still gets their Moment the next time they come through the front door. The cookie is only set when the Moment is actually shown.
- **Tenant control.** Any maker can turn the Moment off. **Default on**, because it's the wow.

### Monetization
- **Custom video Moment (paid upsell).** The signature Moment is included and good. A maker who wants a real cinematic, custom-shot Moment pays for the premium version.

## Shapes that travel (not storefronts)

### The One — a launch / landing page
The One is **not a storefront**. It is a launch page you point at a single hero offer, deploy on top of whatever store the maker already has, take pre-orders, then retire when the drop is over. Same bones whether it's a book, a hot sauce, a print drop, a holiday box: single hero treated like a poster, the offer, the proof, the buy, with detail spilling into beats/sub-pages.

Because almost every maker has *something* to spotlight at some point, this is broadly useful — far more than a one-product storefront ever would be.

**Backend feature — the maker creates a launch page and picks how loud it is:**
1. **As the Moment** — the launch takes over the front door; every first-time front-door visitor sees the drop before the store. **Temporary by default** (reverts to the normal brand Moment when the drop ends) **but the maker owns the dial** — how long it runs, whether it sticks. This is where the paid custom-video Moment naturally attaches.
2. **Clickable link in the store** — a banner / nav item / hero button; the store stays the front door, the launch is one click in.
3. **Total standalone** — its own URL, not surfaced in the store; for a market QR, an email blast, a social link, an ad. (This is a deep link, so it bypasses the Moment and doesn't burn the cookie — consistent with the rule.)

**Two skins demonstrated** (same archetype, different product): a quiet literary book launch (`public/one-mockup.html`) and a loud vintage-advertising hot-sauce poster (`public/one-hotsauce.html`, bottle drawn as SVG because vintage hot-sauce advertising *is* illustration).

**Education tie-in.** The launch page is a natural Skool / Witsend Breakthroughs training module: how to run a drop — Christmas collectible, once-in-a-lifetime, scarcity as a hook. Education-to-product flywheel.

### The dense wall — a catalog / portfolio page treatment
Gallery's one good bone. Not a homepage hook; a *page* treatment for a catalog or portfolio inside other archetypes (especially The Find and The Body of Work, where browsing many discrete pieces is the point).

### Commission — a CTA mode (already scoped)
Custom / made-to-order is a "request a custom order" CTA riding on top of a storefront, not its own archetype.

## Rotating-inventory weekly intake (Counter & Find)

For the rotating archetypes, the **update flow matters as much as the first build** — maybe more. A vintage curator and a weekly baker rebuild their storefront constantly (new in, sold out, this week's swap). If keeping it current is a chore, they let it go stale and churn.

The platform already has the pieces; they just need to be pointed at a weekly ritual:
- Snap a few phone photos of this week's finds / loaves.
- Bohdi does the labor — writes the tag/provenance/condition/note (Find) or descriptor/notes (Counter), suggests a price, and drops each into the grid in the shop's own style (Claude Vision photo upload).
- Marking something sold is one tap; the SOLD stamp and inventory sync handle themselves (Market Mode log-a-sale).

**Upside in the chore:** it turns maintenance into a *weekly habit with Bohdi*, and that same moment fires the "new arrivals" / "next week's bake list" email. That recurring ritual is the SaaS reason-to-exist — the thing a one-and-done site builder can't offer.

## Open items

- **All four shapes now have a drafted look** (mockups in `public/`). What remains is engine implementation, not look-finding.
- **The Counter mockup is tasteful, not yet wow.** The conventional hero (headline-left/photo-right) and the bottom 3-card teaser grid are the weak spots. The wow is meant to come from the Moment, but the board beat itself can be pushed further (a living board, a real countdown, or a magazine-cover treatment) if we want it louder. Revisit when building.
- **Build sequencing** — none of this is in the engine yet. Order, dependencies, and how the Moment engine is extracted/reused are an implementation-plan question.

## Mockup artifacts (design references, in `public/`)
- `counter-mockup.html` — The Counter (Stall Board), June's Sourdough.
- `find-mockup.html` — The Find (Curated Cabinet), Marrow & Moth.
- `one-mockup.html` — The One, quiet literary book launch.
- `one-hotsauce.html` — The One, loud hot-sauce poster.
- `bodyofwork-mockup.html` — The Body of Work, Della Quist (painter).

(Mockup object photos are stand-ins — local bread/book images where we had them, vintage-graded random photos for The Find. Real generation would use the maker's actual wares.)
