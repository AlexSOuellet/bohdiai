# "Do You Need a Site?" App — Planning Notes

Working notes from Alex + Claude dialog, 2026-10-10/11. Direction is being shaped through conversation; nothing here is built yet. Claude compiles this into the app.

## What it is

A guided, app-like experience on bohdiai.com for **makers** (contractors not included — Alex's answer to contractors is always "YES OF COURSE YOU DO").

- Lives on bohdiai.com only, with its own direct shareable link (e.g. `bohdiai.com/need-a-site` — exact path TBD). No app store, no install.
- Runs full screen, phone-first, one question per screen, big tap targets.
- **Visually appealing — not a form with questions.** Each screen should feel designed.
- **Every question branches off answers already given.** Branches only appear for people they apply to, and go deep there.
- Ends in a **full, comprehensive analysis with recommended paths** — not a single answer.
- Recommendations do **not** have to be BohdiAI products. BohdiAI shows up only where it honestly fits. Can recommend several paths at once (e.g. keep doing markets + fix Etsy photos + start Instagram).

## Purpose (Alex, 2026-10-11)

**Lead generation.** For now the goal is people **following Alex, getting to know him, and trusting him.** Paid options or a newsletter may come out of it later, but not now. Every design choice should serve trust and connection to Alex personally.

**Lead capture = newsletter signup — "Free tips and tricks."** Alex likes this (2026-10-11). Placement and newsletter platform TBD; leaning toward full results given freely, signup offered with them (not a gate).

## Decided

- It is a **maker business analysis** — that's what it always was, just not named at first. "Do you need a site" is one path inside it. Name may change later.
- **As little typing as possible.** Taps, choices, sliders over text boxes; typing only where it truly earns it (e.g. a shop link).

- Makers only for now.
- Web page on bohdiai.com with a direct link; app feel, not a native app.
- Multi-path analysis, non-BohdiAI recommendations allowed.
- Comprehensive is the goal — Alex wants depth, and all the question areas below are in.

## Built — current state (2026-10-12, branch `feat/maker-checkup`, pushed, NOT merged)

How it got here: pass 1 was a fixed list with skip rules (felt like a survey; hourly rate scared hobby sellers). Pass 2 had the AI write every question (Opus, then Sonnet, then Haiku) — Haiku kept breaking rules (assumed a Facebook page, mixed two questions, contradictory choices), Sonnet cost ~9-11¢/run. Pass 3 (now) fixes both.

- **Lives at `/checkup`.** Full screen, no site header. Alex's handwriting (Caveat) for asides. Answers are kraft hang tags on the ember background. Mostly taps; "What do you make?" is typed; every tap question has a "Something else, or anything to add" line.
- **Opening:** "What do you make?" (typed) and the goal (3 choices: pay for itself / real money to test / real business). The hobby-only choice was removed (Alex: who takes a make-money checkup if they don't want to).
- **Question bank** (`lib/checkup/bank.ts`, reviewed copy in `Checkup-Question-Bank.md`): ~50 fixed questions, word for word. Code decides which are allowed (`when`) and which are must-cover; **Claude Haiku 5.5 only picks the next id and writes a one-line reaction**. Can't finish while a must-cover is unanswered. Hard cap 24. `How often do you do a market?` is must-cover for market sellers (decides market site vs showcase).
- **Write-up** (Haiku 5.5): summary, two first steps (must be doable in order — set up a place before a card/sign points to it), advice grouped "Do more with what you have / When you're ready to grow / How to think about it". The advice never names Alex's products; it names the need.
- **Pricing read is decided in code** (`lib/checkup/pricing.ts`): thin / thin + priced low out of nerves / room (mixed) / fine / unknown. "Some shoppers hesitate" is NOT evidence. The AI only explains the read.
- **How I can help** (end section): a paragraph + small product cards (sample image, name, AI's few sentences, "Learn more" → `/makers`). **Which offers and their order are decided in code** (`lib/checkup/offers.ts`): markets often → Market site then Showcase; markets now and then → Showcase then Market; nowhere to send people and no markets → Showcase; regular seller who ships and wants online → Full shop first; already has a site/page → none. No prices on the cards.
- **Card images:** `public/checkup/offer-*.webp`, built by `scripts/checkup-offer-shots.mjs` (needs local dev + Saltmarsh preview token) then `scripts/checkup-offer-compose.mjs`. The Market image uses the Saltmarsh market page from branch `feat/saltmarsh-market-page`.
- **Instructions** (`lib/checkup/prompt.ts`): picker prompt + write-up prompt. No sample wording (models copy it). Alex's analogies are ideas to retell, never quotes.
- **Cost:** ~1¢ per full run (logged per call as `checkup cost`). `scripts/checkup-sim.ts <case> [model] [effort]` replays a saved maker (`scripts/checkup-cases/`) with a stand-in model playing the maker.
- **Server:** `/api/checkup/next`, `/api/checkup/writeup`; rate limit `CHECKUP_LIMITER` (30/min per visitor, new binding in wrangler.jsonc). Nothing stored on our side.
- **Newsletter:** `/api/newsletter` → beehiiv. Needs `BEEHIIV_API_KEY` + `BEEHIIV_PUBLICATION_ID` (Alex hasn't sent them). Signup copy says the write-up's ideas go deeper in the tips.
- **Tests:** checkup + bank + offers + pricing + routes + components all pass on the branch.

**Still open on the checkup:** beehiiv keys; more test runs against Alex's own answers (write-up quality); "Learn more" goes to `/makers` (no per-product pages yet); welcome/goal wording to match Alex's ad line ("curious, serious or somewhere in between"); not on bohdiai.com navigation; Etsy shop lookup, anonymous answer data, video links not built; Worker needs `BOHDIAI_ANTHROPIC_KEY` (already set) and the new rate-limit binding deploys with it.

## Open — decide when we get there

- ~~How the analysis is written~~ **DECIDED 2026-10-11: AI is part of this, and always was** (Alex: "There is no way you can build for every answer"). Now: fixed question bank + Haiku picking, AI write-up, code-decided offers and pricing.
- Question order (goal first vs. situation first).
- The shared follow-up set under "How do your buyers find you?" (Alex, 2026-10-11: same questions for all channels).
- Exact URL, name, visual direction.

## Ideas raised, not decided

- **Market app in the write-up / standalone market app (Alex, 2026-10-11):** makers who sell at markets never hear about the Market app (built for Rose n' Cat). Alex floated a standalone market app that combines the showcase with market sales. Not decided; not built. Needs: which plan carries it, and whether it's a product of its own.

- **Etsy shop lookup:** if they give their shop link, the app might read public shop info (listing count, sales, reviews, photos, titles) via Etsy's API to make the analysis specific. Need to check what Etsy's API allows.
- **Existing-site link:** same idea for their current site (at minimum, collect the link).
- **Anonymous answer data:** save answers without names so Alex can see what makers actually struggle with → informs which videos to make.
- **Video links:** each analysis piece can link to Alex's matching video. Videos don't exist yet — app launches without them, links added as each video goes up.

## The goal question (main branching axis)

Four goals:

1. **Just a hobby** — no desire to do more. Still gets a real answer (where to share work if they enjoy showing it; permission to not make it a job).
2. **A little extra** — cover the cost of the hobby.
3. **A little more than extra** — test whether going full force is for them.
4. **Turn the hobby into a business.**

Most of the deeper questions apply only to people who want to push past hobby.

**Two directions (Alex):** some people need to **do better at what they're already doing**; some want to **go bigger**. The analysis must serve both — "get more out of your markets / Etsy / pricing" is as valid a result as "add new channels."

## What we need to learn (no particular order)

**Where they stand**
- How far along: just starting / selling some / selling steadily.
- Where they sell now: markets, Etsy, Facebook, own site, friends & family, nowhere.
- How they're doing locally.
- Have they ever had a business before?
- What's held them back so far. (Often the most revealing answer.)

**Business shape**
- Do they really want a business?
- Local business, online, or both?

**The product**
- What do they make?
- Do they want to deal with shipping? Does it ship easily?
- One of a kind vs. repeatable. (Online — Etsy and shop sites — works much better with repeatable items.)
- Custom orders / commissions?

**Time & capacity**
- Hours per week they can really give it.
- How long one piece takes.
- Could they make 5x as many if orders came in?

**Money & pricing**
- Material cost per piece + time per piece → show their real hourly earnings at current price. Likely the single biggest takeaway for many makers.
- Are they actually profitable at current prices?
- How much are they willing to invest up front ($0 / a little / real money)?
- **Pricing was one of the most common struggles in Penny's group.**

**What they already have**
- Etsy, Facebook, Instagram, email list, follower counts.
- Ever sold online?
- Can they take decent photos?
- Anyone helping (spouse, kid good with phones, friend)?

**Comfort**
- Tech comfort.
- Showing their face / being on camera.
- Posting regularly.

**Marketing now — root question: "How do your buyers find you?"**
- One root question; every channel they pick (markets, Etsy, Facebook, Instagram, TikTok, own site, word of mouth, email list, etc.) gets the **same follow-up questions**, not a separate design per platform.
- Shared follow-ups to be finalized (e.g. how often they work that channel, whether it brings sales, what's hard about it, what it looks like / link).
- Rule (Alex): if a channel needs the same info, it comes from the shared set; if it needs something different (e.g. a site's real monthly cost), that channel gets its own extra questions.
- **The whole thing must be — or at least appear to be — driven by their answers.** Never ask what we already know; questions should reference what they said earlier so it feels like a conversation, not a script.

**Other channels**
- Consignment in local shops, wholesale to boutiques, classes/workshops (some makers would do better teaching than selling).

**Business-path setup**
- Registered? Set up for sales tax? (Not a lecture — so the analysis can list it as a step.)

**Pain points from Penny's group (real maker data)**
- Learning how to price.
- Dealing with competition.
- Not knowing how to start.

## Branch: Local markets

- Do they go to local markets? Which ones?
- Pros and cons of the markets they go to.
- Why do they want to expand beyond that?
- How are sales going — **and leads?** Ask about both.
- Do they hand out cards? Where does the card send people?
- Big crowded shows vs. small ones.

## Branch: Etsy

- Are they making sales? If not, why do they think that is?
- What are they doing to promote their Etsy shop?
- What does it look like? (Get the link.)
- How crowded is their niche?
- What are they doing to stand out?
- The common trap: list products, stop there, then say "Etsy is too crowded."

## Branch: Already has a site

- What is it built on (Shopify, Wix, Squarespace, designer-built)?
- Real monthly cost including apps, domain, designer fees.
- How long they've had it; roughly how many sales it brings.
- Do they know their visitor numbers? How do people find it? Who updates it?
- What they expected vs. what happened.
- **Biggest complaint**, in their words. Alex expects many spend a lot with little result and feel they're wasting money.
- Get the link.
- Analysis must tell apart: "bad/overpriced site" (may mean recommending something cheaper, even non-BohdiAI) vs. "good site nobody has been sent to" (start pointing people there from markets, cards, Facebook).

## Branch: Local only, no desire to ship

- Being online ≠ shipping. For local makers, online is about people **finding them again**.
- Real case from the show: a maker had **no online presence and no card** because they didn't want to ship.
- Pieces for this path: showcase site with work + upcoming market schedule + contact; Facebook page; free Google Business Profile; custom orders and local pickup (no shipping); email/text list announcing upcoming markets.

## Analysis principles

- Honest. Recommends what fits, even when it isn't BohdiAI.
- Multiple paths, not one answer.
- Ends with a **clear first step or two** ("do this next week"), not just a big picture — for the "don't know how to start" crowd.
- Practical, use-it-this-weekend advice.
- Helps them put their **offer** into words (what's different about their work, who it's for, why pick theirs).
- Selling order: start where the people already are (markets, Etsy, Facebook) → showcase is where you send the people you meet → full shop site later, once there's a following.
- Showcase can be recommended early to almost anyone with work to show (including beginners — a real link for cards and posts from day one). Full shop only when answers say they're ready.
- "Not yet" only for someone with **no finished work to show** (friendly "come back when you have a few pieces").

## Alex's ideas — for the AI to retell in its own words, never quote

**Etsy is the biggest mall on the planet**
> Etsy is like being a store in the biggest mall on the planet that has the MOST traffic. Having a store in that mall is almost free until you make a sale. The mall brings the people in, but they do NOT guarantee someone will go into your shop. You need to find a way to stand out in the crowd.

**The clothing designer** (answer to "too crowded" / "too saturated")
> There are thousands if not more clothing manufacturers. If a designer were to say there are too many people already making clothing, why bother — we would all wear the exact same clothing. **The competition is not the issue, the offer is.**

Alex wants **both** used. Together: mall explains why "list and wait" fails; designer explains why crowded isn't a reason to quit → leads into the "what's your offer" questions.

**East Nowhere, America** (own site vs. Etsy)
> Compared to Etsy, having your own site is like opening a store in East Nowhere America — at the end of a dead end 3 miles down, with no signs, in a town of 250 people. NO ONE will EVER find you.

Paired with: your own site should **NOT be your first stop for selling**. A showcase site gives you someplace to send the people you find. (Your site doesn't bring people; you bring people to it.)

**Shows are lead generation too**
> Sometimes a show is just as much lead generation as it is sales. You cannot look at an event from ONLY one perspective.

**Hand your card to everyone**
- The card should be clearly displayed — people should not have to ask. Sign idea: *"Browse what I have when it is less crowded, from the comfort of your own home."*
- Makers should be **handing their card to everyone** who stops — and one in every bag with a purchase.
- Especially at big crowded markets: very hard to decide at a quick glance; shoppers get ~5 seconds and won't buy at the first table they like. The card lets them decide later.
- The card is only worth something if it sends them somewhere good (→ showcase).

## Action items the analysis can hand out (so far)

- Hand a card to everyone who stops + one in every bag.
- Display cards with a clear sign.
- Count leads, not just cash box, when judging a show.
- Run the real-hourly-rate pricing check.
- Etsy: promote the shop, work on standing out / the offer.
- Existing site: start sending people to it — or stop overpaying.
- Local-only: get findable (showcase, Google Business Profile, Facebook, market-schedule list).

## Video tie-in

Analysis pieces double as Alex's video topics. Examples Alex named:
- "Why a showcase is the perfect companion to markets"
- "Why Etsy is NEVER too crowded" / "Why there is no such thing as too saturated"

## Related business context

- Alex is considering offering the **Showcase site free** at in-person events, paid upgrade after. Showcase has zero maintenance after build.
- New possible service line: **Etsy / Facebook page redo** for makers who don't want a site.
- Observation from a large local craft show (2026-10-10): no decoupage/mixed media sellers; lots of resellers of wholesale/marked-up goods.
