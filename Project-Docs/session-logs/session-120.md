# Session 120 — 2026-11-04 → 2026-11-06

**PayPal switched off. Alex's admin, promotions, invites, the new email look and the Stripe cancel fix built on `feat/alex-admin`, merged into `main` at the end of the session (Alex: "document commit merge").**

## PayPal (merged early in the session)

Switched off, code kept: `PAYPAL_ON=on` plus the keys brings it back (`lib/paypal/config.ts`). Alex: only if a maker asks. The wording that named PayPal was reworded.

## Alex's admin (Open-Work item 36)

admin.bohdiai.com forwards to app.bohdiai.com/founder. Locked to Alex's account (`lib/founder/access.ts`); anyone else sees "not found". His sign-in lands there. Tabs:

- **Dashboard** (`lib/founder/dashboard.ts`): MRR, paying makers, sign-ups this month and last, cancellations, who's leaving at term end, live sites, drafts, free sites, Needs you, MRR by plan, latest sign-ups. Alex: "a dashboard just like any other business owner would want". Months run on Eastern time.
- **Invite a maker**: see below.
- **Act as a maker**: find a site by name, address or email, then open its backend. **Alex: no screen listing all sites.** Each row has Make free and Give discount; a maker's page is /founder/act/[id]. In a backend, Alex gets Back to admin instead of Switch site; other accounts keep Switch site.
- **Promotions**: codes (see below).
- **Messages**: Contact support messages. Alex tested it from a maker's account and it worked. He replies by email; there's no reply in the admin.
- **Emails**: every maker email, as it looks.

A sign-up is a subscription, or a free site Alex invited someone to. Hand-built samples have no subscription and no plan, so they don't count.

Still to do from item 36: fuller statistics, demo runs and checkups, FAQs and content, reports from "report this site", the suspend switch.

## Stripe: what reaches it now

Before this session nothing wrote to Stripe after checkout.

- **A cancel or keep now tells Stripe first.** If Stripe can't be told, nothing is marked cancelled.
- **A cancelled site goes offline at the end of its term** (Stripe's notice); nothing took it down before. Not proven against a real Stripe notice.
- **Real makers still can't change plan themselves.** Only demo sites can; everyone else's Upgrade emails Alex. Nothing changes what Stripe charges for a plan change. Alex was asked whether to build this and hasn't answered.

## Promotions (`lib/billing/promos.ts`)

- A discount is a percent for some months or for good. Months free is 100% for N months. Free is 100% for good.
- A code is a Stripe coupon whose id is the code. **Database, approved:** `plan_promo_uses` (who used which code) and `subscriptions.discount_label / discount_percent / discount_ends_at` (`20261104000001_promotions.sql`). `promo_redemptions` is a different, older table, for buyers at shops.
- One use per maker, ever, checked by site and by email. One discount at a time for codes. A discount Alex gives directly replaces the running one.
- Each code says who it's for: new sign-ups only, or existing makers too. Makers enter a code at sign-up or on Your plan.
- Yearly plans: a discount in months can't skip bills, so it becomes credit toward the renewal, or money off the first year at sign-up. Free months at sign-up still ask for a card.
- **Alex's one group promo:** give a maker a free site and a new-sign-ups code for anyone they refer.
- **`discounts: []` is silently ignored by Stripe; it has to be `discounts: ''`.** Only a run against test mode caught this. Run anything touching Stripe against test mode before calling it done.

## Invite a maker (`lib/founder/invites.ts`)

Alex: invites are for giving a site away. Name, email, business, plan, deal, send.

- **Free site:** no Stripe, no card. The account and draft site are made in the admin. `plan_comp = 'free'` counts as paid for onboarding. The link sets a password and opens the site form, and the site builds itself. **Proven end to end by Alex with Potter-House** (alexsouellet+pottery, still in the database as a test site).
- **The invite link never expires (Alex: "why there is ANY limit").** It's our own signed link (`lib/founder/invite-link.ts`), good until the password is set, which clears `invite_open` on the account. After that it goes to sign-in. Opening it only shows a Continue button, so email scanners can't use it up.
- **Discount:** a one-use code on the sign-up link, filled in for them, through Stripe. Good for 60 days.
- Waiting to start lists invites nobody has acted on, with Send again. There's no way to cancel an invite yet.
- **The password screen moved to /auth/set-password**, outside the backend, which would otherwise send an invited maker past it.

Supabase's own emailed links (password resets) last one hour; the setting was never raised. That's on purpose for resets.

## Emails (`lib/email/layout.ts`)

Alex: "pretty bland", then "much better, all future emails need to maintain this look". The dark ember ground, a big honey heading, one honey button, and Alex's face and name at the bottom. Every email a maker gets from BohdiAI uses `renderEmail`: both invites, confirm email, site ready, password reset, plan changes. New ones use it too and join the Emails tab (`lib/founder/email-samples.ts`). Images are in `public/email/`. Emails from a shop to its buyers and alerts to Alex are unchanged.

## Other

- The backend menu's Help is now **Support** (Alex).
- The Invite tab works without Stripe's key; the Promotions tab doesn't, and shows the admin's error until `STRIPE_SECRET_KEY` is in Cloudflare.

## Tests

Everything passes except two Square tests in `lib/square/square-db.test.ts`, which fail on `main` too: a fixed date in the test has drifted into the key-renewal window, so the code is fine. `SectionEditor.test.tsx` and `form-limits.test.ts` time out now and then and pass alone. The test check stays parked (Alex).

## For next session

Alex's call: whether real makers change plans themselves. Parked by Alex: the test check, safety-check ordering, older questions. Then the Open-Work order: makers getting paid online, Square first.
