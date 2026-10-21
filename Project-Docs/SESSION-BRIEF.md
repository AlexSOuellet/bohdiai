# Session Brief — BohdiAI

> **⚠ START HERE (Session 112):** read `session-logs/session-111.md`, then `Plan-Backends.md`, then `Open-Work.md`. Everything is merged and live; `main` is the only branch.
> **First thing (Alex):** Orders on the Market plan, Refund in Orders, a Sales list with Refund on each market's page. Payments: security first (Alex's #1).
> A change to what a plan shows must also be checked in the custom designs (Saltmarsh, Rose n' Cat).
> Build everything Alex decides; ask in plain text (no button questions); ask before any change he didn't ask for.

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Modular-Plan.md`; open items in `Project-Docs/Open-Work.md`. Every session updates Open-Work as items land.

**Last updated:** 2026-10-21, Session 111 (end).

---

## Current state

**Session 111: Market plan merged and live; Saltmarsh is the Scenic mood, drawn by its own design (the Scenic mood now uses the shoreline design); one shared social-button look; 42 test sites purged; the demo's market stays on today (timer bug fixed); the market app takes cards through the maker's own Square (Connect, location, Card hand-off, confirmed by Square, locked keys), haggling (Change price) and Refund on the market day.** Alex's Rustic Rhody Square is connected to Saltmarsh for testing: disconnect after. Recap: `session-logs/session-111.md`.

**Session 110: Showcase backend merged and live, with the footer's named social buttons, visitor numbers (Cloudflare, no cookies; Full keeps its months) and the backend's new look. The Market plan defined and built (merged and live in Session 111): market stock counts and "How it sold", options sell (market app, online cart, Saltmarsh), collections Full only, testimonials up to three on Market, the demo's "Move to <plan> now".** Waiting on Alex: the Cloudflare key for visitor numbers. Recap: `session-logs/session-110.md`.

**Session 87 — the whole app now runs on Cloudflare Workers; Vercel serves nothing.** bohdiai.com, www, every shop subdomain and Cut-Pro are all served by the `bohdiai` Worker, verified live (Cut-Pro end to end, including a real photo estimate). `main` is current (fast-forwarded 552 commits). 1364 tests, tsc + lint clean. Runbook + lessons: `Cloudflare-Move.md`.

- **Direction (2026-09-29):** everything is manual for now. No onboarding, no editor, no automated builder. All site edits go through Alex. A maker **backend** (catalog, pricing, orders, customers, checkout, modeled on Penny's Decoupage Digital Designs site, minus digital downloads) WILL be built. The Facebook poster and financial report come after launch. Sites span service providers, makers and charities, inside the BohdiAI structure.
- **Deploy** = push to `main`. Cloudflare Workers Builds builds on its own Linux machines and deploys. Never build on the PC for production: OpenNext bakes `.env.local` into the bundle. Runtime keys live in the Worker's top-level "Variables and Secrets" (not the Build section), pasted without .env quotes.
- **Switched off** (404 on every host, code kept): onboarding, make-it-yours, dashboard/editor, sign-in/auth, library ingest, archetype-test (`DORMANT_PREFIXES`, lib/proxy-security.ts).
- **Security fixes landed:** the shop resolves from the real Host (`x-bohdi-shop` is retired and stripped); every public form is rate-limited through the Workers Rate Limiting binding (fails closed); deleted shops 404.
- **Workers constraints:** no filesystem at request time (legal templates are now bundled); photo shrink goes through the Images binding (`lib/images/shrink.ts`, 20MB max); edge `middleware.ts`, not `proxy.ts`.
- **Building a client:** content module in `scripts/sites/<site>.ts`, then `npx tsx --env-file=.env.local scripts/build-contractor-site.ts <site> --media <dir> [--contact-email x]`. This writes to the DB and storage, so no deploy is needed.

## Next actions

**Session 112 (first thing, Alex):** Orders on the Market plan; Refund in Orders; a Sales list with Refund on each market's page; ask whether the market day keeps its Refund. Then: Alex disconnects his Square and refunds his $1 tests; remove test sale #1037 (asked); the pricing cards (asked); the Cloudflare analytics key (Alex); define Full; paying at sign-up (top). Later (Alex): Square refund notices; Saltmarsh's products with Alex's own photos after he tests Full; then the demo's personal copies.

**Every open item is in `Open-Work.md`; follow its Priority order.** Next: the maker-backend screens with try on a look for Full (priority 4), then Alex's admin. Waiting on Alex: the purge (after testing); whether Paper & Patina moves onto Spotlight. Waiting on others: Joe's feedback, Renee's details.

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
- **Every phase in the Full Plan updates its checkboxes as work lands.** Don't let the plan and reality drift.
- **Assets today's pipeline ignores may be tomorrow's editor fuel.** "Retire it" is not a safe default just because it's unused now. Ask whether the next phase earns it a job before pulling the plug.
- **Verify agent-reported state instead of trusting it.** Cowork reported "40 uncommitted files"; actual was 4. Read `git status` yourself, don't quote what the agent saw.
- **When Alex says stop / don't change, STOP — even mid-fix.** Session 73 repeatedly edited before he'd said go; he had to say "I did not tell you to change anything."
- **Don't grade your own homework on a comparison set.** Curation = viewing a wide set AND rejecting, including saying "I'm two short," not padding to a target count with near-identical grabs. Sameness across a set is STRUCTURAL (same kind of thing), not fixable by turning up a dial.
- **Never race Alex's dev server.** Don't force-kill his `next dev` or delete `.next` under a running server — it corrupts the Turbopack cache ("missing required error components"). Use the Bash tool for headless checks on your own port; let him own his server. **Ask before starting the dev server; never alongside the full test suite.** If it chokes, clear `.next/dev/cache` first.
- **Hand-built clients get their own layout, not the maker moods.** Alex had to say "we are NOT using the regular bohdiai formats." Don't drag onboarding/editor/mood/menu machinery into a hand-built site.
- **Look at processed media before it goes live.** Sample frames across the whole clip; "encoded with 0 errors" shipped smeared garbage once.
- **Never build to match a test.** A diff or a copy finds differences; ask whether the thing should exist before building it (Session 103 market tag).
- **The type check can pass falsely.** A broken `.next/dev/types` file stops `tsc` before it checks any code (two Cloudflare builds failed on it, Session 108). Before every push: a temp tsconfig excluding `.next`, `--listFilesOnly` to confirm, then check the Workers Builds result (`gh api repos/{owner}/{repo}/commits/<sha>/check-runs`) before saying it's live. Run the e2e tests too when a marketing page changes.
- **No markers in test data (Alex 2026-10-18).** Never "(Claude)" or "Test" in a test submission's names or words: the build prints them on the page. Give Alex clickable local links, not screenshots.
- **Keep it short; ask when a remark has several readings.** Session 104: long option lists lost Alex ("STOP complicating this"); "it is a DEMO" had three readings and asking saved a wrong build.
- **Ornament-heavy looks need real art (Session 105).** Code-drawn ornament, paper and handwriting read thin ("scribble"); build structure in code, but take the art from real assets (Alex's papers, copyright-free scans). Look at your own full-page shots (`tmp/shot.mjs`) before handing over.
- **No words in the code, ever (Alex 2026-10-14).** A new word gets a spot in `<design>/words.ts` and a row in every site's `site_words`. Never a fallback word.
- **Commit messages via a file on Windows.** PowerShell 5.1 splits an inline message with double quotes into pathspecs; a commit silently failed in Session 93. Use `git commit -F <file>` and check `git log` before merging.
- **Payments: security first (Alex 2026-10-21).** Never see cards or passwords (the processor's own pages/app), keys scrambled with a secret kept only in Cloudflare, server-only storage, fewest permissions, a sale counts only when the processor confirms it. After a push, check the Workers Builds check run exists, not just CI.
- **Don't cause side effects Alex didn't ask for.** `seed-editor-test-owner.mjs` resets the password every run — running it "just for the admin row" clobbered his known password. Read what a script does before running it for a narrow purpose.

---

## Session log index

Full recaps live in `session-logs/session-NN.md`. This is the one-line index.

- Session 111 (2026-10-21): **Market plan live; Saltmarsh = Scenic via its own design; shared social buttons; 42 test sites purged; demo market-day timer fixed; Square cards in the market app (locked keys, confirmed by Square), haggling, refunds.** Full recap: `session-logs/session-111.md`.
- Session 110 (2026-10-20): **Showcase backend live (named social buttons, visitor numbers, new backend look); Market plan built on `feat/market-plan`, unmerged (stock at markets, options sell, collections Full only, testimonials up to three).** Full recap: `session-logs/session-110.md`.
- Session 109 (2026-10-19): **Showcase backend + gallery section + About you split into its homes; Cancel, Billing, Contact support, plan emails; on `feat/showcase-backend`, unmerged.** Full recap: `session-logs/session-109.md`.
- Session 108 (2026-10-18): **bohdiai.com split live (parent + makers/service arms); makers arm for an automated build, pay at sign-up; three build bugs fixed; /samples retired.** Full recap: `session-logs/session-108.md`.
- Session 107 (2026-10-17): **Priority reset; Scenic + Spotlight live; Scenic photos/clips + generated searchable scene library; Classic Loafs = all-moods sample (/looks live); bohdiai.com parent + makers/service arms decided.** Full recap: `session-logs/session-107.md`.
- Session 106 (2026-10-16): **Intake form live (account, plan, mood per family); submission → site with Claude-drafted words; big push merged; Publish button; free sites; old samples converted in place; search details from the homes.** Full recap: `session-logs/session-106.md`.
- Session 105 (2026-10-15): **Lineup reset (makers first, family + skin, Scenic/Spotlight, custom sites); every family sells; one builder; Spotlight trial; Vintage begun from Alex's references. All on unmerged branches.** Full recap: `session-logs/session-105.md`.
- Session 104 (2026-10-14): **No word written into the code (`site_words`, all 51 sites, proven identical); Saltmarsh polish from the review; Saturday fairs stay on Saturdays; About you quote/portrait/marquee screen.** Full recap: `session-logs/session-104.md`.
- Sessions 101–103 (2026-10-12 → 10-13): **priorities reset, Saltmarsh public, market POS (101); structural reckoning, Modular-Plan.md + Open-Work.md (102); safeguards + homes, family pages read from the homes (103).** See `session-logs/session-101.md` – `session-103.md`.
- Session 100 (2026-10-10 → 10-12): **Maker checkup built (branch); Maker Market + Full $25 live; Saltmarsh merged as draft; shoreline market page (branch).** Full recap: `session-logs/session-100.md`.
- Sessions 86–99 (2026-09-23 → 10-09): **Cut-Pro LIVE, Cloudflare move, bohdiai.com rebuilt, backend + Catalog (86–90); tiers + pricing pages (91–92); Rustic Rhody, contractor designs, Joe public (93–95); Rose n' Cat + Market POS, not live (96–97); ember logo (98); Saltmarsh demo (99).** See `session-logs/session-86.md` – `session-99.md`.
- Sessions 0-85: Phase 0 through the Make It Yours walk (archetypes, families, sections, editor). See individual logs.
