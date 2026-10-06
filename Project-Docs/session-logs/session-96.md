# Session 96 — 2026-10-06

**Headline:** Rose n' Cat Reborn Babies (Renee Mazzone, Joe's wife, Smithfield RI) built as a sample full maker site on a new hand-built archetype, **boutique**, with its first design, the **nursery**. LIVE and public at https://rose-n-cat.bohdiai.com. Three pushes, all CI green.

## What shipped (live)

- **Boutique archetype** (`lib/archetypes/boutique/`): a hand-built maker shop with a catalog (`usesCatalog: true`, pages: home + `/shop`, product pages, plain pages). Everything reads the backend: About you (`site_profiles`), the catalog (`listings`), Market dates (`events`), Gallery (`gallery_items`). Not on Bohdi's menu. Product pages now receive `tenantId` (`renderProduct` args; `StorefrontPage.renderArchetypeProductPage`).
- **Nursery design** (built with the frontend-design skill; not from the families — Alex: "we decided we did NOT have to build from the families"): a hospital nursery. Arched window with the first home baby and a swinging "Hello, my name is" bassinet card; a letter-bead bracelet band from "What I make"; the nursery window (babies behind glass, pink/sage/lilac/sky cards, "Adoption fee"); **Gone home** (gallery of past babies pegged on clotheslines, opens full size; two-up on phones); the artist's letter on lined stationery with the logo as a postmark; **Visiting hours** (market dates — Alex: "I LOVE visiting hours"); gift-tag contact card (the shared contact form). Each baby's page is a **certificate of birth** (photo strip, Born at, Artist, Status, Adoption fee, "Ask to adopt" → contact form). Top bar **pinned** (fixed, not sticky — the storefront's html/body `overflow-x:hidden` stops sticky); phones get a **Menu** button.
- **Build script** `scripts/build-boutique-site.ts <site> --media <dir>` + `scripts/sites/rose-n-cat.ts`: tenant, envelope, features (profile, catalog, market_dates, gallery), logo (only when none), About you, catalog, gallery, dates — owner's versions kept on re-run (`--replace-profile`, `--replace-products`).
- **Rose n' Cat content:** 15 real dolls from her Facebook (names are PLACEHOLDERS: Theo, Rosie, Ruby…), all $120 (Alex's starting price), ready-made, one of a kind (stock 1); 12 past babies in Gone home; logo cropped from her cover photo; phone + Facebook from her page. Dates: Scituate Art Festival Sat Oct 10 (real, Alex), the rest MADE UP from her 2025 flyers (Pascoag Bazaar Oct 17, Pumpkin Fest Oct 24, Johnston Holly Fair Nov 21, Smithfield Holiday Fair Dec 12). Contact form → Alex's email. Not on bohdiai.com's samples list, no sample banner.

## Lessons

- **prettier-plugin-tailwindcss strips the leading space in className template strings** (`` `nn-baby${x ? ' nn-baby--adopted' : ''}` `` → classes glued together). Build class names from constants/arrays instead. Tests caught it.
- **jsdom applies the page's own `<style>`**, so a phone-only button (`display:none` on desktop) is invisible to `getByRole` even with `hidden: true` in practice — query it by class.
- Alex asked to **read all docs first** before planning; don't plan a build off a partial read.
- Hand-built client sites don't come from the families (memory already says so); reach for design skills.

## Open / next

- Renee: real baby names, prices, her own story and dates (she edits at /admin — needs an invite via `scripts/invite-maker.ts` when she's in); contact email to hers.
- "Market tracker" (the money side — per-show costs and sales) is not built; Alex chose the public visiting-hours list for now.
- Ask-to-adopt goes to the contact form; checkout is maker backend piece 2.
