# Session 100 — 2026-10-10 → 10-12

**The maker checkup, the Market plan, and Saltmarsh live (as a draft).**

## Shipped to main (live)
- **Saltmarsh & Lace demo merged** (`feat/saltmarsh-showcase` → main, 2026-10-12). Still a hidden draft; opens only by its preview link. Full suite green, Workers Builds green.
- **Maker Lite → Maker Market**, **Maker Full $20 → $25** ($250/yr). Plan id stays `maker-lite`. New card: whole catalog, where you'll be next, the full market app (scan-and-pay, sales filed per market, results this year against last). No FB/IG line. Full cards open "Everything in <plan below>, plus" (contractor Full no longer says "Lite"). FAQ, samples ("Market sample" on Classic Loafs), backend plan screens follow.
- Brief: Square card payments for the market app moved to the top of next actions.

## Built, pushed, NOT merged
- **`feat/maker-checkup`** — bohdiai.com/checkup, the maker business checkup. Full write-up of how it works and what's open: `Project-Docs/Need-A-Site-App.md` (on that branch). Also on that branch: `Checkup-Question-Bank.md`, `Market-Plan.md`.
  - Path there: rule list (felt like a survey) → AI writes every question (Opus 19¢/run; Haiku slipped; Sonnet 9-11¢) → **fixed question bank, Haiku picks + writes the reaction line, code enforces must-cover** (~1¢/run).
  - Code decides the **pricing read** and **which offers** appear in "How I can help" (product cards with composed sample images, no prices, Learn more → /makers).
- **`feat/saltmarsh-market-page`** — the shoreline design's market page (before / on the day buy steps / after), buyer steps moved into shared `lib/storefront/MarketBuyer.tsx` (Rose n' Cat's nursery page unchanged, its tests pass). Needed for the Market card image.
- Older parked branches pushed to GitHub as backup (none merged): `feat/site-facebook-link`, `feat/site-photo-hero`, `fix/auth-link-24h`, `fix/bulletin-taken-tab`.

## Decisions (Alex)
- Checkup is a **maker business analysis**; lead generation; trust first; newsletter "Free tips and tricks" (beehiiv). AI was always part of it. Makers only (contractors: "YES OF COURSE YOU DO"). Hobby-only goal removed.
- No hourly rate unless real business. Questions grow from answers. Mostly taps, typing where it helps; too many options → typed.
- **No sample wording in AI prompts** (copied verbatim). Alex's analogies are ideas to retell, never quotes.
- Advice never names products; "How I can help" is a separate end section; offers chosen by rules; frequent market sellers → market site first, talk about both.
- **Maker Market** = craft-show plan: site + full catalog (1 photo) + full market app, no online selling, no reserve-for-pickup, no promos/collections/order tracking.
- Square card payments: soon, likely on Maker Market (card line still on Full until Alex decides).
- Don't use the cheap model for writing questions; Haiku picks from fixed questions.

## Lessons
- After "stop coding until I say", a spec list is **not** a go (memory saved). Suggest; Alex decides.
- Don't recite history ("we agreed on the 2nd", "planned for later").
- Examples in prompts get copied word for word.
- The dev server rewrites `.next/dev/types` mid-typecheck; type-check with a temp tsconfig that leaves out `.next` and `next-env.d.ts` (ignore PageProps errors), or stop the server first.
- The browser pane often won't draw screenshots; don't loop on it.
