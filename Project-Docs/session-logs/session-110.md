# Session 110 — 2026-10-20

**Merged Session 109's Showcase backend (live), then defined and built the Market plan on `feat/market-plan` (committed, not merged; Alex tests on Saltmarsh in the morning).** Saltmarsh is now on Market (Alex moved it on the demo).

## Merged and live (main, 2d01cf8)
- Social links in the footer of every mood: named buttons in the site's accent (like the Send button), on their own line above the footer links.
- **Visitor numbers**: every page view on a live site is counted in Cloudflare (Workers Analytics Engine, dataset `bohdiai_visits`, no cookies); the backend home shows visits and pages seen this week against last, the most-seen pages and where visits came from. Full keeps its months in `site_visit_months` (approved), saved by a daily Worker cron (`worker.ts` wraps the OpenNext app; `/api/cron/visit-months`). QR codes carry `?qr=1`. The privacy page no longer claims an analytics cookie. **Waiting on Alex: the Cloudflare key** (CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_ANALYTICS_TOKEN with Account Analytics: Read, in the Worker's Variables and Secrets); until then the home says the numbers aren't on yet.
- The backend's new look: soft grey page, white rounded panels, white fields with a clear edge, sentence-case labels; product pages lead with their photos; a compact Publish box.

## Decided with Alex
- **Market = everything Showcase has + the whole catalog with prices + the whole market app** (records, costs, results). No online selling, promotions, collections or order tracking. Collections are Full only. Card payments at markets: **Square only**; Full sells online through **Square and/or Stripe**.
- **Stock at markets:** what she brings to each market is counted (per piece or per option); with none left there, the piece is sold out at that market. "What sold out where" is an analytic.
- **Options** (colours, sizes) are real: each choice can have its own price; they show on the site and sell (market app and online cart).
- **Testimonials on Market:** up to three, ticked by the maker; her first three until she ticks any. Full shows all.
- Analytics on every plan; Full keeps its history as long as it's on Full.
- The demo's "Skip to renewal" was confusing: a demo-only note now says what a real site does, with "Move to <plan> now".

## Built on `feat/market-plan` (not merged)
- Dropped the five old `site_profiles` columns (approved; checked no reader, values matched).
- Plan switches: Market gets `market_records` and `testimonials`; new `collections` switch (Full); new `testimonials_all` (Full).
- `market_stock` (approved) + new sale functions: quantity, option, "left at this market", stock back on the right option when a sale is cancelled. "What I'm bringing" counts on each market's page; the market shop shows "n left", how many and which one; the POS has a tile per option with + and −; "How it sold" on each market and "Sold out at your markets" on results. New market words on every site (How many, Which one, {n} left).
- Options sell online: cart lines can be "piece + choice" (`<listing>~<combination>`), `place_order_request` checks and saves the choice; the moods' option picker adds to cart on Full; Saltmarsh's product page shows option dropdowns.
- `site_testimonials.shown` (approved) with the backend tick.
- Saltmarsh's own design caught up: no collections on Market, the gallery section on its home page, named social buttons.
- Every database function change was tested in rolled-back transactions, including the call shapes the live site still sends.

## Things that went wrong (lessons)
- **Custom designs were missed three times** (Saltmarsh's collections row, its round social icon, its missing gallery). A change to what a plan shows must be checked in Saltmarsh's and Rose n' Cat's own designs too (memory saved).
- Asked "is it free?" about Cloudflare's counter: checked the live pricing page instead of answering from memory; good.
- The dev server's build cache corrupted after many edits (Turbopack panics, 5–6 second pages): clearing `.next/dev/cache` and restarting fixed it.

## Next (Session 111)
1. Alex finishes testing `feat/market-plan` on Saltmarsh (now Market: counts on Market on the Common, options, testimonial ticks, the gallery switch).
2. Merge; check the Cloudflare build and the live sites.
3. The pricing cards (asked, not answered): move testimonials to the Market card, take "Testimonials" and "Take cards at markets" off Full.
4. The Cloudflare key for visitor numbers (Alex).
5. Then: define Full; paying at sign-up (top priority).
