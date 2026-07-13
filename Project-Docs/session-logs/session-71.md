# Session 71 — Wave E: sub-page compositions

**Date:** 2026-07-13
**Branch:** `session-12/layout-engine` (continued)
**Docs read at start:** CLAUDE.md, SESSION-BRIEF, Full-Plan, Master Spec (full read), Roles-Workflow, Phase-1-Decisions-Log (full read)

## What happened

Wave E landed, but its scope shifted mid-session. The plan called for "thirty compositions" — six families × five sub-pages. Alex reshaped that to "four canonical library shapes, each painted per family through the existing skin system." Sub-pages no longer reuse whichever teaser treatment the family picked on the home. The shopper on `/shop` gets a browsing surface, not the marquee turned up to eleven.

The session ran in two phases. The first phase was a mockup detour that Alex ultimately rejected. The second phase was editing production TSX directly, one sub-page at a time, with Alex viewing the live output on his own tenants. That's the pattern that actually worked.

## Doc cleanup at the start

Two small doc edits before touching code. Full-Plan Phase 3 DoD referenced a Cheerful reviews-cards fade that Session 70 fixed via the `.ms-family-texture` z-index change — dropped that stale mention. SESSION-BRIEF's Next Actions listed the Turbopack cache fix (done at session start when we killed `.next/` cleanly) and a "Phase 3 checkboxes" item that was already reflecting reality. Trimmed both. Commit `9481454`.

## Dev server clean start

Session 70 left a corrupted Turbopack cache from an in-flight `.next` delete on a running server. First move was to confirm no dev server was actually running (checked node processes and port 3000 — nothing bound), wipe `.next/` clean, restart via `npm run dev`. Came up in 7.8s at localhost:3000. One deprecation warning about `experimental.middlewareClientMaxBodySize` — cosmetic, not blocking.

## The mockup detour

Started Wave E by invoking the brainstorming skill and thinking through what "sub-page compositions" actually meant. Read the current `lib/archetypes/main-street/pages.tsx` and saw the pattern: each sub-page (Shop, About, Collections, Testimonials, Events) rendered its main section via `<XBeat full />` — reusing whatever treatment the family picked on the home, in "full" mode. `/shop` on a Rustic store showed the marquee blown up to a full-page browsing surface. `/shop` on a Cheerful store showed the goods table.

Talked it through with Alex. He named the real bug — "marquee is not a shop page. People go to this page to browse the shop. It should be more of a library." That reframed the whole wave. Sub-pages needed their own visual identity — library shapes that read as browsing surfaces, not teasers turned up.

Built a `tmp/mockups/shop-library-v1.html` with the shape in both Cozy and Modern paint. Alex approved Cozy immediately. Modern went through three revisions before landing — first pass was Squarespace-clean (edge-to-edge grid, big empty EVENTS title with a red underline; Alex called it out as "no edge"), second pass was Balenciaga-shouty (dark background, giant red field, mega-date; Alex called it out as "too full page in your face and BIG"), third pass was restrained (same shape as Cozy, paper background, hard black grid lines, red as a small callout only). That third pass landed.

Then Alex approved Events restrained, then Collections — the Collections mockup went through several rounds of trimming (roman numerals removed, drop cap on the featured lede removed then restored then removed again after clarifying what he actually disliked was the "kind" pills — paper-label styled category chips). At some point around the Collections iteration, Alex said the thing that ended the mockup phase entirely: "I really do not like these piece by piece mockups." He wanted real code he could see live and change as we go.

Pivoted to production TSX from that point on. Every subsequent sub-page was edited in `lib/archetypes/main-street/pages.tsx` with the CSS in `chrome.tsx`, Alex viewing the live output on his tenants. That workflow was fast enough to keep momentum.

## Shop — the library grid (commit `445bb3f`)

Replaced `<GoodsBeat full />` in `ShopPage` with a direct three-column product grid. The chrome CSS already had `.ms-catalog-*` classes defined but never wired up — `.ms-catalog-grid`, `.ms-catalog-card`, `.ms-catalog-media`, `.ms-catalog-price`, `.ms-catalog-name`, `.ms-catalog-desc` — with responsive breakpoints for 2-col at 900px and 1-col at 560px. Just used them.

Family paint flows through the existing skin CSS variables (`--ms-bg`, `--ms-fg`, `--ms-fg-muted`, `--ms-accent`, plus type roles). Nothing family-specific to change in code. Cozy Shop paints warm cream with Fraunces; Modern Shop paints paper with Archivo caps; both use the same grid shape.

Dropped the `treatments` param from `ShopPage`'s signature. Updated the caller in `builder.tsx:270` and the four `ShopPage` invocations in `pages.test.tsx`. 925 tests pass.

## Collections — editorial spreads (commit `4248a7f`)

Alex specifically wanted Collections to look DIFFERENT from Shop, not just Shop-with-collection-names. The mockup direction that landed was editorial spreads — one collection per band, big image on one side, name and short description on the other, alternating left / right down the page for rhythm.

Added new CSS in `chrome.tsx` under `.ms-cs-*` (Collections Sub-page). `ShopPage`-style refactor pattern: replaced `<CollectionsBeat full />` with a direct spread render. Each spread is an `<a>` linking to `/collections/[slug]`. Two-column grid on desktop, single column on mobile with image always first.

Content uses only what `CollectionView` carries: slug, name, count, cover image. No description or tagline fields today. If the spreads feel thin without descriptions we add a schema field later — deferred until Alex flags it.

The home band treatments (Cupboard, Crates, Portals, Chapters, Lanes, Cascade) stay as teasers on the home only. Alex specifically invested design sessions in those per-family band shapes; they weren't retired, just scoped to the home. The `/collections` page has its own library shape now.

Dropped `treatments` from `CollectionsPage`'s signature. Removed the `CollectionsBeat` import from `pages.tsx` (no longer used).

## Events — calendar view with clickable events (commit `4f1e2c2`)

First pass was a chronological list — same list-with-highlighted-next-row shape I built in the mockups. Alex rejected it: "not a fan of events. I really like the calendar option, plus individual events should be clickable."

Redesigned as a calendar view up top with a chronological detail list below. Reused `FindUsCalendar` (Modern family's home find-us treatment) directly, added an optional `eventHrefs?: readonly (string | undefined)[]` prop. The array must be indexed parallel to `section.rows` — internal `hrefFor(e)` uses `section.rows.indexOf(e)` (references survive from `section.rows` through `buildFindUsMonth`). Home band passes no `eventHrefs` so home cells stay non-interactive; sub-page passes an anchor URL array like `#event-{i}`.

Prop is an array, not a callback, because `FindUsCalendar` is a Client Component (`'use client'`) and Next.js RSC won't serialize a function across the server / client boundary. First attempt used a callback (`eventHref: (e, i) => string`) — the page rendered a runtime error ("Functions cannot be passed directly to Client Components"). Fixed by pre-building the array on the server side in `EventsPage`. Refactored the internal `Agenda` sub-component to receive `items: { event, href }[]` pre-mapped so it never needs the resolver function.

Cells in the calendar carry an anchor overlay (`.ms-fu-cal-cell-hit` — position:absolute, inset:0, z-index:2) so the whole cell area is clickable when there's an event. Agenda items in the sidebar wrap in `<a>` when a href resolves. Both link to `#event-{i}` — anchor scrolls down to the detail row in the list below, which briefly highlights on `:target` via a `background` transition (CSS in `chrome.tsx`).

Each detail row also carries an external "Get directions →" link — `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(where)}` with `target="_blank" rel="noopener noreferrer"`. Uses `DEFAULT_STRINGS.getDirections` (new). External links are a first pass — flag flagged with Alex; he can name a different destination later.

Below the calendar, chronological list of ALL events across all months (the calendar's own agenda column is scoped to the currently-viewed month). Each row has `id="event-{i}"`, `scroll-margin-top: 80px` so anchor scroll doesn't land under the fixed sub-header.

Dropped `treatments` from `EventsPage`. Removed `FindUsBeat` import from `pages.tsx`.

## Testimonials — quote wall (commit `c7b5270`)

Two-column responsive grid of quote cards, each with a big opening quote mark (Unicode U+201C, aria-hidden), the quote in a `<blockquote>`, author, optional location. Optional summary bar (score + count) sits above the grid when authored.

Added CSS in `chrome.tsx` under `.ms-tw-*` (Testimonials Wall). Same one-shape / family-paint pattern as the other three. Home reviews treatments (Rating, Pull-Quote, Guestbook, Texts) stay as home teasers.

Alex flagged the summary-without-per-review-ratings inconsistency — the summary card at the top shows "4.9 out of 5" but individual cards don't show ratings. Real fix would be adding `rating: number` to each review item in the schema, updating the copywriter to author them, wiring the summary to the actual average.

He also wanted click-through to individual reviews, filter by rating, and customer photos with a tenant toggle. All deferred to a "real testimonials" phase later. Customer photos in particular is a full pipeline — schema field, dashboard upload, storage bucket, tenant setting, moderation UI — that belongs after verified-purchase reviews come online post-launch. Not this session's work.

Dropped `treatments` from `TestimonialsPage`. Removed `ReviewsBeat` import from `pages.tsx`.

## What we didn't do

- Rich testimonials (per-review ratings, click-through detail, filter, photos) — deferred by Alex.
- Wave F audit rollups (Anthropic `input_schema` on the four crew stages, `AbortController` through the timeout wrapper) — carry to Session 72.
- Niche-writer skill textures section rewrite (owed).
- Bulk-approve trusted niches in DB (owed).
- Dev feature-flag bypass mystery investigation (low priority, DB row overrides it).

## Tests + typecheck

All 925 tests pass. `tsc --noEmit` clean. No lint runs this session but no changes to files that typically trip lint.

## Working-pattern lessons

- Mockup iteration workflow (`tmp/mockups/*.html` side-by-side compares) hit its limit for this kind of work. When Alex has strong opinions about shape and paint separately, mockups fragment the discussion into "does Cozy look right" and "does Modern look right" and "do they look consistent" as three separate conversations across three files. Editing production TSX with the family / skin system already in place kept those three questions unified — one code change, viewed live on Cozy AND Modern by navigating to different tenants.
- Overcorrecting on aesthetic feedback is a real pattern I fell into three times on Modern events (Squarespace → Balenciaga → restrained). "No edge" doesn't mean "maximum edge." Read the whole feedback for the direction, not just the loud word.
- When Alex says "clickable" for something without a natural detail-page destination, the honest first pass is an anchor scroll on the same page or an external useful link (Google Maps for a venue). Don't invent a stub detail page with no data behind it — 404 is worse than no click.
