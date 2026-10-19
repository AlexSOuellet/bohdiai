# Session 109 — 2026-10-19

**Defined and built the Showcase backend, the gallery section for every family, and About you split into its own homes and screens. Everything is committed on `feat/showcase-backend` (not merged, not live). Alex reviews it tomorrow.** The full definition is `Project-Docs/Plan-Backends.md` (Showcase settled; Market and Full still to define).

## Decided with Alex
- **Showcase:** the whole catalog in the backend; the site shows only a **gallery** of up to 12 ticked products (newest 12 by default; no shuffle, no non-product photos), no prices, no shop. **One page:** menu jumps (About, Contact), no Events (a small dates section), the contact form at the bottom, the story behind the about card's "read more" (hidden until clicked). The maker edits the headline and the line under it, not section titles. Search details are automatic, never edited.
- **The gallery is an added section,** separate from products, in every family. Market and Full: switched on by the maker (never while empty), no limit, ticked products plus their own photos.
- **About you = only what's in the About section** (heading, story, quote, portrait). Headline, short line, scrolling line, contact information, socials, "what I make", sign-off: never in About you. Scrolling line, Contact information and Socials each get their own screen; social icons in the footer only. "What I make" is a search detail the build fills. Sign-off name dropped.
- **Menu:** groups with several items start folded; Home alone at the top; **Contact support** its own item; **Settings** (Your plan, Billing) at the bottom.
- **Cancel** takes effect at the end of the current term; Keep my site until then. **Every plan change emails** the maker (Alex gets a copy). **Contact support** form now, an AI chatbot later.
- **Paying at sign-up is the top priority** (Open-Work item 0): there is no way to sign anyone up.
- **Every build makes three backgrounds whatever the family** (so Scenic never falls back to the marsh), until the library is big enough.
- Custom sites (Rustic Rhody, Saltmarsh, Paper & Patina, Rose n' Cat, Cut-Pro…) are **not part of this**; discussed separately. Call them custom sites.

## Built (branch `feat/showcase-backend`, commit a949195)
- Database (Alex approved): `listings.in_gallery` (12 on Showcase only), "gallery" section words, `site_added_sections`, `tenants.plan_cancels`, `site_marquees`, `site_contacts`, `site_socials`, the about heading moved into `site_sections`, `support_messages`.
- Gallery section in all nine moods (`GalleryBeat`, `gallery-styles.ts`); one-page Showcase (`OnePageStory`, `ContactBeat`, `onepage-styles.ts`); footer social icons; phone with the contact form.
- Backend screens: Headline, About you (four pieces), Scrolling line, Contact information, Socials, Products with Gallery/Home ticks, Gallery switch, Billing, Cancel, Contact support; folding menu.
- Fixes along the way: Rustic's opening photo in a widescreen band; Spotlight long names and the line under them step down; search description from the line under the headline; marker-free test draft ("Lena Hart Decoupage").
- 3141 tests pass; type check and lint clean.

## Things that went wrong (lessons)
- **Took the live sites down for a few minutes.** Migration 20261019000003 dropped `site_profiles` columns the live code still reads; the database is shared with the live site. 20261019000004 put them back with their data (checked identical). Never drop what `main` reads before the new code is live; curl live sites after every migration (memory saved).
- **Decided things weren't built** (Billing, Contact support, Cancel) until Alex found them. Build everything he decides in the same push; keep a list and check it (memory saved).
- **Changed things without asking** (a note edit, a fix). Ask and wait for ok before any change Claude thinks up (memory saved).
- **Button questions** in the next-step box annoyed Alex: ask in plain text only (memory saved).
- Too much shorthand early on ("the opening", "section headings") lost Alex; say it plainly.

## Next (Session 110)
1. Alex reviews the branch (backend at the test draft, the gallery in each mood).
2. **Better social icons**, and **a line above the bottom navigation** (the footer row) — Alex, end of session.
3. Merge to `main` once Alex is happy; confirm the Cloudflare build; then the follow-up migration dropping the old `site_profiles` columns (marquee_phrases, phone, facebook_url, instagram_url, about_title).
4. Then: define Market and Full (Plan-Backends.md), paying at sign-up (top priority).
