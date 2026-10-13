# Open Work — everything still to do

**Written 2026-10-13 (Session 102).** One list of every open item: the modular plan, decisions from Session 102, and everything carried over from earlier sessions. Update it as items land; don't let it drift. Order within a group is not priority. Alex sets priority at the start of a session.

## Make content modular (the operative plan: `Modular-Plan.md`)
1. Safeguards:
   - Alex approves every database change
   - page records hold settings only (database rule)
   - tests block content read from the wrong place and hardcoded words
   - the rules go in the session instructions
2. Homes for family-only content: moment, founder quote and portrait, marquee, closing line, contact intro, section headings. All photos become proper uploads.
3. Family designs read from the homes, show sales, follow the three plans, and get the cart, order request and market page.
4. Newer designs read their headings from the homes instead of code.
5. Added sections (plug-ins):
   - every design publishes its look and has plug-in spots
   - the first shared sections: text block, testimonials, FAQ, gallery, market dates, booked-days calendar, video, sale banner, price estimator
   - each one is tested in every design
6. Background as its own setting: family texture, scene library or the maker's own photo, with no default. Build the scene library.
7. New families:
   - Saltmarsh's design becomes **Coastal**
   - Rose n' Cat's design becomes **Sweet** (name to confirm)
8. Contractor sites:
   - content homes
   - photos as uploads
   - an estimate inbox
   - move Cut-Pro, Mazzone, Halfmoon and True Coat over, with Alex checking each
9. Prove it: a fresh site in cozy, switched through every family and plan.
10. Clean up: delete the old family samples, the old page-record code, and the `explore/bulletin-scene-look` branch, if it still exists.

## Automated build, then self-serve (`Modular-Plan.md` section 7)
11. Build by hand first. Then automate one step at a time:
    - intake form
    - AI first drafts
    - the maker picks a family from their own content
    - the maker picks a background
    - the moment
12. "Alex approves" switch: on while curating, off for same-day self-serve signup and payment.
13. Automatic quality checks: content fits, nothing empty, photos usable.
14. Appropriate-content checks:
    - terms and an acceptable-use list
    - AI review of words and photos at build time and on every later edit, with flagged content held for Alex
    - a "report this site" footer link
    - a suspend switch
    - payment fraud screening

## Market app
15. Sales tax:
    - the seller's home rate
    - a rate per market via a state picker, editable
    - tax included or added on top
    - every sale records its tax and state
    - results show tax per state
16. Market discounts set by the seller: one percent per market, changeable per piece.
17. A Publish step on the market setup page.
18. Holds become baskets (decided 2026-10-13):
    - several pieces, one payment, one ticket
    - one open basket per phone
    - a 10-minute timer by default, which the maker can change
    - Paid stops the clock
    - the maker can release a hold and sell the piece in one tap
19. Market POS works without signal:
    - the home-screen app keeps a saved copy of today's market
    - sales are saved on the phone and sent when signal returns
    - a "waiting to send" count is always shown
    - cards follow Square's own offline rules
    - online/booth double sales are flagged on sync
20. Retire the old Today and Sell screens.
21. Square card payments on Market and Full (Alex has the developer account).
22. Research follow-ups (`Project-Docs/research/Maker market app competitors.md`):
    - test the Venmo and Cash App pre-filled amounts on real phones
    - look at TallyTill hands-on
    - watch real buyers at a booth

## Plans and gallery (decided 2026-10-13)
23. The gallery is built from the catalog plus other photos:
    - Showcase shows unlimited work as a gallery with no prices: a short hand-picked set on the page, "see all my work" opens the rest
    - Market and Full get the same gallery, where tapping a for-sale piece opens its page
    - sold pieces stay
24. Canceling offers Showcase for the off-season:
    - everything is kept and hidden
    - open orders and holds are settled first
    - market QR codes land on the home page
    - promotions pause
25. A minimal backend for Showcase and Contractor Lead Generation (not designed).
26. Rename the middle plan from "lite" to "market" in the code.

## Saltmarsh and the demo
27. Demo dates move by whole weeks, so Saturdays stay Saturdays.
28. Today's market shows in "Find me at."
29. Saltmarsh design work:
    - work on the first screen
    - a photo of Lena
    - prices in plain font
    - a lighter phone header
    - readable labels
    - shorter gaps
30. The public demo:
    - personal copies
    - a welcome page that requires an email
    - every payment simulated
    - the Learn explainers
    - open question: morning sales in the demo start

## Other sites
31. Rustic Rhody's hero needs a new idea. Alex dislikes the flyer and liked the photo background over the fake barn wood.
32. True Coat's estimator picks go into the request email.
33. The Classic Loafs screenshot catches the hero mid-fade, and bohdiai.com's sample dates are past July dates.
34. Waiting on others, not ours to push:
    - Rose n' Cat: Renee's invite, her payment handles, real names and prices
    - Joe: his feedback, and switching estimate emails to him
    - Cut-Pro: follow-ups are on them

## Platform
35. Staging: its own test domain, its own database, and the root domain as a setting.
36. Alex's dashboard:
    - view any site as its client
    - statistics
    - demo runs and checkups
    - invites and password resets
    - messages
    - FAQs and content
    - a "contact support" link on client sites
    - reports from "report this site"
    - the suspend switch
37. Invites: talk it through (`fix/auth-link-24h` parked).
38. Video: price Cloudflare Stream, then build.
39. Custom domains and a status panel.
40. Analytics: decide on a cookie-free visit counter, and fix the privacy page's analytics line.
41. Contractor Lead Generation backend.
42. Cloudflare cleanup with Alex:
    - the redundant Cut-Pro route
    - trim the build variables
    - cancel Vercel and delete the old proxy
43. Maker checkup (`feat/maker-checkup` pushed, not merged).
