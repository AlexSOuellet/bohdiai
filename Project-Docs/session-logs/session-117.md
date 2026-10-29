# Session 117 — 2026-10-28

**The backend redesign was merged and is live. Maker Free and the tools are built on `feat/maker-free` (pushed, NOT merged): Free's own Home in the redesign, the tools as separate screens on every plan, a description writer, Is this market worth it? (replacing Market day), Monthly goal, Shipping, and What to bring (Market and Full). Free has no events. Showcase events gained costs and Market day. Next session (Alex): "tomorrow we build the freemium info and rebuild bohdiai.com".**

## Decisions (Alex)

- **The tools are separate screens, not a wizard.** Each one runs on its own. Data carries over only by a link to the next tool (Cost to make into Price it). Tools is its own menu entry on every plan.
- **Market day is not related to pricing.** Price it doesn't link to it, and it doesn't link to Cost to make.
- **The Cost to make heading** reads "What does it cost to make one product?" (or one of her own piece's name).
- **The supply detail goes in Cost to make.** "What it is" holds the exact supply (1 inch thick pine round, 18 inches across).
- **A description writer, on the cheapest AI, using the photo.** It sits under the description on the product screen and also stands alone as Describe it. The stand-alone one can start from one of her products and save back to it. Limits: 30 a month on Free, 100 on paid plans. The `description_runs` table was approved and applied.
- **Free's product screen doesn't ask site things** (no stock, options, collections, shop link or home tick).
- **"Is this market worth it?" replaces Market day in Tools.** Market day is too close to the market app, and counting the day is a reason to move up. Its shape and maths are in Plan-Backends "The tools".
- **Tools to build:** Monthly goal, Shipping, What to bring. **Taxes to set aside: dropped** ("too basic"). **Which pieces earn: a feature on Full's Home, not a tool.**
- **No events on Free.** Events start on Showcase.
- **Market day goes on Showcase events** ("a nice bump on Showcase"). It had only ever been on Free, on the unmerged branch, so no live plan ever had it.
- **Free's numbers tag wording:** "Your prices", "Costs worked out for 1 of 1 products", "Selling for less than they cost to make".
- **Say "the maker", not "she", for makers in chat** (Alex: the "she" was sexist).
- **Recorded in Open-Work for later:**
  - bohdiai.com becomes the maker site only. No doors. Service and charities come off; the service side is switched off, not deleted, apart from one "contact us for a non-maker site" note. Free goes on the plans and pricing.
  - Explainer videos.
  - Finishing the demo.
  - The cancel flow: offer every lower paid plan down to Showcase, and if the maker still cancels, they automatically go onto Free.

## Built (`feat/maker-free`)

- **The merge of `feat/backend-tools` into the redesign,** and the redesign merged into `main` first (live). Coverage was lifted to 90.48% to pass the gate.
- **Free's Home:**
  - "Know your numbers", with Price a piece and Is this market worth it?
  - The numbers tag.
  - First steps: price your first piece, add the rest, write a description.
  - The work wall, and Showcase's nudge at three pieces.
- **Free's switches are catalog only.** Juniper Hollow's switches were reapplied. Its old events are kept, hidden.
- **The tools:**
  - **Cost to make, Price it and Describe it,** as decided above. Save as a product from Price it carries the costs only when they came from Cost to make.
  - **Is it worth it?** The pieces and sales just to cover the day, and to also pay herself, from what a typical piece earns (price less its cost to make less the card fee on the card share). A guess of sales gives "Worth the trip", "Close" or "Hard to justify". Save as an event shows only where there's a schedule.
  - **Monthly goal.** Pieces = goal ÷ what a piece earns, and markets = pieces ÷ what she sells at one, both rounded up.
  - **Shipping.** Box + padding + postage, which she looks up herself. Charge = cost ÷ (1 − card fee), rounded up to the cent.
  - **What to bring** (Market and Full). From How it sold at all her markets, or one market's dates: the most she sold at one of them, the average, and how often it sold out.
- **Showcase events:** an After tab with the costs and Market day (no notes or review, which stay Market's).
- **Product fixes:** ".5" and ".50" save. Free and Showcase are never asked how many they have.

## Found along the way

- **Claude told Alex that Showcase had the Market day box before checking.** It was Free's only, and the mix-up confused the whole discussion. Check the code before saying what a plan has.
- **Prettier reformatted a whole file** (`MarketEditor.tsx`, 833 lines). Don't run it on files the repo doesn't keep formatted; change only the lines you mean to.
- **Haiku sometimes writes "this listing is a set of three".** It's harmless, and the prompt already forbids mentioning the listing.

## State

- `feat/maker-free` is pushed, not merged. The full test suite was last run before the description writer (3775 passing, 90.84%). Since then only the targeted tests ran, because the dev server was on.
- The `description_runs` table is applied to the shared database.
- The Market day box code stays (it's on Showcase now).
- The dev server is running in Alex's Terminal tab.

## Next

- **First: run the full suite with the dev server stopped (ask Alex), then merge `feat/maker-free`** and check Workers Builds and the `test` check.
- **Then (Alex): the freemium info and the bohdiai.com rebuild** (Open-Work 3a). Maker site only: no doors, service switched off but not deleted, one note for non-maker sites, Free on the plans and pricing.
- Still open: Which pieces earn on Full's Home; cancel down to Free; Free's sign-up with paying at sign-up; explainer videos and the demo; renaming `site_added_sections`.
