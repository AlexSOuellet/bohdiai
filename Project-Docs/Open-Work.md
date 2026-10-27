# Open Work — everything still to do

**Written 2026-10-13 (Session 102); last updated Session 113 (2026-10-24): Session 112 merged and live; new products start with no stock choice; Saltmarsh's stock set; main's test check fixed; the Free plan, the ladder and the tools decided, built on `feat/backend-tools` (not merged; Alex: "no better and in some ways worse", the backend "does NOT flow"), items 49–52; before that Session 112 (2026-10-22): refunds everywhere, the Events area, market information pages, how a piece is stocked, the scrolling line rule (all on `feat/market-orders`, not merged); before that Session 111 (2026-10-21): the Market plan live, Square cards, haggling and refunds in the market app, the purge; before that Session 108 (2026-10-18), item 3; before that Session 107 (2026-10-17), priority order below; before that Session 105 (2026-10-15): the design lineup reset (makers first; eight families incl. Scenic and Spotlight; custom sites Rose n' Cat, Cut-Pro, Mazzone; one builder; every family sells). See "The lineup" in `Modular-Plan.md`.** One list of every open item: the modular plan, decisions from Session 102, and everything carried over from earlier sessions. Update it as items land; don't let it drift. Order within a group is not priority. Alex sets priority at the start of a session.

## Priority order (Alex, Session 107, 2026-10-17)
0. **TOP (Alex, Session 109, 2026-10-19): makers pay for their plan at sign-up.** There is no way to sign anyone up today. Card on file at sign-up, renewals, receipts, cancel at the end of the term, plan-change emails. The backend's **Settings → Billing** screen exists (Session 109) and shows the next charge from the plan's terms; its card and past charges come with this work. (Separate from item 6, which is makers taking money from *their* customers.)
1. ~~**Scenic and Spotlight finished as real families**~~ Done and live (Session 107). Still open: more scenes for Scenic's library (it has one, the marsh; where the photos come from is Alex's call) (item 6); Paper & Patina is on Spotlight (Session 116).
2. ~~**bohdiai.com samples**~~ Done (Sessions 107–108): /looks is linked from the makers arm, /samples is retired. Kept for the record: (Alex, Session 107) Classic Loafs is the one sample for every mood: **bohdiai.com/looks** is live (the real site in a window, one row of the nine moods, a Computer/Phone switch), not yet linked from the site (with the rework, item 3). Earlier idea, superseded: a handful that look clearly different. Built through the real path (form, `scripts/intake-to-site.ts`, Publish). Known build bugs: **fixed (Session 108)** Vintage's phone name break (the name sizes to its longest word), the empty about frame with no maker photo (every about design leaves it out), Showcase opening buttons pointing at /shop (no target or a page the plan lacks = no button). Still open: preview links that don't open on the live site (item 11).
3. ~~**The whole bohdiai.com site reworked**~~ Done and live (Session 108) (items 10a, 33). **Built and merged (Session 108):** bohdiai.com is the parent; **makers.bohdiai.com** and **service.bohdiai.com** are its arms ("makers" and "service" reserved; the old /makers and /contractors addresses forward to them). Parent: headline, sample window (Classic Loafs → Halfmoon → Paper & Patina → True Coat → Saltmarsh), doors "I make things" / "I fix things", the two real clients (Penny first, then Cut-Pro), story, pledge, and a "Need something else" box. Makers arm (written for an automated build; makers pay when they sign up, so nothing says "built free"): "Your work online, the way you sell it", the looks, the plans built up as three steps (be found / sell at your markets / sell online too), how it works (form, your site, Publish), prices, comparison, custom sites with Penny, questions, and a "Start your site" close with a small question box. Service arm: unchanged content, hand-built voice, "built free". The questions page now answers for automated maker sites; the cancel answer offers Showcase. /samples retired (forwards to makers.bohdiai.com/looks, Session 108); the "how long" answer, same day, confirmed (Alex). **Open:** the makers list (trades marquee) no longer shows anywhere for makers; the charities list was removed with the parent's trades section.
4. **Showcase and Market backends live (Market merged Session 111; Session 112's work merged Session 113; Plan-Backends.md).** Refunds, the Events area, market information pages, how a piece is stocked (a new product now starts with no choice, Session 113), Sold / Order only; Saltmarsh's stock is a realistic mix (Session 113). Open: the pricing cards (testimonials to Market; "Testimonials" and "Take cards at markets" off Full; asked, not answered); define Full; whether option combinations should also start with no stock choice.
4a. **Full, now (Alex, 2026-10-25, Session 114; Plan-Backends.md "Full").** We are building the backend, not payments (Alex): checkout shows no way to pay until a maker sets one up. **Done (Session 114):** Getting paid with Square, Stripe and PayPal sections (Connect buttons; Stripe's connection waits for payments); PayPal connect/checkout/refunds in test mode only (not live: no keys in Cloudflare; PayPal's sandbox also needs PayPal support to enable Partner Referrals; partner approval is Alex's application, when payments start); Try on a look; opening photo on Headline; Background screen (own background + Scenic from the whole library); `site_backgrounds`; whole-piece photos; Owner login. **Built (Session 115, `feat/buyer-accounts`, not merged):** buyer accounts: Account in every Full site's menu (families, Scenic, the nursery); sign in, make an account, forgot password, My account with orders, each order's page, Reorder on a paid order; orders placed while signed in land in My account; one shared password across shops (Alex), but each shop gives its own sign-in pass, so a buyer's sign-in never opens another shop or a backend; the Buyers screen (her on/off switch, starting on; her buyers with orders and spend); the step-down screen says how many buyers lose sign-in; Show / Hide on every password box. `tenants.buyer_accounts_on` (approved: Full only). **Waits for Alex's backend redesign** (he said Buyers under Online shop isn't intuitive; he is designing the new backend), then merge. **To do:** PayPal on Getting paid for Market sites, downloads delivered (with payments).
4a-i. **Mood-proof build rules (agreed Session 114, write into Modular-Plan):** opening photos have no words or logos; wide and large with the subject marked; scenes and own background separate (done); words fit the tightest mood; the builder screenshots the opening in all nine moods and flags problems before handover.
4b. **NEW, held until Full is done (Alex, 2026-10-25; Session 113): the backend's flow, the Free plan and the tools (items 49–52).** Alex: the whole backend is "utterly underwhelming... it does NOT flow"; the Free build on `feat/backend-tools` "is no better and in some ways worse". **First: ask Alex what felt worse.**
5. **Alex's admin** (item 36), moved up.
6. **Card payments:** ~~Square in the market app~~ done and live (Session 111; item 21). Still to do: online card checkout on Full (Square and/or Stripe), Square refund notices so a refund done in Square shows up on its own (Alex: later), then sales tax (item 15). Market discounts (item 16) are partly covered by Change price at the table.
7. **The market app done right**: the biggest marketing push (items 17–20).
8. **Plans:** the gallery, the Showcase backend, the cancel flow, the plan rename (items 23–26).
9. ~~**Delete the old samples and test drafts**~~ Done (Session 111): 42 sites purged (items 10d, 48). Kept: everything on bohdiai.com, Saltmarsh, Rose n’ Cat, Cut-Pro, Mazzone, Soul Splatter.
10. **Added sections** (item 5; Alex: good idea, keep).
11. **Cut-Pro and Mazzone onto the homes** (item 8). Rose n' Cat already is: its page record holds only its design.
12. **Intake build on its own, checks, the approve switch** (items 11–14). Lower: the hand-run intake script is the same path the automation will use, and Alex wants to build sites by hand first.
13. **Old code clean-up** (item 10). Also: the old Scenic pieces code (`ScenicPieces`, `scenic-styles`), unused since Scenic is drawn by the shoreline design (Session 111).
14. The rest of the platform (items 35, 37–43).

Decided the same day: a maker's saves go live at once (the shop reads the database directly; products keep their own draft/live switch). No Unpublish button for makers; cancelling takes the site down (item 24). Switching a site through every family is dropped (item 9): Alex has not said makers can switch designs. Rustic Rhody is a test site and may come back as a sample. Open question for Alex: does Vintage still get its ornament and paper from real art (item 7)? `vintage-test` goes to deleted either way.

## Make content modular (the operative plan: `Modular-Plan.md`)
1. Safeguards (done 2026-10-13, Session 103):
   - [x] Alex approves every database change (explained in chat first; a hook stops at the moment a change is applied)
   - [x] page records hold settings only (database rule on page records and editor drafts)
   - [x] tests block content read from the wrong place and hardcoded words (their list of known offenders can only shrink)
   - [x] the rules go in the session instructions (CLAUDE.md)
2. Homes for family-only content (homes built, Session 103): moment, founder quote and portrait, marquee, closing line, contact intro, section headings. All photos become proper uploads.
   - [x] the homes and their code, read and saved, with tests (2026-10-13, Session 103): section words for every site, the moment and its photos, and the founder quote, portrait and marquee in About you
   - [ ] the screens to fill them come with step 3, when the designs read from them (About you's quote, portrait and marquee screen done, Session 104; Alex: looks first, screens later)
   - [x] settled (Alex): the line at the top of the page is never edited from About. Don't raise it again. **Enforced (Session 109, 2026-10-19; Alex: "headline and short line should NEVER be in about"):** About you has no Headline or short-line box; the Headline screen (the moment's headline and the line under it) is the only place; the backend Home reminder points to Headline; the sign-up build no longer drafts About-you's short line or headline. The stored `site_profiles.kicker`/`headline` are left only for the older hand-built designs that show them
   - [ ] each design's suggested headings, copied into a new site's section words
   - [ ] product photos that are only a web address exist only on the old family samples; nothing live writes them
3. Family designs read from the homes, show sales, follow the three plans, and get the cart, order request and market page.
   - [x] family pages read every piece from the homes; old samples keep their page record until clean-up (Session 103)
   - [x] proof: `aurora-candles-homes`, a draft copy of aurora-candles made with `scripts/copy-family-sample.ts`, matches the sample word for word (throwaway; delete at clean-up)
   - [ ] **next:** the maker-backend screens for the moment, section words, and About you's quote, portrait and marquee (the build fills them, the maker edits them)
   - [x] each family's empty messages and fallback link words come out of the code (they are the site's own words since Session 104)
   - [x] (merged in the big push, 2026-10-16) every family follows the plans (Alex, 2026-10-15): Showcase never has a shop page or prices; Market shows prices and an "Ask about this" button, and the market app takes payments at markets (the market page); Full adds the cart, the only way to buy online (a working "Add to cart", today a dead button, the cart page and order request). Running sales show on Full. Today only Shoreline and the nursery design do this
   - [x] decided 2026-10-15 (Alex): drop the made-up "4.9 out of 5, 180+ customers" line. Sites built from the homes already don't show it; it goes with the old samples
4. Newer designs read their headings from the homes instead of code. About you's `about_title` moves into the section words too, so the about heading has one home.
   - [x] no word is written into the code (Alex, 2026-10-14, "buttons too"): every design and shop word lives per site in `site_words` (Session 104). Headings are there too for now; moving the newer designs' headings into `site_sections` (so they survive a design switch) is still this item
   - [ ] words still in code, "fine for now" (Alex 2026-10-14): the privacy and terms templates, server error messages (estimate, contact, order, market), the payment app names (Venmo, Cash App, Zelle), symbols (the dash before a signature, the discount's minus, arrows)
   - [ ] a new site's words are written when it's built, as part of its content file in the one builder (item 10b)
   - [ ] a backend screen for a site's words (Alex: not now)
5. Added sections (plug-ins):
   - every design publishes its look and has plug-in spots
   - the first shared sections: text block, testimonials, FAQ, gallery, market dates, booked-days calendar, video, sale banner, price estimator
   - each one is tested in every design
6. Backgrounds are part of the skin (decided 2026-10-15). The six families use textures; on Scenic the maker picks the photo from the scene library or provides their own. The library is built (Session 107): photos in `public/scenes/`, listed in `lib/archetypes/main-street/scenes.ts`, each site's pick in `site_scenes` (a library scene or the maker's upload). It has one scene, the marsh. A Scenic site's photo can be light or dark (dark turns the opening's lettering light) and can have a short muted clip looping over it (`site_scenes.tone`, `video_upload_id`; Session 107). Classic Loafs uses its own clip, dimmed. **Done (Session 107, Alex):** every Scenic build makes its own photos (three, `--scenes 2-4`) from the maker's words and adds them to the scene library, now a database table (`scenes`), tagged and searchable by any word; `scripts/make-scenes.ts <site>` does it for an existing site. Classic Loafs has four in the library. The marsh is only the family's preview picture now. **Open:** a backend screen for the maker to search the library and pick (with the maker-backend screens).
   - **To build (Alex, 2026-10-19): every build makes three backgrounds, whatever the family,** and adds them to the library, so any site shown in Scenic (try on a look on Full, the looks page) has its own background and never falls back to the marsh, which doesn't work. Three for now, until the library is big enough to pick from instead. Sample sites and test drafts get theirs by hand with `scripts/make-scenes.ts` (three, into the library) when needed; no real site is on a family yet.
7. New families (decided 2026-10-15; replaces Coastal and Sweet):
   - [x] Saltmarsh's Shoreline design becomes **Scenic** (live, Session 107): a photo locked behind the page, content floating over it; skins Saltmarsh (its first, from Saltmarsh's colors and fonts), Porcelain, Conservatory, Celestine, Atelier. Saltmarsh itself stays on its own design
   - [x] (live, Session 107; skins Reel, Hearthstone, Anvil, Nightshade, Marquee, Broadside. **Done (Session 116, Alex):** Paper & Patina moved onto Spotlight in place, on Showcase (scripts/convert-card-site.ts).) Paper & Patina's Showreel design becomes **Spotlight**: one piece per full screen, bold color panels, the market-dates ticker, as section styles in the family engine. Alex (2026-10-15): keep the hero, the market-dates ticker and the big images; the text is too large; try two pieces to a row. First, try a shop page and product page on Paper & Patina locally for Alex to see (it was built as Showcase)
   - skins: colors and fonts designed together; handmade touches (lace, frames) are custom-site only
   - the nursery design stays Rose n' Cat's custom design, not a family
   - **Vintage** (Alex, 2026-10-15; inspired by decoupage): in progress on `feat/vintage-family`. Playbill opening, apothecary-tag pieces, cabinet card, specimen drawers, ticket stubs, postcards; skins Playbill (default), Apothecary, Parlor (pre-references, may go), Heirloom, Postmark, Curiosity; mottled-parchment background with filigree bands. Alex: "better" but the art falls short of what he imagines. **Next: rebuild the ornament and paper from real art** (Alex's own vintage papers if he has them, else copyright-free Victorian scans he picks). Test draft `vintage-test`
8. Cut-Pro and Mazzone fit the homes (narrowed 2026-10-15; contractors set aside until their own leg):
   - homes for exactly what those two show, nothing for contractors in general
   - photos as uploads
   - an estimate inbox
   - move both over, with Alex checking each before and after
9. ~~Prove it by switching a site through every family~~ Dropped (Alex, 2026-10-17): makers are not offered design switching.
9a. **Try on a look, Full only (Alex, 2026-10-17, later the same day; replaces the drop above for Full):** a maker on Full can try their own site in another family and skin from their backend, then keep the one they like. Needs: the try-on locked to the site's owner (today `?previewMood`/`?previewLook` work for anyone, changing nothing); a keep step that switches the site's family and skin (and on Scenic, its photo); and proof that every piece lands right in every family. Not on Showcase or Market. A maker who steps down from Full keeps the look they chose (Alex agreed: the upgrade is charged for the rest of the period and the downgrade waits for renewal, so bouncing up for a look is a paid change, not a loophole). Built with the maker-backend screens (priority 4, Alex).
10. Clean up: delete the old family samples (and the `aurora-candles-homes` proof copy), the old page-record code, the old build tools, the Torch design, and the `explore/bulletin-scene-look` branch, if it still exists.
10a. Take down (plain list to Alex first): Ember & Pine (and the Torch design), and bohdiai.com's contractor page, prices, FAQ section and contractor portfolio entries. **The contractor sites stay (Alex, 2026-10-16):** Halfmoon and True Coat come off bohdiai.com for now, the sites themselves are kept. **Corrected (Alex, 2026-10-17):** nothing service comes off bohdiai.com; Alex meant the emphasis comes off service, not removal. bohdiai.com becomes a parent with two arms: makers.bohdiai.com (pushed first) and service.bohdiai.com (complete, quiet until pushed). Halfmoon and True Coat stay, and cycle in the parent's sample window.
10f. **Old samples converted in place, on Full (Session 106, Alex):** aurora-candles, walnut-and-oak, twilight-to-darkness, living-beauty, soul-splatter, knotty-knits, cleanme, heavenly-scents (and Classic Loafs). Removed (marked deleted, for Alex's purge): sheris-dips, soul-splatter-bright, lenticular-lumens, estate-sales-of-new-england, aurora-candles-homes, classic-loafs-homes. Every page's words matched except the cart; heavenly-scents lost the made-up "4.9 out of 5" line (its reviews stay); soul-splatter's weekday-only markets didn't move. Their written search titles/descriptions in the old page records were lost in the conversion. Search details for every newer-format site now come from the homes (`lib/storefront/seo-homes.ts`): title from what they make, description from the line under their name, share picture from the opening photo or first piece. Still on the old format: the four contractor sites (need homes first).
10e. **Classic Loafs stays as the Cozy sample (Alex, 2026-10-16):** converted in place onto the homes with `scripts/convert-family-sample.ts classic-loafs --plan full` (replaces the copy tool; no copies), on Full; every page's words match the old site except the new Cart and Add to cart. Its markets are July dates, past.
10d. **Clean-up plan (Session 106, Alex):** new bohdiai.com samples, one per family, each built through the real path (form, builder, Publish); then the work page switches to them; then the old samples and test drafts are deleted and purged (`scripts/purge-deleted-sites.ts --yes`, Alex runs it; it removes everything from deleted sites). 28 already-deleted sites are waiting for that purge.
10b. **One builder for every new site** (built Session 105, item 46): a content file (every word included) plus family and skin (and the photo on Scenic); fills every home and uploads the photos. Replaces the card, nursery and contractor build tools, the family copy tool and the old onboarding builder.
10c. Rustic Rhody is a test site (Alex, 2026-10-17); it may be rebuilt as a sample. Then the Bulletin design goes.

## Automated build, then self-serve (`Modular-Plan.md` section 7)
11. Build by hand first. Then automate one step at a time:
    - intake form: built (Session 106, branch `feat/maker-intake`): bohdiai.com/start takes name, business, email, what they make, 5 to 10 pieces (one photo each), about, an optional photo of them, the plan they signed up on (the pricing page's maker buttons open the form with the plan and monthly or yearly filled in), and a mood (one tile per family, read from the family list in the code, so every new family appears on its own); saved to `intakes` + `intake_pieces`, photos in the private `intake-photos` bucket, Alex emailed; its words in `intake_words` (`scripts/intake-words.ts`). A submission becomes a private preview site with `scripts/intake-to-site.ts <intake-id> --subdomain <s> --skin <skin> [--family <f>] --build` (Session 106): the maker's words go in as written, Claude drafts the rest from their words and photos (`lib/build/intake-drafts.ts`), buttons and labels are copied from a family site; Showcase pieces become the gallery. The maker makes their account on the form (email + their own password; an email that already has an account needs its password); the build makes them the owner and emails them to sign in at app.bohdiai.com, no expiring link (Session 106). The maker puts it live with the Publish button on their backend home (Session 106; its "View my site" link is made on the live site, so it opens; no Unpublish for makers: cancelling takes a site down (Alex, 2026-10-17); a maker's later saves go live at once). Open: preview links printed by the build scripts don't open on the live site (the Worker's preview secret doesn't match `.env.local`; older drafts fail the same way). Fixed (Session 108): Vintage's long names on phones, the empty about frame with no maker photo
    - AI first drafts
    - the maker picks a family from their own content
    - the maker picks a skin (and, on Scenic, a library photo or their own)
    - the moment
12. "Alex approves" switch: on while curating, off for same-day self-serve signup and payment.
13. Automatic quality checks: content fits, nothing empty, photos usable.
14. Appropriate-content checks:
    - terms and an acceptable-use list
    - AI review of words and photos at build time and on every later edit, with flagged content held for Alex
    - a "report this site" footer link
    - a suspend switch
    - payment fraud screening

## Market app
15. Sales tax:
    - the seller's home rate
    - a rate per market via a state picker, editable
    - tax included or added on top
    - every sale records its tax and state
    - results show tax per state
16. Market discounts set by the seller: one percent per market, changeable per piece. **Change price at the table (haggling) is built (Session 111):** each line of a sale can take an agreed price below the marked one; the order keeps the marked price and the difference ("Price agreed at the table"); How it sold shows "Haggled off".
17. A Publish step on the market setup page.
18. Holds become baskets (decided 2026-10-13):
    - several pieces, one payment, one ticket
    - one open basket per phone
    - a 10-minute timer by default, which the maker can change
    - Paid stops the clock
    - the maker can release a hold and sell the piece in one tap
19. Market POS works without signal:
    - the home-screen app keeps a saved copy of today's market
    - sales are saved on the phone and sent when signal returns
    - a "waiting to send" count is always shown
    - cards follow Square's own offline rules
    - online/booth double sales are flagged on sync
20. Retire the old Today and Sell screens.
21. Card payments through Stripe and Square, online and in the market app (Alex, 2026-10-17). **Refund on every paid sale wherever it shows (Session 112, on the branch).** **Square in the market app: done and live (Session 111).** Connect Square (Square’s page; keys in `square_connections`, server-only, scrambled with `SQUARE_TOKEN_KEY` from Cloudflare; read-only permissions), pick the location, Disconnect; Card opens the Square app (tap, insert or typed in), recorded only when Square confirms the exact total; Android returns on its own; refunds recorded in BohdiAI (Refund on the market day). Alex proved it with a $1 sale. Still to do: online card checkout (Full), Square refund notices (later).
22. Research follow-ups (`Project-Docs/research/Maker market app competitors.md`):
    - test the Venmo and Cash App pre-filled amounts on real phones
    - look at TallyTill hands-on
    - watch real buyers at a booth

## Plans and gallery (decided 2026-10-13)
23. The gallery is built from the catalog plus other photos:
    - Showcase: the maker adds their full catalog, and the site displays 12 pieces with no prices (Alex, 2026-10-15)
    - which 12 show (Alex, 2026-10-19): the maker picks them and can swap any time; until they pick, the site shows their newest 12. No random shuffle (a piece a visitor saw could vanish, and Showcase has no shop page to find it again)
    - Market and Full get the same gallery, where tapping a for-sale piece opens its page
    - sold pieces stay
24. Canceling offers Showcase for the off-season, as an option only, never an automatic drop (Alex, 2026-10-17). Turning it down takes the site down; makers get no Unpublish button:
    - everything is kept and hidden
    - open orders and holds are settled first
    - market QR codes land on the home page
    - promotions pause
25. A minimal backend for Showcase (not designed). Contractor Lead Generation is set aside with contractors (2026-10-15).
26. Rename the middle plan from "lite" to "market" in the code.
26a. Free sites (Session 106, Alex): `tenants.plan_comp` is `free` (nothing to pay on any plan: Cut-Pro, Mazzone, Rose n' Cat) or `showcase` (Showcase free, Market and Full at their normal price), with a private note; set with `scripts/plan-comp.ts` until Alex's dashboard has a screen. The plan screen says "Free for you" and plan changes charge the right amount. Later (Alex): a one-month Market trial, or a percent off, as more kinds of this setting

## Saltmarsh and the demo
26b. **Saltmarsh's stock (Session 112, Alex to decide):** all 20 pieces were blank (made to order), so all 20 show Order only now. Set each to one of a kind or a count (Alex's call; demo data is his), or change the rule.
27. [x] Demo dates move by whole weeks, so Saturdays stay Saturdays; today's market stays today (Session 104)
28. [x] Today's market shows in "Find me at" (visitors don't see markets marked finished; Session 104)
29. [x] Saltmarsh design work (Session 104): a "Visit the shop" button under the opening (Alex: the demo's opening shows what a site can be, no pieces in the sky), Lena's portrait on the story card, plain-font prices, a lighter phone header, readable collection buttons, shorter gaps
29a. [x] Fixed (Session 111): the demo timer put today’s market a week ahead when the weekly and daily moves landed the same night; today’s market is now always put on today (`scripts/check-demo-market-today.mjs`).
30. The public demo:
    - **before the personal copies (Alex, 2026-10-21):** Saltmarsh’s products get Alex’s own photos, once he has tested Full (several photos per piece); changes to Saltmarsh are permanent until then
    - personal copies
    - a welcome page that requires an email
    - every payment simulated
    - the Learn explainers
    - open question: morning sales in the demo start

## Other sites
31. Rustic Rhody: a test site, may come back as a sample (item 10c).
32. (Dropped 2026-10-15: True Coat is switched off.)
33. bohdiai.com gets new sample sites (Alex, 2026-10-15; 2026-10-17: a handful, not every family, Alex picks; the whole bohdiai.com site is reworked), built on the families with the one builder, before the old family samples are deleted (its hero and samples page show them today, with stale July market dates).
34. Waiting on others, not ours to push:
    - Rose n' Cat: Renee's payment handles, real names and prices (she accepted her invite and signed in 2026-10-08)
    - Joe: his feedback, and switching estimate emails to him
    - Cut-Pro: follow-ups are on them

## Platform
35. Staging: its own test domain, its own database, and the root domain as a setting.
36. Alex's dashboard:
    - view any site as its client
    - statistics
    - demo runs and checkups
    - invites and password resets
    - messages
    - FAQs and content
    - a "contact support" link on client sites
    - reports from "report this site"
    - the suspend switch
37. Invites: talk it through (`fix/auth-link-24h` parked).
38. Video: price Cloudflare Stream, then build.
39. Custom domains and a status panel.
40. ~~Analytics~~ Built and live (Session 110): Cloudflare's cookie-free counter, the backend home's Visitors section on every plan, Full's months kept; the privacy line fixed. **Waiting on Alex: the Cloudflare key** (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ANALYTICS_TOKEN).
41. Contractor Lead Generation backend: set aside until contractors come back as their own leg (2026-10-15).
42. Cloudflare cleanup with Alex:
    - the redundant Cut-Pro route
    - trim the build variables
    - cancel Vercel and delete the old proxy
43. Maker checkup (`feat/maker-checkup` pushed, not merged). Session 113 (Alex): it belongs beside the public Maker's Toolkit (item 51).
44. Spotlight trial (merged in the big push, 2026-10-16): Showreel work two to a row, quieter text, shop and piece pages when the catalog is on. Alex likes it "ok", isn't into very large product photos; three to a row only if people complain. Private test copy `paper-and-patina-trial` (draft, its own photo copies) stays until the selling work.
45. Family plans (merged in the big push, 2026-10-16): Full cart, Add to cart, sales, market page and Showcase rules on every family; cart and market words loaded on all family sites. Fixed (Session 108): a button with no target, or one pointing at a page the site's plan doesn't have, is left out (no guessed /shop or /contact). Test copy `aurora-candles-homes` now has its market page switched on.
47. Vintage family: see item 7. Merged in the big push (2026-10-16); its intake-form tile words are loaded.
48. ~~Test drafts to delete at clean-up~~ Purged (Session 111).
46. One builder (merged in the big push, 2026-10-16; turns intake submissions into sites since Session 106): `scripts/build-site.ts <site> --media <dir>` builds a new site on any family or the shoreline/show reel page from one content file (`lib/build/site-plan.ts` checks it whole first); a new site's starting words: `scripts/site-words.ts dump <site> <prefix> [shop]`. Proof site `aurora-built` (draft) matches `aurora-candles-homes` word for word. Still to do: retire the card, nursery and contractor build tools and the family copy tool at clean-up; re-runs (it builds new sites only; an existing site is changed in its backend).
49. **The Free plan** (Alex, Session 113; Plan-Backends.md "Free"): a dashboard only, products for analysis, results saved on products and events. **Database applied** (Free in `tenants.plan`/`plan_next`; `product_costs`, `product_cost_items`, `event_takings`). **Built on `feat/backend-tools` (pushed, not merged)**: Free's switches, Free's Home (steps and numbers), costs on products with the suggested price and a below-cost warning, Market day on events, the products list flag. Preview site Juniper Hollow Candles (`juniper-hollow`, draft, Alex's login). Alex: "no better and in some ways worse". Open: what to change (ask Alex), Free's sign-up (with paying at sign-up), a product limit, Free on the pricing pages.
50. **The backend's flow** (Alex, Session 113): organize around what a maker is doing, not where things are stored; each plan gets its own first steps, then its everyday Home (Plan-Backends.md "The ladder"). Proposed: Home that leads, every save points to the next thing, edit the site on the site (click-to-edit, replacing Headline / About you / Scrolling line / Contact / Socials), events as before / the day / after, a menu of jobs. Not started beyond Free; Alex to say what didn't work.
51. **The tools** (Alex, Session 113; Plan-Backends.md "The tools"): Cost to make, Price it, Market day built in the backend on `feat/backend-tools`. To add: is this market worth it, monthly goal, shipping, taxes to set aside, which pieces earn (paid), what to bring (Market), description writer (no fetching Etsy on our server; no AI talk on the makers arm). **The public toolkit page** (`makers.bohdiai.com/tools` suggested; Alex hasn't said where or whether the header links it), free and open, beside the checkup (item 43). Alex's call: the Other costs double count (card and booth fees counted twice for Etsy and website prices). A video on the ladder (Alex).
52. **After every push, check the `test` check run too, not only Workers Builds** (Session 113: main's tests failed unseen from 2026-10-21 to 2026-10-24 on Square coverage; fixed, `lib/` branch coverage 91.3% on the branch, 90.89% on main).
