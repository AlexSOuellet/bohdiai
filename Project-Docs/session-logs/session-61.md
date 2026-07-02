# Session 61 — Find-us section: designed (6 treatments), defaults assigned, built into the engine; approach correction pending

**Date:** 2026-07-02
**Branch:** `session-12/layout-engine`
**Commit:** `79c2006` (pushed)

## What happened

Took the Map / Find-us section from nothing to built-in-the-engine, then hit a design/approach correction from Alex that's parked for tomorrow.

### Design — six find-us treatments (a shared pool, like reviews/nav)
Alex opened with three options he saw (a list, a monthly calendar, a card per event) and asked for suggestions. I over-anchored on "sparse craft-fair dates" and argued against the calendar; Alex corrected me twice:
- **Any maker could hold workshops** (candle maker, signmaker, photobooth vendor) — so a recurring/dense schedule is real, and the calendar earns its place. Density is **per-maker, not per-family**.
- **At onboarding there are NO real events** — Bohdi seeds sample dates (D38), and every section is enable/disable/swap in the editor. So a treatment is a maker CHOICE from a shelf, not something we derive from data. "All of these options we are creating are as much samples as real sections."

That reframed find-us as the same pattern as Reviews: a shared pool of treatments, seeded, maker-swappable. Designed six (mockup `tmp/mockups/findus-treatments-v1.html`, viewed in Chrome, no map — Alex: "map is too complicated and I do not believe visually appealing"): **Board** (tour-dates list), **Calendar** (month grid), **Passes** (ticket-stub rail), **Next Stop** (spotlight nearest date), **Itinerary** (stitched route line), **Season Poster** (playbill broadside). Reworked #6 once — it first rhymed with the reviews Guestbook (pinned slips) → became a single printed broadside.

### Per-family defaults (Alex delegated: "do whatever / just finish it")
Cozy → Season Poster, Rustic → Itinerary, Dark → Next Stop, **Luxury → Board** (came *off* the Calendar — a grid doesn't carry Luxury's refinement), Cheerful → Passes, Modern → Calendar. Recorded in `Family-Style-Sheets.md` (table + notes) and `tmp/mockups/defaults-matrix.html`. **No family→default code wiring yet** — the dispatcher falls back to `board` until the family layer.

### Build ("build it")
Mirrored the reviews pattern exactly:
- `lib/archetypes/main-street/findus.ts` — registry (treatments tuple, menu, default, `FindUsEvent`/`FindUsSection` types, `sampleEvents`, and pure date/grid helpers `parseFindUsDate` / `buildFindUsMonth` / `formatFindUsMonthTitle`, `seedPreviewFindUs`).
- Six components (`FindUsBoard/Calendar/Passes/NextStop/Itinerary/Poster.tsx`) — skin-agnostic, class-only, `Type` roles, CSS in `skinVarsCss` under `.ms-fu-*`.
- `FindUsBeat.tsx` rewritten from the old single-list into a dispatcher.
- Schema: enriched `FindUsRow` with optional ISO `date` + `kind` (market/workshop/event) and added `findUs.treatment`; the copywriter now authors `date`+`kind` at build.
- Wired `findUsTreatment` through MainStreet → builder.tsx → builder.ts → StorefrontPage (+ `?findus=` seed) → `app/storefront/page.tsx`. Preview: `?findus=<treatment>`.
- Tests: `findus.test.ts`, rewritten `FindUsBeat.test.tsx`, `FindUsTreatments.test.tsx`; updated `MainStreet.test.tsx` (selector `#find-us`).
- **1400 tests green (+28), tsc + lint clean.** Committed + pushed. Verified live via curl on `soul-splatter-bright.localhost:3000/?findus=<t>` — all six section classes switch correctly.

### The correction that's PARKED for tomorrow
Alex looked at **Next Stop** on the live store and said "this does not look right" — a giant lone "Sat" as the hero (the store's dates predate the ISO field, so the big line fell back to the bare `day` string). Two problems: (1) that store has no real dates attached, (2) leading with a derived weekday is a weak hero regardless.

Then the load-bearing correction: **"the event treatment should show whatever events are configured.. not dynamically do it by real dates. It is up to the maker to keep it updated not us."** i.e. the treatments should render the maker's CONFIGURED events as-is (in configured order) — NOT compute "next," sort, hide past, or derive the display from real dates. The date-intelligence I built (the whole ISO-date derivation + `buildFindUsMonth` sort/soonest-month) goes against this.

**Open question I raised (Alex: "I will deal with calendar tomorrow"):** the Calendar is a literal month grid, so it structurally needs a date on each event to place it. Keep a configured date on calendar events so the grid works, OR drop the literal grid and make "calendar" a configured agenda. **Decide tomorrow.** Everything else: strip the date-cleverness, render configured `day`/`where`/`time` as-is, and rework Next Stop to be venue-led (place is the hero, date/time as an accent line) rather than a giant derived weekday.

### Process notes / feedback banked
- **Alex: "why are you committing files I have not verified"** — I treated tests-green as the finish line and committed a *visual* section before he'd looked at it. For visible-output work his eyes gate the commit. (He said don't revert.) Saved as `feedback_verify_visual_before_commit`.
- Ride-along: verified the **Vercel `*.bohdiai.com` "misconfigured domain"** email is a dead leftover from the Session-47 wildcard attempt (Vercel can't issue a wildcard cert on Cloudflare DNS). Both prod subdomains serve 200 through the Cloudflare Worker → apex (headers: `Server: cloudflare` + `X-Matched-Path: /storefront`), so the Vercel entry is not load-bearing and is safe for Alex to remove (Vercel → bohdiai → Settings → Domains). His action; I can't touch his Vercel account.

## State
Find-us is built + committed + pushed but **NOT signed off** — Next Stop looks wrong, the "render configured, not dynamic" correction is unapplied, and the Calendar approach is undecided. Do NOT treat find-us as done.
