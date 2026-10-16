# BohdiAI Modular Plan

**Rewritten 2026-10-13 around Alex's actual goal. Status (Session 105, 2026-10-15): steps 1 and 2 done; step 3 underway (family pages read from the homes); no word is written into the code. Session 105 reset the design lineup (see "The lineup" below): makers first, eight families (the six plus Scenic and Spotlight), three custom sites, one builder for every new site, and every family can sell. The order of work is proposed at the end, for Alex to confirm. See `Open-Work.md` for each item.**

## The lineup (decided 2026-10-15, Session 105)

**Makers first.** BohdiAI concentrates on makers and grows that side. Contractors come back later as their own marketing leg, with their own landing page, and likely with the marketing services they need (a contractor wants the phone to ring, and that field is crowded). Until then bohdiai.com stops selling to contractors.

**A standard site is a family and a skin.**
- **Family** is the layout: how the products show, how the collections show, where the About sits, how the market dates show, the order of the sections, the menu style.
- **Skin** is the colors, fonts and background (each of today's 29 skins already carries colors and fonts), designed together and named. Variety grows by adding skins.
- **The background is part of the skin.** The six families sit on textures (linen, burlap, smoke, marble, confetti, concrete). Scenic is the only family with a photo behind the page: on Scenic the maker picks the photo from the scene library or provides their own.
- Handmade finishing touches (lace edges, matted frames, window frames) are **custom-site only**. Most makers want a site that sells their work, not lace.
- Family names don't have to be moods. They name what the site does or feels like.

**The families (eight):** cozy, rustic, dark, elegant, cheerful, modern, plus:
- **Scenic**, from Saltmarsh's Shoreline design. Its bones: a photo locked behind the page with the content floating over it. Saltmarsh's colors and fonts become one Scenic skin, with the marsh photo as its photo. The family is not about the shore.
- **Spotlight**, from Paper & Patina's Showreel design. Its bones: each piece fills the screen one at a time, with bold color panels between and a scrolling market-dates ticker. Its section styles join the family engine as new choices, and Spotlight picks them.

More families are added as BohdiAI grows. A good custom shape can become a new family. **Vintage** (Alex, 2026-10-15, inspired by decoupage) is the first one added this way: Victorian printed ephemera with section styles of its own (playbill opening, apothecary tags, cabinet card, specimen drawers, ticket stubs, postcards), in progress on `feat/vintage-family`; its ornament and paper are to be rebuilt from real art.

**Custom sites** (handmade, a paid option for makers who want one; content still lives in the same homes): Rose n' Cat (the nursery design stays hers), Cut-Pro and Mazzone. Cut-Pro and Mazzone are already built; they get homes for exactly what they show, so they fit the structure, and nothing is built for contractors in general. If they need customizing later, we deal with it then.

**Going away:** the old family sample sites, Ember & Pine with the Torch design, and the contractor page, prices and FAQ section on bohdiai.com. (2026-10-16, Alex: the contractor sites, Halfmoon and True Coat included, are not going away; they only come off bohdiai.com for now.) Rustic Rhody will be changed (off the Bulletin design, which then goes too).

**The demo** shows what a site can do (plans, shop, cart, markets, the market app, the backend), not a promise of a look. Saltmarsh stays as it is.

**Who picks the family and skin:** Alex for now, with Claude suggesting. It moves to the maker for automation; building real sites shows the best way.

**One builder for every new site.** One content file (every word the site shows included) plus two settings (family and skin; on Scenic, the photo too) fill the homes and upload the photos, for any of the eight families. It replaces the separate card, nursery and contractor build tools and the old onboarding builder.

**Every family can sell:** a working "Add to cart", the cart page, order request, market page, running sales, and the three plans. Today only Shoreline and the nursery design can.

## The goal

> Build a site today in cozy, change it to modern, and everything comes along.

Each design decides its own section order and its own look. If modern puts testimonials before the about, that's fine. What matters is that every piece of content lands in the right section after the switch, because every design reads the same content from the same homes.

The same goes for every other design: any family, and the newer designs like shoreline and nursery. The content belongs to the site, and the design only shows it.

**Who switches designs:** makers never switch designs. Alex might. (2026-10-15: picking the family and skin moves to the maker when the build is automated.)

**When a maker wants something no design has, it becomes a feature for every site.** Its content gets its own home. It is built once as an added section that takes on any design's look, and it gets its own switch. It arrives switched off everywhere, so building it changes no existing site. Turning it on for a site is seamless. See 3b. A whole new design is only made when a new shape is wanted, never to add one feature.

## The rules

1. **Every piece of content has its own home** (a table or field in the database) that any design can read.
2. **Pages hold settings only.** A page's saved record says which design and which look, never words, photos or dates.
3. **Designs only display.** A design never stores content of its own.
4. **No hardcoding.** No display words inside a design, buttons and labels included (Alex, 2026-10-14). Section headings come from the site's own content; every other word from the site's own words (`site_words`).
5. **No standard site ever requires custom work.** Every standard site is a family, a skin, content and added sections. New needs become new shared sections, skins or families that any site can use. Custom sites (2026-10-15) are a paid option with their own handmade touches; their content still lives in the same homes.

## Where things stand (checked against code and database 2026-10-13)

- **Newer maker sites** (Rustic Rhody, Paper & Patina, Ember & Pine, Saltmarsh, Rose n' Cat): content is in proper homes. But their section headings ("From the shelf", "Kind words", "Find me at") are hardcoded in each design.
- **Family sites:** switching cozy to modern is already one setting. But the family designs read the moment, about, founder, reviews, market dates, marquee, closing line, contact intro and headings from the page record, not from homes. Only products and collections come from homes. Family designs have no cart and no market page.
- **Contractor sites** (Cut-Pro, Mazzone, Halfmoon, True Coat): every piece of content is in the page record. Photos have no upload records. Estimate requests are emailed and never saved.

## The steps

### 1. Safeguards (done 2026-10-13)
Built: the approval stop (`.claude/hooks/db-change-gate.mjs`, one prompt when a change is applied, after Claude explains it in chat), the database rule (`supabase/migrations/20261013000001_page_records_settings_only.sql`, proven by `scripts/check-page-rule.mjs`), the test (`lib/archetypes/modular-rules.test.ts` with its shrinking register), and the rules in `CLAUDE.md`. Alex's line on words: site words (headings, ledes, empty states, the maker's voice and vocabulary) get homes; platform words (buttons, labels, mechanics, errors) stay in code.

1. **You approve every database change.** Claude Code stops and asks you before any table is created or changed, with one plain sentence saying what it's for.
2. **Database rule.** A page's saved record can only hold settings. It applies to new saves; old samples stay readable.
3. **A test that blocks bad changes.** Every change runs a check that each design reads content only from the homes, and that no design contains display words of its own.
4. **Rules in the instructions loaded every session.** Before any new design or home is built, Alex sees a plain list of where each piece of content goes.

### 2. Homes for the family pieces that don't have one (done 2026-10-13)
Built: `site_sections` (each section's words; the closing line and contact intro live here), `site_moments` + `site_moment_photos`, and About you's quote, attribution, portrait upload and marquee phrases, with backend read and save code. Screens come with step 3.

5. **Moment:** story lines, tagline, buttons, video or photo (as a proper upload), play setting.
6. **Founder quote and portrait,** added to About you.
7. **Marquee phrases, closing line, contact intro.**
8. **Section headings:** one home per site per section. Every design, family and newer, reads its headings from here instead of code. A new site starts with each design's suggested headings, and they can be changed.
9. **Photos become proper uploads:** moment media, founder portrait, and products whose photo is only a bare web address.

Everything else already has a home: About you, gallery, Markets, Testimonials, products, collections, sales.

### 3. Family designs read from the homes (underway)
Done: every family page reads from the homes (`lib/archetypes/main-street/from-homes.ts`); old samples keep their page record until step 6. Proven on `aurora-candles-homes`, a copy that matches the sample word for word.

10. **Every family section reads from the homes:**
    - the about from About you
    - "find us" from Markets
    - reviews from Testimonials
    - the moment, marquee, closing line, contact and headings from step 2
11. **Family designs show running sales** and respect the plans (Alex, 2026-10-15): **Showcase** never has a shop page or prices. **Market** shows prices and an "Ask about this" button on each piece; at a market, the market app takes the payment. **Full** adds the cart, the only place to buy online.
12. **Family designs get the cart, order request and market page** the newer designs already have, dressed in each family's look.
13. **The newer designs read their headings from the homes** (step 8) instead of their code. (2026-10-15: Shoreline and Showreel get this by becoming the Scenic and Spotlight families.)

### 3b. Every site can add sections (plug-ins)
Every site must be able to add sections without a new design and without touching other sites.
13a. **Every design publishes its look as shared settings:** fonts, colors, corners, spacing and the section heading style. A plug-in picks these up, so it always looks native in whatever design it lands in.
13b. **Every design gets plug-in spots,** fixed places where added sections can appear (for example after the main content, before contact, or as their own page in the menu). The design itself stays fixed.
13c. **Plug-in sections are built once and work in every design.** Each reads its content from its own home and shows nothing when it's empty. The first set:
   - text block (heading, paragraphs, optional photo)
   - testimonials
   - FAQ
   - gallery
   - market dates
   - booked-days calendar
   - video
   - sale banner
   - price estimator
   New feature requests become new plug-ins, available to every design at once. A new plug-in arrives switched off everywhere and changes no existing site.
   **Seamless test:** an automatic check renders every plug-in in every design's spots, both empty and filled. A plug-in can't go live until it passes in every design.
13d. **Each site saves which plug-ins it has, in which spot and in what order,** as settings only. Adding one is a switch plus filling in its content. No code change and no other site touched.
13e. **Features that today are hand-written into one design become plug-ins:** True Coat's calendar and estimator, Saltmarsh's testimonials, Rose n' Cat's sale banner. Each design keeps its own built-in version only where it is part of the design's shape.

### 3c. Backgrounds and the new families
13f. **SUPERSEDED 2026-10-15: the background is part of the skin, not its own setting; on Scenic the maker picks the photo from the scene library or provides their own** (see "The lineup"). Kept for the record: **Every site has two look settings:** its family (cozy, rustic, dark, luxury, cheerful, modern, coastal, sweet) and its background. No family has a default background; the background is always chosen for the site. It is one of three things:
   - a family texture
   - a scene photo from the shared scene library
   - the maker's own photo of their shop, booth or view, as an upload

   Any family can sit on any background. Example: rustic on a workshop scene.
13g. **Scene library:** scene photos in their own home, tagged with the crafts and families they suit. A new scene is available to every family at once. Readability over photos is handled by each family (panels and scrim), and is checked by the design test.
13h. **Saltmarsh's Shoreline design becomes the Scenic family** (replaces "Coastal", 2026-10-15): the photo locked behind the page with the content floating over it, built on the family engine with its own section styles. Saltmarsh's colors and fonts become its first skin; the marsh photo goes into the scene library like any other scene. Lace edges and matted frames are Saltmarsh's handmade touches, not part of the family.
13i. **Paper & Patina's Showreel design becomes the Spotlight family** (2026-10-15): one piece per full screen, bold color panels, the market-dates ticker. Those become section styles in the family engine (so any later family can use them too), and Spotlight picks them.
13j. **Family vs skin vs background vs words:**
   - the family is the layout
   - the skin is the colors and fonts
   - the background comes with the skin (on Scenic the maker picks the photo from the scene library or provides their own)
   - every word on the page comes from the site's content

   Family names don't have to be moods (cozy, rustic, dark, elegant, cheerful, modern, Scenic, Spotlight). The nursery design is not a family: it stays Rose n' Cat's custom design (replaces "Sweet").

### 4. Cut-Pro and Mazzone onto the same footing (narrowed 2026-10-15)
Contractors are set aside until they come back as their own leg. Only Cut-Pro and Mazzone stay, as custom sites, and they only need to fit.
14. **Homes for exactly what Cut-Pro and Mazzone show,** nothing for contractors in general.
15. **Their photos become proper uploads.**
16. **Estimate requests are saved** in an inbox as well as emailed.
17. **Their designs read from those homes.** Each is copied over and shown to Alex before and after, and nothing switches until he's seen it. They are already built, so they don't go through the new builder. Halfmoon and True Coat are switched off, not moved.

### 4b. One builder for every new site (2026-10-15)
17a. **One builder:** a site's content file, every word included, plus its family and skin (and its photo on Scenic). It fills every home and uploads the photos, for any of the eight families. It replaces the card, nursery and contractor build tools, the family copy tool and the old onboarding builder (which still writes the page record the old way and is switched off).

### 5. Prove it
18. **Build a fresh sample site in cozy with the one builder.**
19. **Switch it to every other family, Scenic and Spotlight included,** on all three plans. Every piece of content lands in its section every time, and it can sell on Full.
20. **Alex looks and approves.**

### 6. Clean up
21. **Delete the old family samples** (and the `aurora-candles-homes` proof copy). They no longer need protecting while the families change. First, bohdiai.com gets **new sample sites** built with the one builder (Alex, 2026-10-15), since its hero and samples page show the old ones today.
22. **Remove the old code that reads content from the page record,** the old build tools once the one builder replaces them, and the Torch design.
22a. **Take down** Ember & Pine (Halfmoon and True Coat stay, off bohdiai.com; Alex 2026-10-16), and the contractor page, prices and FAQ section on bohdiai.com (a plain list goes to Alex before anything comes down).
22b. **Rustic Rhody** moves onto a family; then the Bulletin design goes.

### Proposed order of work (Session 105, for Alex to confirm)
1. Every family can sell (step 3, items 11 and 12): the six families first, since Scenic and Spotlight will sit on the same engine.
2. The one builder (4b).
3. Scenic and Spotlight become families (13h, 13i), with skins.
4. Prove it (step 5), then clean up (step 6).
5. Cut-Pro and Mazzone fit the homes (step 4).

### 7. The automated build, then self-serve (built step by step on top of the above)

At first Alex curates every site. Eventually a maker signs up, pays and is live the same day, with no one in the loop.

23. **Build by hand first.** Create the site, pick its family and skin, fill the content through the normal screens, turn on added sections. There is no custom code.
24. **Automate one hand step at a time:** (Session 106: the intake form is live at bohdiai.com/start, the maker makes their account there, and `scripts/intake-to-site.ts` builds the site with Claude's first drafts of the words; the maker publishes it from their backend. Still by hand: running the command, and picking the skin, and the family on "you pick".)
    - an intake form fills the homes
    - the AI writes first drafts of the words
    - the maker sees their own content in each family and picks one, with the AI marking its two best fits
    - the maker sees their own content in each skin (on Scenic, over library scenes tagged for their craft, or their own photo)
    - the moment gets made once
25. **"Alex approves" is a switch from day one.** It is on while Alex curates. When it is off, the maker pays and goes live the same day.
26. **Automatic quality checks** replace Alex's eyes before anything publishes:
    - content fits the design
    - nothing required is empty or broken
    - photos are usable (size, sharpness, not blank)
27. **Appropriate-content checks:**
    - **Terms and an acceptable-use list** of what can't be sold or published, agreed to at signup.
    - **AI review at build time.** The maker's words and every photo are read and flagged if they don't belong. A flagged site is held for Alex instead of publishing.
    - **The same review runs on later edits.** When a maker changes words or adds photos after launch, a flagged change is held and doesn't go live.
    - **"Report this site" link** in every site footer, which sends a report to Alex's dashboard.
    - **Suspend switch** in Alex's dashboard that takes a site offline without deleting it.
    - **Payment screening:** signup payments go through the processor's fraud screening.

## Decisions Alex makes along the way (one at a time)

1. **Who edits each new piece:** the moment story, headings, marquee, closing line, contact intro and founder quote. Is it the maker, or Alex? **Decided 2026-10-13 (Alex): "when we generate the site we fill it in then they edit it."** The build fills every piece; the maker edits all of them in their backend.
2. **The made-up "4.9 out of 5, 180+ customers" line** on family reviews. **Decided 2026-10-15 (Alex): drop it.** The homes have no place for it, so sites built from the homes already don't show it.
3. **Contractor backend screens:** which contractor homes get maker screens as part of step 4. (Set aside 2026-10-15 with contractors.)
