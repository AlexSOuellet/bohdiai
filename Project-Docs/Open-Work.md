# Open Work — everything still to do

**Written 2026-10-13 (Session 102); last updated Session 105 (2026-10-15): the design lineup reset (makers first; eight families incl. Scenic and Spotlight; custom sites Rose n' Cat, Cut-Pro, Mazzone; one builder; every family sells). See "The lineup" in `Modular-Plan.md`.** One list of every open item: the modular plan, decisions from Session 102, and everything carried over from earlier sessions. Update it as items land; don't let it drift. Order within a group is not priority. Alex sets priority at the start of a session.

## Make content modular (the operative plan: `Modular-Plan.md`)
1. Safeguards (done 2026-10-13, Session 103):
   - [x] Alex approves every database change (explained in chat first; a hook stops at the moment a change is applied)
   - [x] page records hold settings only (database rule on page records and editor drafts)
   - [x] tests block content read from the wrong place and hardcoded words (their list of known offenders can only shrink)
   - [x] the rules go in the session instructions (CLAUDE.md)
2. Homes for family-only content (homes built, Session 103): moment, founder quote and portrait, marquee, closing line, contact intro, section headings. All photos become proper uploads.
   - [x] the homes and their code, read and saved, with tests (2026-10-13, Session 103): section words for every site, the moment and its photos, and the founder quote, portrait and marquee in About you
   - [ ] the screens to fill them come with step 3, when the designs read from them (About you's quote, portrait and marquee screen done, Session 104; Alex: looks first, screens later)
   - [ ] the line at the top of the page and the sentence under the name have two homes (About you for the newer designs, the moment for family designs). Alex: the About screen must never change the top of the page. Not fixed; talk it through with Alex before touching it
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
6. Backgrounds are part of the skin (decided 2026-10-15). The six families use textures; on Scenic the maker picks the photo from the scene library or provides their own. Build the scene photo library for Scenic.
7. New families (decided 2026-10-15; replaces Coastal and Sweet):
   - Saltmarsh's Shoreline design becomes **Scenic**: a photo locked behind the page, content floating over it. Saltmarsh's colors and fonts become its first skin
   - Paper & Patina's Showreel design becomes **Spotlight**: one piece per full screen, bold color panels, the market-dates ticker, as section styles in the family engine. Alex (2026-10-15): keep the hero, the market-dates ticker and the big images; the text is too large; try two pieces to a row. First, try a shop page and product page on Paper & Patina locally for Alex to see (it was built as Showcase)
   - skins: colors and fonts designed together; handmade touches (lace, frames) are custom-site only
   - the nursery design stays Rose n' Cat's custom design, not a family
   - **Vintage** (Alex, 2026-10-15; inspired by decoupage): in progress on `feat/vintage-family`. Playbill opening, apothecary-tag pieces, cabinet card, specimen drawers, ticket stubs, postcards; skins Playbill (default), Apothecary, Parlor (pre-references, may go), Heirloom, Postmark, Curiosity; mottled-parchment background with filigree bands. Alex: "better" but the art falls short of what he imagines. **Next: rebuild the ornament and paper from real art** (Alex's own vintage papers if he has them, else copyright-free Victorian scans he picks). Test draft `vintage-test`
8. Cut-Pro and Mazzone fit the homes (narrowed 2026-10-15; contractors set aside until their own leg):
   - homes for exactly what those two show, nothing for contractors in general
   - photos as uploads
   - an estimate inbox
   - move both over, with Alex checking each before and after
9. Prove it: a fresh site in cozy, built with the one builder, switched through every family (Scenic and Spotlight included) and plan.
10. Clean up: delete the old family samples (and the `aurora-candles-homes` proof copy), the old page-record code, the old build tools, the Torch design, and the `explore/bulletin-scene-look` branch, if it still exists.
10a. Take down (plain list to Alex first): Halfmoon, True Coat, Ember & Pine, and bohdiai.com's contractor page, prices, FAQ section and True Coat portfolio entry.
10b. **One builder for every new site** (built Session 105, item 46): a content file (every word included) plus family and skin (and the photo on Scenic); fills every home and uploads the photos. Replaces the card, nursery and contractor build tools, the family copy tool and the old onboarding builder.
10c. Rustic Rhody moves onto a family; then the Bulletin design goes.

## Automated build, then self-serve (`Modular-Plan.md` section 7)
11. Build by hand first. Then automate one step at a time:
    - intake form: built (Session 106, branch `feat/maker-intake`): bohdiai.com/start takes name, business, email, what they make, 5 to 10 pieces (one photo each), about, an optional photo of them, the plan they signed up on (the pricing page's maker buttons open the form with the plan and monthly or yearly filled in), and a mood (one tile per family, read from the family list in the code, so every new family appears on its own); saved to `intakes` + `intake_pieces`, photos in the private `intake-photos` bucket, Alex emailed; its words in `intake_words` (`scripts/intake-words.ts`). A submission becomes a private preview site with `scripts/intake-to-site.ts <intake-id> --subdomain <s> --skin <skin> [--family <f>] --build` (Session 106): the maker's words go in as written, Claude drafts the rest from their words and photos (`lib/build/intake-drafts.ts`), buttons and labels are copied from a family site; Showcase pieces become the gallery. The maker makes their account on the form (email + their own password; an email that already has an account needs its password); the build makes them the owner and emails them to sign in at app.bohdiai.com, no expiring link (Session 106). The maker puts it live with the Publish button on their backend home (Session 106; its "View my site" link is made on the live site, so it opens; taking a site private again isn't there yet; Alex: that's temporary, an "Unpublish" beside it is still to build). Open: preview links printed by the build scripts don't open on the live site (the Worker's preview secret doesn't match `.env.local`; older drafts fail the same way); Vintage's opening breaks a long business name mid-word on phones; a family's about card shows an empty frame when the maker sends no photo
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
16. Market discounts set by the seller: one percent per market, changeable per piece.
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
21. Square card payments on Market and Full (Alex has the developer account).
22. Research follow-ups (`Project-Docs/research/Maker market app competitors.md`):
    - test the Venmo and Cash App pre-filled amounts on real phones
    - look at TallyTill hands-on
    - watch real buyers at a booth

## Plans and gallery (decided 2026-10-13)
23. The gallery is built from the catalog plus other photos:
    - Showcase: the maker adds their full catalog, and the site displays 12 pieces with no prices (Alex, 2026-10-15)
    - Market and Full get the same gallery, where tapping a for-sale piece opens its page
    - sold pieces stay
24. Canceling offers Showcase for the off-season:
    - everything is kept and hidden
    - open orders and holds are settled first
    - market QR codes land on the home page
    - promotions pause
25. A minimal backend for Showcase (not designed). Contractor Lead Generation is set aside with contractors (2026-10-15).
26. Rename the middle plan from "lite" to "market" in the code.
26a. Free sites (Session 106, Alex): `tenants.plan_comp` is `free` (nothing to pay on any plan: Cut-Pro, Mazzone, Rose n' Cat) or `showcase` (Showcase free, Market and Full at their normal price), with a private note; set with `scripts/plan-comp.ts` until Alex's dashboard has a screen. The plan screen says "Free for you" and plan changes charge the right amount. Later (Alex): a one-month Market trial, or a percent off, as more kinds of this setting

## Saltmarsh and the demo
27. [x] Demo dates move by whole weeks, so Saturdays stay Saturdays; today's market stays today (Session 104)
28. [x] Today's market shows in "Find me at" (visitors don't see markets marked finished; Session 104)
29. [x] Saltmarsh design work (Session 104): a "Visit the shop" button under the opening (Alex: the demo's opening shows what a site can be, no pieces in the sky), Lena's portrait on the story card, plain-font prices, a lighter phone header, readable collection buttons, shorter gaps
30. The public demo:
    - personal copies
    - a welcome page that requires an email
    - every payment simulated
    - the Learn explainers
    - open question: morning sales in the demo start

## Other sites
31. Rustic Rhody moves onto a family (item 10c); its hero question goes with it.
32. (Dropped 2026-10-15: True Coat is switched off.)
33. bohdiai.com gets new sample sites (Alex, 2026-10-15), built on the families with the one builder, before the old family samples are deleted (its hero and samples page show them today, with stale July market dates).
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
40. Analytics: decide on a cookie-free visit counter, and fix the privacy page's analytics line.
41. Contractor Lead Generation backend: set aside until contractors come back as their own leg (2026-10-15).
42. Cloudflare cleanup with Alex:
    - the redundant Cut-Pro route
    - trim the build variables
    - cancel Vercel and delete the old proxy
43. Maker checkup (`feat/maker-checkup` pushed, not merged).
44. Spotlight trial (merged in the big push, 2026-10-16): Showreel work two to a row, quieter text, shop and piece pages when the catalog is on. Alex likes it "ok", isn't into very large product photos; three to a row only if people complain. Private test copy `paper-and-patina-trial` (draft, its own photo copies) stays until the selling work.
45. Family plans (merged in the big push, 2026-10-16): Full cart, Add to cart, sales, market page and Showcase rules on every family; cart and market words loaded on all family sites. Still open: on Showcase a family opening's buttons can still point at /shop (the opening's button targets come from the site's moment; the builder must only offer pages the plan has). Test copy `aurora-candles-homes` now has its market page switched on.
47. Vintage family: see item 7. Merged in the big push (2026-10-16); its intake-form tile words are loaded.
48. Test drafts to delete at clean-up: `paper-and-patina-trial`, `aurora-built`, `vintage-test`, `aurora-candles-homes`, `claude-test-decoupage` (and its intake).
46. One builder (merged in the big push, 2026-10-16; turns intake submissions into sites since Session 106): `scripts/build-site.ts <site> --media <dir>` builds a new site on any family or the shoreline/show reel page from one content file (`lib/build/site-plan.ts` checks it whole first); a new site's starting words: `scripts/site-words.ts dump <site> <prefix> [shop]`. Proof site `aurora-built` (draft) matches `aurora-candles-homes` word for word. Still to do: retire the card, nursery and contractor build tools and the family copy tool at clean-up; re-runs (it builds new sites only; an existing site is changed in its backend).
