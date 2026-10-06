# Session 95 — 2026-10-06

**Headline:** homepage reshaped (samples-only hero, client slideshow, one card per tier + /samples); hidden draft sites; three new contractor sites and their own designs (True Coat = Contractor Full sample, Halfmoon = Contractor Lead Generation sample, Mazzone = Joe's real site, now PUBLIC); Contractor Lite renamed Contractor Lead Generation at $10/$100; every site will have a backend; BohdiAI business cards. All on `main`, live, CI green.

## What shipped (live)

- **bohdiai.com hero browser** cycles samples only: Rustic Rhody, Paper & Patina, Classic Loafs, Knotty Knits (hero-only, no banner — Alex), Twilight to Darkness, Heavenly Scents (`HERO_WORK`, lib/site/work.ts).
- **Client slideshow** in the work section: Cut-Pro and Penny one at a time, arrows + keyboard, no autoplay (`components/ClientSlideshow.tsx`).
- **Sample cards: one per tier** — Maker Showcase (Rustic Rhody), Maker Lite (Classic Loafs), Contractor Lead Generation (Halfmoon), Contractor Full (True Coat) — labelled with the pricing pages' plan names, then **"See more samples" → `/samples`**, every sample grouped by plan (in the sitemap). Pricing pages show their own audience's samples (contractor page had none before).
- **Sample banner** on True Coat ("Contractor Full sample") and Halfmoon ("Contractor Lead Generation sample"), linking to /contractors#plans. **Thumbnails leave the banner out** (capture script crops below the 48px banner); all sample thumbnails retaken; Ember & Pine captured via Playwright after its burn-in.
- **Plans:** Contractor Lite → **Contractor Lead Generation**, **$10/mo, $100/yr** (plan id stays `contractor-lite`). Tiers spec records: **ALL sites will have a backend**; Showcase and Lead Generation get a minimal one (not designed yet). Alex is *considering* cutting Maker Lite (undecided).
- **Draft (hidden) sites:** `build-contractor-site.ts --draft`; drafts 404 publicly; a private `?preview=` link (HMAC of the subdomain under BACKEND_SESSION_SECRET) opens one and is remembered by cookie; drafts are no-store + noindex; the estimate form accepts drafts. `scripts/site-visibility.ts <sub> live|draft|link`. **Known gap:** the preview link 404s on prod — the Worker's BACKEND_SESSION_SECRET doesn't match .env.local. Only matters next time a site is hidden; Alex to align it in Cloudflare (top-level Variables and Secrets).
- **Contractor designs** (the content shape is shared; `design` picks the page):
  - `yard` — Cut-Pro (unchanged).
  - `atelier` — **True Coat Painting** (Alex's first Stitch reference, built as a website): magazine-cover hero, live ballpark **estimator** (authored price table), service/case-study cards, "typical vs us" comparison, rating + reviews, notice strip, **booked-days calendar**, FAQ, booking banner. Sections each open differently (no label-over-title).
  - `harbor` — **Mazzone Home Improvement** (Alex's Stitch reference for Joe): navy + gold, Joe cut out (rembg) over the cover photo, trust strip, request form right after the top, photo service cards, project cards, one-at-a-time reviews, "When you call, you get Joe" promises panel; lighter varied card shading.
  - `ridge` — **Halfmoon Roofing** (Cut-Pro's top + Stitch card middle): roof-pitch photo cut, accent trust strip, side-pinned services headline, headline over the first project photo, first review as the opener, faded word behind the form.
  - Removed (Alex passed on them): statement, swatch, blueprint.
- **Joe's site is PUBLIC** (Alex sent it to Joe). Real facts only: 4.5 on Google, his five real Google reviews, Smithfield; stock work photos labelled as examples; estimate requests still go to **Alex's** email. The dark trial copy was soft-deleted.
- **Business cards** (not in the app): `Design files/business-card/` — dark and light versions, Avery 8371/5371 10-up PDFs, a dark-front/light-back PDF; QR → https://bohdiai.com (verified by decoding). Alex ordered them.

## Lessons (also saved as memories)

- **Custom sites must each be a new design** — changing type/colour isn't enough; the bones (section order, openers) made everything read as Cut-Pro.
- **No numbered lists on sites.** **No eyebrow-over-title section openers** as the default — vary them.
- **No client site live before it's done** (hence drafts). **No routine screenshots** — Alex opens the link; headless Chrome hung twice and loaded his PC.
- The **dev server hung** at ~860MB with a 686MB Turbopack cache and maxed the PC; the Stitch canvas in the browser pane also hung. Fix: stop the server, delete `.next/dev`, restart.
- Removing well-tested code can trip the **tsx branch-coverage gate** (75%) — CI caught it; fixed with bare/full design tests.

## Open / next

- Joe's feedback on his site; switch estimate emails to Joe when he's in (needs his address).
- Joe's site needs its own section openers (True Coat and Halfmoon got theirs).
- Estimator choices don't travel into the request email yet (offered, not done).
- BACKEND_SESSION_SECRET mismatch on the Worker (preview links).
- Minimal backend for Showcase / Lead Generation — undesigned.
- Parked branches: `feat/site-photo-hero` (homepage desk hero), `fix/bulletin-taken-tab`.
