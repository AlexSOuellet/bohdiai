# Card Site, Show Reel and Torch Designs

**Date:** 2026-10-05 (Session 94)
**Status:** Alex: all three flyer mockups become real sites. The bulletin board is Rustic Rhody. The show reel and the torch each go on a new sample site, with names, photos and words Claude chooses ("you choose", "you can just make some, it is just a sample"). Not three woodworkers: the show reel went to a mixed-media artist (Alex, 2026-10-05).
**Mockups (the spec for the look):** `tmp/mockups/flyer/b-showreel.html`, `tmp/mockups/flyer/c-torch.html`.
**Related:** `2026-10-05-card-bulletin-design.md` covers how a card site picks its design, and its rules apply here too.

## The two new sample sites

| Site | Design | Maker (made up) | Photos |
|---|---|---|---|
| **Paper & Patina** (`paper-and-patina`) | `showreel` | Dana, mixed media and decoupage (dressers, trays, boxes, canvases: the work Penny's papers go on), Warwick RI | 10 generated (fal.ai FLUX Pro 1.1), checked one by one |
| **Ember & Pine** (`ember-and-pine`) | `torch` | Jen, charred wood, pyrography and burned signs, Aquidneck Island | 10 generated, checked one by one |

Both are Showcase card sites built with `scripts/build-card-site.ts`, with made-up market dates. Messages from their contact forms go to Alex. Adding them to bohdiai.com's samples list is Alex's call, asked separately.

## Show reel (`showreel`)

Its own fixed look, changed after Alex's first look ("most of these makers are much more vintage and cottage core"). The type is the "seed packet" option he picked: Fraunces, a soft vintage serif, with the first line heavy and the rest in a soft italic (dusty rose for the name), and Karla for small text. The colors are near-black, bone and terracotta (#b5543f, "whichever looks best"). The pieces carry no number badges (Alex). The top bar sits on a soft dark fade instead of inverting its color. Top to bottom:

- **Top bar** (fixed): the business name only, with no piece counter (Alex).
- **Opening**: the first gallery photo fills the screen and slowly zooms out. Over it sit the tag line, then the business name slamming in letter by letter (one word per line), the headline, and a "See the work" button.
- **The reel**: every other photo gets its own full screen. The whole photo shows over a blurred, darkened copy of itself. Each has its caption rising in big type (no number badge).
- **The red panel** (after the fourth piece, or after the last one if there are fewer than four): the about heading split across two lines that slide in from opposite sides, then the bio paragraphs and the signature. Left out when there's no about heading and no bio.
- **End panel** (bone): "Tell me about it" and a short line asking people to get in touch (both renderer strings), the phone, Facebook and Instagram buttons, the contact form and the footer.
- **Ticker** (fixed, red, bottom): the market dates scrolling, paused while the pointer is over it. Left out with no dates.

Screens snap gently into place (proximity). What I make is not shown.

## Torch (`torch`)

A pine-board page. The type is the "antique letterpress" option Alex picked after his first look: IM Fell English SC for display, with IM Fell English italic for everything after the first word of the name and the captions ("Ember" / *"& Pine"*, "Goldie, *on basswood*"). Barlow Condensed, Barlow and Caveat Brush carry the small text. The colors are pine, char, ember orange and flag red. The pieces carry no number badges. Top to bottom:

- **Top bar** (fixed, char): the name and links to whichever sections exist.
- **Opening**: the tag line, then the business name burning into the pine letter by letter with a glowing edge and sparks. Words of two characters or fewer join the next word, so "Ember & Pine" becomes "Ember" / "& Pine". Then the headline and two buttons (see the work, get in touch).
- **Scorched stripes** torch across the page between sections, alternating char and red.
- **About**: the about heading burned in, the bio, the signature in brush script, and the maker's round brand (initials inside a ring of words) pressed in with a glow.
- **The work**: every photo as a big framed panel, alternating left and right. Each caption burns onto a pine plate overlapping the photo. A photo opens the shared full-size viewer.
- **Find me at**: the market dates on stained planks (day, market, town). Left out with no dates.
- **Get in touch**: "Tell me about it" burned in, a short line, phone, Facebook and Instagram tags, and the contact form on a char card. Then a char footer with the faded name.

What I make is not shown.

## Rules both keep

- Every renderer word lives in the strings file, and every maker word comes from the database.
- No inline styles: per-letter and per-item timing comes from `nth-child` rules or classes, never style attributes.
- **Nothing depends on JavaScript to become visible.** Content renders at rest. A small client script "arms" the page by adding a class that sets up the entrance animations, then plays them as each piece scrolls in. With no JavaScript, or with reduced motion, the page simply shows.
- Fixed bars sit below the sample banner (`--sample-bar-h`).
- "Done" is checked the same way as the bulletin board: real page and mockup screenshotted side by side at desktop and phone sizes, with every difference fixed before Alex sees it.
