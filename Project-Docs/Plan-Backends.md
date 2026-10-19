# Plan Backends — what each plan's backend holds

**Started 2026-10-19 (Session 109), defined with Alex one plan at a time.** The backend is the set of screens a maker uses at app.bohdiai.com to change their own site. This page says what each maker plan gets on a **standard site** (a family/mood site). It is the source for the plan switches in the code (`lib/backend/plan/plan-features.ts`) and for what the pricing cards promise (`lib/site/plans.ts`). Market and Full are added as they are settled.

**Custom sites** (Rustic Rhody, Saltmarsh, Paper & Patina, Ember & Pine, Rose n' Cat, Cut-Pro, Mazzone…) are **not part of this**. They are discussed separately (Alex, 2026-10-19).

---

## Showcase ($5 a month)

Settled with Alex, 2026-10-19.

### On the site: one page

- **No products, no shop, no prices.** The maker's pieces show only in the **gallery** (see "The gallery section").
- **One page.** No About, Events or Contact pages. The menu has **About** and **Contact**, each jumping down the home page. The old page addresses (/about, /events, /contact) land on their section of the home page.
- **About:** the about card on the home page with its "read more" link. The whole story stays hidden until "read more" is clicked, then opens right under the card. No "read more" when there is no story.
- **Markets:** a small dates section on the home page (day, market, town). **No Events** page or menu item.
- **Contact:** the contact form at the **bottom** of the home page.
- **Search details** (Google): built automatically following good practice, never edited by the maker. The description comes from the line under the headline; "what they make" names the site's craft.

### What the maker gets in the backend

1. **Home:** the Publish button and a link to view their site.
2. **Products:** they build their whole catalog, every piece they make. The catalog never shows on the site as products; it feeds the gallery, and it's all there when they move up to Market (no re-entry, prices start showing). The product page keeps the price, with a note that it shows on Market; no collections, options, stock or home-page tick.
3. **The gallery pick:** a Gallery tick on each product. Up to 12. The maker picks which and can swap any time. Until they pick, the gallery shows their newest 12.
   - Products only on Showcase. No non-product photos (those are Market and Full).
   - No random shuffle. A piece a visitor saw could disappear the next day, and Showcase has no shop page where they could find it again.
4. **Headline:** the headline at the top of the home page and the line under it. The photo and the button stay as the build made them. This is the **only** place the words at the top of the page are edited.
5. **Section titles** ("Find me at" and the like): not editable on Showcase. They stay as the build wrote them.
6. **About you:** **only what is in the About section**: the about heading, the story, the quote and who it's from, the portrait. Nothing else (Alex: "the About you edit should be JUST what is in About you").
   - Never in About you: the headline and the short line at the top of the page (Headline screen), the scrolling line, contact information, socials, "what I make", a sign-off name.
7. **Scrolling line:** its own screen (the phrases that scroll across the home page), with its own home in the database.
8. **Contact information:** its own screen, with its own home.
9. **Socials:** their own screen, with their own home. On the site, the social icons show in the **footer only**.
10. **Markets:** the day, the market name and the town only.
11. **QR code:** a printable code for their site.
12. **Settings** (a group at the bottom of the menu; Home stands alone at the top): **Your plan** and **Billing**.
    - **Billing:** the next charge (amount, plan, monthly or yearly, the day), how they pay (their card), past charges. Built 2026-10-19 showing the next charge; the card and past charges come with paying at sign-up (Open-Work, top priority).
    - **Your plan:** the plan they're on and what moving up adds, plus **Cancel**:
      - Cancelling takes effect at the **end of their current term**. Until then the site stays up, the screen shows the date it goes down, and they can change their mind before that date.
      - On Showcase there is nothing lower to offer; cancelling takes the site down (kept and hidden, never deleted).
13. **Contact support:** its own item on the main menu (just above Settings), in every backend, on every plan. A short form (their message; the site and their email filled in) that emails Alex (the maker's email is the reply-to). Built 2026-10-19. Keeping a copy for Alex's admin needs a small table (Alex's yes first). **Later replaced by an AI chatbot** (the spec's maker-help chatbot).

### Not the maker's

- **What I make:** filled by the build from the sign-up form, used only for search details. The maker doesn't edit it.
- **Sign-off name:** removed. The mood sites sign the quote ("who it's from"), not the story.

---

## Every plan

- **Plan-change emails:** every plan change sends an email: moving up, moving down, cancelling, changing their mind, and the day a change takes effect. The maker gets each one. Proposed (not yet confirmed by Alex): Alex gets a copy of each.
- **Contact support** (above) in every backend.
- **Cancel** takes effect at the end of the current term on every plan. On Market and Full, cancelling first offers Showcase for a quiet season, as a choice only, never automatic (Open-Work item 24).

---

## The gallery section (every plan)

Settled with Alex, 2026-10-19.

The gallery is its own **added section**, separate from products. A site can have the gallery, products, or both.

- **In every mood (family):** the gallery sits right after the products section in every mood's page order. Each mood hangs it its own way, in its own colors and fonts (Cozy soft on a warm mat, Rustic in thick dark frames, Dark dim until pointed at, Elegant two big columns, Cheerful tilted snapshots, Modern a square grid three across, Vintage cabinet cards, Scenic matted prints, Spotlight big two to a row with the name on a color strip). Photos keep their real shape (Modern crops to squares). Each piece shows its photo and name, no price; tapping a photo opens it big.
- **Its own heading:** the gallery has its own section words (heading, the short line above it), separate from the products heading, since a site can show both.
- **Showcase:** always on. Up to 12 ticked products (newest 12 if none ticked). Products only.
- **Market and Full:** an add-on the maker switches on. **No limit** on how many pieces. Ticked products **plus their own non-product photos** (booth, workbench, anything) if they want. The switch only turns on once there's at least one piece or photo in it. If they later empty it, the section doesn't show and the backend tells them why.
- **The products list** shows the ticks the site uses: Gallery on Showcase; Home and Gallery on Market and Full when the gallery is on.

---

## Market ($15 a month)

To be defined.

## Full ($25 a month)

To be defined. Already decided: try on a look (see another mood and skin on their own site, then keep it) is Full only (Alex, 2026-10-17). The try-on must survive clicking around the site (not only the address bar), and Scenic must never fall back to the marsh: every build makes three backgrounds whatever the family (Open-Work item 6). The gallery add-on is above.

---

## Build status

On branch `feat/showcase-backend`, not yet merged. Test draft: `claude-test-decoupage` ("Lena Hart Decoupage"), on Showcase.

**Built (2026-10-19, Session 109):**
- **Database (Alex approved):** products' gallery tick (`listings.in_gallery`, 12 on Showcase only); "gallery" in the section words; `site_added_sections` (the gallery switch); `tenants.plan_cancels`; new homes `site_marquees` (scrolling line), `site_contacts` (phone), `site_socials` (one row per account); the about heading moved into the section words; `support_messages`. Every value moved checked identical on all 21 sites.
- **Backend:** Showcase's Products screen with Gallery ticks; Market and Full products list with Home and Gallery ticks (no gallery limit); the Gallery screen's switch (can't be on while empty) and unlimited photos on standard sites; Headline; About you (heading, story, quote, portrait only); Scrolling line; Contact information (phone, email for messages); Socials; Billing; Cancel at the end of the term with Keep my site; plan-change emails to the maker with a copy to Alex; Contact support (emailed and saved); the menu (groups fold, Home alone at top, Contact support, Settings at the bottom).
- **Site:** the gallery section in all nine moods; Showcase as one page (menu jumps, old addresses land on their sections, the story behind the about card's "read more", every date, the contact form at the bottom with the phone); social icons in the footer only; Rustic's opening photo in a widescreen band; Spotlight's long names and lines step down.
- **Builders:** Showcase pieces become the catalog; every build makes three backgrounds whatever the family; about-the-maker content is written to each of its homes; the sign-up drafts no longer write About you's headline, short line or heading.

**Still to do:**
- **After the merge is live:** drop the old `site_profiles` columns (marquee_phrases, phone, facebook_url, instagram_url, about_title). They were put back (20261019000004) because the live code still reads them; the database is shared with the live site.
- **Taking a cancelled site down** on its date, and Billing's card and past charges: with paying at sign-up (Open-Work, top priority).
