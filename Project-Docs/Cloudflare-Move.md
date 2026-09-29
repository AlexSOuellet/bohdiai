# Moving BohdiAI from Vercel to Cloudflare

Started 2026-09-29. Branch `infra/cloudflare-move` (pushed to GitHub).

## Why

Cost. Cloudflare Workers Paid is $5/mo, and Vercel is $20/mo once the use is commercial. The move also removes the `shop-proxy` forwarding worker and its fakeable `x-bohdi-shop` header, which the July audit rated HIGH.

## What's done (on the branch)

- The app builds for Cloudflare with the OpenNext adapter (`npm run cf:build`). The bundle is 3.8MB gzipped, which needs the **paid** Workers plan (the free plan caps at 3MB).
- Photo shrinking (Cut-Pro's estimate form, dashboard upload) goes through Cloudflare's Images binding instead of `sharp`, which can't run on Workers.
- Routing is in edge `middleware.ts`, the adapter's supported path.
- Onboarding, Make It Yours, the dashboard/editor, sign-in, library ingest and the archetype test pages are switched off. They return 404 on every host, and the code stays.
- Every public form is rate-limited by Cloudflare's Rate Limiting binding (5/min per visitor per form, fails closed).
- The shop lookup skips deleted shops.
- A local preview on the real Workers runtime showed Cut-Pro rendering, the switched-off pages returning 404, the share image rendering, and the limiter turning away the 6th try.

**Do not `vercel --prod` from this branch.** Photo shrinking and the form limiter exist only on Cloudflare, so on Vercel every form would refuse to send.

## Why Cloudflare builds it (not Alex's PC)

When OpenNext builds locally, it bakes every value in `.env.local` into the uploaded bundle, including the service-role key and the DB password. Letting Cloudflare build from GitHub keeps `.env.local` on the PC, keeps the keys in Cloudflare's secret storage, and avoids OpenNext's warning that Windows builds can fail unpredictably.

## Alex's steps (Cloudflare dashboard)

1. **Plan.** Workers & Pages → Plans → Workers Paid ($5/mo).
2. **Create the Worker from GitHub.** Workers & Pages → Create → Import a repository → connect GitHub → pick `AlexSOuellet/Bohdiai`.
   - Project/Worker name: `bohdiai` (must match `wrangler.jsonc`)
   - Production branch: `infra/cloudflare-move` (switch to `main` after cutover)
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
3. **Build variables** (Settings → Build → Variables): `NODE_VERSION` = `22`, plus `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (these get baked into the browser code at build time, and they're public by design).
4. **Runtime secrets** (Settings → Variables and Secrets, type *Secret*), with values copied from `.env.local`:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SITE_URL`.
   If the first deploy's log names a missing variable, add it. The AI, image-generation, Cowork and DB-password keys are **not** needed, because everything that uses them is switched off.
5. **Deploy** (retry the build). The app comes up on `bohdiai.alexsouellet.workers.dev`, and bohdiai.com is untouched. To start a build on the right branch, push to it; "Retry" re-runs an old build on its old branch.

## Status 2026-09-29: Cut-Pro is live on Cloudflare

Steps 1–7 are done. The `bohdiai` Worker builds from GitHub, and the route `cut-pro-lawncare.bohdiai.com/*` serves Cut-Pro from it. Checked live: home, /privacy, /terms, all 19 media files, all 12 assets, and the form. A real estimate with a 4000×3000 / 5.5MB photo reached Alex's inbox through the Worker, and the form was then pointed back at Chris.

Lessons from the first attempts:
- There are **two** "Variables and secrets" sections. The one under *Build* exists only during the build. The running app's keys go in the top-level one.
- Paste values **without** the quote marks `.env.local` wraps them in. Cloudflare keeps the quotes, and Resend rejected the quoted sender.
- Workers have no filesystem, so nothing may read files at request time (shop legal pages did; now bundled).
- The Build section needs only `NODE_VERSION` and the two `NEXT_PUBLIC_` values. The other four there can be deleted.

## Status 2026-09-29 (end of day): everything is on Cloudflare

Done: the catch-all `*.bohdiai.com/*` moved from `shop-proxy` to `bohdiai`; bohdiai.com and www are Custom Domains on `bohdiai`; the `*` DNS row is AAAA `100::` proxied (no Vercel target); `main` was fast-forwarded and is the Workers Builds production branch. Vercel serves nothing.

Left: delete the Cut-Pro route (redundant), trim the Build variables, and **after a few quiet days** cancel Vercel and delete `shop-proxy` together. `shop-proxy` is the rollback path until then: re-adding its route sends shops back to Vercel.

## Original plan (Claude + Alex)

6. **Test on workers.dev:** the marketing page, 404s, and the limiter.
7. **Staged cutover, one shop first.** Add a Worker route `cut-pro-lawncare.bohdiai.com/*` → `bohdiai`. A specific route beats `shop-proxy`'s `*.bohdiai.com/*`, so only Cut-Pro moves. Send one real estimate with photos to Alex's inbox to prove the Images binding end to end. Rollback = delete the route.
8. **Full cutover.** Route `*.bohdiai.com/*` to `bohdiai` and delete the `shop-proxy` worker. `bohdiai.com` and `www.bohdiai.com` are **DNS-only records pointing straight at Vercel today** (checked 2026-09-29: both answer `Server: Vercel`, and www 308s to the apex), so routes alone won't catch them. Delete their Vercel DNS records, then add both as Custom Domains on the `bohdiai` Worker, which creates proxied records. The app redirects www → bohdiai.com itself (`apexRedirect`, middleware). In the same deploy, Claude removes the app's trust in `x-bohdi-shop` (it has to wait until then, or Cut-Pro breaks on Vercel today).
9. **Retire Vercel.** Merge to `main`, point the Cloudflare production branch at `main`, and cancel the Vercel project.
