# Session 87 — 2026-09-29: BohdiAI moves to Cloudflare

## Direction (Alex)
- Saw Theo (theo.site): an AI site builder and managed service at $69.99/mo plus change credits, with the price hidden until after the build. Alex found the homepage vague and the build "nowhere near where we were."
- Most makers don't need a website yet. Alex is starting **The Maker Experiment** (YouTube: learning decoupage from $0 to $1000/mo) with a Skool community built around it. Penny (12K-follower decoupage group) will let him promote it there.
- **Everything is manual for now.** No onboarding, no site editor; all edits go through Alex. A maker **backend** like Penny's site (catalog, pricing, orders, customers, checkout, no digital downloads) WILL be built. The Facebook poster and financial report come after launch. Service providers, makers and charities all live inside the BohdiAI structure.
- Hosting moves from Vercel to Cloudflare, because it's cheaper ($5 Workers Paid vs $20 Vercel Pro).
- Claude to keep chat technical unless asked otherwise.

## Built (branch infra/cloudflare-move, now main)
- OpenNext Cloudflare adapter, wrangler config, generated env types, cf:* scripts.
- Photo shrink through the Images binding (`lib/images/shrink.ts`) instead of sharp. The dashboard cap is now 20MB.
- Edge `middleware.ts` instead of Node `proxy.ts` (the adapter's supported path); `next.config.mjs`.
- Dormant surfaces return 404 (`DORMANT_PREFIXES`).
- Form rate limits on the Workers Rate Limiting binding, keyed by cf-connecting-ip and failing closed.
- The shop lookup skips deleted tenants; shops resolve from the real Host; `x-bohdi-shop` is retired and stripped.
- The app redirects www to the apex.
- Builds run without secrets: the homepage and onboarding are force-dynamic, and the AI/fal keys are optional app-wide with clear errors at use.
- Legal templates are bundled (Workers have no filesystem).
- Fixed a latent OG-image bug (a multi-child div with no flex).

## Cutover (with Alex in the dashboard)
Paid plan → Workers Builds from GitHub → runtime secrets → Cut-Pro route (staged) → catch-all → apex + www as Custom Domains. Verified live: every page on 13 test shops and Cut-Pro, plus a real photo estimate to Alex's inbox.

## Mistakes / snags
- Keys first went into the Build variables section, so the running app couldn't find them and Cut-Pro showed "Store not found." Rolled back within minutes.
- Values were pasted with .env quote marks, which Resend rejected. The live form briefly failed; rolled back and fixed.
- Shop legal pages returned 500 because they read files. Rolled back and bundled the templates.
- A chained command committed despite one failing test (the flaky one; three reruns were clean).
- A heredoc slip deleted the legal .md files; restored from git at once.
- The GitHub repo is PUBLIC; the history scan found no secrets.

## After the log was first written
- `*.bohdiai.com` DNS is now AAAA `100::` proxied (no Vercel target). www was added as a Custom Domain (it had worked through the wildcard route).
- Workers Builds' production branch is `main`. GitHub's default branch is `main`.
- Deleted every merged branch (beta/founder-admin, infra/cloudflare-move, cutpro/brand-colors, session-9/11/12, port-atmospheric), each verified as contained in main first. **`main` is the only branch.**
- `shop-proxy` is kept, route-less, as the rollback path until Vercel is cancelled.
- Next session: rebuild bohdiai.com.

## Next
See SESSION-BRIEF next actions: Cloudflare cleanup, cancel Vercel after a few days, homepage rebuild, maker backend scope.
