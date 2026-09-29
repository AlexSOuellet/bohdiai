# Session 88 — 2026-09-29: bohdiai.com rebuilt as a web developer site

## Direction (Alex)
- Sites are "manual" to the customer; BohdiAI works behind the scenes. bohdiai.com presents BohdiAI as a **web developer** for makers, contractors (service providers) and charities — one site, not two.
- Keep the existing look (dark, honey glow, embers). Slogan: **"If you make it, bake it, fix it or fund it, we build it for you."**
- Portfolio: Cut-Pro + Penny's decodigitaldesigns.com; samples Classic Loafs, Twilight to Darkness, Heavenly Scents.
- No pricing section (Alex hasn't charged anyone yet); two promises instead: full price before I start, never a cut of sales.
- No Skool, YouTube, beta, waitlist. No AI talk on the page ("technology" is fine). Name "BohdiAI" goes unexplained for now.
- Facebook page logo (rainbow wave, "Bohdi") is to become the site logo — waiting on the original file.
- About rewritten: IT trainer 30+ years, retired, helping people empower themselves and their businesses — **The Bohdi Way**. Signed "Alex" (not Alex Scott); pledge too.
- Testimonials: Sheri Giannattasio + Chris Bullock (both Cut-Pro — they're together), Penny C. (Troy, MO). "Alex Ouellet" → "BohdiAI" in Sheri's opener, "Alex" elsewhere. Short with Read more.
- Contact form: name, email, phone, best way to reach (email/call/text), kind of business, what they need, optional link → alex@bohdiai.com (forwards to Alex), Reply-To = sender.
- **New idea for next session: "MY ADMIN"** — Alex's own admin to drive the original Bohdi builder to build client sites. Not scoped.

## Built (merged to main, live)
- Spec + plan: `docs/superpowers/specs/2026-09-29-bohdiai-com-rebuild-design.md`, `docs/superpowers/plans/2026-09-29-bohdiai-com-rebuild.md`.
- `lib/site/work.ts` (one list feeds hero + work section), `lib/site/contact.ts`, `scripts/capture-work-shots.mjs` → `public/work/*.webp`.
- `lib/inquiry/request.ts` (pure parse + compose), `app/api/inquiry/route.ts` (limiter first, fails with the email address in the message), `components/InquiryForm.tsx`.
- `WorkBrowser` (real screenshots, Client/Sample tag, live link), `Work` (client spreads, fanned samples), `ClientQuote(s)` (read-more), `Contact`; rewritten Hero, TradesMarquee (makers / trades / causes), HowItWorks, WhoBehind, Pledge, Header, Footer, OG image, metadata, privacy, terms (privacy had claimed PostHog + Sentry, never installed — removed).
- Deleted: waitlist API, confirm pages, Waitlist/Community/BrowserDemo/Rotator/Typewriter, fake storefronts + ~950 lines of their CSS, storefront-only fonts, lib/emails, waitlistSchema, FOUNDER_CAP. Waitlist table kept.
- Verified live: all pages 200, www 308 → apex, old waitlist routes 404.

## Mistakes / snags
- Told Alex the local form would refuse to send; it actually sent (local dev emulates the limiter). Corrected.
- Heredoc edits stripped backslashes twice: the phone digit check counted characters (`/D/g`), and a no-AI test regex got literal backspace characters and could never fail. Both caught and fixed; added a test that exposes the phone bug.
- A commit swept in previously staged deletions (broken intermediate state); undone and split before pushing.
- "her site's surname" — muddled wording in chat.

## Found
- **GitHub CI red since 2026-09-24** (last green 07-11): all tests pass but the coverage gate fails (lib branches 85.3% vs 90%, .tsx 74.65% vs 75%); Playwright then never runs, and two e2e specs still target the old homepage. Alex's call: fix properly tomorrow (no threshold lowering).

## Next
See SESSION-BRIEF next actions: CI fix, MY ADMIN brainstorm, bohdiai.com loose ends (prod inquiry test, logo, Classic Loafs cleanup).
