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
- Supabase public sign-up turned OFF by Alex (verified disable_signup: true). Customer sign-up, when built, goes through our own server code (admin API), per site.
- alexsouellet@gmail.com is now an admin of classic-loafs; alex@bohdiai.com admin of all 39 test shops (old test data).
- Next: plan + build 1b Catalog, then 1c Video, 1d Custom domains.

## Deploy
- First deploy failed on Cloudflare: the footer link called serverEnv(), and Cloudflare's build prerenders static pages without runtime secrets. Fixed: `ownerSignInHref()` reads only SITE_URL (falls back to bohdiai.com). **Lesson: anything a static page renders must not need runtime secrets; tests don't catch it — only the Cloudflare build does.**
- Verified live: app.bohdiai.com/signin 200; shop /signin → app host; /manage → sign-in when signed out; /dashboard 404; owner link in Classic Loafs and Cut-Pro footers; bohdiai.com and Cut-Pro 200.
- **Owner entry changed (Alex):** the footer sign-in link was rejected ("not on the footer"). Removed from both archetypes (tests keep it out). Owners type `/admin` on their own site → `app.bohdiai.com/manage` (sign-in first when signed out), the Shopify pattern. Verified live on Classic Loafs and Cut-Pro.
- **Agreed next (Alex "ok"):** auto sign-out for the backend — after 8 hours with no activity, and always after 7 days — because makers use shared/public devices. Not built yet.
