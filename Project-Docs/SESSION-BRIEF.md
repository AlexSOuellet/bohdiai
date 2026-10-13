# Session Brief — BohdiAI

> **⚠ STOP — read `Project-Docs/Direction-2026-09-23.md` first.**
> The direction changed on 23 September 2026. The waitlist and the Beta phase are dropped (the
> waitlist has zero rows in it), there is no self-serve signup, and first clients are built by
> hand. Current state + next actions below are current (Session 86). `Full-Plan.md` still
> describes the previous plan and has not been rewritten yet — treat it as history.

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Full-Plan.md`. Every session reads it. Every session updates its checkboxes.

**Last updated:** 2026-10-13, Session 102 (end).

---

## Current state

**Session 102: no code shipped; the structure got reset.** Read `Modular-Plan.md` (the operative plan) and `Open-Work.md` (every open item) first. "Modular" means the content: every piece has its own home, designs are fixed shapes, and any site can switch family (cozy to modern) with everything landing in its section. Family and contractor sites keep their content in one page record, which breaks that; the newer maker sites store content correctly but hardcode headings. No custom work, ever: requests become shared added sections. Coastal (from Saltmarsh) and Sweet (from Rose n' Cat, name to confirm) families are planned, and background is its own setting. Recap: `session-logs/session-102.md`. **Start next session: Alex reviews Modular-Plan.md, then Phase 1 (safeguards).**

**Session 101 — Saltmarsh public; demo always today; Market POS live (phone screen, home-screen app, button per market).** Recap: `session-logs/session-101.md`. **Tomorrow (Alex): sales tax**, then market discounts + Publish on the setup page. Decided: demo POS starts empty; Buyer/Seller switch on phones, side by side on computers; market discount = one percent for the market, overridable per piece; Paid is enough (no Handed over step).

**Session 100 — maker checkup built (branch), Maker Market + Full $25 LIVE, Saltmarsh merged (still a draft).** Checkup at bohdiai.com/checkup on `feat/maker-checkup` (question bank + Haiku, code-decided offers and pricing, How I can help product cards); Saltmarsh shoreline market page on `feat/saltmarsh-market-page`. Recap + decisions: `session-logs/session-100.md`. **Start next session with the OPEN PIECES list below and prioritize with Alex.**

**Session 87 — the whole app now runs on Cloudflare Workers; Vercel serves nothing.** bohdiai.com, www, every shop subdomain and Cut-Pro are all served by the `bohdiai` Worker, verified live (Cut-Pro end to end, including a real photo estimate). `main` is current (fast-forwarded 552 commits). 1364 tests, tsc + lint clean. Runbook + lessons: `Cloudflare-Move.md`.

- **Direction (2026-09-29):** everything is manual for now. No onboarding, no editor, no automated builder. All site edits go through Alex. A maker **backend** (catalog, pricing, orders, customers, checkout, modeled on Penny's Decoupage Digital Designs site, minus digital downloads) WILL be built. The Facebook poster and financial report come after launch. Sites span service providers, makers and charities, inside the BohdiAI structure.
- **Deploy** = push to `main`. Cloudflare Workers Builds builds on its own Linux machines and deploys. Never build on the PC for production: OpenNext bakes `.env.local` into the bundle. Runtime keys live in the Worker's top-level "Variables and Secrets" (not the Build section), pasted without .env quotes.
- **Switched off** (404 on every host, code kept): onboarding, make-it-yours, dashboard/editor, sign-in/auth, library ingest, archetype-test (`DORMANT_PREFIXES`, lib/proxy-security.ts).
- **Security fixes landed:** the shop resolves from the real Host (`x-bohdi-shop` is retired and stripped); every public form is rate-limited through the Workers Rate Limiting binding (fails closed); deleted shops 404.
- **Workers constraints:** no filesystem at request time (legal templates are now bundled); photo shrink goes through the Images binding (`lib/images/shrink.ts`, 20MB max); edge `middleware.ts`, not `proxy.ts`.
- **Building a client:** content module in `scripts/sites/<site>.ts`, then `npx tsx --env-file=.env.local scripts/build-contractor-site.ts <site> --media <dir> [--contact-email x]`. This writes to the DB and storage, so no deploy is needed.

## Next actions

**Superseded by `Open-Work.md` (Session 102); kept for reference.** Priorities set with Alex, Session 101 (2026-10-12). Makers come first.

1. **Saltmarsh demo** (top). `feat/saltmarsh-market-page` pushed, not merged; the buy steps only show on a market day (ask before moving a demo market's date). Then the public demo (personal copies, welcome page, Learn).
1b. **Market app (Session 101, live):** Market POS (`/manage/markets/[id]/day` + `/manage/pos` home-screen app, 7-day sign-in) replaces Today + Sell (old screens still exist; retire once Alex is happy). **Next: sales tax (Alex: tomorrow)**, then on the setup page **market discounts** set by the seller (one percent off for the market, overridable per piece; no codes for buyers) and a **Publish** step; then **sales tax**: seller's home rate, each market its own rate via a state picker (editable for local add-ons), each seller picks tax included or on top, every sale records its tax and state, market results show tax collected per state. Open: does a buyer's order need a "Handed over" step after Paid?
2. **Staging** (moved up): own test domain, own Supabase, root domain as a setting. Detail: backend overview spec, "Staging".
3. **Alex's dashboard (admin)**: look at any client site as that client; site statistics; see each demo run and each checkup taken; send invites (if we go that way) and reset passwords; messages stored in the dashboard; add FAQs and other content. Client sites then need a "contact support" link. Not designed yet.
4. **Square card payments on BOTH Maker Market and Maker Full.** Alex is getting the Square developer account. Shopper pays on their phone; maker charges at the table with their own reader via the Square app.
5. **Invites**: talk through with Alex before anything (`fix/auth-link-24h` parked).
6. **Video**: price Cloudflare Stream first, then build. Then custom domains + status panel.
7. **True Coat estimator**: the visitor's picks (job, size, finish, range) go into the request email.
8. **Cloudflare cleanup**: step through it with Alex (redundant Cut-Pro route, trim Build variables, cancel Vercel + delete shop-proxy).
9. **Maker checkup** (marketing tool, waits): `feat/maker-checkup` pushed, not merged.
10. **Later:** contractor Lead Generation backend (makers first); bohdiai.com sample dates are past July dates; Classic Loafs shot catches the hero mid-fade.

**Not ours to push:** Rose n' Cat and Joe come to Alex when they're ready. Cut-Pro follow-ups are on Cut-Pro.
**Closed:** Penny's site never moves into BohdiAI. "Alex Scott" dropped everywhere (live). Facebook link in the bohdiai.com footer (live). Photo-hero and business-card branches deleted. Saltmarsh & Lace is LIVE (public, 2026-10-12).

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

- Session 102 (2026-10-13): **Business and design review, then structural reckoning: family and contractor content is stuck in page records. Modular-Plan.md + Open-Work.md written; Coastal/Sweet families; no custom work ever.** Full recap: `session-logs/session-102.md`.
- Session 101 (2026-10-12): **Priorities reset; Saltmarsh public; demo always today; Market POS + home-screen app live; no codes at markets.** Full recap: `session-logs/session-101.md`.
- Session 100 (2026-10-10 → 10-12): **Maker checkup built (branch); Maker Market + Full $25 live; Saltmarsh merged as draft; shoreline market page (branch).** Full recap: `session-logs/session-100.md`.
- Sessions 86–99 (2026-09-23 → 10-09): **Cut-Pro LIVE, Cloudflare move, bohdiai.com rebuilt, backend + Catalog (86–90); tiers + pricing pages (91–92); Rustic Rhody, contractor designs, Joe public (93–95); Rose n' Cat + Market POS, not live (96–97); ember logo (98); Saltmarsh demo (99).** See `session-logs/session-86.md` – `session-99.md`.
- Sessions 0-85: Phase 0 through the Make It Yours walk (archetypes, families, sections, editor). See individual logs.
