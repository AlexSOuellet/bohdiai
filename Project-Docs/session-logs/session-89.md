# Session 89 — 2026-09-30: CI green, Classic Loafs reverted, maker backend designed + foundation built

## Done
- **GitHub CI green** for the first time since 2026-09-24. Coverage raised with real tests (no threshold lowering); new e2e/home.spec.ts (work links + project form); stale waitlist/browser-demo specs deleted; FOUNDER_CAP dropped.
- **Contact form confirmed on prod** (Alex's real inquiry arrived).
- **Claude desktop MCP popups:** removed four broken add-ons (puppeteer, memory, sequential-thinking, stripe) from claude_desktop_config.json (backup kept beside it) and their corrupt npx cache folders.
- **Classic Loafs reverted** to its original build (5 breads, 3 collections, round-robin assignment); test products/collections/uploads soft-deleted; test draft deleted. Live words were never changed (walk tests only wrote the draft).
- **MY ADMIN deferred** (stays in plan, lower priority). Client sites are built in chat with Claude for now.
- **Maker backend designed** (brainstorm with Alex): `docs/superpowers/specs/2026-09-30-maker-backend-overview.md` + `...-piece-1-design.md`. Key calls: modeled on Penny's admin (her site untouched; port screens onto BohdiAI data; framework unchanged); BohdiAI-hosted only; everything incl. downloads, each feature switched per site by Alex (tiers later flip the same switches); clients manage lists/facts (products, dates, services, gallery, reviews, notices, form inboxes), Alex keeps words/look; one feature set across makers, contractors, charities (shared tables per feature); backend at app.bohdiai.com reached from a footer link; looks like Penny's admin (light only); custom domains connected by Alex/Claude, maker sees status; Cloudflare Registrar recommended; categories + standard pricing later; customer accounts a switchable feature, shared-login question open.
- **Backend foundation (plan 1a) built and live-tested:** tenant_features + registry + set-feature script; sign-in/reset/set-password on the app host only (other hosts redirect); invite-maker script (link → membership → email); scanner-safe confirm (GET → Continue page → POST verify); fresh-link check on set-password; per-IP and per-email limits (fail closed); Penny-style shell + feature-built menu + site picker; home screen from feature contributors; "Shop owner sign-in" footer link on both archetypes; a11y scans. Alex received an invite on Gmail for classic-loafs and got in (local).

## Found / fixed along the way
- Final review caught `no-referrer` making the Continue POST send `Origin: null` → every link refused. Fixed (same-origin).
- Alex's live test caught the dev server reporting `localhost` in request.url → origin check refused real clicks. Fixed: checks use the visitor's Host (`lib/backend/request-origin.ts`).
- /auth/callback put back on the dormant list (open-redirect `next`).

## Open
- **Alex: turn off "Allow new users to sign up" in Supabase** (Authentication → Sign In / Providers). Still on as of end of session.
- alexsouellet@gmail.com is now an admin of classic-loafs; alex@bohdiai.com admin of all 39 test shops (old test data).
- Next: plan + build 1b Catalog, then 1c Video, 1d Custom domains.
