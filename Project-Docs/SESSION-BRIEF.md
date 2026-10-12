# Session Brief — BohdiAI

> **⚠ STOP — read `Project-Docs/Direction-2026-09-23.md` first.**
> The direction changed on 23 September 2026. The waitlist and the Beta phase are dropped (the
> waitlist has zero rows in it), there is no self-serve signup, and first clients are built by
> hand. Current state + next actions below are current (Session 86). `Full-Plan.md` still
> describes the previous plan and has not been rewritten yet — treat it as history.

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Full-Plan.md`. Every session reads it. Every session updates its checkboxes.

**Last updated:** 2026-10-12, Session 100.

---

## Current state

**Session 100 — maker checkup built (branch), Maker Market + Full $25 LIVE, Saltmarsh merged (still a draft).** Checkup at bohdiai.com/checkup on `feat/maker-checkup` (question bank + Haiku, code-decided offers and pricing, How I can help product cards); Saltmarsh shoreline market page on `feat/saltmarsh-market-page`. Recap + decisions: `session-logs/session-100.md`. **Start next session with the OPEN PIECES list below and prioritize with Alex.**

**Session 87 — the whole app now runs on Cloudflare Workers; Vercel serves nothing.** bohdiai.com, www, every shop subdomain and Cut-Pro are all served by the `bohdiai` Worker, verified live (Cut-Pro end to end, including a real photo estimate). `main` is current (fast-forwarded 552 commits). 1364 tests, tsc + lint clean. Runbook + lessons: `Cloudflare-Move.md`.

- **Direction (2026-09-29):** everything is manual for now. No onboarding, no editor, no automated builder. All site edits go through Alex. A maker **backend** (catalog, pricing, orders, customers, checkout, modeled on Penny's Decoupage Digital Designs site, minus digital downloads) WILL be built. The Facebook poster and financial report come after launch. Sites span service providers, makers and charities, inside the BohdiAI structure.
- **Deploy** = push to `main`. Cloudflare Workers Builds builds on its own Linux machines and deploys. Never build on the PC for production: OpenNext bakes `.env.local` into the bundle. Runtime keys live in the Worker's top-level "Variables and Secrets" (not the Build section), pasted without .env quotes.
- **Switched off** (404 on every host, code kept): onboarding, make-it-yours, dashboard/editor, sign-in/auth, library ingest, archetype-test (`DORMANT_PREFIXES`, lib/proxy-security.ts).
- **Security fixes landed:** the shop resolves from the real Host (`x-bohdi-shop` is retired and stripped); every public form is rate-limited through the Workers Rate Limiting binding (fails closed); deleted shops 404.
- **Workers constraints:** no filesystem at request time (legal templates are now bundled); photo shrink goes through the Images binding (`lib/images/shrink.ts`, 20MB max); edge `middleware.ts`, not `proxy.ts`.
- **Building a client:** content module in `scripts/sites/<site>.ts`, then `npx tsx --env-file=.env.local scripts/build-contractor-site.ts <site> --media <dir> [--contact-email x]`. This writes to the DB and storage, so no deploy is needed.

## Next actions

**OPEN PIECES — status (2026-10-12). Prioritize these with Alex at the start of Session 101.**

A. **Maker checkup** — `feat/maker-checkup`, pushed, not merged. Works end to end locally (~1¢/run). Open: Alex's test runs + review; beehiiv API key + Publication ID (Alex); "Learn more" goes to /makers (no product pages); welcome/goal wording to match the ad line; not linked from the site yet. Notes: `Need-A-Site-App.md` on that branch.
B. **Saltmarsh market page** — `feat/saltmarsh-market-page`, pushed, not merged. Before-day view checked; buy steps only show on a market day (ask Alex before moving a demo market's date). Needed so the demo shows Maker Market properly.
C. **Square card payments** (top build) — see 00000 below. Blocked on Alex: Square developer account.
D. **Maker Market follow-ups** — card-taking at markets: Full or Maker Market? (Alex thinking). Market app beef-ups under discussion (buyer "tell me where you'll be next" tick, custom orders with deposit, application tracker, what to bring). `Market-Plan.md` lives on `feat/maker-checkup`.
E. **Public demo** (from Session 99: personal copies, welcome page, Learn) — not started.
F. **Parked branches** (all pushed as backup, none merged): `feat/site-facebook-link` (Alex said hold), `fix/auth-link-24h` (waits on Supabase OTP 86400), `feat/site-photo-hero`, `fix/bulletin-taken-tab`. Everything below (invites, Rose n' Cat, Joe, estimator email, minimal backend, preview-link secret, video, staging, bohdiai.com loose ends, Cloudflare cleanup, Cut-Pro, maker backend scope, MY ADMIN) is unchanged from before.

00000. **Square card payments for the market app — SOONER THAN LATER (Alex, 2026-10-12).** Belongs on Maker Market (was Lite), not just Full: most makers already use Square. Two pieces, money straight to the maker's own Square: (1) shopper self-checkout pays by card on their phone via Square's web card form + Apple/Google Pay, sold the moment Square confirms (no "I paid"); (2) maker charges at the table: market app opens the Square app with amount + piece filled in, maker uses their own reader, Square returns to the app and the sale lands under that market. Needs: a BohdiAI Square developer account + "Connect Square" per maker (OAuth). Later, maybe: matching sales rung up only inside Square.
0000. **Invites:** Alex sets Supabase Email OTP Expiration = 86400 → merge `fix/auth-link-24h`. Then the maker-started sign-up ("First time here?", six-digit code, email must already be on a shop) — Alex liked it, not a go yet. Links last 1 hour today; an existing unconfirmed account needs a recovery token sent with invite wording (`invite-maker.ts` sends reset wording).
000. **Rose n' Cat:** Renee is IN (signed in 2026-10-08). Fill Getting paid (only cash shows); tick babies per market; real names/prices. Open asks to Alex: analytics (own cookieless counter?), Square card (build switched off or wait for keys?), a test market to try a buyer order. Next build: **Market POS piece 3 — results** (own design pass). Privacy template's "analytics cookie" line is wrong; fix with analytics.
00. **Joe (Mazzone):** his feedback on the site; switch estimate emails to his address when he's in; give his page its own section openers (True Coat and Halfmoon got theirs); his own job photos when he has them.
01a. **Estimator → request email:** the choices a visitor taps (job, size, finish, range) should travel into the estimate email. Offered, not built.
01b. **Minimal backend for Maker Showcase + Contractor Lead Generation** — Alex: every site gets a backend; "minimal" is undesigned.
01c. **Cloudflare:** set the Worker's BACKEND_SESSION_SECRET to match .env.local (preview links for hidden sites).
02. **Maker backend 1c — Video** (Cloudflare Stream; confirm cost first), then 1d Custom domains + status panel (custom domains must pass `platformCredit={false}` to both footers so the "Empowered by BohdiAI" line comes off — tiers spec). Options/combinations get their real test with the first real client who sells sizes/scents.
01. **Staging before the first paying customer's site goes live** (agreed 2026-10-02; Alex: pay buttons don't need it): own test domain, own Supabase (after Rhody Strong is deleted), root domain as a setting. Detail: backend overview spec, "Staging".
0. **bohdiai.com loose ends (Session 89 cleared most):** CI green again (2026-09-30); prod inquiry confirmed in Alex's inbox; Classic Loafs reverted to its original build. Still open (logo DONE Session 98; Stripe pay buttons are OFF the plan, payment links by hand): the Classic Loafs work shot catches the hero words mid-fade (re-time if Alex wants); sample find-us dates are all past July dates; drop "(publicly: Alex Scott)" from privacy/terms? JSON-LD founder name?
1. **Cloudflare cleanup (Alex):** delete the redundant Cut-Pro route; trim Build variables to NODE_VERSION + the two NEXT_PUBLIC_*; after a few quiet days cancel Vercel and delete `shop-proxy` together.
2. **Cut-Pro follow-ups:** their copy review (crew-photo names, services list, "since 2009"); better originals from their phones; review the privacy-page wording for a contractor.
4. **Maker backend:** scope it against Penny's site. Open question: does Penny's store move into BohdiAI or stay standalone?
6. **MY ADMIN — stays in the plan, lower priority (Alex, 2026-09-30).** For now client sites are built here with Claude, following the BohdiAI rules (the Bohdi builder can still be run by script for a fast first draft). The admin comes back later; nothing about its shape is decided.

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
- **Commit messages via a file on Windows.** PowerShell 5.1 splits an inline message with double quotes into pathspecs; a commit silently failed in Session 93. Use `git commit -F <file>` and check `git log` before merging.
- **Don't cause side effects Alex didn't ask for.** `seed-editor-test-owner.mjs` resets the password every run — running it "just for the admin row" clobbered his known password. Read what a script does before running it for a narrow purpose.

---

## Session log index

Full recaps live in `session-logs/session-NN.md`. This is the one-line index.

- Session 100 (2026-10-10 → 10-12): **Maker checkup built (branch); Maker Market + Full $25 live; Saltmarsh merged as draft; shoreline market page (branch).** Full recap: `session-logs/session-100.md`.
- Sessions 86–99 (2026-09-23 → 10-09): **Cut-Pro LIVE, Cloudflare move, bohdiai.com rebuilt, backend + Catalog (86–90); tiers + pricing pages (91–92); Rustic Rhody, contractor designs, Joe public (93–95); Rose n' Cat + Market POS, not live (96–97); ember logo (98); Saltmarsh demo (99).** See `session-logs/session-86.md` – `session-99.md`.
- Sessions 0-85: Phase 0 through the Make It Yours walk (archetypes, families, sections, editor). See individual logs.
