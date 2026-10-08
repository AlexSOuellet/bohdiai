# Session Brief — BohdiAI

> **⚠ STOP — read `Project-Docs/Direction-2026-09-23.md` first.**
> The direction changed on 23 September 2026. The waitlist and the Beta phase are dropped (the
> waitlist has zero rows in it), there is no self-serve signup, and first clients are built by
> hand. Current state + next actions below are current (Session 86). `Full-Plan.md` still
> describes the previous plan and has not been rewritten yet — treat it as history.

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Full-Plan.md`. Every session reads it. Every session updates its checkboxes.

**Last updated:** 2026-10-08, Session 98.

---

## Current state

**Session 98 — new logo + sticky header LIVE; Renee is in.** Ember wordmark (`components/Wordmark.tsx`: Bohdi with a flame for the i dot) in header/footer/legal pages, ember tab icon; sticky header with a solid strip once scrolled. Cards, logo files, Facebook cover/profile in `Design files/` (untracked). Renee signed in 2026-10-08. 24-hour invite wording parked on `fix/auth-link-24h` — merge only after Supabase "Email OTP Expiration" = 86400. Recap: `session-logs/session-98.md`.

**Session 97 — Rose n' Cat is a working shop + the first Market POS (all LIVE, switched on for her).** Cart + order requests (no card yet; emails go to ALEX), Orders, Terms/Privacy links, QR codes, New arrival + "Just born", Promotions (sale or codes, never stacked), **Markets** (replaced Market dates; private costs/organizer/notes/review; anon read on `events` dropped), **market shop** (per-market QR page, holds paid by Venmo/Cash App/Zelle/cash, Getting paid, Today). Design: `docs/superpowers/specs/2026-10-07-market-pos-design.md`. Session 96 built the site itself (boutique archetype, nursery design). Recaps: `session-logs/session-97.md`, `session-96.md`.

**Session 95 — homepage reshaped; three contractor sites with their own designs; Joe's site PUBLIC; Contractor Lead Generation $10.** Hero browser = samples only; clients in an arrow slideshow; sample cards one per tier (Maker Showcase, Maker Lite, Contractor Lead Generation, Contractor Full) + "See more samples" → `/samples`. Contractor designs (`design` in the content): `yard` Cut-Pro, `atelier` True Coat (Contractor Full sample: estimator, calendar, FAQ), `ridge` Halfmoon (Contractor Lead Generation sample), `harbor` Mazzone (Joe's REAL site, public, real facts only; estimates still email Alex). Every section opener varied — no label-over-title. Draft (hidden) sites + private preview links exist (`--draft`, `scripts/site-visibility.ts`), but prod preview links 404 until the Worker's BACKEND_SESSION_SECRET matches .env.local. **Plans:** Contractor Lite → Contractor Lead Generation, $10/$100; ALL sites will get a backend (minimal for Showcase + Lead Generation); Alex considering cutting Maker Lite (undecided). Homepage desk hero still parked (`feat/site-photo-hero`); `fix/bulletin-taken-tab` still parked. Recap: `session-logs/session-95.md`.

**Session 87 — the whole app now runs on Cloudflare Workers; Vercel serves nothing.** bohdiai.com, www, every shop subdomain and Cut-Pro are all served by the `bohdiai` Worker, verified live (Cut-Pro end to end, including a real photo estimate). `main` is current (fast-forwarded 552 commits). 1364 tests, tsc + lint clean. Runbook + lessons: `Cloudflare-Move.md`.

- **Direction (2026-09-29):** everything is manual for now. No onboarding, no editor, no automated builder. All site edits go through Alex. A maker **backend** (catalog, pricing, orders, customers, checkout, modeled on Penny's Decoupage Digital Designs site, minus digital downloads) WILL be built. The Facebook poster and financial report come after launch. Sites span service providers, makers and charities, inside the BohdiAI structure.
- **Deploy** = push to `main`. Cloudflare Workers Builds builds on its own Linux machines and deploys. Never build on the PC for production: OpenNext bakes `.env.local` into the bundle. Runtime keys live in the Worker's top-level "Variables and Secrets" (not the Build section), pasted without .env quotes.
- **Switched off** (404 on every host, code kept): onboarding, make-it-yours, dashboard/editor, sign-in/auth, library ingest, archetype-test (`DORMANT_PREFIXES`, lib/proxy-security.ts).
- **Security fixes landed:** the shop resolves from the real Host (`x-bohdi-shop` is retired and stripped); every public form is rate-limited through the Workers Rate Limiting binding (fails closed); deleted shops 404.
- **Workers constraints:** no filesystem at request time (legal templates are now bundled); photo shrink goes through the Images binding (`lib/images/shrink.ts`, 20MB max); edge `middleware.ts`, not `proxy.ts`.
- **Building a client:** content module in `scripts/sites/<site>.ts`, then `npx tsx --env-file=.env.local scripts/build-contractor-site.ts <site> --media <dir> [--contact-email x]`. This writes to the DB and storage, so no deploy is needed.

## Next actions

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
- **No flattery. No reflexive agreement.** Rank ideas by merit, concede only on principle.
- **Don't invent under pushback.** Acknowledge and wait; don't fill the gap with a new guess.
- **Design discipline is not restraint.** Match the maker's real brand energy (Sheri's saturated maximalism). Don't default to clean/white/minimal.
- **A "structural fix" that only fixes the failure surface is a shortcut.** Audit every affected surface, not just the loud one.
- **Don't drift to serif; don't pick safe/lazy.** Bold, distinctive, executed — serif only where it earns it. Don't overcorrect to absolutes.
- **Every phase in the Full Plan updates its checkboxes as work lands.** Don't let the plan and reality drift.
- **Assets today's pipeline ignores may be tomorrow's editor fuel.** "Retire it" is not a safe default just because it's unused now. Ask whether the next phase earns it a job before pulling the plug.
- **Verify agent-reported state instead of trusting it.** Cowork reported "40 uncommitted files"; actual was 4. Read `git status` yourself, don't quote what the agent saw.
- **When Alex says stop / don't change, STOP — even mid-fix.** Session 73 repeatedly edited before he'd said go; he had to say "I did not tell you to change anything."
- **Don't grade your own homework on a comparison set.** Curation = viewing a wide set AND rejecting, including saying "I'm two short," not padding to a target count with near-identical grabs. Sameness across a set is STRUCTURAL (same kind of thing), not fixable by turning up a dial.
- **Never race Alex's dev server.** Don't force-kill his `next dev` or delete `.next` under a running server — it corrupts the Turbopack cache ("missing required error components"). Use the Bash tool for headless checks on your own port; let him own his server.
- **Hand-built clients get their own layout, not the maker moods.** Alex had to say "we are NOT using the regular bohdiai formats." Don't drag onboarding/editor/mood/menu machinery into a hand-built site.
- **Look at processed media before it goes live.** Sample frames across the whole clip; "encoded with 0 errors" shipped smeared garbage once.
- **Ask before starting the dev server; never alongside the full test suite.** If it chokes, clear `.next/dev/cache` first.
- **Commit messages via a file on Windows.** PowerShell 5.1 splits an inline message with double quotes into pathspecs; a commit silently failed in Session 93. Use `git commit -F <file>` and check `git log` before merging.
- **Don't cause side effects Alex didn't ask for.** `seed-editor-test-owner.mjs` resets the password every run — running it "just for the admin row" clobbered his known password. Read what a script does before running it for a narrow purpose.

---

## Session log index

Full recaps live in `session-logs/session-NN.md`. This is the one-line index.

- Session 98 (2026-10-08): **Ember logo + sticky header LIVE; business cards, logo files, Facebook cover; Renee in; 24h invite parked.** Full recap: `session-logs/session-98.md`.
- Sessions 96–97 (2026-10-06 → 10-07): **Rose n' Cat LIVE (boutique/nursery), then cart, orders, promotions, new arrivals, QR, Markets, market shop.** See `session-logs/session-96.md`, `session-97.md`.
- Sessions 93–95 (2026-10-04 → 10-06): **Showcase marquee + builder login (93); bulletin board design, Rustic Rhody (94); homepage reshaped, three contractor designs, Joe public, Lead Generation $10, business cards (95).** See `session-logs/session-93.md` – `session-95.md`.
- Sessions 91–92 (2026-10-02 → 10-03): **Tiers + prices agreed; pricing pages + FAQ live; Showcase tier + business card site (Rustic Rhody).** See `session-logs/session-91.md` and the tiers / business card specs.
- Sessions 89–90 (2026-09-30 → 10-01): **CI green; maker backend designed, foundation (1a) + Catalog (1b) live; auto sign-out.** See `session-logs/session-89.md`, `session-90.md`.
- Sessions 86–88 (2026-09-23 → 09-29): **Cut-Pro built by hand and LIVE (86); whole app moved from Vercel to Cloudflare Workers (87); bohdiai.com rebuilt as a web developer site (88).** See `session-logs/session-86.md` – `session-88.md`.
- Sessions 0-85: Phase 0 through the Make It Yours walk (archetypes, families, sections, editor). See individual logs.
