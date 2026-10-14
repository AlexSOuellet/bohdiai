# BohdiAI — Full Project Briefing

**Written 2026-10-08 (after Session 97); updated 2026-10-14 (after Session 104).** One document to bring a fresh chat up to speed on the whole project: who, what, why, what's built, how it's built, what's decided, what's open, and how Alex likes to work. Upload this at the start of a conversation.

---

## 1. Who you're talking to

**Alex Ouellet** is the founder, owner and product decision-maker. Publicly he signs just **"Alex"** on bohdiai.com (the old "Alex Scott" name was dropped everywhere on 2026-10-12). He's 67, a retired IT trainer with 30+ years of helping people through technology changes (in the 1990s he ran "Witsend", helping people into home computers). He doesn't write code; Claude (in Claude Code) is the lead developer and does all the building and commits.

"Bohdi" is only the Windows username, not a person.

### How Alex wants to be talked to

- **Plain English.** Short sentences, conversational. No headings, bullets or bold labels in chat when a couple of sentences will do. No doc reference codes ("§6.2", "D5"), no file names or jargon he didn't use first.
- **No flattery, no reflexive agreement.** Hold a reasoned view; don't fold under pushback and don't defend your own work by reflex. When he pushes back, acknowledge and wait rather than inventing a new guess.
- **No reflexive caveats.** Answer what he asked. Raise risks only when they're real and relevant now.
- **Stay technical.** Don't volunteer business or strategy opinions unless asked. Decisions are his.
- **One question at a time**, asked inline, with your recommendation marked.
- **Don't give time estimates.** Past estimates were off by ~7x. Talk in terms of what depends on what.
- **Push back on scope drift** in build work — he explicitly wants to be kept in check.
- **Never say "not urgent" or "we can do it later"** about agreed work. Everything agreed is in scope; order it, never drop it.
- **Check, don't recall.** Before saying how something is built or stored, check the real code and database. Answers from memory caused the Session 102 contradictions.
- When something needs him to act, put it at the very end in a short "For you:" list.
- When he's just chatting, just chat back.

---

## 2. What BohdiAI is now (and how it got here)

### The original idea (May–September 2026, now shelved)

BohdiAI started as a self-serve, multi-tenant SaaS: a maker (crafter, baker, artisan) signs up, an AI named **Bohdi** interviews them and generates a complete, unique storefront at `[shop].bohdiai.com` in minutes. Subscription only, **never a cut of sales** (money flows straight to the maker's own Stripe/Square). Built around "moods" (public word) / "families" (internal word) — six visual families (cozy, rustic, dark, luxury, cheerful, modern) with their own section stacks, an onboarding flow, and a "make it yours" editor. That storefront engine ran live end to end by mid-July 2026, but the commerce half and the maker dashboard were missing, and a four-month coming-soon waitlist produced **zero signups**.

### The pivot (23 September 2026)

Instead of finishing the software and then hunting for customers, Alex **takes clients by hand** and builds their sites inside the BohdiAI platform. Client work funds and directs what gets built next.

- **Still one multi-tenant platform**, not one-off sites: one database, every client is rows in it, features switched on per client.
- **No self-serve signup, no waitlist, no Beta phase** for now.
- **Only sell to the target:** makers, charities, and service businesses (contractors) that need *presenting*, not appointment booking.

### Everything is manual (29 September 2026)

- **Switched off (code kept, returns 404):** onboarding, the AI builder flow, the make-it-yours editor, the old dashboard/editor, library ingest, archetype test pages.
- **Sites are built by Alex + Claude**, using build scripts that write the site into the database.
- **A client backend IS being built** (section 6).
- **Hosting moved from Vercel to Cloudflare Workers.** Vercel serves nothing; its Git hookup was disconnected 2026-10-12.

### The modular reset (Sessions 102–103, 13 October 2026) — the operative plan now

Checking the code and database showed a structural flaw: the family sites and the contractor sites (Cut-Pro, Mazzone, Halfmoon, True Coat) kept all their words, photos and dates inside one page record, so they couldn't use the backend or switch designs. The newer maker sites stored content properly but typed their section headings straight into the design code. Alex expected every editable piece to have its own home from day one; that was Claude's design mistake.

The goal now, in Alex's words: **"Build a site today in cozy, change it to modern, and everything comes along."** The plan is `Project-Docs/Modular-Plan.md`, with every open item in `Project-Docs/Open-Work.md`. Its five rules:

1. Every piece of content has its own home (a table or field) that any design can read.
2. Pages hold settings only — which design and which look, never words, photos or dates.
3. Designs only display; they never store content.
4. No hardcoding. Section headings come from the site's own content.
5. No site ever requires custom work. A new need becomes a shared **added section** (plug-in) or a new design that every site can use. It arrives switched off everywhere.

**Nothing is ever written into the code (Alex, 2026-10-14):** every word a site shows, buttons, labels and messages included, lives per site in the `site_words` table; designs only name their spots. A new site's words are written when it's built. No screen to edit them yet (Alex's call). This replaced an earlier line that kept "platform words" in code.

Further calls from the reset:
- **Makers never switch designs.** Alex might.
- **The build fills every piece, then the maker edits all of it** in their backend (Alex, 2026-10-13). This replaces the earlier "clients manage lists and facts, Alex keeps the words and the look."
- **New families:** Saltmarsh's design becomes **Coastal**; Rose n' Cat's nursery design becomes a family (Claude suggested **Sweet**, not yet confirmed). The photo behind a page becomes its own **background setting** (a family texture, a scene from a shared library, or the maker's own photo), with no default.
- **Build by hand first, then automate one step at a time,** ending in same-day self-serve signup. "Alex approves" is a switch from day one, with automatic quality and appropriate-content checks in the plan.
- **Never build to match a test.** A copy or a diff finds differences; ask whether the thing should exist before building it (a market-kind tag was added and then removed for exactly this reason).

**Safeguards built (Session 103), so the rules don't depend on Claude remembering:** Alex approves every database change (explained in chat first; a hook stops at the moment it's applied); a database rule refuses any page record carrying words, photos or dates; a test fails when a design reads content from the wrong place or has words typed into it (its list of known offenders can only shrink).

**Progress:** steps 1 (safeguards) and 2 (homes) are done. The new homes hold each section's words (heading, the line under it, link, empty message, menu name; the closing line and contact intro too), the moment (story lines, headline, buttons, play setting, photo or video as a proper upload, extra photos), and About you's founder quote, portrait and marquee phrases. Step 3 is underway: family pages now read everything from the homes, and a copy of an old sample built purely from the homes matched it word for word. **Next:** the backend screens to fill those homes.

### bohdiai.com is a web-developer site

bohdiai.com presents BohdiAI as a **web developer for makers, contractors and charities**. Slogan: **"If you make it, bake it, fix it or fund it, we build it for you."** No AI talk on the page (say "technology"); the name BohdiAI goes unexplained. Dark honey look with the **ember wordmark** logo (a small flame dots the i) and a sticky header. About: retired IT trainer empowering people and their businesses — **"The Bohdi Way"**. Pricing pages for makers and contractors, samples, a client slideshow, FAQ, a contact form that emails Alex, and a link to Alex's Facebook page.

### Customer philosophy

- Most makers **don't need a website yet** — they sell at craft shows, have no following, and a site doesn't bring traffic on its own. Alex only wants clients who understand a site takes their own work too ("no magic-thinkers").
- "Visibly not AI slop" — every site should look hand-made and distinct, never like a Wix/Squarespace template.

---

## 3. Plans and prices (agreed 2026-10-02, updated through 10-12)

Every plan: **the site is built free**, then monthly, or yearly at exactly 10x monthly. Whole dollars. No up-front fee, no commitment; the site pauses if payments stop. These are launch prices; launch clients keep them.

| Plan | Monthly | Yearly | What it is |
|---|---|---|---|
| Maker Showcase | $5 | $50 | One-page "who I am": story, up to 12 photos, contact form, phone/social, market dates in a scrolling marquee. Carries a "Most popular" badge (Alex's call). |
| Maker Market | $15 | $150 | For craft-show sellers. Site + whole catalog (one photo per piece, prices shown, ask about it), where you'll be next, the full market app. No online selling, no reserve-for-pickup, no promotions, collections or order tracking. Was "Maker Lite" (plan id in code is still `maker-lite`). |
| Maker Full | $25 | $250 | Market plus online selling (cart, checkout to the maker's own processor), up to 12 photos, video, downloads, market results. |
| Contractor Lead Generation | $10 | $100 | One-page lead site with an estimate request form. |
| Contractor Full | $30 | $300 | Estimate inbox, job gallery, services, booked-days calendar, reviews, FAQ, notices, review requests. |

Other settled rules:
- **No payment on the website.** Prices are listed; every client talks with Alex first; when they sign off on their finished site, Alex sends a payment link by hand.
- **Square card payments** go on both Maker Market and Maker Full (Alex has the Square developer account).
- **Every site gets a backend.** Showcase and Lead Generation get a minimal one — not designed yet.
- **A plan is just a set of feature switches.** Upgrading flips switches; no rebuild. Upgrades are prorated; downgrades happen at renewal.
- **Canceling offers Showcase for the off-season:** everything kept and hidden, open orders and holds settled first, market QR codes land on the home page, promotions pause.
- **Gallery** (decided 2026-10-13): built from the catalog plus other photos. Showcase shows unlimited work as a priceless gallery; Market and Full get the same gallery, where a for-sale piece opens its page. Sold pieces stay.
- Footer on subdomain sites says "2026 Empowered by BohdiAI"; on a client's own domain it shows only their name.
- **Cut-Pro** is family and keeps "love pricing" (free).
- Don't re-litigate prices.

---

## 4. Sites and clients

**No site is truly live yet** (Alex, 2026-10-13). Cut-Pro and Rose n' Cat will become real once they're on the modular footing; Saltmarsh is the demo.

### Clients

- **Cut-Pro Lawncare & Construction** — https://cut-pro-lawncare.bohdiai.com — Alex's daughter Sheri Giannattasio and her partner Chris Bullock. Sod, grading, drainage, stonework across RI/MA/CT. Publicly reachable since 2026-09-23. Bold one-page site, estimate form with photo uploads that emails Chris. Free. Its content still sits in the page record; it moves to the contractor homes in plan step 4.
- **Rose n' Cat Reborn Babies** — https://rose-n-cat.bohdiai.com — Renee Mazzone (Joe's wife), ready-made reborn dolls (~$120, one of a kind). Built on the "boutique" layout with the **nursery** design (arched nursery window, "Gone home" clothesline gallery, artist's letter, "Visiting hours" for market dates, each doll's page a birth certificate). Has cart + order requests (orders email Alex), Orders, promotions, QR codes, new arrivals, Markets and the market shop. Renee signed into her backend on 2026-10-08. Payment handles, real names and prices are still hers to give. Not live.
- **Mazzone Home Improvement** — Joe Mazzone (renovator, Smithfield RI). "Harbor" design (navy + gold). Real facts only. Estimate emails still go to Alex until Joe is set up; his feedback is pending.
- **Decoupage Digital Designs** — https://decodigitaldesigns.com — **Penny C.** (Troy, MO). A custom shop Alex built **outside** BohdiAI; it's the blueprint for BohdiAI's backend but **never moves into BohdiAI and is never touched from BohdiAI work** (separate thread). Penny is also the main distribution hope.

### Demo and samples

- **Saltmarsh & Lace** — the public demo (made-up maker Lena Brightman, Bristol RI, decoupage on shells, bottles, boards). "Shoreline" design (fixed ocean behind every page, weathered window frames). It moves between Showcase, Market and Full with a reset script, has the plan screens (Your plan, upgrade/downgrade), testimonials, a market page, and **the demo is always today**: an hourly job moves its dates forward so markets never go stale. Its design becomes the Coastal family.
- **Samples** (red "<Plan> sample" banner): Rustic Rhody (Showcase; its hero needs a new idea), Classic Loafs (Market), Halfmoon Roofing (Lead Generation), True Coat Painting (Contractor Full), plus Twilight to Darkness, Heavenly Scents, Paper & Patina, Knotty Knits, Ember & Pine. Listed by plan at bohdiai.com/samples.

---

## 5. Design rules for sites

- **Every site is a design plus its content plus added sections.** Nothing is built for one site only. When a client wants something no design has, it becomes an added section every site can use, or a new design any site can use.
- **Every word on the page comes from the site's content.** Designs carry no display words of their own.
- **Each new design must be genuinely new** — change the bones (section order, how sections open, organizing idea), not just colors and fonts. **One bold organizing idea**, designed outward from it. Never safe/generic/template output; don't default to serif or clean-white-minimal; match the client's real energy.
- **No numbered lists** (01/02/03) on sites. **No "small label over big headline"** as the default opener. **No headline ends in a period.**
- **Render what's configured, in configured order.** Don't hide past dates or compute "next".
- **No site goes live before it's done.** Drafts are hidden, with a private preview link.
- **Alex's eyes gate visual work.** Tests passing doesn't mean it looks right. He can't judge mockups, so options get built into the real page locally and he opens the link himself.
- Pricing and FAQ go in the header, not only the footer.
- Mood is the public word; "family" is internal and never shown to a maker.

---

## 6. The client backend

Lives at **app.bohdiai.com**. Owners reach it by typing `/admin` on their own site (no visible link). One sign-in for every client; Alex's account is admin on every site. Light look modeled on Penny's admin. Auto sign-out after 8 hours idle or 7 days (the Market POS stays signed in for the 7 days).

**Principles:** one feature set shared by makers, contractors and charities — each capability is a feature with its own on/off switch, screen and part of the site. Features outside a plan are absent. The build fills every piece of content; the maker edits all of it here.

**Built:**
- Foundation: invites, sign-in, feature switches, home screen, Your plan (upgrade, downgrade, Showcase picker).
- Catalog: products (options, stock, photos, physical/digital), collections, downloads, home-page picks.
- About you, Gallery, Testimonials, QR codes, New arrivals.
- Markets: days, hours, town, address, booth, website, canceled flag; private costs, organizer, notes and a review per market; results this year against last.
- Cart + order requests, Orders, Promotions (sale or codes, never stacked), Getting paid (Venmo / Cash App / Zelle handles).
- **Market shop + Market POS:** each market has a QR page where a buyer picks a piece and a payment method and the piece is held. The maker's **Market POS** is one phone screen (buyers waiting to pay as ticket slips, Paid / Not received, sold today, a till to ring up walk-up sales) and installs as a **home-screen app**. No discount codes at the market; the seller sets market discounts.
- **Backend code for the new homes** (read and save, tested) — section words, the moment, About you's quote/portrait/marquee. **The screens are next.**

**Planned (all in `Open-Work.md`):** sales tax (home rate, a rate per market by state, included or on top, recorded per sale), market discounts, a Publish step on market setup, holds become baskets with a changeable 10-minute timer, an offline Market POS, Square card payments, video, custom domains, the minimal backend for Showcase and Lead Generation, contractor homes and an estimate inbox, and **Alex's own dashboard** (view any site as its client, statistics, demo runs and checkups, invites and password resets, messages, FAQs, reports and a suspend switch).

**Staging** (own test domain, own database) is agreed and required before the first paying client goes live.

---

## 7. How it's built (technical)

- **Stack:** Next.js 16 (App Router — newer than most training data; APIs differ), TypeScript at the strictest settings, Tailwind + CSS variables, Supabase (Postgres with row-level security, auth, storage), Resend for email, Cloudflare (Workers via OpenNext, DNS, email routing, Images, Rate Limiting). Anthropic and fal.ai are wired but dormant with the AI builder (the checkup uses Haiku).
- **Deploy = push to `main`.** Cloudflare Workers Builds builds on its own machines and deploys. Never build production on Alex's PC (it would bake secrets into the bundle). Everything on `main` deploys, so verify before merging.
- **Routing:** one Worker serves bohdiai.com, app.bohdiai.com and every `[shop].bohdiai.com`; the shop is resolved from the real host name.
- **Site layouts ("archetypes")**, hand-built: `contractor` (yard = Cut-Pro, atelier = True Coat, harbor = Mazzone, ridge = Halfmoon), `card` (Showcase one-pagers: pinned, bulletin), `boutique` (nursery), shoreline (Saltmarsh), plus the older `main-street` family storefront, which now reads from the homes.
- **Database:** multi-tenant with row-level security; Claude writes and runs migrations (after Alex's yes) and regenerates types.
- **Quality bar:** tests are part of done; CI enforces 90% branch coverage on library code; typecheck + lint clean. Ship complete — code, tests, types, verification — never partial. No hardcoded English in designs, no inline styles, no shortcuts.
- **Git:** Claude does all commits, on short-lived feature branches merged into `main` the same session. No worktrees. GitHub repo `AlexSOuellet/Bohdiai`.

---

## 8. What's open right now

- **Modular plan step 3:** Alex's order (2026-10-14) is the sites look good first; the backend screens (moment, section words) wait. Open: the line at the top of the page has two homes (About you and the moment), and Alex wants the About screen never to change the top of the page; talk it through first.
- **Then:** added sections (plug-ins) for every design, background as its own setting with a scene library, the Coastal and Sweet families, contractor sites onto the homes (each checked by Alex before switching), a fresh sample proven across every family and plan, then cleanup of the old samples and old code.
- **Open decision:** the made-up "4.9 out of 5, 180+ customers" line on family reviews — drop it, or let the maker enter a real one.
- **Market app:** sales tax, market discounts, Publish step, baskets, offline POS, retire the old Today and Sell screens, Square card payments.
- **Saltmarsh:** the design-review polish is live (Lena's portrait, plain prices, light phone header, tighter gaps, a shop button under the opening, today's market first, fairs always on Saturdays). Next: the public demo (personal copies, welcome page with email, every payment simulated, Learn explainers). Alex: the demo's opening shows what a site can be.
- **Other sites:** Rustic Rhody's hero; True Coat's estimator picks into the email; Classic Loafs screenshot and bohdiai.com sample dates.
- **Platform:** staging, Alex's dashboard, invites (24-hour links parked on a branch), video pricing, custom domains, analytics decision, Cloudflare cleanup with Alex (redundant Cut-Pro route, build variables, cancel Vercel and the old proxy).
- **Maker checkup** (bohdiai.com/checkup, a maker business analysis with a fixed question bank and Haiku reactions): built on a branch, not merged.
- **Waiting on others:** Renee (handles, names, prices), Joe (feedback, estimate emails), Cut-Pro (their follow-ups).

---

## 9. Alex's wider picture (context, not plans)

- **Distribution is the constant problem.** Every version stalled because nobody knew he existed. The one time distribution appeared, it came from doing great work for one person with an audience (Penny).
- **The Maker Experiment** (decided late September): a YouTube channel where Alex learns decoupage from zero and documents going from $0 to $1,000/month, with a Skool community rebuilt around it. Sites become a product offered to members who reach the stage where a site makes sense. Watch for overload.
- **The Bohdi Way newsletter** (undecided): a free newsletter teaching makers the business side. The checkup's "Free tips and tricks" signup points the same way. Don't push it.
- He wants something that pays him repeatedly without trading his own time, and has said hand-holding client service feels heavy — which is why the plan ends in automated, same-day self-serve. Don't try to talk him into or out of anything.
- **Separate:** Rhody Strong (a Rhode Island lifestyle store for Alex and Cheryl) lives in its own codebase.

---

## 10. Mantras

- "If it is not in the spec, do not build it."
- "If it violates a golden rule, it does not ship."
- "When in doubt, stop and ask."
- Every piece of content has its own home. No site ever requires custom work.
- Don't defer the hard part and call it sequencing. Don't inflate blockers. Fix the root cause, never a workaround dressed up as intentional. No silent failures — every error path shows the user something.
