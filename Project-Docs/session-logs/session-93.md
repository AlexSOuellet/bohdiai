# Session 93 — 2026-10-04: Showcase market dates, sample banners, "Most popular"

Started as a chat about getting exposure (craft groups, Facebook Pages, the EC Hot Mess Station live-sale group; Alex has asked to join it). Alex's direction for his own exposure: a site for the group/event, a slot on a future group live, Penny's site credit (Penny will never do a live). Penny's affiliate/discount-code idea belongs to her site, which is worked on in its own thread, never from a BohdiAI session.

## Built and LIVE (3 pushes)

- **Card marquee slowed** (38s → 64s → 100s for the big words).
- **Showcase market dates** (`market_dates` switch; `/manage/dates`; `events` table; up to 20; earliest first, nothing hidden by date). Shown only in the marquee's bottom row, bold body type in dark ink, timed per site to match the big words' speed (`lib/archetypes/card/marquee.ts`); hidden list for screen readers. Lite keeps the full calendar later. Spec: business card design, "Market dates and the marquee".
- **Marquee pauses** on hover and holds on click/tap (`CardMarquee`).
- **Builder login:** alexsouellet@gmail.com is admin on every site (all 15 added 2026-10-04, no emails). `ensureBuilderAccess` runs in both build scripts. Alex first said he shouldn't have logins to real client sites, then reversed: he builds them, so he has one to each. Rustic Rhody and Cut-Pro had no logins at all before.
- **Sample banner:** red "<Plan> sample" pill in a dark fixed strip on the four bohdiai.com samples (from `SAMPLES` in `lib/site/work.ts`), linking to `/makers#plans`. Main Street's fixed headers moved below it (`--sample-bar-h`). Iterated: thin honey strip → solid honey → red button (Alex: "red button is good").
- **Pricing:** highlight moved from Full to Showcase via `Plan.badge`; badge "Most popular" (Alex's call after "Start here" was rejected as misleading and Claude flagged the claim isn't true yet). Contractor page has no highlight now.
- Rustic Rhody has three made-up market dates (Harvest Craft Fair, Holiday Makers Market, Christmas on the Green); the sample banner covers them.

## Checks
2,192 of 2,193 tests passed in the full run; the one failure was the known flaky `SectionEditor.test.tsx` "Write it up…" (passes alone). Typecheck + lint clean.

## Lessons
- In Windows PowerShell 5.1, a commit message with double quotes passed inline breaks into pathspecs; one commit silently didn't happen (and `git branch -d` then deleted the empty branch). Write the message to a file and use `git commit -F`, then check `git log`.

## Open
- Chris (Cut-Pro) has no owner login yet; hold his invite until there are contractor screens worth logging into.
- No session-92 log exists for 2026-10-03 (Showcase tier, card site, Rustic Rhody); see the business card design spec and the tiers spec for that day's decisions.
