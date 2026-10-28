# Plan Backends — what each plan's backend holds

**Started 2026-10-19 (Session 109), defined with Alex one plan at a time.** The backend is the set of screens a maker uses at app.bohdiai.com to change their own site. This page says what each maker plan gets on a **standard site** (a family/mood site). It is the source for the plan switches in the code (`lib/backend/plan/plan-features.ts`) and for what the pricing cards promise (`lib/site/plans.ts`). Market and Full are added as they are settled.

**Custom sites** (Rustic Rhody, Saltmarsh, Paper & Patina, Ember & Pine, Rose n' Cat, Cut-Pro, Mazzone…) are **not part of this**. They are discussed separately (Alex, 2026-10-19).

---

## The ladder (Alex, 2026-10-24, Session 113)

Four plans, each keeping everything below it and adding one capability:

- **Free** — know your numbers: the dashboard and the tools, no site.
- **Showcase ($5)** — be found: a one-page site in their chosen look ("one page", never "generic").
- **Market ($15)** — sell in person: the whole market app.
- **Full ($25)** — sell online.

Each plan gets its own first steps, starting where the plan below ended, so moving up feels like the next chapter. Every step opens where it happens and comes back to Home with the next one ready; a plan's steps go once done and Home settles into its everyday view. Proposed and agreed in outline (Alex: yes; build Free first):

- **Free:** price your first piece (Cost to make, Price it, save as a product), the rest of your pieces (products list shows each price against its break-even), your next market, then Market day after it. Ongoing: Home shows pieces priced too low, the best earner, what the last market paid an hour. Nudge up once there are a few products: "Your pieces are ready to show."
- **Showcase:** products already there; pick the 12 for the gallery, headline and story on the page, how people reach you and socials, publish, print the QR. Ongoing: market dates, swap the gallery. Nudge up when doing markets often.
- **Market:** prices start showing; how each piece is stocked, connect Square, before the next event pick what you're bringing and put out the QR; the till on the day; after, costs, How it sold and Results fill in (Market day done for you). Nudge up when people ask to buy online.
- **Full:** connect online payments, collections, more photos, a promotion; ongoing: an order comes in, pack, mark sent, refunds there.

**Status:** Free built on `feat/backend-tools` (Session 113, unmerged). Alex: "this is no better and in some ways worse"; the whole backend "does NOT flow". Next session starts by asking what felt worse.

## Free (Alex, 2026-10-24, Session 113)

**A dashboard only.** Makers sign up free and add products only for analysis (running the tools). Results are saved on their own products and events, not downloaded. They upgrade when ready or stay free. An account (not just a newsletter email) keeps them connected and is a marketing tool (Alex).

- **Products come from the tools, not the other way round** (Alex): a Tools menu not tied to any product; a product is saved out of a tool ("Save as a product"), a market out of Market day ("Save as an event").
- **What it holds:** products (with their costs), the schedule with each event's costs and Market day numbers, the Tools, Contact support. No site screens, no plan or billing screens yet. Not on the pricing pages yet.
- **Suggested price next to her own price:** her price is her decision; the tool's is advice, one tap away ("Use the suggested price"). A price below break-even says so on the product and in the products list. A product with no price starts at the suggested one.
- **Database (Alex approved, applied Session 113):** Free in `tenants.plan` / `plan_next` (not `plan_comp` 'free', which gives a paid plan away); `product_costs` + `product_cost_items` (a product's batch, time, other costs, markup and supply list); `event_takings` (Market day's own numbers where there's no till: sales, card share and fee, materials, hours, hourly pay; booth, gas, food and other stay in the event's costs).
- **Steps and numbers on Home are worked out, not stored:** a step is done when the thing it asks for exists.
- **Preview site:** Juniper Hollow Candles (`juniper-hollow`, draft, Alex's login).
- **Open:** whether Free has a product limit; Free's sign-up (with paying at sign-up, the same form); how Free shows on the pricing pages.

## The tools (Alex, 2026-10-24, Session 113)

From Alex's Maker's Toolkit (claude.ai build; `Downloads/bohdiai/makers-toolkit.html`). **The maths is Alex's agreed version; don't change it without asking him** (now in `lib/tools/maths.ts` on the branch).

- **Built (branch):** Cost to make (one batch: supplies with what was paid and batches each lasts, what every piece gets, hours and pay), Price it (break-even exact, never rounded; price = break-even × Double / 2.5 / Triple rounded up; per place: markets, Etsy grossed up for its fees, Facebook haggle room, own website card fees, consignment cut plus rent shared over pieces sold; shop price = (materials + time) × markup; comps search buttons and a low/high), Market day (take-home, pay per hour, verdict against her rate, sales needed to hit it).
- **Built (Session 117, `feat/maker-free`):** Describe it, the description writer (also under the description on the product screen; can start from one of her products).
- **Decided (Alex, Session 117, 2026-10-28):** **"Is this market worth it?" replaces Market day in Tools.** Market day is too close to what the market app does, and adding up the day itself is a reason to move up to Market. Build next: is this market worth it, a monthly goal (pieces / markets / batches to reach $X), shipping cost (box, padding, postage by weight), what to bring (Market, from How it sold). **Taxes to set aside: dropped** (too basic). **Which pieces actually earn: not a tool, a feature on Full's Home** (from real sales).
- **Is this market worth it? (agreed with Alex, Session 117):** asks the market's name; what it costs to go (booth fee; gas, tolls and parking; food; bags, signs, other); her time (hours at the market, hours driving and packing, what an hour is worth); a typical sale (what an average piece sells for, what it costs to make, the share paid by card and the card fee). Maths: each piece earns its price less its cost to make less the card fee on the card share; the day's cost = booth + travel + food + other. **Just to cover the day** = day's cost ÷ what each piece earns, rounded up to whole pieces, shown as pieces and dollars; **to also pay herself** = (day's cost + hours × rate) ÷ the same. An optional guess of what she'll sell gives the verdict ("worth the trip", "close", "hard to justify"). Save as an event puts it on the schedule with the booth and travel as its costs.
- **The Market day box on an event's page (Alex, Session 117):** stays on the paid plans (Showcase has it; Market and Full count the day in the market app), **gone on Free**. Free's Home then leads with "Is this market worth it?" instead of "How did a market go?", and its numbers stop counting market days.
- **Description writer and competition:** a monthly limit on Free (cheap model, about a cent a run), more on paid plans. Never fetch Etsy (or other shops') results on our server (Etsy's rules); the search buttons open Etsy in her own browser, and comparison works from listings she pastes or the low/high she typed. On the makers arm, no AI talk ("help writing your descriptions").
- **Public:** the toolkit stays free and open on the web (saved in the browser) as a way in, beside the maker checkup ("do you need a site", `feat/maker-checkup`). Suggested home `makers.bohdiai.com/tools`; Alex hasn't answered where it lives or whether the header links it.
- **Flagged to Alex, not changed:** the "Other costs for one" hint includes booth and card fees, then the Etsy and website prices add card fees again and charge booth share to online sales.
- **A video** explains the ladder (Alex); film the free toolkit first, the whole ladder once Free is real.

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

Settled with Alex, 2026-10-20 (from the 2026-10-11 Market plan talk): **everything Showcase has, plus the whole catalog with prices and the whole market app.** No online selling of any kind (not even reserve for pickup), no promotions, no collections, no order tracking, one photo per piece.

### On the site
- The shop page and a page for each piece: photo, price, "Ask about this". Pieces with options (colours, sizes) show their dropdowns, each choice at its own price.
- **No collections** (Full only): no collections band, menu link or pages.
- The gallery as an add-on with **no limit** (see "The gallery section").
- Markets with day, hours, address, booth and website.
- **Testimonials: up to three**, the ones the maker ticks; her first three until she ticks any.
- The market shop shoppers scan at her table: pick a piece, how many, and which option; it shows what's left at that market.

### What the maker gets in the backend
Everything Showcase has, plus:
1. **Products** with prices, stock on hand, and options (each choice with its own price and stock).
2. **Markets** with details, and the market records: costs, organizer, notes, review.
3. **What I'm bringing** on each market: tick the pieces, and say how many of each (or of each option). The count starts at what's on hand. With none left at that market, the piece shows sold out there. Each sale takes from what's on hand and from what's left at that market.
4. **Market POS**: a tile per piece or option, + and − for how many, stops at what's left; Getting paid.
5. **How it sold** on each market's page (brought, sold, left, when it sold out) and **Sold out at your markets** on the results page; results this year against last, after costs.
6. **Testimonials** with a "Show on my site" tick (up to three).
7. Card payments at the table: **Square only** (Alex, 2026-10-20). **Built and live (Session 111):** Connect Square on Getting paid (Square's own page; read-only permissions; keys locked server-side and scrambled with a secret kept in Cloudflare), pick the Square location, Disconnect. Card in the Market POS opens the Square app with the total (tap, insert, or typed in by hand); the sale is recorded only when Square confirms the exact total. Alex's #1 for payments: they stay secure.
8. **Change price** at the table (haggling, Alex 2026-10-21, built): an agreed price per line, never above the marked one; How it sold shows what was haggled off.
9. **Refunds** (Alex 2026-10-21; built Session 112 on `feat/market-orders`): Refund (a yes first) on every paid sale, on the market day, in **Sales** and on each event's **How it sold**; the piece goes back in stock, the takings leave it out, a card sale gets its refund record. Final. A refund done in the Square app shows up on its own later (Square notices; Alex: later).
10. **The Events menu** (Alex 2026-10-22, Session 112): **Schedule** (the events list; each past one shows what it took in; "Add an event"), **Market POS**, **Sales** (every market sale grouped by event, one line each), **Results**. **Getting paid** sits in **Settings**. Each event's page: a summary sentence (takings, after costs, Open market day on the day) and tabs **Details**, **What I'm bringing**, **How it sold**, **After**. "Event", not "market" (Alex: not all are markets); Market POS and the market day keep their names.
11. **Home Events box** (Alex 2026-10-22): next event, last event (takings, after costs), the year so far against last; each line opens where it leads.
12. **How a piece is stocked** (Alex 2026-10-22): **One of a kind** (Sold once it sells), **I have some** (a count; Sold out at 0), **Made to order** (optional ready count; with none ready the site shows **Order only** and it can still be asked about or ordered). Per option too. **A new product starts with no choice** and can't be saved until she picks (Alex 2026-10-24: most makers are small batches, then one-offs; pure made to order is the smallest group). Option combinations still start on Made to order (Alex may want them blank too).

### On the site, also (Session 112)
- **Each market has its own page** (`/events/<id>`), reached by clicking it anywhere on the site: its details and What I'm bringing (or "coming soon"); never takes payment. Showcase's dates stay plain.
- **Sold** and **Order only** on the pieces, in every design.

### Every plan, also (Session 112)
- The **Scrolling line** screen only where the site's design shows one (the moods other than Scenic; Alex: "turn it off for sites it is not included in the design for").

## Every plan, also
- **Visitor numbers** on the backend home (Alex, 2026-10-20): visits and pages seen this week against last, the most-seen pages and where visits came from (30 days). Counted without cookies in Cloudflare (three months kept). **Full keeps its months** for as long as it's on Full (`site_visit_months`, saved daily).

## Full ($25 a month)

Settled with Alex, 2026-10-25 (Session 114), on top of the earlier calls. **Everything Market has, plus selling online, buyer accounts and try on a look.** Next after Full: the tools and Free (held until Full is done, Alex 2026-10-25).

### On the site
- **The cart takes payment** (today it only sends an order request): cards through the maker's own **Square and/or Stripe** (Alex, 2026-10-20), and **PayPal** (Alex, 2026-10-25). Money goes straight to the maker; BohdiAI never sees a card or a password and takes no cut; an order counts as paid only when the processor confirms it. **Any one processor is enough** (Alex, 2026-10-25: Renée has only PayPal): with PayPal alone, buyers without PayPal still pay by card, through PayPal's guest card option and its card form on the site (confirm it's offered in Canada and for her account).
- **Collections** (band, menu link and pages).
- **Every testimonial**, not just three.
- **Several photos per piece** (Market has one).
- **Buyer accounts** (Alex, 2026-10-25; Penny's site is the reference): a buyer signs in on that shop (each shop's accounts are its own) and sees **My account**: past orders, a page for each order, **Reorder** on a paid order. Checking out without an account always works. The maker switches buyer accounts **on or off** in her settings.

### What the maker gets in the backend
Everything Market has, plus:
1. **Online shop**: **Orders** (online orders, Refund on every paid one; built Session 112) and **Promotions** (sales and codes, never stacked; built).
2. **Getting paid** adds connecting Stripe and PayPal beside Square, each on the processor's own page, keys locked server-side as Square's are.
3. **Buyer accounts** switch, and her buyers.
4. **Visitor months kept** for as long as she's on Full.
5. **Try on a look** (Alex, 2026-10-17; how it looks, Alex 2026-10-25): built like bohdiai.com/looks, a row of moods above **her own live site** in a browser window, with the phone switch, her own pieces and words in every mood. Only she can see it, from her backend; **Keep this look** switches her site. It must survive clicking around the site, and Scenic must never fall back to the marsh (every build makes three backgrounds, Open-Work item 6). A maker who steps down from Full keeps the look she chose.

### Leaving Full (Alex, 2026-10-25)
- **Buyer accounts are never deleted.** Below Full her buyers just can't sign in; moving back up to Full turns sign-in back on with everything there. This is meant as a reason not to step down.
- The step-down screen says so plainly before she confirms (how many of her customers will no longer be able to sign in), in the site's own words.

### Built (Session 114)
Getting paid's Square, Stripe and PayPal sections; PayPal connect, checkout and refunds in test mode only (nothing live; Alex: admin first, payments later; checkout shows no way to pay until one is set up); Try on a look (`try_on`, Full); the opening photo on Headline and the Background screen (every plan); a site's own background (`site_backgrounds`). Still to do: PayPal for Market, downloads delivered. Buyer accounts and the step-down count built in Session 115 (`feat/buyer-accounts`).

### Market, also (Alex, 2026-10-25)
- **PayPal at the table** beside Square: the maker's own PayPal account; the simplest way is a PayPal QR code the buyer scans, recorded only when PayPal confirms. (PayPal's card reader is another option.) Venmo comes through PayPal in the US only.
- Before building PayPal: check what PayPal requires of BohdiAI for makers to connect their own accounts (Square needed its own setup).

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
