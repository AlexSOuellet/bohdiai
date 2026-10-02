# bohdiai.com — pricing pages and signup — design

**Date:** 2026-10-02 (Session 91)
**Status:** agreed with Alex in brainstorming, section by section.
**Builds on:** `2026-09-29-bohdiai-com-rebuild-design.md` (the current site) and `2026-10-02-tiers-and-pricing.md` (the plans and prices).
**Order:** built before maker backend 1c Video (Alex, 2026-10-02 — showing prices is what brings people in).

## Why

The rebuild left pricing off because there was nothing to show. There is now: four plans, every one built free, monthly or yearly. Alex's point: people have been burned by high custom-site quotes, so show them what they get, for much less. The one-line pitch: **a real web developer for less than a site builder.**

This reverses the rebuild's "no pricing section" decision and its "you'll know the full price before I start" promise.

## Settled decisions

- **The look stays** (dark, honey glow, Inter Tight, pills, dot-flanked kickers). New content, not a redesign.
- **Prices are public.**
- **Makers and contractors get separate pages.** Their prices are never shown side by side (contractor Full costs more than maker Full; it is a different product sold on what it does for the business).
- **Charities:** stay on the home page as "let's talk" — no price, no page; they use the contact form. The headline keeps "fund it".
- **Headline on both pricing pages:** "A real web developer for less than a site builder" (no terminal punctuation). "Less" counts the customer's own time: the comparison directly underneath shows it, so the page backs up its own claim.
- **Competitors are named** (Wix, Squarespace, Shopify, Etsy; Angi / HomeAdvisor / Thumbtack for contractors). Every price is checked on the competitor's own site and the check date recorded before the page goes live. Rows are fair: say what the cheaper option makes you do yourself.
- **No "Recommended" / "Most popular" tag** on plan cards for now — added once real signups show which plan people pick.
- **Self-serve signup through Stripe Checkout.** Card saved at signup; **first charge when the site goes live** (Alex ends the trial in Stripe on hand-over day). A Full maker who wants to start entering products early asks for **early access**, and billing starts then. No special caveat line for Full makers: billing starts at go-live and a Full site goes live with checkout working (if a Full maker signs up before selling exists, focus switches to building it).

## Home page (`/`)

Unchanged: header look, hero + work browser, the work section, trades strip, About (`WhoBehind`), Pledge, footer.

Changes:

1. **Two doors**, directly under the hero: "I make things" → `/makers`; "I run a service business" → `/contractors`. Beneath them a small line: "Charity or community group? Let's talk" → the contact form.
2. **Header:** add "Makers" and "Contractors" links beside Work / About / Contact.
3. **How it works** reworded for plans:
   1. Pick your plan (or tell me about your project) — sign up on the makers or contractors page, or send a message.
   2. I build it and show you — unchanged in spirit; you see the real site before it goes live.
   3. You go live — billing starts the day your site goes live. Fixes are always covered; on Full plans you keep your own products, dates and photos current yourself.
4. **Contact section promises:** "You'll know the full price before I start" is replaced (prices are public now). Kept: "I never take a cut of your sales." New second promise: "Built free. You pay nothing until your site is live."

## The two pricing pages (`/makers`, `/contractors`)

Same structure, own words and examples.

1. **Hero:** the headline, plus a one-line sub for the audience (makers: products, markets, being found; contractors: estimate requests and getting work).
2. **Plan cards — Lite and Full, side by side** (stacked on phones). Each card:
   - name and one line on who it is for (e.g. Maker Lite: "For makers who sell in person and want a place to send people"; Contractor Full: "For contractors who want the site to bring in work");
   - the monthly price large, the yearly price beneath ("or $149 a year — two months free");
   - "Built free";
   - what is included, in plain words (lists in the tiers-and-pricing spec);
   - **Get started** → Stripe Checkout for that plan and the billing period chosen with one Monthly / Yearly toggle above both cards (Monthly selected by default).
3. **The comparison:** rows of what each option costs and what you have to do yourself, ending with BohdiAI.
   - Makers: web designer; Wix / Squarespace; Shopify; Etsy (fees on every listing and sale, customers are Etsy's); BohdiAI.
   - Contractors: web designer; Wix / Squarespace (you build it at night after a day on the job); Angi / HomeAdvisor / Thumbtack (pay per lead, shared with competitors, whether or not you get the job); just a Facebook page; BohdiAI.
   - Every competitor figure checked and dated before launch (recorded in the code beside the figures).
4. **Real work for the audience:** makers — Penny (Decoupage Digital Designs) and the three sample shops; contractors — Cut-Pro. Reuses the existing work data (`lib/site/work.ts`) and components.
5. **Contact form** for questions, with the kind of business preset and the plan they were looking at noted.

**What contractor pages may advertise:** the full Contractor Full package, built or not; when a contractor signs up, the missing pieces are built before their site goes live. No delivery date is promised.

**Copy:** wording in this document (How it works, promises, card lines, page subs) is draft; it is written in the build and Alex reviews it on the running page before commit, as with the rebuild.

## Signup flow

1. **Get started** asks our server for a Stripe Checkout session for that plan and billing period (`app/api/checkout/route.ts`, rate-limited like the other public routes, plan + period validated against a fixed list — the browser never sends a price).
2. **Stripe Checkout** (subscription mode, long trial) collects name, email and card, plus two custom fields: **business name** and **Facebook, Instagram or website link** (optional). Custom text on the page: "Your card is saved today. You aren't charged until your site goes live." The word "trial" is not the message.
3. **Thank-you page** (`/welcome`): what happens next ("Alex will be in touch within two business days to start your site") and a short get-ready checklist (logo, a few photos of your work, a sentence about what you do, your social links).
4. **Stripe webhook** (`app/api/stripe/webhook/route.ts`, signature verified): on a completed checkout, email Alex the name, business, plan, period, socials and contact email. Nothing is written to our database yet; Stripe is the record.
5. **Hand-over:** Alex ends the trial in the Stripe dashboard → first charge. Early access is the same click, earlier.
6. **Non-payment:** Stripe's failed-payment emails go to Alex; pausing a site is manual for now.

**Stripe setup:** a script (`scripts/stripe-setup-plans.ts`) creates the four products with monthly and yearly prices, idempotently, so staging and live match. The price ids live in config, not in the page.

## Release in two steps

- **Step A — pages:** home changes and both pricing pages, with every **Get started** button pointing to the contact form (plan preset). Ships to live as soon as Alex has seen it — no money involved.
- **Step B — checkout:** the Stripe pieces above. **Needs staging first** (agreed: staging before the first paying customer). Proven with a test card end to end on staging, then switched on live.

## Errors

No silent failures: if creating a checkout session fails, the button shows a message with `alex@bohdiai.com` and the contact form link; both the `{ok:false}` branch and a thrown fetch are handled. The webhook rejects bad signatures and logs; a failure to email Alex is logged and retried by Stripe (non-2xx response).

## Secrets

Stripe secret key and webhook signing secret in the Worker's runtime Variables and Secrets (never `NEXT_PUBLIC_`, never the build section). Test-mode keys on staging, live keys on production.

## Testing

- Pricing pages render each plan's name, monthly and yearly price, "Built free" and a Get started link; maker page never shows contractor prices and vice versa (test enforces it).
- Home: two doors present and linked; header links; new How it works copy; the old "full price before I start" promise is gone.
- No AI talk on the pages (the existing test extends to the new pages).
- Checkout route: rate limit first; rejects unknown plan/period; builds the session with the configured price id, trial, custom fields and success/cancel URLs; error paths.
- Webhook: bad signature rejected; completed checkout emails Alex with the right fields, all user text escaped; email failure returns non-2xx.
- tsc + lint clean, full suite green, coverage gate holds.
- **Alex's eyes** on home and both pages, desktop and phone width, before commit.
- Step B live check: a test-card signup on staging produces the email and a trialing subscription; ending the trial charges it.

## Out of scope

Customer-facing billing management (change card, cancel) — handled by Alex in Stripe for now (Stripe's customer portal can be added later). Automatic site pausing. A charity plan. The Lite-only product features (the point of sale, "Ask about this", the one-photo limit) — built as makers sign up, per the tiers spec.
