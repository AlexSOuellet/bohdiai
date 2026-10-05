# Card Site, Bulletin Board Design

**Date:** 2026-10-05 (Session 94)
**Status:** Agreed with Alex ("ok"). Rustic Rhody is the first site to use it.
**Mockup (the spec for the look):** `tmp/mockups/flyer/a-bulletin.html`, with reference shots in `tmp/mockups/flyer/shots/`.
**Related:** `2026-10-03-business-card-site-design.md`, the card site this adds a design to.

## What it is

The bulletin board is a second design a card (Showcase) site can use. The first design is the current one, "pinned prints". The bulletin board is a kraft-paper flyer tacked to a barn-board wall, with stamped woodtype, pinned snapshots that swing, marker-circled market dates, and real tear-off tabs. A site can use it, and nothing requires any site to (Alex, 2026-10-05: "each new site may use the design but NOT be restricted to it").

The bulletin board has its own fixed look: barn wall, kraft, ink black, flag red and navy, in Alfa Slab One, Special Elite, Permanent Marker and Oswald. It does not come from the families, and the owner never changes it. This follows the 2026-10-05 retraction of the "always build from the families" rule. The backend is unchanged except for one new About you field (below).

## Choosing the design

The card envelope's content gains an optional `design`: `'pinned'` (the default, today's page) or `'bulletin'`. A missing `design` means pinned, so every existing site renders as it does now. The site module's `SITE.design` sets it, and `scripts/build-card-site.ts` writes it. The family, skin and brand palette are still stored, but only the pinned design reads them.

## The page (top to bottom, as in the mockup)

There is no top bar, since the mockup has none. Everything sits on the barn wall.

1. **The flyer.** A kraft sheet that drops in and swings onto the wall, pinned with two red tacks:
   - the red rubber stamp is the owner's **tag line** (`kicker`), and is left out if empty;
   - the **business name** in big stamped woodtype, one word per line: the first word in ink, the rest in red and indented. The size steps down for long words so the longest word fits;
   - the **strip** between two heavy rules holds the owner's new **What I make** phrases (up to three), separated by red stars, and is left out if empty;
   - the **headline** below it, in typewriter type;
   - the **first three gallery photos** as pinned snapshots with marker captions. They drop in at angles, swing on hover, and open full size on tap;
   - **Find me at**: the owner's market dates in marker, each day circled in red (`Sat Oct 17 Harvest Craft Fair · Wickford`). Left out when the site has no dates;
   - the **tear-off tabs** along the bottom (nine, with one already torn off). If the owner has a phone number, each tab shows it and tapping calls them. Otherwise each tab says "Message <signature>" ("Message me" with no signature) and goes to the contact form. Either way the tab tears away first.
2. **More off the bench.** Gallery photos 4–12 as pinned snapshots on the wall, each at its own angle, with captions. They swing on hover and open full size on tap. Left out when there are three photos or fewer.
3. **Two pinned cards.** A taped lined index card holds the **about heading** (`aboutTitle`, falling back to a renderer string), the **bio** paragraphs and the **signature**. A second taped card holds the **contact form**, the same one and the same route as today, restyled. The owner's Facebook and Instagram links go on the about card when they are set.
4. **Footer.** "© year Business name", Privacy, Terms, and "Empowered by BohdiAI".

Tapping any photo opens the same full-size viewer as today: next and previous, Escape to close, and focus returns to the photo. Privacy and terms pages render as a kraft sheet on the same wall.

All motion is CSS (drop-in, stamp-in, swing on hover, tab tear). Under reduced motion everything shows at rest, and tabs act straight away. Nothing waits on a scroll observer to become visible.

## What I make (new About you field)

- `site_profiles.makes`: `text[]`, up to 3 items, each up to 30 characters, blanks dropped.
- About you gets three short inputs under the headline, labeled "What I make (up to three, like 'Carved signs')."
- Pinned prints ignores it for now.
- Rustic Rhody: `Burned-wood flags`, `Carved signs`, `Custom work`.

## Rules it keeps

Every renderer string lives in the card's strings file. Every word the maker wrote comes from the database. There are no inline styles: the per-photo angles come from `nth-child` rules, not style attributes. The fonts load from Google Fonts like the pinned design's do.

## How "done" is checked

The mockup is the spec. Before Alex sees it, the local site and the mockup are screenshotted at the same moments (desktop 1440×900 and phone 390×844, top of page and lower down) and compared side by side, and every section that doesn't match is fixed first. Tests cover:

- design selection (missing means pinned);
- the name split and size steps;
- what the tabs target with and without a phone;
- sections being left out when empty;
- the What I make validation;
- the bulletin page's render.

## Not in this

The show reel and torch designs (next, one at a time). Owner-side design switching. Brand colors on the bulletin board.
