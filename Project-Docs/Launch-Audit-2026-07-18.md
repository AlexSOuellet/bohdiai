# What's Built and What Isn't — 18 July 2026

I went through everything the Master Spec says has to be there at launch and checked it against the actual code. Not the checkboxes in the plan — the code. Here's what I found.

## The short version

The store itself is finished. Everything a shopper sees when they land on a maker's site is built and works. We've run it live plenty of times.

Almost everything the maker does *after* their store gets built is not. They can't add a product. They can't take an order. They can't take money. They can't log a sale from a craft fair. Four of the six pages their dashboard is supposed to have don't exist.

Your admin doesn't exist at all. It's two empty folders.

The one piece of good news underneath all that: the database is completely built out. All 38 tables — orders, payments, shipments, product variations, gift cards, everything. We did that early on purpose and it paid off. So none of the missing work needs database changes to start. It's all screens and plumbing, not foundations.

## What's done

Onboarding works. A maker types their name, picks their craft and a feeling, and Bohdi builds them a real store. We've run that through all six feelings.

The store itself is complete — home, shop, product pages, about, collections, events, testimonials, contact, privacy, terms. Every one of those pages paints in the maker's own family style.

The event calendar on the storefront works, in six different looks.

Logging in works — email, Google, the whole flow.

And the one editor door we built works: the maker can try a different feeling and their store re-paints instantly. They can also keep or mute the family wallpaper and dial how strong it is, and that choice sticks.

## What's half-done

**The editor is the big one.** The spec promises makers four ways to change their site: talk to Bohdi in chat, highlight some text and tell him to rewrite it, click straight on something and edit it, and a slider that shifts the whole design feel.

None of those four exist. What we built is a feeling swap. A maker can't change a single word of their own copy today.

And the current plan doesn't describe the editor that way either — it talks about three "doors," which are mood, colors, and products. Those three doors are not the same thing as the four editing modes in the spec. The plan quietly changed what the editor is without saying so. That's the biggest question hanging over the rewrite.

**The maker's dashboard has two pages out of six.** Home and My Website are there. Listings, Orders, Log a Sale, and Settings aren't.

**The trial screen is a fake.** It looks like a trial signup but it takes no card and charges nothing. It just moves to the next step. I also found a bug on it while I was looking — the heading says seven days free and the badge right next to it says fourteen-day trial. One of those is wrong, and the decision we made says seven.

**The marketing site is still the coming-soon page.** Waitlist only. No pricing, no Get Started button into onboarding.

**Niches** — 15 approved, 4 sitting in draft, 38 still unwritten. Cowork hasn't touched them since Session 67.

One correction while I was in there: the session brief says to go approve niches because the picker only shows two. There are already 15 approved. Either that got done and nobody updated the note, or the picker is filtering on something else. Worth a two-minute look before spending real time on it.

## What hasn't been started

None of this exists in the code at all.

The cart is a placeholder page that says "your cart is empty" and nothing else. There's no checkout. There is no Stripe or Square code anywhere in the repo — not a line. No order management, no way to catch a payment notification and turn it into an order the maker can see. No walkthrough to help a maker connect their payment account.

A maker can't create a product. Can't set up their own product options like scent or size, even though the tables for it are sitting there ready. No photo upload that fills in the title and description for them.

Log a Sale doesn't exist, so Market Mode doesn't exist. Neither does the event log where they'd track booth fees and see which craft shows were worth doing.

There's no way to put social media links on a store — no field for it, nothing to display.

There's no subscription billing. No tier, no trial that actually charges, no card on file.

Your admin — all three screens missing. User management, revenue, niche management. And the founder invite flow depends on that admin existing first, so it's blocked behind it.

Small stuff: the Skool link isn't in the maker's dashboard yet, and learn.bohdiai.com doesn't redirect anywhere. There's also no FAQ content anywhere, even though the plan assumed we had one in the footer.

## Things the plan treats as launch blockers that the spec doesn't

Worth pulling these out so we don't build them before we need to.

Custom domains. The plan puts the whole Cloudflare hosting setup before beta opens. The spec puts custom domains in Phase 2, after launch. Those disagree and I think the plan is over-scoped there.

Same with customer accounts, verified-purchase reviews, gift cards, discount codes, wishlists, the CSV importers, the full Market Mode phone app, the image studio, and multi-tier pricing. All of those are Phase 2 in the spec.

## Security

There are eleven security fixes waiting from the July audit — rate limiting, a couple of redirect holes, cookie scoping, that sort of thing. One of the twelve went away when we deleted the Try-On feature. The rest are real and they belong right before you let anyone sign up. They carry over to the new plan as-is.

## Three things you have to decide before I can write the new plan

**What does launch mean?** Founding members from the waitlist getting in free on accounts you approve by hand, or public signup with people paying? The first one lets us skip billing, the trial, and the pricing page completely. The second makes all three blockers.

**What is the editor at launch?** All four editing modes from the spec, or something narrower? This is the single biggest scope call in the product.

**Is commerce in the first launch?** Cart, checkout, Stripe, orders — that's a big build that hasn't started. A store that can't take money is a different promise than what the marketing site implies today.

---

*Checked against the code and the live database on 18 July 2026.*
