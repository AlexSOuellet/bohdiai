# Session 114 — 2026-10-25

**A sample site for Renée (Rustic Charm & More, rustic-charm.bohdiai.com, public); Full defined (PayPal, buyer accounts, try on a look) and its backend largely built: Getting paid with Square, Stripe and PayPal side by side, PayPal connect/checkout/refunds in test mode (not live by Alex's choice), Try on a look, the opening photo and a new Background screen, a site's own background in its own home. Every piece's photo now shows whole in every mood. Mood-proof build rules agreed. All merged at the end of the session.**

## Rustic Charm & More (Renée, Sault Ste. Marie ON)

- Renée (facebook.com/rrollincrafts, 19K followers; NOT Rose n' Cat's Renee) designs rustic/primitive printables: most given free (with a pinned usage policy), paid pattern bundles sold by hand (message → PayPal invoice → PDF by email). First bundle: Primitive Skinny Snowman, $6 US / $8.43 CAD. **Alex's deal, same as Penny's:** a free site for her files and promoting BohdiAI to her followers.
- Built with the one builder from a content file (`tmp/intake-sites/rustic-charm/`, gitignored): **Full** (Alex switched from Showcase), Rustic family, Tannery skin, 17 designs in four collections (Patterns and tutorials, Christmas and winter, Fall and harvest, Signs and sayings), bundle priced $6, contact email alex@bohdiai.com until handover. The Dolly Parton design left out. Alex published it (it has to be public to show her; "there will be no strangers").
- **Redesigned for every mood (Alex's question "how do we build sites that look good in each mood"):** the painted Facebook-cover sign was dropped (Alex: "why do we even have to use her painted sign"); the opening photo is the primitive pumpkins (no words in it); three real scenes generated for her (`rustic-charm-1..3`: barn interior, autumn field, winter porch); her real bundle photo replaced the wrong snowman; her **barn wood** (generated to match the boards behind her bundle photo, "not the wood of the snowman") is her own background. Checked in all nine moods.
- Mistakes of mine, fixed: About heading written twice (half-built draft, purged with Alex's OK); six pieces on the home page (the home page holds five; the builder now refuses more); the wood first put in Scenic's home (now its own home).

## Full (Alex, written in Plan-Backends.md "Full")

- Online payment through **Square, Stripe and/or PayPal; any one is enough** (Renée has only PayPal); PayPal at markets too.
- **Buyer accounts** (Penny's site as reference: My account, orders, Reorder); the maker switches them on/off; **below Full they're kept but can't sign in** (an incentive not to step down; the step-down screen says how many customers lose sign-in).
- **Try on a look**, built like bohdiai.com/looks with her own site.
- Held until Full is done: the tools and the Free plan (`feat/backend-tools`).

## PayPal (built, in test mode, NOT live — Alex: "I do not want paypal actually live")

- PayPal research: makers connect through PayPal's partner sign-up, which needs BohdiAI approved as a PayPal partner (Alex applies, under a BohdiAI business account); each maker needs a PayPal business account; PayPal's card form works in Canada (Expanded Checkout; a Canadian merchant must offer PayPal Credit where PayPal enables it). Even PayPal's sandbox needs PayPal support to switch on Partner Referrals for our test app (it answered 403 NOT_AUTHORIZED).
- Built: `paypal_connections` (no keys kept; merchant ID + PayPal's checks), PayPal allowed in `payments`/`orders`, one record per processor payment, `record_online_payment` (one step, once, exact total, stock out). Connect / Check again / Disconnect; the cart's PayPal button (card option for buyers without PayPal), create → capture → recorded only when PayPal confirms; Refund in Orders goes back through PayPal first; the maker's email says paid. Sandbox keys in `.env.local` only (Cloudflare has none, so nothing PayPal works live).
- Alex rejected a coming-soon PayPal button on carts: **checkout shows no way to pay until a maker sets one up in admin; we are building admin, not payments.**

## Getting paid (Alex: Square, Stripe, PayPal, Venmo, Cash App, Zelle all configurable; none take real money yet)

- Square, Stripe and PayPal sections side by side, each with its Connect button always in place (saying plainly when not set up on BohdiAI). Square's wording is about getting paid through her Square, not only the market app. Connect Stripe comes back "not set up yet" (the connection is built with payments). Venmo, Cash App, Zelle and cash unchanged.

## Backend

- **Try on a look (Full):** moods row, her live site in a browser window, Computer/Phone, Keep the <mood> look (page record's mood and look only); Scenic only with her own background photo; a tried-on mood stays across clicks. `try_on` switch on Full (on for the five Full sites). Alex questioned whether it's worth offering, since a site built around one look shows its seams; that led to the build rules below.
- **Opening photo on Headline** (every plan; replace only; advice: a wide photo of her work with no words).
- **Background screen** (new, every plan, standard sites): her own background (add/replace/remove; Rustic shows it) and Scenic's photo (the whole scene library, hers first, search; or her own, light/dark). `background` switch on every plan site.
- **Owner login** in every family site's footer (`/admin`), like Scenic's.
- Errors scroll into view below the backend's pinned top bar.

## Site changes (every site)

- Rustic's opening keeps its widescreen band on phones (no 40vh minimum).
- **A site's own background** (`site_backgrounds`, approved): Rustic shows it instead of burlap; Scenic keeps only its scene. Burlap stays Rustic's default.
- Cozy's opening words stay readable over a light photo (stronger darkening behind the middle, firmer shadow, words at 96% per the Session 66 call).
- **Every piece's photo shows whole** (fits its frame on a soft mat): shop, every mood's home section, market pages, the piece page, Scenic's prints. Collection tiles still fill their frames.
- Pieces without a price show no empty price tag.

## Build rules (agreed in discussion; not yet written into Modular-Plan)

1. The opening photo has no words or logos in it (a logo/cover image is not an opening photo).
2. Opening photos are wide and large, with the subject marked.
3. Scenes and a site's own background are separate homes (done).
4. Words fit the tightest mood.
5. The build checks the opening in all nine moods before handover (screenshots; e.g. measure lightness under the words).

## Database (shared with live; all approved)

`20261025000001_paypal_connections.sql`, `20261025000002_record_online_payment.sql`, `20261025000003_site_backgrounds.sql`. Data: words added to every family/Scenic site (`family.footerOwnerLogin`, the checkout's pay words); `try_on` and `background` feature rows; Renée's site rows (published, scenes, background, opening photo).

## Checks

Type check (without `.next`) and lint clean; the affected areas' tests pass (latest run 1,940 backend/design tests; full suite runs in CI on push).

## Next

- **Full's backend still to do:** buyer accounts (the switch and the list), the step-down screen's customer count, PayPal on Getting paid for Market sites.
- **Alex:** apply to PayPal as a partner; ask PayPal developer support for Partner Referrals in sandbox (client ID AeZjNA…, sb-0vvlm52898920@business.example.com) — only when payments are on.
- Write the build rules into Modular-Plan and make the builder check all nine moods.
- Maybe: a line on the Products upload suggesting square photos.
- Show Renée her site; at handover switch the contact email to rrollin62@gmail.com and make her the owner.
