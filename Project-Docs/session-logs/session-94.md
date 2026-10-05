# Session 94 — 2026-10-05

## What shipped (LIVE)

- **Card sites can use different designs.** The card envelope's content takes an optional `design`. With no `design`, a site gets `pinned`, today's pinned-prints page, so existing sites are unchanged. The first new design is `bulletin`: a kraft flyer tacked to a barn wall. It has a stamped tag line, the name in woodtype one word per line, a What I make strip, pinned snapshots that swing, market days circled in marker, and tear-off tabs that call the owner (with a phone number) or go to the contact form (without one). The photos and the wall share one full-size viewer (`PhotoViewer.tsx`).
- **What I make** (`site_profiles.makes`): up to 3 phrases of up to 30 characters, checked in the database by `site_profile_makes_ok`, edited through three inputs in About you.
- **Rustic Rhody switched to the bulletin board** and set its What I make. The hidden test copy (`bulletin-test`) was soft-deleted afterwards, and its storage was kept.

## Decisions (Alex)

- Client sites do NOT have to use the families' structure or looks ("I was wrong" about the 10-03 rule). A site still has to be a BohdiAI shop underneath: a tenant, the backend, forms and footer.
- New designs are options a site may use. No site is restricted to one.
- The tear-off tabs show the phone number when there is one. Otherwise they read "Message <signature>" and go to the form.

## How it was done

The mockup is the spec. Alex said Claude struggles going from mockup to site, so the CSS was carried over almost word for word (classes prefixed `bb-`). The real page and the mockup were screenshotted at the same spots, on desktop and phone, and compared side by side. One gap was fixed: a reset rule was overriding the strip's margin, and is now `:where()`. The checks ran on a hidden test tenant, because the live code parsed card content strictly and writing `design` into Rustic Rhody before the deploy would have 404'd the live site.

## Next

- The **show reel** design, then the **torch** design, each the same way: mockup → carry it over → side-by-side check (mockups in `tmp/mockups/flyer/`).
- bohdiai.com's work shot of Rustic Rhody (`/work/rustic-rhody.webp`) still shows the pinned design.

## Also this session (chat)

Alex asked about pitching his dentist a site. Two feedback memories came out of it. No reflexive caveats: answer what he said. And if the honest view goes against how a question is framed, lead with the view instead of filling the frame.
