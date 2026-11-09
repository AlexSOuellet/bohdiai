# Go-Live Plan

**Written 2026-11-09 (Session 121).** "Fully live" means a stranger can find bohdiai.com, sign up, pay BohdiAI for a plan, get a site, change or cancel their plan, and take money from their own customers online and at markets, with nothing on the site promising what isn't there and nothing harmful getting published.

Part 1 is what has to be done for that, in the order it gets done. Part 2 is everything else, after.

**Each step is ticked here the moment it's done and live (Alex, 2026-11-09).**

---

## Part 1 — To be fully live

### [x] 1. Get the tests passing again (Claude) — done 2026-11-09
**What it is:** every push to `main` runs about 4,200 automatic checks. Since Oct 29 that run has been failing, so a real break could slip through and nobody would notice.
**Today:** 2 of 4,185 checks fail, both in the Square card-sale code at markets (the check that a card sale counts only when Square confirms the exact total). The other 4,183 pass. Coverage (how much of the code the checks exercise) was also below the 90% rule after Session 119.
**Done when:** the run is green on `main`, and stays green after every later push.
**Done (2026-11-09):** green on `main`, Cloudflare build passed. Four causes, each hidden behind the last: the Square checks' pretend key ran into its renewal window on the real clock (now pinned to their own date); coverage 89.07% (85 checks added, now 90.48%); GitHub's test machine moved to Ubuntu 26.04, where the browser tests can't install (pinned to 24.04); one browser check still expected no button on Free. Noticed, not changed: a promo code with `&`, `#` or a space breaks Stripe's back link at sign-up; a saved discount with a code but no percent records as NaN; fixing a sign-up email changes it on our side before Stripe, so a Stripe failure there leaves no confirmation sent.

### [ ] 2. Makers change their own plan (Claude)
**What it is:** a maker presses Upgrade or Downgrade and it just happens, and Stripe charges the right amount.
**Today:** the Change plan screen exists, but pressing it says "Plan changes go through Alex for now" and emails you. Nothing changes in Stripe.
**How it will work (the rules you already set):**
- Upgrade: happens straight away. Stripe charges the difference for the rest of the month or year right then.
- Downgrade: takes effect at the next renewal. Nothing is refunded. The maker keeps the bigger plan until then.
- Free to a paid plan: same as upgrade (Free is already a $0 Stripe subscription, so it's a change on that same subscription).
- Every change still emails the maker, with a copy to you.
- Stepping down warns first about what they lose (this screen exists, for example how many customer accounts stop working when leaving Full).
**Done when:** proven against Stripe's test mode, every direction (up, down, monthly to yearly).

### [ ] 3. Safety checks before strangers can sign up (Claude builds; you decide the wording)
**What it is:** once anyone can sign up, someone will eventually put up something illegal, hateful, a scam, or someone else's photos. Today nothing stops that and you have no way to take it down quickly.
**Today:** bohdiai.com has terms and privacy pages, but they are written for visitors to bohdiai.com, not for makers using the service. There is no terms page a maker agrees to at sign-up, no check on what goes on a site, no way for a visitor to report a site, and no switch to take one down.
**What gets built:**
- **Maker terms and an acceptable-use list:** what a maker can and can't sell or show, ticked at sign-up. You approve the wording.
- **A check on words and photos:** when a site is built, and when a maker saves something new, Claude reviews it. Anything flagged is held until you look at it; the rest goes through as now.
- **"Report this site":** a small link in every site's footer that sends you a message.
- **A suspend switch:** on a maker's page in your admin. One press takes the site offline (the same "temporarily offline" page that exists today) and stops the maker putting it back.
**Before building:** I bring you the plain list of what each check flags and what the maker sees, and wait for your yes.

### [ ] 4. Makers get paid online with Square (Claude)
**What it is:** on Full, a shopper fills the cart, presses Pay, and pays on Square's own checkout page. The money goes straight into the maker's Square. BohdiAI never sees the card.
**Today:** Square works only at markets (Card in the market app). Online, the cart has no way to pay.
**How it stays safe (payment security is #1):**
- The shopper types their card only on Square's page, never on ours.
- An order counts as paid only when Square itself confirms the exact amount, never because a page says "thanks".
- Square's keys stay where they are now: on the server only, scrambled with a secret that lives only in Cloudflare.
- It needs two more permissions from the maker's Square (make orders, take payments). A maker already connected presses Connect once more (nobody real today).
**Done when:** a test order goes through end to end, with a refund.

### [ ] 5. Makers get paid online with Stripe (Claude)
**What it is:** the same, for makers who use Stripe instead of Square. They connect their own Stripe account to BohdiAI, and shoppers pay on Stripe's own page.
**Today:** the Stripe section on Getting paid exists with a Connect button that says it isn't set up yet.
**Same protections as Square.** Money goes into the maker's Stripe, never BohdiAI's, and BohdiAI takes no cut.
**Done when:** a test order goes through end to end, with a refund.

### [ ] 6. Sales tax (needs a talk first)
**What it is:** makers have to charge sales tax in most US states, and Canadian makers charge GST/HST. Today no sale anywhere adds tax.
**The question for you:** who works the tax out?
- **Option A (Claude's suggestion):** the maker types their own rate (and can change it for a market in another state). BohdiAI adds it to each sale and shows it in the results, per state. Simple, free, and the maker stays responsible, which they are anyway.
- **Option B:** Square or Stripe works out the rate from the shopper's address. More exact for online sales, but Stripe charges extra for it, and markets still need a typed rate.
Also to settle: whether a maker's prices include tax or have it added on top (the old plan said: their choice).

### [ ] 7. Pricing cards that match what's built (you decide; Claude changes it)
**What it is:** the plan cards on bohdiai.com list what each plan includes. Right now the Full card promises things that don't exist.
**The Full card today says:**
- "Take cards at markets through your own Stripe or Square": only Square does that, and it's already on Market, not just Full.
- "Up to 12 photos and a short video for each product": the photos are real; product video isn't built.
- "Digital downloads, if you sell them": not built.
- "Testimonials from your customers": these start on Market, so it isn't something Full adds.
**The Market card** is right about Venmo, Cash App, Zelle and cash at the table, but it doesn't mention Square cards at markets, which it has.
**Your choice:** change the words to what's built now, or build video and downloads before going live.

### [ ] 8. The site form keeps the maker's work (Claude)
**What it is:** after paying, a maker fills in one long form (their pieces, photos, about, mood) and the site builds from it.
**Today, two problems:**
- If a photo can't be read, the error doesn't say which photo, so the maker has to guess.
- If the page reloads (phone locks, bad signal), everything they typed and every photo is gone and they start over.
**Done when:** the error names the photo, and a reload brings back what they had, photos included.

### [ ] 9. Switch Stripe from test to live (you, with Claude)
**What it is:** today everything BohdiAI charges runs in Stripe's test mode (fake cards, no real money). Going live means real keys.
**Steps:**
1. **Now:** put the **test** keys into Cloudflare (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) and register the webhook (the address Stripe calls to tell us a payment happened). This lets the live site run real sign-ups against test mode, and makes your Promotions tab work.
2. **After 1–8 are done:** one full run-through in test mode: sign up on each plan, build, upgrade, downgrade, cancel, a promo code, an online order through Square and Stripe.
3. **Then:** make the plan prices in live Stripe (`scripts/stripe-plans.ts`, run once), swap the live keys into Cloudflare, register the live webhook, and do one real sign-up yourself.

---

## Part 2 — After going live

Not needed for a stranger to sign up and sell. Roughly in order of value.

**Selling**
- **The market app done right:** several pieces in one basket with one payment; keeps working with no signal and sends sales when signal returns; a Publish step when setting up a market; retire the old Today and Sell screens.
- **Market discounts:** a percent off per market, set by the maker (haggling at the table already works).
- **Square refund notices:** a refund done inside Square shows up in BohdiAI on its own (today it's recorded only when done in BohdiAI).
- **Product video** and **digital downloads**, if they stay off the Full card for launch.

**Running the business (your admin)**
- Statistics beyond the dashboard, demo runs and checkups, FAQs and content, reports from "report this site" in one list.
- Error alerts: you hear when something breaks on the live site (Sentry is set up in settings but not installed).
- The Cloudflare analytics key (you) so makers' visitor numbers show.

**Makers' tools**
- The photo backgrounds tool (Showcase 20 a month, Market 50, Full 100).
- The four extra Free tools: price tags and labels, supply shopping list, batch planner, care and thank-you cards.

**bohdiai.com**
- A page for each plan.
- The public demo with explainer videos, and your own photos on Saltmarsh.

**Platform**
- Custom domains (a maker's own web address) and a status panel.
- Staging: a separate test copy of the whole system with its own database, so testing never touches live data.
- Clean-up: rename the section-switch table, remove old code and build tools, tidy Cloudflare, cancel Vercel.
- Move Cut-Pro and Mazzone onto the same setup every other site uses.

**Waiting on others:** Joe's feedback; Renee's details for Rose n' Cat.
