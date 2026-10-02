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
| Maker Lite | $14.99 | $149 |
| Maker Full | $19.99 | $199 |
| Contractor Lite | $14.99 | $149 |
| Contractor Full | $29.99 | $299 |

Superseded the same day: an earlier version had makers pay $150 / $250 up front (the build plus a free first year) then $9.99 / $14.99 a month, with the monthly price as the no-up-front alternative. Dropped because one model for every plan is simpler to read and the easiest signup ("built free"); the cost is no up-front cash.

## Maker tiers

### Lite

For the local maker: people they meet at markets or on Facebook have a place to see what they make and get in touch. Sales are handled by hand.

- Home page plus a second page: the catalog and market dates.
- Full product list, **one photo per product**, prices shown.
- No online buying. Each product has an **"Ask about this"** button that opens the contact form with the product already named.
- Social links and a contact form.
- **The till** (market POS): tap items, running total, the maker's Venmo / Cash App QR shown full-size, record how the customer paid. Every sale is tagged to the market it happened at, so Full's market numbers show the whole history on upgrade.
- When pitching the till, don't promise "no fees": Venmo and Cash App business accounts charge fees (roughly 2–3%); personal accounts are not meant for selling goods.

**Price:** $14.99/month or $149/year, built free.

### Full

Everything in Lite, plus:

- Online selling: cart, checkout, the maker's own Stripe / Square, orders, shipping.
- Up to 12 photos per product; product video; downloads where switched on.
- **Market numbers:** each market's results after costs (booth fee, gas, supplies) and year-against-year comparison — is this market worth going back to.

**Price:** $19.99/month or $199/year, built free.

### Not tiers

- No separate "Market Maker" middle tier (considered and dropped: without online selling, stock syncing matters little, so it added too little over Lite).
- Product video is Full only.

## Contractors

A separate track, not on the maker ladder (a contractor never moves up to selling products). Contractor sites are the quickest to build (Cut-Pro took about an hour).

Two tiers, mirroring the makers. The site is built free on both; the contractor pays monthly.

- **Contractor Lite — $14.99/month.** A Cut-Pro-style one-page site: the estimate form (photos to email), no backend; changes go through Alex. Sellable today. $149/year. Priced the same as Maker Lite: a one-page site costs the same whoever buys it.
- **Contractor Full — $29.99/month, or $299/year.** The contractor backend: estimate inbox (new → contacted → quoted → won/lost), job gallery (photos and short videos), services and service area, booked-days calendar, reviews, FAQ, notices, and **review requests** (after a job, the customer gets a text/email link to leave a Google review — new, not yet in the backend plan). Contractor-only features a maker doesn't need.
- **Why contractors pay more for Full than makers do:** different product with contractor-only tools, and contractors read a low price as amateur work. Justified by features, never by "more changes" (that would invite edit requests and break the fixes-not-additions rule). Contractor Full is sold on what it does for their business (estimate requests with photos on their phone, booked-out calendar), never as page count. The two audiences get separate pages (see the bohdiai.com pricing design), so the prices are not shown side by side. Considered and rejected: one value-based contractor price ($29.99 for a one-page site) — publicly it reads as "you can afford it".
- Contractors are expected to churn less than weekend-warrior makers (the site is how they get work) — reasoning, not data.
- Upgrade Lite → Full is switches, as for makers.
- **Selling unbuilt features:** the contractor page advertises the full package; when a contractor signs up for Full, focus switches to building what they need before their site goes live. No delivery date is promised.
- **Cut-Pro is family (Alex's daughter and her fiancé) and keeps its own "love pricing"** — not on these prices.
- Same rules as makers: fixes covered, additions paid; no commitment, site pauses if payments stop.

## Upgrading, downgrading, cancelling

- **Upgrade Lite → Full:** no up-front fee; they pay the Full monthly price from then on. If they upgrade inside a prepaid year, they pay the difference for the months left, in one payment.
- **No commitment.** If payments stop, the site pauses until they catch up.
- **Cancelling Full:** offered a move down to Lite at Lite's normal price instead (no discount). Cancelling Lite: the site pauses, no counter-offer.
- **Downgrading Full → Lite:** extra photos are kept but hidden (they return on upgrade); orders still waiting to ship stay visible until done, although online selling switches off.

## Selling before features exist

A maker can sign up for either tier now. What is built is theirs immediately (e.g. the catalog backend, so they can start filling in products); what is not yet built switches on when it is. No dates are promised to a maker for unbuilt features until that piece is planned. Early payments can go through a hand-sent Stripe payment link until billing is built.

## Build order

Unchanged: maker backend piece 1 continues (video, then custom domains), then the remaining pieces. Lite-only items (the one-photo limit, "Ask about this", the till, billing) are added as makers sign up. Staging is required before the first paying customer (overview spec, "Staging").

## Open

- **Lite's design:** a cut-down Full (same look, fewer pages — upgrades are just switches; recommended) or its own one-page design.
