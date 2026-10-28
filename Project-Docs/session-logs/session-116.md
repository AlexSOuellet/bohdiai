# Session 116 — 2026-10-27

**Claude rebuilt the maker backend on `feat/backend-redesign` (pushed, NOT merged; it carries Session 115's buyer accounts too). Alex: "sooooo much better", "I really like this new look". Home changes by plan (Showcase, Market, Full; Free left out for now). Paper & Patina moved onto Spotlight on Showcase, in place. The Spotlight long-headline fix is merged and live. Customers has its own menu entry, and every home page section has a switch on My site. Next session: Maker Free.**

## Decisions (Alex)

- **"Rebuild it and see if you can wow me."** He skipped the design questions; Claude made the calls, and he approved the result.
- **The backend adjusts per plan:** "leave free out for now and convert the others" (Showcase, Market, Full).
- **Paper & Patina moves onto Spotlight, on Showcase.** There was no Showcase site; it was still on the old Showreel card design.
- **Buyers isn't a logical spot under Orders, and the word is customers.** Customers is its own menu entry on Full, shown only while her switch is on ("why would customers stay when there are NO customers"). The switch, **Customer accounts**, lives under My site, because it adds Account to her site's menu.
- **Every home page section gets a switch on the My site page itself.** "It is not intuitive to have to drill in." The gallery's existing switch moves there, so there is one switch per section ("not two toggles or tables").
- **Database change approved:** `site_added_sections` (the gallery's switch table) now accepts every home page section, rather than a new column ("if it is the best way to do it and not a shortcut"). No row means the design decides, so no live site changed.

## Built (`feat/backend-redesign`)

- **The look:** BohdiAI's own face (Schibsted Grotesk; a deep blue and the ember gold; the flame in the rail). It runs on every backend screen and on the sign-in, forgot-password and link pages.
- **The menu, in her words:** Home, Products, Events, Orders, Customers, My site, Account, Help. A group's screens show as tabs across the top (Products and Collections; Schedule, Sales, Results and Market POS). On a phone, a bottom bar has Home, three groups and Menu.
- **My site:** her site top to bottom, each part showing what it says now and opening its own screen. The whole-site tools (Background, Try on a look, QR code) sit beside it, under **On your home page**, a switch beside every section her design and plan show, with her own heading under each.
- **Home by plan:** first steps worked out from her data, not stored. A lower plan's unfinished steps come first, and the list disappears when all are done.
  - Showcase: headline, story, gallery, how to reach her, publish.
  - Market: prices, Square, an event, what she's bringing.
  - Full: online payments, a collection, photos, a promotion.
  - Home also has the market-day band on the day, the opening photo, the gallery or work wall, events, numbers and visitors.
- **Home page switches:** both the family moods and Scenic's shoreline hide a section that's switched off; its words and photos are kept. The gallery can't be turned on while it's empty. The Gallery screen now just says whether the gallery is on and links to My site.
- **Paper & Patina:** Spotlight, Showcase, opening photo "The studio", nine pieces as products in the gallery (no prices), its sections and words (`scripts/convert-card-site.ts`, `scripts/sites/paper-and-patina.ts`).

## Merged and live

- **Spotlight's long headline** (main, 2026-10-27). A headline over 32 letters sets as a sentence and steps down in size, and one over 70 steps down again. Buttons show their whole label; they had been cut off by the menu's width cap. Checked live on paper-and-patina.bohdiai.com; the Cloudflare build and the test check passed.

## Found along the way

- **The rule that hides the phone's bottom bar came before the rule that draws it,** so the bar showed on a computer and its Menu button did nothing.
- **The local dev server breaks after branch switches.** Turbopack panicked, and Tailwind kept looking for a renamed file. Both times, restarting with `.next` cleared fixed it (Alex said yes each time).
- **`square_connections` is server-only.** The first steps read Square and PayPal through the server's readers, because "permission denied" broke Home.
- **The old site editor's hidden-sections list lives in page records,** which the settings-only rule now refuses, so it was dead. That's why the switches needed a real home.

## State

- `feat/backend-redesign` pushed, not merged. It includes `feat/buyer-accounts` (Session 115), so that branch merges with it.
- The database change is applied to the shared database; live code ignores the new rows until the merge.
- Open: rename `site_added_sections` once this is live (Open-Work 53). Four Full sites (classic-loafs, heavenly-scents, soul-splatter, twilight-to-darkness) lack the `headline` switch. Ember & Pine and Rustic Rhody are still on their own custom designs.
- The dev server was left running in Alex's Terminal tab.

## Next

- **Maker Free** (Alex: "tomorrow we will tackle maker free"). It's on `feat/backend-tools` (unmerged, built before the redesign). Before touching anything, ask Alex what felt worse there (Session 113). Then bring Free into the redesign: its own Home and first steps.
- After that: merge the redesign (it carries buyer accounts), then check every plan's site live.
