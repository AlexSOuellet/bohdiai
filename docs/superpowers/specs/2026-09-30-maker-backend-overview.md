# Maker Backend — Overview

**Date:** 2026-09-30 (Session 89)
**Status:** Agreed with Alex in brainstorming. Piece 1 has its own design: `2026-09-30-maker-backend-piece-1-design.md`.

This is new work. Earlier plan limits on what a maker gets (the "entry tier is products and events only" idea from 23 September) do not apply. What is included starts fresh from this document.

## What it is

The backend a client signs into to run their site: for a maker, their catalog, sales, customers, marketing and numbers; for a contractor or a charity, the day-to-day items their site needs (see **Site types**). "Maker" below means any client site owner unless it says otherwise. It is modeled on the admin Alex built for Penny's Decoupage Digital Designs (`C:\Users\Bohdi\Documents\DecoupageDigital\Website`), which has been run for real by a real maker.

## Ground rules

- **Penny's site is not changed.** It stays self-hosted, on its own framework, exactly as it is. It is the blueprint and the test case, not a source to transplant.
- **BohdiAI keeps its framework** (Next.js on Cloudflare Workers) unless a compelling reason appears. Penny's screens are ported one at a time onto BohdiAI's own multi-tenant data.
- **BohdiAI-hosted only.** Self-hosting for a particular client is handled case by case, outside this work.
- **Everything is included**, digital downloads too, because Penny is a hybrid shop (printed sheets, downloads and 3D-printed pieces). Penny-specific mechanics are generalised, not copied (her print quantity tiers and two 3D finishes become maker-defined options plus promos).

## Who controls what

| Level | Controlled by | Example |
|---|---|---|
| Whether a site has a feature at all | Alex (by script until his admin exists); later the maker's plan/tier | Downloads on for Penny-style sellers, off for a bakery |
| Whether a feature shows on the home page | The maker | Testimonials or gallery on the home page, or only on their own page |
| Everyday settings inside a feature | The maker | Pausing the shop, hiding a section for a while |

The maker never sees the feature switches. A feature the site does not have is simply absent. When tiers exist, a feature outside the plan shows as locked with an upgrade button, and upgrading flips the same switch. No rebuild is needed to add tiers; only what flips the switch changes.

## What clients manage vs what stays with Alex

- **Clients manage the lists and facts of their business:** products and collections; dates (market days, fundraisers, booked days); services and service area; contact details and hours; gallery photos and videos; reviews / supporters' words; FAQ; sponsors; **notices** (short announcements like "Now booking spring sod installs" or "Closed for vacation until the 15th"); and the lists that forms fill (estimate requests, volunteer sign-ups).
- **Alex keeps the site's voice and look:** the home page headlines and story, the About page, and any other written page or design change. Clients ask Alex for those.

## Site types — one feature set, mixed per site

There are no per-site-type backends and no per-site-type tables. Every capability is a **feature**: its own switch, its own backend screen, its own card on the home screen, its own part of the site that reads from it. A site is just the set of features switched on for it. Tables are per feature and shared by every site that uses it; features that are the same thing underneath share one table:

- **Dates** — market days, fundraisers, a contractor's booked days: one events table (exists), each entry typed.
- **Reviews** — customer reviews and a charity's supporters' words: one reviews table (exists).
- **Form submissions** — estimate requests and volunteer sign-ups: one table, each entry with a status (e.g. new → contacted → quoted → won/lost).
- **Notices** — one table for every site.
- **Gallery** — photos and videos, optional albums, owner's order. Serves a charity's event photos, a contractor's job photos and videos, and Penny-style customer photos. **Customer photo submissions** are a gallery setting, off by default (they suit shops whose products become part of something customers make; most makers never need it).
- **Payments** — a donation is a payment with no product attached, so it rides on selling's orders and payments tables.
- Own tables only where nothing else is alike: e.g. services, sponsors.

Typical mixes:

| Site | Typical features |
|---|---|
| Maker | Catalog, dates, reviews, gallery, notices; selling; optionally downloads, customer accounts, bundles/promos |
| Contractor (Cut-Pro) | Gallery (job photos/videos), services and service area, estimate requests inbox, reviews, FAQ, notices, **booked-days calendar** |
| Charity | Donations, fundraiser dates, supporters' words, gallery, sponsors, volunteer sign-ups, notices |

- **Booked-days calendar (contractors):** display only — the contractor marks booked days and the site shows how far out they are and which days are open; customers still ask through the estimate form. **Real booking** (customer picks and books a day, with confirmations, clashes, cancellations, reminders) is a future feature Cut-Pro wants; it grows out of the same calendar.
- Contractor and charity features become their own pieces, built in the order real clients ask (Cut-Pro first, as a live client). A contractor site's content currently comes from a build script (`scripts/sites/<site>.ts`); each part handed to the client moves into that feature's own storage as the feature is built.

## Where it lives

`app.bohdiai.com`. One sign-in for every client. Makers reach it from a "Shop owner sign-in" link on their own shop, and every email BohdiAI sends them links straight in. Shoppers never go there.

## The five pieces (built in order, each finished before the next)

1. **Foundation and catalog.** Maker accounts and sign-in, feature switches, the home screen, products (options, stock, photos, one video, physical/digital), collections, and the domain status panel. *Design: piece-1 document.*
2. **Selling.** Cart, checkout, the maker connecting their own payment accounts (Stripe, Square, PayPal — the hardest single part of the whole backend, because each maker links their own account and BohdiAI never holds their passwords or secret keys), receipts, order emails, the sold-out email to the maker when a stocked item runs out, download delivery, shipping rates, and the orders screen (shipped, refunded).
3. **Customers.** Customer accounts (a switchable feature — most makers leave it off; guest checkout plus the emailed receipt link covers them), order history, favourites, the maker's customer list, reorder.
4. **Marketing.** Testimonials and review requests, the customer photo gallery, bundles and promotions (including quantity pricing like "buy 3, save $5"), search, the Facebook post tool.
5. **Reports.** Dashboard numbers (today, this month, 30-day chart, top products) and the revenue report with Excel export.

The five pieces are the maker path. Contractor and charity features (estimate inbox, services, booked-days calendar, donations, sponsors, volunteer sign-ups) are added as their own pieces in the order clients need them; shared features (gallery, reviews, notices, dates) are built once and serve every site type.

## Custom domains

- Alex and Claude connect domains; the maker only sees the status (see piece 1). Alex's admin gets the button later.
- Makers who do not own a domain are pointed to Cloudflare Registrar (at cost, no markup, free privacy, the bare `yourshop.com` points cleanly, free email forwarding). The maker owns the domain in their own account and shares access.
- Domains bought elsewhere are handled case by case.
- Cloudflare for SaaS includes 100 custom hostnames free on the bohdiai.com zone; $0.10/month each after.
- Registrar forwarding/masking is not a supported state. Plain forwarding works but keeps the bohdiai.com address; masking breaks checkout and sign-in and is to be avoided.
- The first real custom domain is a live test before any client depends on it.

## Open, decided later

- **Customer logins across shops.** When customer accounts are built (piece 3): one shared login across BohdiAI shops, or separate per shop. Alex's current view: shared is fine on `*.bohdiai.com` addresses, not on custom domains. Maker sign-in is kept separate so either answer slots in.
- **Categories** (a label grouping collections, Penny's "themes"): later, as a switchable feature, when a big-catalog seller arrives. Additive; does not change products or collections.
- **Standard pricing** (shop-wide price → collection price → product price, Penny's cascade): later, as a switchable feature, for big-catalog sellers. Additive database changes, made cheap by piece 1 reading every price from one place.
- **Google sign-in** for makers: later, if makers ask.
- **Alex's admin**: stays in the plan at lower priority; client sites are built in chat with Claude for now.
