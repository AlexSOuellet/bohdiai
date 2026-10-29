# Session 118 — 2026-10-29

**Everything merged and live.** Maker Free and the tools (`feat/maker-free`), bohdiai.com rebuilt as the maker site (`feat/bohdiai-makers-only`), and Spotlight's opening put back the way Paper & Patina's show reel had it (`feat/spotlight-opening`). `main` is the only branch from this session.

## Free and Showcase

Alex asked whether Maker Free and Showcase should be one plan (the only real difference is the site with no prices). Claude said keep them apart: Free has no site at all, Showcase is the first step with one. Is Free enough to get sign-ups? On its own, no; the pull is the description writer and every piece priced in one place.

**There is no public toolkit (Alex).** Claude had repeated a Session 113 suggestion as if it were settled. `Plan-Backends.md` and Open-Work now say so.

## More tools for Free (agreed, not built)

Alex wants Free more useful: business tools and things to download or print. Agreed, "all of them":
- printable price tags and labels
- a supply shopping list
- a batch planner
- care cards and thank-you cards (the care words could come from the product's existing after-purchase note)

Dropped: a year-end summary (Alex: Free doesn't track that and makers won't enter it).

## bohdiai.com is the maker site (Open-Work 3a, done)

- No doors. bohdiai.com is the maker page: opening with the samples (Classic Loafs, Paper & Patina, Saltmarsh), one line for anyone who needs a site that isn't for a maker ("send me a note", to the question box), the looks, the plan ladder, how it works, plans and prices, the comparison, custom sites, who's behind it, the pledge, questions, the close.
- makers.bohdiai.com and service.bohdiai.com forward to the same page on bohdiai.com; /makers and /contractors forward to the home page, /samples to /looks. The service code stays, switched off.
- **Free is on the ladder and the pricing cards** ("Know your numbers", $0 always, no card, a short list of what it does, no button yet: Free's sign-up doesn't exist).
- The questions page answers for makers only (service questions kept, tagged, not shown); new Free questions.
- Header, footer, the share picture, the sitemap and the who's-behind words are maker-only.

## Spotlight's opening (Paper & Patina)

Alex: converting Paper & Patina to Spotlight lost a lot of its look; "I like the hero the old way... the rest is good the new way". Claude showed the old show reel locally first, then matched it:
- the shop name slams in again, the second line smaller and softer; the headline under it
- the Reel skin uses the show reel's own fonts (Fraunces, soft, over Karla). Botanical moved to Newsreader, since no two skins share a display face (Alex said yes)
- no added line under the headline (Alex: "no additions"); Paper & Patina's sub cleared
- the button says **See the work ↓** again and jumps down to the gallery: opening buttons can now point at the gallery (**database: approved and applied**, `20261029000001_moment_button_to_gallery.sql`), offered only on plans without a shop
- the market dates band is bigger and easier to read
- **Spotlight has one scrolling band**, the market dates. The big-word scrolling line is off in Spotlight, and its backend screen is hidden there (like Scenic); the saved phrases stay.

Small differences left: the "& Patina" pink is a touch duller than the old one; Spotlight's menu shows About and Contact, which the old page didn't (Alex hasn't objected).

## Mistakes

- Claude merged `feat/maker-free` when Alex had asked for the bohdiai.com rebuild ("wait, what did you do"). It stayed live.
- Claude kept changing Paper & Patina's words when asked to put it back ("I have said over and over to put it back the way it was").

## Open, unanswered

- A page for each plan (Alex raised it). Claude's suggestion: the home page cards as the overview, each linking to its own page (bohdiai.com/free and so on).
- The paid pricing cards still promise things that aren't true (Market: Venmo / Cash App / Zelle; Full: cards at markets through Stripe or Square, video).
- Free's sign-up.

## Checks

3,818 unit tests, type check clean (outside the throwaway `tmp/` scripts), lint clean; 30 e2e tests on the marketing pages ran on the branch.
