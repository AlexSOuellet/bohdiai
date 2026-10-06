# Tiers and Pricing — Launch

**Date:** 2026-10-02 (Session 91)
**Status:** Agreed with Alex in brainstorming. Maker and contractor pricing settled.
**Related:** `2026-09-30-maker-backend-overview.md` (feature switches — a tier is a set of switches turned on).

## Principles

- **Launch prices.** Every number below is a launch price. Regular (higher) prices come once the automation is in place.
- **Launch makers keep launch prices.** Not advertised and not promised "for life"; new makers pay the higher prices as the platform grows.
- **The Bohdi Way:** not about huge profits. Priced so signing up is easy.
- **Fixes are covered, additions are not.** A maker can email Alex for fixes to their site; new sections, pages or changes are paid additions. Every site runs on one codebase, so a platform fix is made once for everyone.
- **A tier is a set of feature switches.** Each tier's backend shows only its features; upgrading turns more switches on, no rebuild.

## How everyone pays

Every plan, maker or contractor: **the site is built free**, then a monthly price, or a yearly price with about two months free. No up-front fee, no commitment; the site pauses if payments stop.

| Plan | Monthly | Yearly |
|---|---|---|
| Maker Showcase | $5 | $50 |
| Maker Lite | $15 | $150 |
| Maker Full | $20 | $200 |
| Contractor Lead Generation | $15 | $150 |
| Contractor Full | $30 | $300 |

**2026-10-03 (Alex):** every price is whole dollars, rounded up from the .99 prices (round reads as honest, and only the first digit moves a buyer); yearly is exactly ten months. Maker Showcase added below Lite.

Superseded the same day: an earlier version had makers pay $150 / $250 up front (the build plus a free first year) then $9.99 / $14.99 a month, with the monthly price as the no-up-front alternative. Dropped because one model for every plan is simpler to read and the easiest signup ("built free"); the cost is no up-front cash.

## Maker tiers

### Showcase (added 2026-10-03)

For makers who don't sell online or need a catalog: an online place that says who they are, shows some of what they make, and lets people get in touch. One page: their story, up to 12 photos with captions, a contact form, phone and social links. The owner changes their own words and photos; the look is set when the site is built, always from one of our families. Design: `2026-10-03-business-card-site-design.md`. The Rustic sample is rustic-rhody.bohdiai.com.

**Price:** $5/month or $50/year, built free. Upgrades to Lite are switches.

**2026-10-04 (Alex):** Showcase also gets **market dates, shown only in the marquee's bottom row** (day, market, town; owner-managed, up to 20). Lite keeps the full calendar. Both read the same `events` rows, so an upgrade keeps every date. Alex expects Showcase to be the best seller.

**Pricing page highlight (Alex, 2026-10-04):** never nudge toward Full. The maker page lights up Showcase with a **"Most popular"** badge beside its name (`Plan.badge` in `lib/site/plans.ts`; the badged plan gets the honey edge). Claude flagged that the claim isn't true until Showcase has sales; Alex decided to use it anyway. The contractor page has no highlighted plan.


### Lite

For the local maker: people they meet at markets or on Facebook have a place to see what they make and get in touch. Sales are handled by hand.

- Home page plus a second page: the catalog and market dates.
- Full product list, **one photo per product**, prices shown.
- No online buying. Each product has an **"Ask about this"** button that opens the contact form with the product already named.
- Social links and a contact form.
- **The point of sale** (market POS; public copy says "point of sale", never "till" — Alex 2026-10-02): tap items, running total, the maker's Venmo / Cash App QR shown full-size, record how the customer paid. Every sale is tagged to the market it happened at, so Full's market numbers show the whole history on upgrade.
- When pitching the point of sale, don't promise "no fees": Venmo and Cash App business accounts charge fees (roughly 2–3%); personal accounts are not meant for selling goods.

**Price:** $15/month or $150/year, built free.

### Full

Everything in Lite, plus:

- Online selling: cart, checkout, the maker's own Stripe / Square, orders, shipping.
- Up to 12 photos per product; product video; downloads where switched on.
- **Cards at markets through the maker's own Stripe or Square** (agreed 2026-10-02): the point of sale totals the sale, then either hands it to the maker's Square app with the total filled in (Square's hand-off for mobile web apps — confirm details before building) or shows a QR for that total so the customer pays on their own phone through the maker's Stripe. Recorded with the other sales, tagged to the market, stock comes off. No reader of our own (the "real POS" stays parked).
- **Market numbers:** each market's results after costs (booth fee, gas, supplies) and year-against-year comparison — is this market worth going back to.

**Price:** $20/month or $200/year, built free.

### Not tiers

- No separate "Market Maker" middle tier (considered and dropped: without online selling, stock syncing matters little, so it added too little over Lite).
- Product video is Full only.

## Contractors

A separate track, not on the maker ladder (a contractor never moves up to selling products). Contractor sites are the quickest to build (Cut-Pro took about an hour).

Two tiers, mirroring the makers. The site is built free on both; the contractor pays monthly.

- **Contractor Lead Generation — $15/month** (named Contractor Lite until 2026-10-06; Alex: "I like Contractor Lead Generation"; the plan id stays `contractor-lite` so existing links work). A Cut-Pro-style one-page site: the estimate form (photos to email), no backend; changes go through Alex. Sellable today. $150/year. Priced the same as Maker Lite: a one-page site costs the same whoever buys it.
- **Contractor Full — $30/month, or $300/year.** The contractor backend: estimate inbox (new → contacted → quoted → won/lost), job gallery (photos and short videos), services and service area, booked-days calendar, reviews, FAQ, notices, and **review requests** (after a job, the customer gets a text/email link to leave a Google review — new, not yet in the backend plan). Contractor-only features a maker doesn't need.
- **Why contractors pay more for Full than makers do:** different product with contractor-only tools, and contractors read a low price as amateur work. Justified by features, never by "more changes" (that would invite edit requests and break the fixes-not-additions rule). Contractor Full is sold on what it does for their business (estimate requests with photos on their phone, booked-out calendar), never as page count. The two audiences get separate pages (see the bohdiai.com pricing design), so the prices are not shown side by side. Considered and rejected: one value-based contractor price ($29.99, now $30, for a one-page site) — publicly it reads as "you can afford it".
- Contractors are expected to churn less than weekend-warrior makers (the site is how they get work) — reasoning, not data.
- Upgrade Lite → Full is switches, as for makers.
- **Selling unbuilt features:** the contractor page advertises the full package; when a contractor signs up for Full, focus switches to building what they need before their site goes live. No delivery date is promised.
- **Cut-Pro is family (Alex's daughter and her fiancé) and keeps its own "love pricing"** — not on these prices.
- Same rules as makers: fixes covered, additions paid; no commitment, site pauses if payments stop.

## Custom sites (Alex, 2026-10-02)

Plan sites are ready in 2 to 5 days. Anything beyond what a plan lists — a special layout, a feature no plan has, a site that lives outside BohdiAI (Penny's is the example) — is a **custom site, quoted separately** after a conversation. Mentioned in the FAQ only for now, not on the pricing pages.

## Footer credit on client sites (Alex, 2026-10-02)

- **Site on a `bohdiai.com` subdomain:** the footer carries a line "2026 Empowered by BohdiAI" (year = the current year).
- **Site on its own custom domain:** that line shows the site's own name instead — no BohdiAI credit.
- Applies to every plan, makers and contractors. **Built 2026-10-02** in both footers (maker shops `MainStreetFooter`, contractor sites `ContractorShell`), linking bohdiai.com, behind a `platformCredit` prop that defaults on. Every shop is on a subdomain today; custom domains (maker backend 1d) pass `platformCredit={false}` so only the site's own name shows. Replaces the Master Spec's launch-tier "Footer Branding: None".

## Upgrading, downgrading, cancelling

- **Upgrade Lite → Full:** no up-front fee; they pay the Full monthly price from then on. If they upgrade inside a prepaid year, they pay the difference for the months left, in one payment.
- **No commitment.** If payments stop, the site pauses until they catch up.
- **Cancelling Full:** offered a move down to Lite at Lite's normal price instead (no discount). Cancelling Lite: the site pauses, no counter-offer.
- **Downgrading Full → Lite:** extra photos are kept but hidden (they return on upgrade); orders still waiting to ship stay visible until done, although online selling switches off.

## Selling before features exist

A maker can sign up for either tier now. What is built is theirs immediately (e.g. the catalog backend, so they can start filling in products); what is not yet built switches on when it is. No dates are promised to a maker for unbuilt features until that piece is planned. Early payments can go through a hand-sent Stripe payment link until billing is built.

## Build order

Unchanged: maker backend piece 1 continues (video, then custom domains), then the remaining pieces. Lite-only items (the one-photo limit, "Ask about this", the point of sale, billing) are added as makers sign up. Staging is required before the first paying customer (overview spec, "Staging").

## Open

- **Lite's design:** a cut-down Full (same look, fewer pages — upgrades are just switches; recommended) or its own one-page design.
