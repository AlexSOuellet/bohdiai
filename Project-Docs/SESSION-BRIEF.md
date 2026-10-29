# Session Brief — BohdiAI

> **⚠ START HERE (Session 119):** read `session-logs/session-118.md`, then `Open-Work.md` (items 3a, 49, 51, 54, 55).
> **Everything is merged and live; `main` is the only branch from Session 118.** bohdiai.com is the maker site with Free on the ladder and pricing; Spotlight's opening is back to Paper & Patina's show reel.
> **Unanswered (ask Alex, one at a time):** a page for each plan; the paid pricing cards that promise things that aren't built; Free's sign-up.
> **Agreed, not built: four more Free tools** (price tags and labels, supply shopping list, batch planner, care and thank-you cards). Ask where they go before building.
> **There is no public toolkit (Alex).** Never place a new backend screen without asking where it goes. Say "the maker", not "she".
> Payments are NOT being built (Alex: "we are building ADMIN").
> Saltmarsh IS Scenic. A change to what a plan shows must reach the moods, Scenic's shoreline code and Rose n' Cat's nursery.
> **When Alex says put it back the way it was, match the old one exactly: words, fonts, sizes. No additions.**
> Build everything Alex decides; ask in plain text (no button questions); ask before any change he didn't ask for.

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.
**Operative plan doc:** `Project-Docs/Modular-Plan.md`; open items in `Project-Docs/Open-Work.md`. Every session updates Open-Work as items land.

**Last updated:** 2026-10-29, Session 118 (end).

---

## Current state

**Session 118 (all merged and live): Maker Free and the tools merged; bohdiai.com is the maker site (no doors, service switched off, one line for non-maker sites, Free on the ladder and pricing); Spotlight's opening back to the show reel (the slammed name, its fonts, See the work ↓ to the gallery, one scrolling band).** Recap: `session-logs/session-118.md`.

**Session 117 (merged Session 118): Free's own Home (no events on Free); the tools as separate screens on every plan: Cost to make, Price it, Is it worth it? (replaces Market day), Monthly goal, Shipping, Describe it (the description writer, 30/100 a month), What to bring (Market and Full); Market day on Showcase events.** Recap: `session-logs/session-117.md`.

**Session 87 — the whole app now runs on Cloudflare Workers; Vercel serves nothing.** bohdiai.com, www, every shop subdomain and Cut-Pro are all served by the `bohdiai` Worker, verified live (Cut-Pro end to end, including a real photo estimate). `main` is current (fast-forwarded 552 commits). 1364 tests, tsc + lint clean. Runbook + lessons: `Cloudflare-Move.md`.

- **Direction (2026-09-29):** everything is manual for now. No onboarding, no editor, no automated builder. All site edits go through Alex. A maker **backend** (catalog, pricing, orders, customers, checkout, modeled on Penny's Decoupage Digital Designs site, minus digital downloads) WILL be built. The Facebook poster and financial report come after launch. Sites span service providers, makers and charities, inside the BohdiAI structure.
- **Deploy** = push to `main`. Cloudflare Workers Builds builds on its own Linux machines and deploys. Never build on the PC for production: OpenNext bakes `.env.local` into the bundle. Runtime keys live in the Worker's top-level "Variables and Secrets" (not the Build section), pasted without .env quotes.
- **Switched off** (404 on every host, code kept): onboarding, make-it-yours, dashboard/editor, sign-in/auth, library ingest, archetype-test (`DORMANT_PREFIXES`, lib/proxy-security.ts).
- **Security fixes landed:** the shop resolves from the real Host (`x-bohdi-shop` is retired and stripped); every public form is rate-limited through the Workers Rate Limiting binding (fails closed); deleted shops 404.
- **Workers constraints:** no filesystem at request time (legal templates are now bundled); photo shrink goes through the Images binding (`lib/images/shrink.ts`, 20MB max); edge `middleware.ts`, not `proxy.ts`.
- **Building a client:** content module in `scripts/sites/<site>.ts`, then `npx tsx --env-file=.env.local scripts/build-contractor-site.ts <site> --media <dir> [--contact-email x]`. This writes to the DB and storage, so no deploy is needed.

## Next actions

**Session 119:** Alex's answers on a page per plan, the pricing cards and Free's sign-up; then the four new Free tools (ask where they go). Still open: Which pieces earn on Full's Home, cancel down to Free, Free's sign-up with paying at sign-up, explainer videos and the demo, renaming `site_added_sections`, PayPal for Market, the Cloudflare analytics key (Alex).

**Every open item is in `Open-Work.md`; follow its Priority order.** Waiting on others: Joe's feedback, Renee's details.

---

## Standing lessons (carry forward every session)

- **No copies, no private sites for anything not real; act in place (Alex 2026-10-16).** And don't run tools that change things while Alex is still discussing a plan.
- **Before clearing an old record, check every reader of it** (search details were lost converting the old samples: the page looked identical, the reader nobody sees broke).
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
- **Verify agent-reported state instead of trusting it.** Cowork reported "40 uncommitted files"; actual was 4. Read `git status` yourself, don't quote what the agent saw.
- **When Alex says stop / don't change, STOP — even mid-fix.** Session 73 repeatedly edited before he'd said go; he had to say "I did not tell you to change anything."
- **Don't grade your own homework on a comparison set.** Curation = viewing a wide set AND rejecting, including saying "I'm two short," not padding to a target count with near-identical grabs. Sameness across a set is STRUCTURAL (same kind of thing), not fixable by turning up a dial.
- **Never race Alex's dev server.** Don't force-kill his `next dev` or delete `.next` under a running server — it corrupts the Turbopack cache ("missing required error components"). Use the Bash tool for headless checks on your own port; let him own his server. **Ask before starting the dev server; never alongside the full test suite.** If it chokes, clear `.next/dev/cache` first.
- **Hand-built clients get their own layout, not the maker moods.** Alex had to say "we are NOT using the regular bohdiai formats." Don't drag onboarding/editor/mood/menu machinery into a hand-built site.
- **Look at processed media before it goes live.** Sample frames across the whole clip; "encoded with 0 errors" shipped smeared garbage once.
- **Never build to match a test.** A diff or a copy finds differences; ask whether the thing should exist before building it (Session 103 market tag).
- **After a push, check the `test` check run as well as Workers Builds** (Session 113: tests failed unseen for three days). **Before stopping the dev server, read its tab's last lines and tell Alex** (it was closed under him once).
- **The type check can pass falsely.** A broken `.next/dev/types` file stops `tsc` before it checks any code (two Cloudflare builds failed on it, Session 108). Before every push: a temp tsconfig excluding `.next`, `--listFilesOnly` to confirm, then check the Workers Builds result (`gh api repos/{owner}/{repo}/commits/<sha>/check-runs`) before saying it's live. Run the e2e tests too when a marketing page changes.
- **No markers in test data (Alex 2026-10-18).** Never "(Claude)" or "Test" in a test submission's names or words: the build prints them on the page. Give Alex clickable local links, not screenshots.
- **Keep it short; ask when a remark has several readings.** Session 104: long option lists lost Alex ("STOP complicating this"); "it is a DEMO" had three readings and asking saved a wrong build.
- **Ornament-heavy looks need real art (Session 105).** Code-drawn ornament, paper and handwriting read thin ("scribble"); build structure in code, but take the art from real assets (Alex's papers, copyright-free scans). Look at your own full-page shots (`tmp/shot.mjs`) before handing over.
- **No words in the code, ever (Alex 2026-10-14).** A new word gets a spot in `<design>/words.ts` and a row in every site's `site_words`. Never a fallback word.
- **Commit messages via a file on Windows.** PowerShell 5.1 splits an inline message with double quotes into pathspecs; a commit silently failed in Session 93. Use `git commit -F <file>` and check `git log` before merging.
- **Play a rule back against the real data before building it (Session 112).** "Order only when the one at the market sells" was built to need a typed count; Saltmarsh's are all blank, so nothing changed and Alex had to raise it twice.
- **Shop pages' typed routes (Session 115).** The shop is served under `/storefront`, so a redirect to `/account` or `/cart` needs `as Route` or the Cloudflare build fails. Type-check with `.next/types` in and `.next/dev` + `next-env.d.ts` out.
- **Payments: security first (Alex 2026-10-21).** Never see cards or passwords (the processor's own pages/app), keys scrambled with a secret kept only in Cloudflare, server-only storage, fewest permissions, a sale counts only when the processor confirms it. After a push, check the Workers Builds check run exists, not just CI.
- **Don't cause side effects Alex didn't ask for.** `seed-editor-test-owner.mjs` resets the password every run — running it "just for the admin row" clobbered his known password. Read what a script does before running it for a narrow purpose.

---

## Session log index

Full recaps live in `session-logs/session-NN.md`. This is the one-line index.

- Session 118 (2026-10-29): **All merged and live: Maker Free and the tools; bohdiai.com is the maker site with Free; Spotlight's opening back to the show reel; four more Free tools agreed.** Full recap: `session-logs/session-118.md`.
- Session 117 (2026-10-28): **Redesign merged and live; Maker Free, the tools (Is it worth it?, Monthly goal, Shipping, Describe it, What to bring) and Market day on Showcase on `feat/maker-free`, unmerged; no events on Free.** Full recap: `session-logs/session-117.md`.
- Sessions 115–116 (2026-10-26 → 10-27): **Buyer accounts for Full (115); backend rebuilt by Claude: new look, short menu, My site, Home by plan, section switches, Customers; Paper & Patina on Spotlight/Showcase (116); merged S117.** See `session-logs/session-115.md`, `session-116.md`.
- Sessions 111–114 (2026-10-21 → 10-25): **Market plan live, Square cards, refunds (111); Events area, stock kinds (112); Free plan + ladder + tools decided (113); Rustic Charm & More, Full defined, Getting paid, PayPal test mode, Try on a look (114).** See `session-logs/session-111.md` – `session-114.md`.
- Sessions 109–110 (2026-10-19 → 10-20): **Showcase backend + gallery section + About you split into its homes (109); Showcase live, named social buttons, visitor numbers, new backend look; Market plan built (110).** See `session-logs/session-109.md`, `session-110.md`.
- Sessions 105–108 (2026-10-15 → 10-18): **Lineup reset, every family sells, one builder, Vintage (105); intake form live, big push merged (106); Scenic + Spotlight, scene library, /looks (107); bohdiai.com split into parent + makers/service arms (108).** See `session-logs/session-105.md` – `session-108.md`.
- Sessions 100–104 (2026-10-10 → 10-14): **Maker checkup, Market + Full (100); Saltmarsh public, market POS (101); Modular-Plan + Open-Work (102); safeguards + homes (103); no word written into the code, `site_words` on all sites (104).** See `session-logs/session-100.md` – `session-104.md`.
- Sessions 86–99 (2026-09-23 → 10-09): **Cut-Pro LIVE, Cloudflare move, bohdiai.com rebuilt, backend + Catalog (86–90); tiers + pricing pages (91–92); Rustic Rhody, contractor designs, Joe public (93–95); Rose n' Cat + Market POS, not live (96–97); ember logo (98); Saltmarsh demo (99).** See `session-logs/session-86.md` – `session-99.md`.
- Sessions 0-85: Phase 0 through the Make It Yours walk (archetypes, families, sections, editor). See individual logs.
