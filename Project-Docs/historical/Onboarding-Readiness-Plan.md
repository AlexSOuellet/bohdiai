# Onboarding Readiness Plan

**Written:** 2026-07-03, end of Session 62
**Purpose:** what has to be done to run a full onboarding that produces a live, working, presentable storefront. No padding. Excludes Stripe wiring and Google OAuth per Alex's call.

---

## The honest starting point

The onboarding pipeline has grown significantly since it last produced a real store (Soul Splatter, Session 47-48). Sessions since then added: 4 goods treatments, 7 About treatments, 4 nav registers, the Collections band, the Marquee section, the Reviews section, the Find-us treatments, the Type-layer refactor, and the modular hero system. Every one of those is a new field the copywriter has to author or a new component that has to render without breaking.

**We have never run a real onboarding through the current pipeline end-to-end.** Every risk below is real; none has been proven either way.

---

## Blockers (must be done before the run)

### B1. Supabase email confirmation OFF

Alex-only. Supabase dashboard → Authentication → Providers → Email → turn "Confirm email" off. Without this, sign-up stalls at the account step and the build never starts.

### B2. Sweep FounderBeats and FindUsList to class-only

Two files (`lib/archetypes/main-street/FounderBeats.tsx`, and the `FindUsList` component inside it) still carry inline `style={{...}}` on every treatment (Quote, Portrait, Letter, Card, Workbench, Editorial, Signature). This means:

- The `/about` page I built today renders inline-styled content inside a class-only shell. It's not what I said it was.
- The FounderBand wrapper background, portrait scrim, quote positioning — all inline.
- Any per-family type refactor later can't reach these because they're pinned to inline literals.

Move every declaration into `skinVarsCss` under `.ms-founder-*` scoped classes with `data-` attribute variants where needed. Same rule as the goods/collections/reviews/findus components already follow.

### B3. Move hardcoded strings out of the renderer

Every fallback string I wrote in the pages today sits in the code:
- Shop empty: `"New pieces are on the way — check back soon."`
- Events empty: `"No upcoming dates just yet — check back soon..."`
- Testimonials empty: `"The kind words are still coming in — check back soon."`
- Collections empty: `"New collections are on the way — check back soon."`
- About heading fallback: `"Our story"`
- Contact heading fallback: `"Get in touch"`, intro fallback text
- Collections page title fallback: `"Collections"`, `"Browse by collection"`
- `seedPreviewFindUs` venue names: `"Providence Flea — India Point Park"`, `"Hope Street Market — Lippitt Park"`, etc.

Two-step fix:
- The **empty-state strings** move into a single `DEFAULT_STRINGS` map in `chrome.tsx` or a new `defaults.ts`, one source of truth so they're not scattered.
- The **heading/intro fallbacks** (`"Our story"`, `"Get in touch"`) should be dropped entirely — the copywriter already authors these (`about.heading`, `contact.heading`). If a real build lands with them missing, that's a copywriter bug, not something the renderer should silently paper over with hardcoded English.
- The **seed venues in `seedPreviewFindUs`** are preview-only content that never renders on a real build (real builds now stamp dates onto rows the copywriter authored). Move these to a preview-only fixture file with a comment naming them as preview-only, OR replace them with generic names so it's obvious.

### B4. Add Testimonials + Collections to LINK_TARGETS

`lib/archetypes/main-street/links.ts` hardcodes `LINK_TARGETS = ['home', 'shop', 'about', 'events', 'contact']`. The copywriter authors nav items from this list, so the two pages I built today can't appear in the nav. Two changes:
- Add `'collections'` and `'testimonials'` to `LINK_TARGETS` and `LINK_HREFS`.
- Update the copywriter's prompt in `lib/archetypes/main-street/builder.tsx` to name them as valid targets and describe when to include each (`collections` only when the store has authored collections; `testimonials` when reviews were authored).

### B5. Reviews home band needs a "See all" link

`MainStreet.tsx:114` renders `<ReviewsBeat>` without `viewAll`. Nothing on the home points at `/testimonials`. Fix: pass `viewAll={{ href: '/testimonials', label: content.reviews.viewAllLabel ?? '...' }}`. Copywriter can author the label alongside the treatment.

### B6. Verify the copywriter authors every new section correctly

Before running a real build, sanity-check that the copywriter's prompt in `builder.tsx` authors: marquee.voice, reviews.items, reviews.summary, findUs.rows (label + eventsLabel + rows with day/where/time/kind — no dates, build stamps them), collections (still open — see G1 below), plus the treatments Bohdi picks for each of them. Missing fields fail the build in the parser.

---

## Gaps that will make the site look weak but not fail the build

### G1. Collections doesn't populate on onboarding

The copywriter doesn't author collections, and no `collections` DB rows get created. So the Collections home band never renders and `/collections` shows the empty state. Two options:

- **Option A: Cut collections from launch.** Remove the `/collections` route from nav/link options; drop the CollectionsPage. Comes back Phase 2 when the maker can add real collections.
- **Option B: Author placeholder collections.** Copywriter authors 2-3 collections at build time (`content.collections`) and the build creates real `collections` DB rows for them (`Home Goods`, `New This Week`, `Bestsellers` — niche-appropriate). Requires: prompt update, a step in the build pipeline to insert the rows, and a way for the maker to edit them later (which needs the editor — G7).

**Recommendation: Option A for the test build.** Cutting an unused page is cleaner than adding placeholder content that will confuse Bohdi when he tries to edit it. Bring collections back with the editor.

### G2. Mobile

Session 47 flagged this as a hard problem: About/founder section reads badly on phone because skins under-declare `sizeMobile`. Hero video crops on mobile. Fix is automatic responsive scaling in the renderer, not per-skin tuning. Test the build on your phone before calling it done.

### G3. Build runner is fire-and-forget

`app/api/onboarding/start/route.ts:53` does `void runBuild(...)`. Fine in dev (Node keeps running). On Vercel prod, the function can freeze after returning — real makers' builds never finish. Needs `waitUntil()` or Next.js `after()`. Only matters if we're testing in prod today. **Recommendation:** test in dev, defer the fix until a beta run.

### G4. Reviews home band content might not read as authentic

The copywriter authors testimonials as plausible-looking placeholders (D60: not labeled "sample" per Alex's call). If they read as AI-generated, the store fails the "not AI slop" bar. Won't know without seeing a real build.

### G5. Find-us dates read as plausible but generic

"Providence Flea" as a placeholder venue is Rhode-Island-specific and wrong for any other tenant. The copywriter's prompt should ground venue names in the tenant's stated location if available, or use generic ones (`"Local Farmers Market"`, `"Community Craft Fair"`) that work anywhere.

### G6. Product descriptions on placeholder products

The maker gets 5 auto-generated products with descriptions. A real customer would see these before the maker replaces them. Content quality here has been iterated over sessions — worth a spot-check.

### G7. No way to edit anything post-build

Editor door 1 (mood swap) is built. Doors 2 (colors) and 3 (products/listings) are not. So the maker can't add real products, edit copy, turn off placeholder content, add real events, or change reviews. The site "goes live" frozen at what onboarding produced.

For a real live site: door 3 (products/listings management) is the hard gate — a maker without it can't ever add inventory. Doors 1 and 2 are nice-to-have; door 3 is required.

---

## Verification pass (once the build lands)

Every one of these could reveal a bug that took a Session to introduce and hasn't been noticed:

- Home renders all sections (hero, marquee if authored, goods teaser in its treatment, founder in its treatment, find-us with real current dates, reviews if authored, close, footer)
- All 6 sub-pages render without errors (/shop, /about, /events, /contact, /collections empty state OR real if G1 Option B, /testimonials)
- Every treatment reads correctly with real authored content (not the ?preview= sample seeds)
- Nav highlights current page on each sub-page
- Product detail page (/listings/[slug]) renders
- No console errors on any navigation
- Mobile viewport doesn't break (per G2)
- Find-us dates stamped correctly to the current week/month (today's work)
- Subdomain resolver picks up the new tenant correctly

---

## Post-launch (a maker could run a business here)

Not on the critical path for tonight's test build, but named so we track them:

- Editor doors 2 + 3 (colors + listings management)
- Orders dashboard
- Payment processor setup UI (guided Stripe/Square walkthrough)
- Market Mode (Log a Sale)
- Event calendar management UI
- Settings (account, subscription, business name)
- Custom-order request widget
- Stripe/Square wire-up

---

## What I recommend

1. **Tonight:** stop. Nothing more from me.
2. **Next session first thing:** do B2, B3, B4, B5 (the class-only sweep + hardcoded strings + nav wiring). Together they're the "no hardcoding, no inline" pass I claimed to have done but hadn't. Ballpark: 2-3 hours if I don't get distracted.
3. **Then:** B6 quick verification pass on the copywriter prompt.
4. **Decide on G1:** cut collections from launch (Option A) or author placeholders (Option B).
5. **Alex flips B1** (email confirmation) whenever ready.
6. **Then run the onboarding.** Watch it build. Verification pass. Fix what surfaces.
7. **Only then:** decide on editor + dashboard scope for actual go-live.

---

## What I'm NOT going to pretend

- I don't know if the copywriter will successfully author every new field. Only a real run tells us.
- I don't know if the rendering paths for every treatment combination work. Only a real run.
- I don't know if the graphic artist picks a skin that carries the maker's brand.
- I don't know how the mobile view looks.
- I don't know how long a real build takes today (Session 41 said 3-4 minutes; the pipeline has grown since).

The plan above gets us to a state where running an onboarding is worth doing. It doesn't guarantee the run succeeds.

---

*End of plan.*
