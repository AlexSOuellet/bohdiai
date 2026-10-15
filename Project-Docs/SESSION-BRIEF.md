# Session Brief — BohdiAI

> **⚠ START HERE (Session 105, 2026-10-15):** read `Project-Docs/Modular-Plan.md` (the operative
> plan; **"The lineup" section was decided Session 105**) and `Project-Docs/Open-Work.md`.
> Makers first; eight families (the six + Scenic + Spotlight); custom sites Rose n' Cat, Cut-Pro,
> Mazzone; one builder; every family sells. Proposed order awaits Alex's OK. Don't pitch per-site
> polish or editing screens unless Alex raises them.
> `Full-Plan.md` and `Direction-2026-09-23.md` are history.

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Modular-Plan.md`; open items in `Project-Docs/Open-Work.md`. Every session updates Open-Work as items land.

**Last updated:** 2026-10-14, Session 104 (end).

---

## Current state

**Session 104: no word is written into the code; Saltmarsh polished; the demo keeps its weekdays. All merged and live.** Every word a site shows (buttons, menu names, labels, messages, page and search titles) lives per site in `site_words`; designs only name their spots (`<design>/words.ts`) and read them (`lib/site-words`). All 51 sites filled (`scripts/site-words.ts load`; a new site: `copy <from> <to> <prefix>`), live vs local compared word for word: identical. The modular-rules test fails on any word in code. Still in code, "fine for now": legal templates, server error messages, payment app names, symbols. Saltmarsh: Lena's portrait on the story card, plain-lettered prices, light phone header, solid category buttons, tighter gaps, a "Visit the shop" button under the opening (Alex: "it is a DEMO", the opening shows what a site can be), today's market leads "Find me at" (visitors don't see finished markets), fairs stay on Saturdays (`tenants.demo_week_day`, weekly moves; today's market still moves daily), today's market is "Market on the Common". About you has the quote/portrait/marquee screen. **Open:** the top-of-page line has two homes (About you vs the moment); Alex: "the About page should NOT change the hero"; talk it through before touching it. Recap: `session-logs/session-104.md`.

**Session 103: the fix began. Modular Plan steps 1 and 2 done, step 3 started; all merged.** Safeguards: a hook asks Alex once when a database change is applied (after Claude explains it in chat), a database rule refuses words/photos/dates in page records, and `lib/archetypes/modular-rules.test.ts` + its shrinking register block content read from the wrong place and words typed into designs. Homes built: `site_sections` (every section's words), `site_moments` + `site_moment_photos`, About you + quote/portrait/marquee, with backend read/save code. Family pages now read from the homes (`lib/archetypes/main-street/from-homes.ts`); old samples keep their page record until cleanup. Proof: `aurora-candles-homes` (draft copy of aurora-candles via `scripts/copy-family-sample.ts`) matches word for word. Decided: the build fills every piece, the maker edits it all; no site is truly live (Cut-Pro and Rose n' Cat will be real, Saltmarsh is the demo); the market tag was removed (built only to match a test site). Recap: `session-logs/session-103.md`. 

**Session 102 — structure reset; `Modular-Plan.md` + `Open-Work.md` written.** Recap: `session-logs/session-102.md`.

**Session 101 — Saltmarsh public; demo always today; Market POS live (phone screen, home-screen app, button per market).** Recap: `session-logs/session-101.md`. **Tomorrow (Alex): sales tax**, then market discounts + Publish on the setup page. Decided: demo POS starts empty; Buyer/Seller switch on phones, side by side on computers; market discount = one percent for the market, overridable per piece; Paid is enough (no Handed over step).

**Session 100 — maker checkup (branch `feat/maker-checkup`), Maker Market + Full $25 live.** Recap: `session-logs/session-100.md`.

**Session 87 — the whole app now runs on Cloudflare Workers; Vercel serves nothing.** bohdiai.com, www, every shop subdomain and Cut-Pro are all served by the `bohdiai` Worker, verified live (Cut-Pro end to end, including a real photo estimate). `main` is current (fast-forwarded 552 commits). 1364 tests, tsc + lint clean. Runbook + lessons: `Cloudflare-Move.md`.

- **Direction (2026-09-29):** everything is manual for now. No onboarding, no editor, no automated builder. All site edits go through Alex. A maker **backend** (catalog, pricing, orders, customers, checkout, modeled on Penny's Decoupage Digital Designs site, minus digital downloads) WILL be built. The Facebook poster and financial report come after launch. Sites span service providers, makers and charities, inside the BohdiAI structure.
- **Deploy** = push to `main`. Cloudflare Workers Builds builds on its own Linux machines and deploys. Never build on the PC for production: OpenNext bakes `.env.local` into the bundle. Runtime keys live in the Worker's top-level "Variables and Secrets" (not the Build section), pasted without .env quotes.
- **Switched off** (404 on every host, code kept): onboarding, make-it-yours, dashboard/editor, sign-in/auth, library ingest, archetype-test (`DORMANT_PREFIXES`, lib/proxy-security.ts).
- **Security fixes landed:** the shop resolves from the real Host (`x-bohdi-shop` is retired and stripped); every public form is rate-limited through the Workers Rate Limiting binding (fails closed); deleted shops 404.
- **Workers constraints:** no filesystem at request time (legal templates are now bundled); photo shrink goes through the Images binding (`lib/images/shrink.ts`, 20MB max); edge `middleware.ts`, not `proxy.ts`.
- **Building a client:** content module in `scripts/sites/<site>.ts`, then `npx tsx --env-file=.env.local scripts/build-contractor-site.ts <site> --media <dir> [--contact-email x]`. This writes to the DB and storage, so no deploy is needed.

## Next actions

**Every open item is in `Open-Work.md`**; the order of the fix is `Modular-Plan.md`. Alex (2026-10-14): the sites look good first, the edit screens wait. Candidates: Rustic Rhody's hero, the public demo, the top-of-page line's two homes (talk first), the newer designs' headings into `site_sections`. Waiting on others: Rose n' Cat and Joe come to Alex when ready. Closed: Penny's site never moves into BohdiAI; "Alex Scott" dropped everywhere.

---

## Standing lessons (carry forward every session)

- **Bohdi authors CONTENT ONLY.** Structure / nav / sections / treatments come from the family (renderer). Never from Bohdi.
- **Mood is public. Family is internal.** Public copy always says mood. Never expose "family" to a maker.
- **No hardcoded strings in the renderer. No inline styles. No shortcuts.** All strings through `DEFAULT_STRINGS`/`DEFAULT_COUNTS`. Dynamic per-instance values pass as CSS custom properties or `data-*` attributes.
- **Tests are part of done.** No feature is complete without tests. Backlog compounds. CI also gates 90% branch coverage on `lib/**/*.ts` (fake Supabase chain: `lib/market/market-db.test.ts`).
- **Ship complete, not partial.** Code + tests + types + verification before "done." Ask Alex if exception.
- **Verify visual work before commit.** Alex's eyes gate any change with visible output. Tests-green ≠ looks-right.
- **Verify against real code + live data, not memory.** Confident inference is the trap; the check IS the answer. When a live bug is murky, read the DB (the `listings`/`uploads`/`collections` rows tell you what actually happened) instead of guessing at the cause.
- **No silent failures — always display errors.** Every failure path shows the user something; handle both the `{ok:false}` branch AND a thrown rejection; a disabled control says what it's waiting for. Prefer graceful handling (accept a big photo and shrink it) over rejecting.
- **Render configured content in configured order.** Don't compute freshness, hide past items, or invent relative labels. The maker keeps content current.
- **Cite, don't paraphrase the spec.** Re-read + cite. Don't state from memory.
- **Don't inflate blockers.** Name only what actually blocks the run. Keep "block the test" separate from "make the site live."
- **A comparison set's job is variance ACROSS the set.** Best-of-each in isolation converges.
- **Hold the full direction; don't lurch off one comment.** A single remark adjusts within an established direction; only a full-direction change repoints.
- **When asked "is this a shortcut?", separate root-cause from convenient. Don't defend the easy version.**
- **Show, don't describe, for visible-output decisions.** Font, color, layout, treatment — render a specimen, don't argue.
- **Plain English in chat. One idea per line.** No doc-speak, no shorthand (`§6.2`, `D5`), no jargon Alex didn't use first.
- **No flattery. No reflexive agreement.** Rank ideas by merit, concede only on principle. **Don't invent under pushback.** Acknowledge and wait; don't fill the gap with a new guess.
- **Design discipline is not restraint.** Match the maker's real brand energy (Sheri's saturated maximalism). Don't default to clean/white/minimal.
- **A "structural fix" that only fixes the failure surface is a shortcut.** Audit every affected surface, not just the loud one.
- **Don't drift to serif; don't pick safe/lazy.** Bold, distinctive, executed — serif only where it earns it. Don't overcorrect to absolutes.
- **Every phase in the Full Plan updates its checkboxes as work lands.** Don't let the plan and reality drift.
- **Assets today's pipeline ignores may be tomorrow's editor fuel.** "Retire it" is not a safe default just because it's unused now. Ask whether the next phase earns it a job before pulling the plug.
- **Verify agent-reported state instead of trusting it.** Cowork reported "40 uncommitted files"; actual was 4. Read `git status` yourself, don't quote what the agent saw.
- **When Alex says stop / don't change, STOP — even mid-fix.** Session 73 repeatedly edited before he'd said go; he had to say "I did not tell you to change anything."
- **Don't grade your own homework on a comparison set.** Curation = viewing a wide set AND rejecting, including saying "I'm two short," not padding to a target count with near-identical grabs. Sameness across a set is STRUCTURAL (same kind of thing), not fixable by turning up a dial.
- **Never race Alex's dev server.** Don't force-kill his `next dev` or delete `.next` under a running server — it corrupts the Turbopack cache ("missing required error components"). Use the Bash tool for headless checks on your own port; let him own his server. **Ask before starting the dev server; never alongside the full test suite.** If it chokes, clear `.next/dev/cache` first.
- **Hand-built clients get their own layout, not the maker moods.** Alex had to say "we are NOT using the regular bohdiai formats." Don't drag onboarding/editor/mood/menu machinery into a hand-built site.
- **Look at processed media before it goes live.** Sample frames across the whole clip; "encoded with 0 errors" shipped smeared garbage once.
- **Never build to match a test.** A diff or a copy finds differences; ask whether the thing should exist before building it (Session 103 market tag).
- **The type check can pass falsely.** A broken `.next/dev/types` file stops `tsc` at syntax errors before it checks any code. Check with `.next` excluded.
- **Keep it short; ask when a remark has several readings.** Session 104: long option lists lost Alex ("STOP complicating this"); "it is a DEMO" had three readings and asking saved a wrong build.
- **No words in the code, ever (Alex 2026-10-14).** A new word gets a spot in `<design>/words.ts` and a row in every site's `site_words`. Never a fallback word.
- **Commit messages via a file on Windows.** PowerShell 5.1 splits an inline message with double quotes into pathspecs; a commit silently failed in Session 93. Use `git commit -F <file>` and check `git log` before merging.
- **Don't cause side effects Alex didn't ask for.** `seed-editor-test-owner.mjs` resets the password every run — running it "just for the admin row" clobbered his known password. Read what a script does before running it for a narrow purpose.

---

## Session log index

Full recaps live in `session-logs/session-NN.md`. This is the one-line index.

- Session 104 (2026-10-14): **No word written into the code (`site_words`, all 51 sites, proven identical); Saltmarsh polish from the review; Saturday fairs stay on Saturdays; About you quote/portrait/marquee screen.** Full recap: `session-logs/session-104.md`.
- Session 103 (2026-10-13): **Modular Plan steps 1–2 done (safeguards, homes), step 3 started: family pages read from the homes; Aurora copy proven identical; market tag added then removed.** Full recap: `session-logs/session-103.md`.
- Session 102 (2026-10-13): **Structural reckoning: content stuck in page records. Modular-Plan.md + Open-Work.md written.** Full recap: `session-logs/session-102.md`.
- Session 101 (2026-10-12): **Priorities reset; Saltmarsh public; demo always today; Market POS + home-screen app live; no codes at markets.** Full recap: `session-logs/session-101.md`.
- Session 100 (2026-10-10 → 10-12): **Maker checkup built (branch); Maker Market + Full $25 live; Saltmarsh merged as draft; shoreline market page (branch).** Full recap: `session-logs/session-100.md`.
- Sessions 86–99 (2026-09-23 → 10-09): **Cut-Pro LIVE, Cloudflare move, bohdiai.com rebuilt, backend + Catalog (86–90); tiers + pricing pages (91–92); Rustic Rhody, contractor designs, Joe public (93–95); Rose n' Cat + Market POS, not live (96–97); ember logo (98); Saltmarsh demo (99).** See `session-logs/session-86.md` – `session-99.md`.
- Sessions 0-85: Phase 0 through the Make It Yours walk (archetypes, families, sections, editor). See individual logs.
