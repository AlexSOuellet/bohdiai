# Business Card Site — Design

**Date:** 2026-10-03 (Session 92)
**Status:** Agreed with Alex in brainstorming ("no mockups, build it"). First sites: RusticRhody (Alex's old woodworking), then Frank (a woodworker) if he agrees.
**Related:** `2026-10-02-tiers-and-pricing.md` (a new tier below Maker Lite), `2026-09-30-maker-backend-overview.md` (gallery is a planned shared feature).

## What it is

An online business card for a maker who doesn't need a shop: who I am, some of what I make, how to reach me. One page, one fixed layout, always painted in one of our families. Aimed at about $5/month (price and yearly figure still to be set in the tiers spec). Everything is built so that a later "send your photos and bio, get your card" flow can produce it with no hand work.

## The page (top to bottom)

1. **Opening.** A top bar with the name and section links; then, centered, the kicker as a tag, the business name very large, a hand-drawn underline, the headline, two buttons (see the work, get in touch) and the maker's round stamp; the first gallery photo framed beneath.
2. **About.** A heading and the bio in the maker's own words, signed with their first name.
3. **The work.** Up to 12 gallery photos in an even grid (three across, two on phones), each with its caption underneath. A photo opens full size, with next/previous controls and Escape to close.
4. **Get in touch.** Phone (call or text) and Facebook / Instagram links where set, plus a contact form (name, email, message) that emails the maker through the existing contact route.
5. **Footer.** "© year Business name" and "Empowered by BohdiAI" on a bohdiai.com address.

The opening photo is simply the first gallery photo, so the maker controls it by reordering. If the gallery is empty, the opening has no photo and the gallery section is omitted.

**Always built from our families (Alex, 2026-10-03).** The card paints in one family: the family (stored as the envelope's `mood`) gives the type package and wallpaper, and one of that family's skins (stored as `lookKey`) gives the colors. A shop's own brand palette can replace the skin colors, still in the family's type. The layout follows the families' stacked page: centered opening (tag, name, hand-drawn underline, headline, buttons, round stamp), the first photo framed under it, then roomy bands, with the work in an even grid with captions underneath. RusticRhody is Rustic in the light Sawdust skin. (A first version in a look Claude invented was rejected as "too dark and crowded.") Every UI string lives in the card's strings file; every visible sentence the maker wrote comes from the database.

## What the maker manages (backend)

Two new features, both off by default, both on for a card site:

- **About you** (`profile`): kicker, headline, about heading, bio, first name for the signature, phone, Facebook link, Instagram link. **The maker edits these themselves** (Alex, 2026-10-03). This overrides the overview spec's "Alex keeps the voice" line, which turned out to be Claude's rule, not Alex's.
- **Gallery** (`gallery`): add photos (shrunk to WebP like product photos), caption each, reorder, remove. **Up to 12 photos** on a card site. The gallery is the shared feature the backend overview plans for every site type; it is built once here.

Where messages go (`tenants.contact_email`) stays set by Alex for now.

## Data

- `gallery_items`: id, tenant_id, upload_id (the photo's `uploads` row), caption (≤ 80 chars, optional), position, timestamps.
- `site_profiles`: tenant_id (key), kicker, headline, about_title, bio, signature, phone, facebook_url, instagram_url, updated_at.
- Both: RLS lets a site's admins read and write their own rows; the storefront reads with the service role.
- The site itself is an archetype envelope (`archetypeKey: 'card'`, `mood` = family, `lookKey` = skin, optional brand palette, empty content) on the published home page, like the contractor site. The page reads the gallery and profile at render time.

## Building one

`scripts/build-card-site.ts <site> --media <dir>`: creates the tenant if missing, writes the envelope, turns `profile` + `gallery` on and `catalog` off, writes the profile, and loads the photos (in order, with captions) into the gallery. The site module lives in `scripts/sites/<site>.ts`. The owner gets in through `scripts/invite-maker.ts`. Every run also makes Alex's account (alexsouellet@gmail.com) an admin of the site (`lib/backend/builder-access.ts`; Alex, 2026-10-04: he builds every site, so he has a login to each). The contractor build script does the same.

## Market dates and the marquee (2026-10-04)

- **Market dates** (`market_dates` switch, off by default, on for card sites; `scripts/build-card-site.ts` switches it on). Backend screen `/manage/dates`: add, change, remove; each date is a day, the market's name and an optional town; up to 20. Stored in the existing `events` table (`event_date`, `name`, `location`), which Lite's calendar will also use. Listed earliest first by the market's own day; nothing is hidden by today's date (the owner removes past ones).
- **The marquee's bottom row** shows the dates as "Sat Oct 17 · Harvest Craft Fair · Wickford" in bold body type and the skin's dark ink; with no dates it shows the business name as before. The dates are also listed as hidden text for screen readers (the band itself is hidden from them).
- **Speed (Alex):** the big-words row loops in 100s. The dates row's loop time is worked out per site from both rows' contents (`lib/archetypes/card/marquee.ts`) so both rows travel at the same speed.
- **Pause:** the band pauses while the pointer is over it, and a click or tap holds it paused until the next one (`CardMarquee`).

## Sample sites (2026-10-04)

Sites on bohdiai.com's samples list (`SAMPLES` in `lib/site/work.ts`) carry a fixed dark strip at the top of every page with a red "<Plan> sample" button ("Showcase sample", "Lite sample", "Full sample") linking to the maker plans (`app/storefront/_components/SampleBanner.tsx`). Real client sites can't get it. Fixed site headers sit below it via `--sample-bar-h`. Rustic Rhody's dates are made-up examples, which the banner covers.

## Later (Alex, 2026-10-03: "we will do that later")

The page takes its fonts, texture and colors straight from the family, and its loud moves are modeled on Rustic sections (the marquee band; the Guestbook's pinned paper slips). But its sections (the pinned-prints opening, the taped note, the print wall, the contact slip) are written for this page, not built as family section variants. To give every family its own version, rebuild them the way the store sections are built: one shape per section, a variant per family, picked from the family registry.

Owners on this tier never change the look (Alex, 2026-10-03): they edit words and photos only, and the family and skin are chosen when the site is built. So this job is for our range, not their editing. Do it when the first maker who isn't a Rustic fit signs up.

## Not in this

The automated signup flow, billing, the price on the pricing page, custom domains. The photo limit is a constant until tiers drive it.
