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

## Maker tiers

### Lite

For the local maker: people they meet at markets or on Facebook have a place to see what they make and get in touch. Sales are handled by hand.

- Home page plus a second page: the catalog and market dates.
- Full product list, **one photo per product**, prices shown.
- No online buying. Each product has an **"Ask about this"** button that opens the contact form with the product already named.
- Social links and a contact form.
- **The till** (market POS): tap items, running total, the maker's Venmo / Cash App QR shown full-size, record how the customer paid. Every sale is tagged to the market it happened at, so Full's market numbers show the whole history on upgrade.
- When pitching the till, don't promise "no fees": Venmo and Cash App business accounts charge fees (roughly 2–3%); personal accounts are not meant for selling goods.

**Price:** $150 up front (the build plus the first year), then $9.99/month — **or** nothing up front at $14.99/month.

### Full

Everything in Lite, plus:

- Online selling: cart, checkout, the maker's own Stripe / Square, orders, shipping.
- Up to 12 photos per product; product video; downloads where switched on.
- **Market numbers:** each market's results after costs (booth fee, gas, supplies) and year-against-year comparison — is this market worth going back to.

**Price:** $250 up front (the build plus the first year), then $14.99/month — **or** nothing up front at $19.99/month.

### Not tiers

- No separate "Market Maker" middle tier (considered and dropped: without online selling, stock syncing matters little, so it added too little over Lite).
- Product video is Full only.

## Contractors

A separate track, not on the maker ladder (a contractor never moves up to selling products). Contractor sites are the quickest to build (Cut-Pro took about an hour).

- **Site built free; the contractor pays for hosting:** $29.99/month, or $299/year.
- Pitched to sit at the do-it-yourself price (Wix / Squarespace ~$17–36/month) while handing over a finished site; below a local designer's $50–150/month maintenance fee. High enough not to look cheap, low enough to be a no-brainer — less than one job a month.
- Same rules as makers: fixes covered, additions paid; no commitment, site pauses if payments stop.
- Contractor features still to come (job-photo gallery, estimate inbox, booked-days calendar) leave room for a second contractor tier later.

## Upgrading, downgrading, cancelling

- **Upgrade Lite → Full:** no up-front fee; they pay the Full monthly price from then on. If they upgrade inside a prepaid year, they pay the difference for the months left, in one payment.
- **No commitment.** If payments stop, the site pauses until they catch up.
- **Cancelling Full:** offered Lite at $9.99/month instead. Cancelling Lite: the site pauses, no counter-offer.
- **Downgrading Full → Lite:** extra photos are kept but hidden (they return on upgrade); orders still waiting to ship stay visible until done, although online selling switches off.

## Selling before features exist

A maker can sign up for either tier now. What is built is theirs immediately (e.g. the catalog backend, so they can start filling in products); what is not yet built switches on when it is. No dates are promised to a maker for unbuilt features until that piece is planned. Early payments can go through a hand-sent Stripe payment link until billing is built.

## Build order

Unchanged: maker backend piece 1 continues (video, then custom domains), then the remaining pieces. Lite-only items (the one-photo limit, "Ask about this", the till, billing) are added as makers sign up. Staging is required before the first paying customer (overview spec, "Staging").

## Open

- **Cut-Pro:** whether it moves onto the contractor price or keeps its own arrangement.
- **Lite's design:** a cut-down Full (same look, fewer pages — upgrades are just switches; recommended) or its own one-page design.
- **Year-two annual option** (e.g. $99/year for Lite): suggested, not decided.
