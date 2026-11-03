# Session 119 — 2026-10-31 → 2026-11-03

**Self-serve sign-up and payment, the automatic build, Publish wherever the site shows, and taking a site offline. All on `feat/signup-and-pay`, merged into `main` at the end of the session (Alex: "OK to merge").** `feat/maker-checkup` stays parked; `fix/auth-link-24h` is still Alex's call.

## Sign-up, every plan (Open-Work item 0, done)

The order Alex settled:
1. The maker picks a plan on a pricing card (Free included). Each card has its own sign-up link.
2. They make an account at /start (name, business name, email, password).
3. They go straight to Stripe's own checkout. Free is a $0 subscription with no card box.
4. Back on our site (/start/paid), a "check your email" screen shows. It has a spam note, **Send it again**, and **Wrong email?** to fix the address.
5. The confirmation link signs them in. Free goes to its backend. Showcase, Market and Full go to the site form at **/welcome**, and the backend waits until that form is sent.
6. Sending the form starts the build on its own (see below), then the "your site is ready" email goes out.

A sign-in before the email is confirmed sends a paid maker a fresh link. An unpaid one goes back to Stripe. A sign-up that's started again with the same email picks up the unfinished payment. The confirmation link and Stripe's way back follow the address the sign-up used, so the dev server works while testing.

Billing:
- Plans in Stripe have lookup keys `bohdiai_<plan>_<monthly|yearly>`, made by `scripts/stripe-plans.ts` (run once, in test mode).
- The subscription is recorded from Stripe, in `subscriptions` and the tenant's plan, billing and renewal date.
- `stripe_events` means each Stripe notice is acted on once.
- **Database: approved and applied.** `subscriptions` takes today's plan names, and the `stripe_events` table is new (`20261031000001_signup_billing.sql`).

Proven by Alex end to end: **Rustic Flags** (alexsouellet+tester4) signed up on Full, yearly. Stripe charged $250 on 2026-11-03, the plan renews 2027-11-03, and the site built itself in Cozy. Alex then kept Scenic through Try on a look and published it.

## The build runs on its own

Sending the site form starts a Cloudflare Workflow (`SiteBuild` in `worker.ts`, binding `SITE_BUILD`). It runs the build in steps, each one retried on its own, calling `/api/build/step` signed with the server's secret:
1. prepare
2. pick the mood (when the maker chose "you pick")
3. draft the words
4. write the site
5. send the ready email
6. make the background photos

On the dev server the same steps run in turn after the reply.

Decided (Alex):
- **No product images are ever generated.** Only the maker's own photos are used.
- The three background scenes are still made, after the ready email (before it for Scenic).
- The skin is the mood's default.
- The web address comes from the business name.

Fixed along the way:
- Dev and the live build now use **webpack** (`next dev --webpack`, `next build --webpack`). Google Fonts' new font addresses break Turbopack.
- The app never loads sharp. Two versions in one process broke the dev server. The hand-run scripts finish photos through `scene-finish-sharp.ts`, and the live build uses Cloudflare Images. A test guards it.
- Mood sites carry both word sets, and the build's check now accepts them.

## Publish and offline

- **Publish shows wherever the site is shown** while it isn't live: Home, My site, and the try-on page. Alex then said "take it off the side menu", so it's gone from there.
- **Take my site offline (Alex: the 2026-10-17 "no Unpublish" was "a bad decision").**
  - While the site is live, the foot of Home has "Need a break?" with **Take my site offline**.
  - While it's offline, the top of Home has **Put it back online** and View my site.
  - Both ask once to confirm.
  - Visitors see "This site is temporarily offline. Please check back later." on every page, in the site's own look and words (`shop.offline.*`, filled on all 17 sites). The page isn't indexed.
  - The maker still sees the real site through the private link.
  - **Database: approved and applied**: `offline` is a tenant status (`20261103000001_site_offline.sql`).
- **Offline is also how to hold changes (Alex).** Saves in the backend go live at once. A maker who wants to rework the site takes it offline, makes the changes, checks them through the private link, and puts it back. Visitors see the offline page meanwhile, not the old site. A real draft-over-live is a different feature, not asked for.

## Getting paid for makers: next (Alex)

- **Square takes payments online too (Alex):** "if that is all a maker has we should not be requiring them to get stripe". Any one processor is enough on Full, which Alex already decided on 2026-10-25.
- **How it will work:** Pay in the cart sends the buyer to Square's own checkout page, so we never see the card. The order counts as paid only when Square confirms the exact amount, and the money goes straight to the maker's Square.
- **Why online differs from the market app:** at a market, the maker's own Square app takes the card and BohdiAI only reads the result, so the connection is read-only. Online, BohdiAI has to open the checkout for the maker. That needs two more Square permissions, making orders and taking payments. It's the same Square app, and Square needs no application. Makers already connected would press Connect once more; today that's nobody.
- With Square and PayPal both set up, the buyer picks one at checkout.
- No database change expected: `payments` already records the processor.
- **Stripe for makers** (Connect + checkout) is still to build. Today the button says it isn't set up.
- **PayPal (Alex applies):** the partner form is at https://developer.paypal.com/platforms/overview#tell-us-about-your-platform. It needs a BohdiAI PayPal business account, ideally a fresh one. A PayPal representative reviews it, with no published timeline. Once approved, we give them our live app's ID and they switch it on. Until then PayPal is test mode only.
- Alex starts this in a new session.

## Agreed, not built

- **Photo backgrounds tool** (Open-Work item 56): Tools menu, paid plans only, after the build; 20 / 50 / 100 a month at $0.04 a photo.
- Two questions from testing, still unanswered:
  - Should the form's photo error name the photo ("Photo 3 couldn't be read")?
  - Should the form keep a draft across a reload, photos included?

## Mistakes

- Claude said the build was already automated. It still needed someone to run a command, and Alex: "YOU running it is not testing it".
- Claude first had confirming lead into the backend with no site yet, and misread "no images" as all images. Alex meant product images only.
- Claude built Alex's first test site by hand instead of letting the onboarding build it ("STOP giving us extra steps").

## For Alex, before live sign-ups

1. Add `STRIPE_SECRET_KEY` (the test key for now) to the Worker's Variables and Secrets in Cloudflare. Live sign-up can't reach Stripe without it.
2. Register the Stripe webhook (bohdiai.com/api/stripe/webhook) and add its `STRIPE_WEBHOOK_SECRET` the same way. Claude will walk through it.
3. Optional: change Stripe's public business name from "Alex Ouellet" to BohdiAI.

## Checks

3,964 unit tests and a clean type check (`.next` excluded). Sign-up, confirm, the form, the build and Publish were run through the dev server by Alex. Offline was checked with curl as a visitor and as the maker.
