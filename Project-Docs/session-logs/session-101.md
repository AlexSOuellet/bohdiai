# Session 101 — 2026-10-12

**Priorities reset with Alex; Saltmarsh public; the demo is always today; Market POS built and live.**

## Shipped to main (live)
- "Alex Scott" dropped everywhere (home page founder data, privacy, terms, CLAUDE.md). Alex Ouellet only.
- Facebook link in the bohdiai.com footer (old parked branch, merged).
- **Saltmarsh & Lace is public** (was a draft behind a preview link).
- **The demo is always today**: `tenants.demo_day` anchors a demo's timeline; an hourly pg_cron job (`demo_keep_today()`) moves every date of demo sites forward by the days passed. Demo sites only. `demo-reset` anchors on reset. Proof script: `scripts/check-demo-always-today.mjs` (rolled-back transaction).
- **Shoreline market page** merged; fixed a crash on market day (server passed function strings to a client component; `ShorelineMarketBuyer` wrapper reads them on the client).
- Market page: **no menu, footer or links while buying**; one "Visit the shop" when there's nothing to buy or once done.
- **No discount code box** on the market page (seller assigns market discounts; a code sent anyway is ignored; running sale still applies).
- **Market POS** (`/manage/markets/[id]/day`): one phone screen, no backend menu. Buyers waiting to pay as ticket slips (Paid / Not received), Sold today, walnut till docked at the bottom (takings + Ring up a sale in a sheet, shared `RingUp`). Settling a hold needs only `market_shop` (old Confirm needed `cart`, would have broken Maker Market).
- **Market POS button** on every coming-up market in the list; Market POS in the backend menu.
- **Home-screen app**: per-shop manifest `/pos-manifest/<sub>`, ember icon (`public/pos/`), starts at `/manage/pos` (today's market or the coming-up list), install tip. POS pages stay signed in to the 7-day limit (rest of backend 8h idle).
- Saltmarsh reset to its clean Full start (market id changed: today's market is `0391df71-…`).
- Branches deleted: photo hero, bulletin taken-tab, facebook link, demo-always-today, saltmarsh-market-page, market-pos-app.

## Decisions (Alex)
- Order: Saltmarsh demo first, staging moved up, then Alex's dashboard, Square on BOTH Maker Market and Full (Alex has the Square developer account), invites to talk, video pricing, True Coat estimator fix, cleanup together, checkup waits. Contractor backend waits. Rose n' Cat and Joe come to Alex. Cut-Pro is on them. Penny's site never moves in.
- **Alex's dashboard**: view any client site as them, site statistics, every demo run and checkup, send invites / reset passwords, messages stored, add FAQs and other content; client sites get a "contact support" link.
- Demo: required email on the welcome page, no confirmation code, no newsletter box. Market always today. **Every payment simulated.** Explainers (Learn) stay in the plan. Every visitor gets a new copy (personal copies piece).
- Market setup page = getting ready: dates and details, pieces, **market discounts** (seller-assigned), **Publish** to the site. Selling lives only on the Market POS.
- **Sales tax**: home rate; each market its own rate via a state picker (editable); each seller picks included or on top; every sale records its tax and state; results show tax per state.
- payments@bohdiai.com for Square (Cloudflare routing rule; catch-all stays off unless Alex chose it).
- Vercel was still building every push (why the storage emails came); Alex disconnected Git.

## Open
- Morning sales in the demo's start (asked, no answer yet).
- Market discount: one percent per market or per piece (asked).
- "Handed over" step after Paid (asked).
- Old Today and Sell screens: retire once Alex is happy with Market POS.
- Today wording bug in old TodayBoard ("picks a baby") goes away when it's retired.

## Lessons
- Run a real market day before calling a market page done: tests rendered the client component directly and missed the server-to-client crash.
- Vercel stayed connected to GitHub after the move; check integrations when retiring a host.
