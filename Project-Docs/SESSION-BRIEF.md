# Session Brief — BohdiAI

> **⚠ STOP — read `Project-Docs/Direction-2026-09-23.md` first.**
> The direction changed on 23 September 2026. The waitlist and the Beta phase are dropped (the
> waitlist has zero rows in it), there is no self-serve signup, and first clients are built by
> hand. Current state + next actions below are current (Session 86). `Full-Plan.md` still
> describes the previous plan and has not been rewritten yet — treat it as history.

**Purpose:** the operational state a fresh session needs to start — current state, next actions, and the standing lessons that carry forward. **Stays under 100 lines.** Detailed per-session recaps live in `session-logs/session-NN.md`. At the end of a session, write the recap there, add a one-line entry to the index at the bottom of this file, and update only the Current State + Next Actions sections here. Do not paste full recaps back.

**Operative plan doc:** `Project-Docs/Full-Plan.md`. Every session reads it. Every session updates its checkboxes.

**Last updated:** 2026-09-30, Session 89.

---

## Current state

**Session 89 — maker backend designed; foundation live.** CI green again; Classic Loafs reverted to its original build; MY ADMIN deferred. Backend spec: `docs/superpowers/specs/2026-09-30-maker-backend-overview.md` + `...-piece-1-design.md` (modeled on Penny's admin, feature switches per site, clients manage lists/facts, Alex keeps words/look, app.bohdiai.com). Plan 1a (foundation: sign-in on app host, invites via `scripts/invite-maker.ts`, feature switches via `scripts/set-feature.ts`, Penny-style shell, home) built, reviewed, live-tested by Alex. Full recap: `session-logs/session-89.md`.

**Session 88 — bohdiai.com rebuilt as a web developer site and LIVE.** Slogan "If you make it, bake it, fix it or fund it, we build it for you"; hero browser cycles real screenshots (Cut-Pro, Penny's decodigitaldesigns.com, samples Classic Loafs / Twilight to Darkness / Heavenly Scents); client spreads carry Sheri + Chris (Cut-Pro) and Penny testimonials with read-more; new about (IT trainer 30+ years, The Bohdi Way), signed "Alex"; no AI talk (test enforces it); no pricing, two price promises; contact form → `/api/inquiry` → alex@bohdiai.com (Reply-To = sender; phone + best-way-to-reach). Waitlist stack, founder counter, Skool, fake stores deleted (waitlist table kept). Spec/plan: `docs/superpowers/specs|plans/2026-09-29-bohdiai-com-rebuild*`. 1399 tests, tsc + lint clean. Full recap: `session-logs/session-88.md`.

**Session 87 — the whole app now runs on Cloudflare Workers; Vercel serves nothing.** bohdiai.com, www, every shop subdomain and Cut-Pro are all served by the `bohdiai` Worker, verified live (Cut-Pro end to end, including a real photo estimate). `main` is current (fast-forwarded 552 commits). 1364 tests, tsc + lint clean. Runbook + lessons: `Cloudflare-Move.md`.

- **Direction (2026-09-29):** everything is manual for now. No onboarding, no editor, no automated builder. All site edits go through Alex. A maker **backend** (catalog, pricing, orders, customers, checkout, modeled on Penny's Decoupage Digital Designs site, minus digital downloads) WILL be built. The Facebook poster and financial report come after launch. Sites span service providers, makers and charities, inside the BohdiAI structure.
- **Deploy** = push to `main`. Cloudflare Workers Builds builds on its own Linux machines and deploys. Never build on the PC for production: OpenNext bakes `.env.local` into the bundle. Runtime keys live in the Worker's top-level "Variables and Secrets" (not the Build section), pasted without .env quotes.
- **Switched off** (404 on every host, code kept): onboarding, make-it-yours, dashboard/editor, sign-in/auth, library ingest, archetype-test (`DORMANT_PREFIXES`, lib/proxy-security.ts).
- **Security fixes landed:** the shop resolves from the real Host (`x-bohdi-shop` is retired and stripped); every public form is rate-limited through the Workers Rate Limiting binding (fails closed); deleted shops 404.
- **Workers constraints:** no filesystem at request time (legal templates are now bundled); photo shrink goes through the Images binding (`lib/images/shrink.ts`, 20MB max); edge `middleware.ts`, not `proxy.ts`.
- **Building a client:** content module in `scripts/sites/<site>.ts`, then `npx tsx --env-file=.env.local scripts/build-contractor-site.ts <site> --media <dir> [--contact-email x]`. This writes to the DB and storage, so no deploy is needed.

Full recap: `session-logs/session-87.md`.

## Next actions

00. **Alex: turn off "Allow new users to sign up"** in Supabase (Authentication → Sign In / Providers). Verify with GET /auth/v1/settings → disable_signup true.
01. **Backend auto sign-out** (Alex agreed): signed out after 8h idle, always after 7 days (app host middleware + a last-activity cookie; Supabase's own timeouts are paid-plan). Owners enter via `/admin` on their site (no visible link).
02. **Maker backend 1b — Catalog:** write the plan from the piece-1 spec (products, options, stock, photos, collections via listing_collections, one-place price, storefront rendering), then build. Then 1c Video (Cloudflare Stream), 1d Custom domains + status panel.
0. **bohdiai.com loose ends (Session 89 cleared most):** CI green again (2026-09-30); prod inquiry confirmed in Alex's inbox; Classic Loafs reverted to its original build. Still open: logo from the BohdiAi Facebook page (Alex skipped for now); the Classic Loafs work shot catches the hero words mid-fade (re-time if Alex wants); sample find-us dates are all past July dates; drop "(publicly: Alex Scott)" from privacy/terms? JSON-LD founder name?
1. **Cloudflare cleanup (Alex):** delete the redundant Cut-Pro route; trim Build variables to NODE_VERSION + the two NEXT_PUBLIC_*; after a few quiet days cancel Vercel and delete `shop-proxy` together.
2. **Cut-Pro follow-ups:** their copy review (crew-photo names, services list, "since 2009"); better originals from their phones; review the privacy-page wording for a contractor.
4. **Maker backend:** scope it against Penny's site. Open question: does Penny's store move into BohdiAI or stay standalone?
5. **Flaky test:** `SectionEditor.test.tsx` "Write it up…" fails only under full-suite load.
6. **MY ADMIN — stays in the plan, lower priority (Alex, 2026-09-30).** For now client sites are built here with Claude, following the BohdiAI rules (the Bohdi builder can still be run by script for a fast first draft). The admin comes back later; nothing about its shape is decided.


---

## Standing lessons (carry forward every session)

- **Bohdi authors CONTENT ONLY.** Structure / nav / sections / treatments come from the family (renderer). Never from Bohdi.
- **Mood is public. Family is internal.** Public copy always says mood. Never expose "family" to a maker.
- **No hardcoded strings in the renderer. No inline styles. No shortcuts.** All strings through `DEFAULT_STRINGS`/`DEFAULT_COUNTS`. Dynamic per-instance values pass as CSS custom properties or `data-*` attributes.
- **Tests are part of done.** No feature is complete without tests. Backlog compounds.
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
- **Don't cause side effects Alex didn't ask for.** `seed-editor-test-owner.mjs` resets the password every run — running it "just for the admin row" clobbered his known password. Read what a script does before running it for a narrow purpose.

---

## Session log index

Full recaps live in `session-logs/session-NN.md`. This is the one-line index.

- Session 89 (2026-09-30): **CI green; maker backend designed; foundation (1a) built + live-tested.** Classic Loafs reverted; MCP popups fixed; MY ADMIN deferred. Full recap: `session-logs/session-89.md`.
- Session 88 (2026-09-29): **bohdiai.com rebuilt as a web developer site, LIVE.** Real work (Cut-Pro, Penny, 3 samples) with testimonials, new about + The Bohdi Way, inquiry form with phone/best-way, waitlist stack deleted. Found CI red since 09-24 (coverage gate). Next: CI fix, then MY ADMIN brainstorm. Full recap: `session-logs/session-88.md`.
- Session 87 (2026-09-29): **Moved the whole app from Vercel to Cloudflare Workers**, verified live. Direction: everything manual; maker backend (Penny-style) to come. Switched off automation surfaces; form rate limits; Host-only shop resolution; bundled legal templates; Images-binding photo shrink; Workers Builds from GitHub. `main` current. Full recap: `session-logs/session-87.md`.
- Session 86 (2026-09-23/24): **Cut-Pro Lawncare's site built by hand and LIVE** (cut-pro-lawncare.bohdiai.com; family loves it). Brand-colors-take-over feature (`lib/color/`, OKLCH derivation, 5k-case property test); new hand-built **contractor** one-page archetype with a working **estimate form** (`/api/estimate`, photos to email attachments); store built by `scripts/build-contractor-site.ts` from `scripts/sites/cut-pro-lawncare.ts` + Google Photos media. tenant-media accepts mp4. Found the PC-crash cause (stale 859MB Turbopack dev cache). Dead Resend key replaced; form proven on prod. Mistakes: dragged the site into maker moods before Alex's correction; uploaded vidstab-garbled clips without looking (reverted). 14 commits, local. Full recap: `session-logs/session-86.md`.
- Session 85 (2026-08-05): **Listings built into the walk — real products, then real collections.** Goods step became a real product editor (name/price/own photo/short+long copy, typed or Bohdi-drafted); the store already reads products from the `listings` table, so it's DB CRUD + the store/preview follow along. **First real product clears the placeholders**; shared catalog projection (`lib/storefront/catalog.ts`) resolves each photo from `media_ids`→uploaded file (legacy metadata fallback). Photos upload to `tenant-media` and are **downscaled + WebP-converted with sharp** (accepts 30MB — raw phone photos work). Live-testing root-caused (from the DB, not guesses): a **setState-in-render crash** (onResolved inside a setProducts updater), a **dead disabled button** (now says what's missing), and a **silent second-upload failure** (the 10MB cap → raised + WebP). Alex's standing rule: **"no silent failures, always display errors"** — wrapped every call. Then, correcting my mistaken deferral, built **real collections in the walk**: `collections.is_preview` migration, collection CRUD + product assignment (`primary_collection_id`, cover from products), `CollectionsEditor`, collections now **real-or-off**, placeholders clear on product/collection/turn-off, publish-gated. 1230 tests, tsc+lint clean, 20 commits. **NEXT (S86):** gate-verify collections with Alex, then the standalone Listings admin (options/multi-photo/video/stock/digital/touch-ups/logo). Full recap: `session-logs/session-85.md`.
- Sessions 80-84 (2026-07-31 → 08-04): the Make It Yours walk (full-screen, section by section), story interview, Moment step, events/testimonials editors, no fabricated ratings. See individual logs.
- Sessions 66-79 (2026-07-07 → 07-30): six-family walkthrough + fix waves A-F, textures, editor draft-and-publish, the Make It Yours walk (D67-D71). See individual logs.
- Sessions 63-65 (2026-07-04 → 07-06): substrate cleanup, Phase 0, then Phase 1 family layer landed and run through all six moods. See individual logs.
- Sessions 40-62 (→ 2026-07-03): sections built (About, nav, collections, marquee, reviews, find-us), families designed, editor design started. See individual logs.
- Sessions 30-39: Main Street becomes sole archetype, families framework designed, Bohdi crew built.
- Sessions 0-29: Phase 0 build, then design/build cycles under superseded models. See individual logs.
