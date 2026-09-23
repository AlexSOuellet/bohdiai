# Direction — 23 September 2026

**Written at the end of a long strategy conversation. Read this before `SESSION-BRIEF.md` or
`Full-Plan.md` — both of those describe a plan that no longer applies.**

This is not a build plan. It's where the thinking landed, what got ruled out and why, what's
still open, and a set of facts that were checked against the code and database during the
conversation rather than assumed.

---

## The short version

BohdiAI is still the thing Alex wants to sell: a multi-tenant product where a maker gets a
complete store they run themselves, on their own payment account, with no cut taken of their
sales. What changed is how it gets there. Instead of finishing the software and then looking
for customers — which is what stalled it — Alex takes clients by hand now, builds their sites
with the software as it is, and the client work funds and directs what gets built next.

The ambivalence in this document is real and should not be smoothed over. See **Where Alex
actually is** at the bottom.

---

## What's settled

**Still a multi-tenant platform, not bespoke sites.** One database, every client as rows in it,
features switched on per client. Bespoke means a separate database and separate everything per
client, which at ten clients is unmanageable and costs roughly $25/month each in databases alone.

**The waitlist and the Beta phase are dropped.** The waitlist has zero rows in it — not thin,
empty — so the Full Plan's Beta, which opens by approving founding members off the waitlist, is
describing machinery for an empty queue.

**First clients are built by hand.** No self-serve signup, no subscription plumbing in the app.
Recurring billing is set up per client in Stripe's own dashboard, which needs no development.
Nobody gets to sign themselves up and discover a missing feature.

**Only sell to the target.** The target is makers, charities, and service businesses that need
presenting rather than booking. Anything outside it gets built on something else — WordPress,
Wix, whatever suits — priced properly, and never touches the platform. Critically: the marketing
never advertises bespoke work, because what you advertise decides what walks in the door.

**The entry tier gets no Bohdi and no editor.** The client can add products and announce events.
That's it. Everything else comes back to Alex, which the arithmetic says is affordable — at
roughly one small request per client per month you'd break even, which is far more room than it
sounds.

**Charities are close to makers, not a second product.** Same page shape — their mission where
the maker's story goes, fundraisers where the market dates go, supporters' words where the
testimonials go. Shop and collections off, one donate button on. Donate is simpler than a cart.

**Service businesses split.** A contractor or photographer who needs pages, a gallery, a story
and a contact form fits the existing structure. Anything needing real appointment booking with
time slots does not, and that's a proper build. Don't do it until someone's asking.

---

## What got ruled out, and why

**Deploying each client like Penny's site** (their own project, own database, own accounts).
Kills the recurring economics — a separate database per client is about $25/month each — and
produces ten codebases that drift apart. Also means Alex holding logins to four or five services
per client.

**Renting a platform** (GoHighLevel, Duda, Simvoly, SiteSwan, Wix Studio). They price you out of
the cheap end. Break-even at $14.95 a client is seven customers on Simvoly, ten on SiteSwan,
seventeen on Duda's white-label, twenty on GHL — against three or four on your own
infrastructure. They also can't produce what the renderer produces.

**A marketing agency for makers.** Retainers and makers don't fit structurally. A roofer's new
customer is worth thousands, so $300/month to get two more is obvious arithmetic. A maker's new
customer is worth twenty or thirty dollars, and the same fee would need to bring ten or fifteen
new customers a month to break even. Alex was explicit that Penny would not pay that.

**Widening the platform to plumbers, lawyers and dentists.** Everything in it assumes someone
who makes things and sells them. Generalising it produces a generic site builder, which is the
most crowded product category there is.

---

## The immediate job

### 1. Alex's daughter's site — Cut Pro Lawncare (working name)

Lawn construction — mostly sod, grading, drainage, with stonework and patios secondary. Their
leads currently come from the sod company that refers them. **They already understand the site
won't bring traffic on its own** — Alex told them. What they want now is to look legitimate when
a referred customer looks them up.

Everything they need exists. They don't sell online, so the entire unfinished half — cart,
checkout, payments, orders — is irrelevant to them.

- Address is `cut-pro-lawncare.bohdiai.com`. Subdomains already work; nothing to build.
- Free. She's a tenant like any other, never billed.
- **The site is the photos.** Ask for every decent job they've done, and tell them how to shoot
  the next ones: same spot, same angle, before and after, wide enough to see the whole yard,
  morning or late afternoon. Sod has the most dramatic before-and-after of any trade and none
  of the competitors are using it.
- Collections become project types — sod installs, drainage, patios, walls.
- The words will be Alex's, not Bohdi's — there is no landscaping niche and all 25 are crafts.
- **Test the contact form properly before it goes live.** It has never been verified to send,
  and for them it's the only thing on the site that matters.

Three small things that would need adding, all of which serve every service business afterwards
rather than being one-offs for her:

- A listing type that means "a job we did, here are the photos, no price." Every listing
  currently requires a price and a finished patio isn't priced. The `listing_type` column
  already exists, so this works with the design rather than against it.
- A before-and-after treatment in the section catalogue. Nothing pairs two photos today.
- An estimate request form — town, what they want, and photos of the space. The photo upload
  already exists and already shrinks big phone pictures.

### 2. The marketing site

`bohdiai.com` currently shows a fake browser cycling three hand-coded React components
(`SourdoughStore`, `TattooStore`, `KidsStore`) with subdomains printed on them that don't exist.
Meanwhile six real stores sit live at addresses nobody is shown.

It needs to become: a samples section and a portfolio section. Samples are openly labelled as
demonstrations. The portfolio is real client work, with Penny's site as the first entry. As real
clients land they move into the portfolio and the samples matter less.

The samples should be six new stores built through the app as a customer would — a spread of
crafts with one decoupage maker in there for Penny's audience — each sized like a real small
maker rather than like Penny, who is a fringe exception. Eight or ten products, two or three
collections, a story, a few dates.

Out goes the waitlist, the founder counter and the coming-soon framing.

---

## Open questions

**Price.** Alex floated $14.95 or $19.95/month. Not settled. Note for whoever picks this up:
Claude has now tried to reprice this three times across two sessions and been told to stop each
time. **Don't.** The one useful input is the cost floor, which is below.

**Vercel or Cloudflare.** The app is on Vercel. A free Cloudflare worker (`shop-proxy`, route
`*.bohdiai.com/*`) sits in front because Vercel can't issue a wildcard certificate for the shop
subdomains while Cloudflare holds DNS — so the worker reverse-proxies every shop to the apex and
passes the real shop name in an `x-bohdi-shop` header. Moving the app to Cloudflare would delete
that whole workaround and close a known hole (the Vercel origin is reachable directly and the
shop header can be spoofed — flagged HIGH in the July audit). The argument for moving is timing:
the cheapest moment is before the back half gets written, not after. Not needed for the
daughter's site either way — tenants are rows in a database, not deployments.

**Whether Alex wants this at all.** See below.

---

## Facts checked during the conversation

Worth recording because several were assumed wrong at the start.

- **Waitlist: 0 rows. Notify form: 0 rows.** Four months of a live coming-soon site produced
  nobody.
- **39 tenants, all test stores, last one built 11 July.**
- **No payment SDK installed at all** — no Stripe, no Square, no PayPal. The trial screen in
  onboarding takes no card and just advances. Its heading says 7 days, the badge beside it says 14.
- **`tenants.custom_domain` exists and not one line of code reads it.** Every store is a
  bohdiai.com subdomain and nothing else.
- **The design system is barely tied to Next.** 71 files, two import anything Next-specific
  (both just `next/link`), one touches Supabase, no server components. It's plain React that
  takes props and returns markup — so it travels to another framework if the app ever moves.
- **25 niches, every one a craft.** No service trades. `fine_artist`, `photographer`,
  `sewing_alterations` and `tattoo_artist` are still draft.
- **`listings.base_price_cents` is NOT NULL.** Everything listed must have a price.
- **Penny's site** (`C:\Users\Bohdi\Documents\DecoupageDigital\Website`) is TanStack Start, built
  in Lovable, deployed on Cloudflare, on free Supabase with R2 for images. 140 source files.
  Full commerce: cart, checkout, Square and PayPal, orders, customer accounts, digital downloads,
  and seven admin screens. It is the reference implementation for the half BohdiAI lacks — read
  it, don't lift from it.
- **Infrastructure floor** is near zero today (free Supabase, R2, Cloudflare free tier), rising
  to about $30/month once a real shop is taking orders — Supabase Pro at $25 for point-in-time
  recovery, which stops being optional the moment someone's orders are in there, and $5 for the
  Cloudflare paid plan, which also covers the first hundred custom domains. Vercel adds $20 on
  top of all of it, and its free plan forbids commercial use.
- **The space has competitors now.** Your Next Store and Playcode are both AI store builders
  aimed at small sellers with no transaction fees, and Big Cartel has been doing maker-focused,
  no-cut-of-sales at $9.99/month for years.

---

## Where Alex actually is

This needs to be in the record, because a new session will otherwise read the above and
cheerfully start building.

Alex is 67 and wants leverage that isn't his own time and effort. Late in the conversation he
said plainly that none of it feels good — that he wants to *create* something that pays him
repeatedly, and does not want to trade his time helping other people build their businesses and
then be stuck supporting them. His words: "THAT feels so heavy."

Everything in this document is a service business wearing different clothes. That's why it all
felt heavy. The version with real leverage is software that serves someone without him in the
room, and that's also the slowest to pay and the one he already walked away from once.

Two threads were left open when the conversation ended:

- **The distribution problem is the constant.** Not the product. Every version of this has failed
  or stalled for the same reason — nobody knows he exists. The one time distribution appeared it
  came from doing good work for one person with an audience. Penny has eleven thousand followers
  and is about to refer people, including makers, charities, and a biker club.
- **The insight worth keeping:** most of these people don't need a website. The maker at the
  market needs to take money at the table. The maker on Instagram needs a link that sells one
  thing. The biker club needs to collect donations from a Facebook group they already have. The
  audience is never the problem — the collecting is. That's a much smaller product than anything
  else in this document, and it's the one thing said all day that Alex reacted to as *right*.

He also has an unused Skool community he's still paying for, and an idea about teaching small
businesses the difference between what they think they need and what they actually need. Both
were left unexplored.

**Nothing in the "where Alex actually is" section is decided. Don't treat it as a plan, and don't
try to talk him out of it.**
