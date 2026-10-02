# Session 91 — 2026-10-02: tiers, pricing, and the pricing pages

## Decided (brainstorm with Alex)
- **Plans and prices** — `docs/superpowers/specs/2026-10-02-tiers-and-pricing.md`. Every plan built free, then monthly or yearly (~2 months free): Maker Lite $14.99/$149, Maker Full $19.99/$199, Contractor Lite $14.99/$149, Contractor Full $29.99/$299. Launch prices; launch makers keep them (not advertised). No middle "Market Maker" tier. Lite = home + catalog page (1 photo, prices, "Ask about this", no buying), market dates, the point of sale (never "till"). Full adds online selling, 12 photos, video, downloads, market numbers, cards at markets through the maker's own Stripe/Square. Contractor Lite = Cut-Pro-style one page; Contractor Full = estimate inbox, job gallery, booked days, review requests. Free upgrades; no commitment, site pauses on non-payment; Full cancellers offered Lite at its normal price. Fixes covered, additions paid. Cut-Pro keeps family "love pricing".
- **Staging** — written into the backend overview spec. Alex then pointed out the pay buttons don't need it (Stripe test mode covers them); proposed rule: staging before the first paying customer's **site** goes live. Not yet confirmed — ask.
- **bohdiai.com shows prices** (reverses the Session 88 "no pricing" call) — design: `docs/superpowers/specs/2026-10-02-bohdiai-com-pricing-design.md`; plan: `docs/superpowers/plans/2026-10-02-bohdiai-com-pricing-pages.md`. Built before video.

## Built (branch `site/pricing-pages`, NOT merged, NOT live)
- `/makers` and `/contractors`: headline "A real web developer for less than a site builder", Lite/Full cards with monthly/yearly switch, comparison (web designer, Wix/Squarespace, Shopify, Etsy / lead services, Facebook page — prices checked 2026-10-02, recorded in `lib/site/plans.ts`), audience's work, contact form with plan chips (plan in Alex's email).
- Home: two doors under the hero (`#pricing`), charity "let's talk" line, Pricing link in the header on every screen size, hero button "See plans and prices", How it works for plans, new promise "Built free. You pay nothing until your site is live", phone headline breaks cleanly.
- 2059+ tests green, typecheck + lint clean.

## Why the branch stays open
Alex: the pages can't go live without pay buttons. Merging = live (push to main deploys).

## Next (tomorrow)
Stripe pay buttons (step B of the pricing design): Alex's BohdiAI Stripe account; checkout per plan (card saved, charged at go-live; custom fields business name + socials); thank-you page; webhook emails Alex; full test-mode run. Then merge the branch and go live together.
