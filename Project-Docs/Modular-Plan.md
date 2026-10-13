# BohdiAI Modular Plan

**Rewritten 2026-10-13 around Alex's actual goal. Status (Session 103, 2026-10-13): steps 1 and 2 done; step 3 underway (family pages read from the homes). See `Open-Work.md` for each item.**

## The goal

> Build a site today in cozy, change it to modern, and everything comes along.

Each design decides its own section order and its own look. If modern puts testimonials before the about, that's fine. What matters is that every piece of content lands in the right section after the switch, because every design reads the same content from the same homes.

The same goes for every other design: any family, and the newer designs like shoreline and nursery. The content belongs to the site, and the design only shows it.

**Who switches designs:** makers never switch designs. Alex might.

**When a maker wants something no design has, it becomes a feature for every site.** Its content gets its own home. It is built once as an added section that takes on any design's look, and it gets its own switch. It arrives switched off everywhere, so building it changes no existing site. Turning it on for a site is seamless. See 3b. A whole new design is only made when a new shape is wanted, never to add one feature.

## The rules

1. **Every piece of content has its own home** (a table or field in the database) that any design can read.
2. **Pages hold settings only.** A page's saved record says which design and which look, never words, photos or dates.
3. **Designs only display.** A design never stores content of its own.
4. **No hardcoding.** No display words inside a design. Section headings come from the site's own content.
5. **No site ever requires custom work.** Every site is a design plus content plus added sections. New needs become new shared sections or new designs that any site can use. Nothing is ever built for one site only.

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
11. **Family designs show running sales** and respect the plan switches: Showcase shows the gallery instead of the shop, Market shows prices with buying by asking or at markets, Full has the cart.
12. **Family designs get the cart, order request and market page** the newer designs already have, dressed in each family's look.
13. **The newer designs read their headings from the homes** (step 8) instead of their code.

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

### 3c. Background as its own setting, and the Coastal and Sweet families
13f. **Every site has two look settings:** its family (cozy, rustic, dark, luxury, cheerful, modern, coastal, sweet) and its background. No family has a default background; the background is always chosen for the site. It is one of three things:
   - a family texture
   - a scene photo from the shared scene library
   - the maker's own photo of their shop, booth or view, as an upload

   Any family can sit on any background. Example: rustic on a workshop scene.
13g. **Scene library:** scene photos in their own home, tagged with the crafts and families they suit. A new scene is available to every family at once. Readability over photos is handled by each family (panels and scrim), and is checked by the design test.
13h. **Saltmarsh's design becomes the Coastal family:**
   - **sections:** the shelf of framed pieces with tags, the scalloped story card, the market table, testimonial cards
   - **feel:** dusky rose and navy, the elegant name, italic headings, handwriting

   It has no default background. The marsh photo goes into the scene library like any other scene.
13i. **Rose n' Cat's nursery design becomes the Sweet family** (name recommended by Claude; Alex to confirm):
   - **sections:** the arched window opening, the name cards, the bead strip, the clothesline gallery, the artist's letter, visiting hours
   - **feel:** soft pastels (blush, sage, lilac, sky), script name, dotted paper

   The doll wording ("adoption fee", "Hello, my name is", "Gone home") becomes Rose n' Cat's own content in the homes, not part of the family. The birth-certificate product page is the one doll-specific piece; it stays as Rose n' Cat's product page style within Sweet.
13j. **Family vs background vs design words:**
   - the family is the shape and feel
   - the background is chosen per site
   - every word on the page comes from the site's content

   Families are listed publicly as moods (cozy, rustic, dark, elegant, cheerful, modern, coastal, sweet).

### 4. Contractor sites onto the same footing
14. **Homes for contractor content:**
    - business facts (trade, phone, service area)
    - services
    - crew bio and promises
    - work photos with their details
    - reviews, in Testimonials
    - FAQ
    - proof figures and comparison
    - booked days
    - estimator prices
    - notice line
15. **Contractor photos become proper uploads.**
16. **Estimate requests are saved** in an inbox as well as emailed.
17. **The contractor designs read from those homes.** Each live site is copied over and shown to Alex before and after, and nothing switches until he's seen it. That covers Cut-Pro and Mazzone, then Halfmoon and True Coat.

### 5. Prove it
18. **Build a fresh sample site in cozy,** with every piece of content entered through the normal screens.
19. **Switch it to every other family and to the newer designs,** on all three plans. Every piece of content lands in its section every time.
20. **Alex looks and approves.**

### 6. Clean up
21. **Delete the old family samples.** They are never moved; they stay untouched as reference until then.
22. **Remove the old code that reads content from the page record,** and today's Rustic Rhody experiment branch.

### 7. The automated build, then self-serve (built step by step on top of the above)

At first Alex curates every site. Eventually a maker signs up, pays and is live the same day, with no one in the loop.

23. **Build by hand first.** Create the site, pick its family and background, fill the content through the normal screens, turn on added sections. There is no custom code.
24. **Automate one hand step at a time:**
    - an intake form fills the homes
    - the AI writes first drafts of the words
    - the maker sees their own content in each family and picks one, with the AI marking its two best fits
    - the maker sees their own content over background choices: textures, scenes tagged for their craft, or their own photo
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
2. **The made-up "4.9 out of 5, 180+ customers" line** on family reviews. Drop it, or let the maker enter a real one? (Still open. The homes have no place for it, so sites built from the homes don't show it.)
3. **Contractor backend screens:** which contractor homes get maker screens as part of step 4.
