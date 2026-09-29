# bohdiai.com rebuild — design

**Date:** 2026-09-29 (Session 88)
**Status:** approved in conversation with Alex; mockup of hero + work section approved.
**Branch:** `site/bohdiai-com-rebuild`

## Why

Direction changed on 2026-09-23 and again on 2026-09-29 (`Project-Docs/Direction-2026-09-23.md`, `session-logs/session-87.md`). Every site is now built by Alex, with BohdiAI working behind the scenes. As far as a customer can tell, each site is built by hand. The current bohdiai.com still sells a self-serve AI store builder: a beta badge, a "built by AI, live in minutes" headline, a waitlist with a founder counter, a Skool section, and a fake browser cycling three made-up stores. The waitlist has zero rows.

The new site presents **BohdiAI as a web developer** for three audiences: **makers, service providers (contractors), and charities**. It shows real work and ends in a contact form. Everything after first contact happens in conversation with Alex.

## Settled decisions

- **Keep the current look.** Dark background, honey/amber glow, the breathing light, beams, grain and embers, Inter Tight, pill buttons, and the dot-flanked section kickers. This is a content rebuild, not a redesign.
- **Headline:** "If you make it, bake it, fix it or fund it, we build it for you" (no terminal punctuation). "Fix it" brings in contractors and "fund it" brings in charities.
- **The page speaks to all three audiences**, not just the headline.
- **No AI talk on the page** apart from Alex's own about section, which stays word for word. The name BohdiAI goes unexplained.
- **No pricing section.** Alex hasn't charged yet, so there's no structure to show. Two promises go near the form instead: "you'll know the full price before I start" and "I never take a cut of your sales."
- **No Skool, no YouTube, no beta, no waitlist, no founder counter.**
- **Logo:** the BohdiAi Facebook page logo (rainbow sound wave on black, "Bohdi") replaces the honey dot in the header and the favicon. Alex will compare the full-color version with a honey-toned one in the header, which needs the original file from Alex. Until then the honey dot stays.
- **Contact form** goes to `alex@bohdiai.com` (forwards to Alex's personal inbox) with Reply-To set to the sender.

## Page, top to bottom

1. **Header.** The logo chip, then Work / About / Contact, then a "Start a project →" pill that jumps to the form.
2. **Hero.** A small badge ("Websites for makers, contractors & charities"), the headline (second line in the pulsing honey glow), a one-line sub, and two buttons: "Tell me about your project →" (to the form) and "See the work".
3. **Hero browser.** The existing browser frame, now cycling **real screenshots** of five sites with their real addresses in the address bar. An orange tag reads "Client · Name" or "Sample · Name", and a "Visit the live site ↗" link sits top right. Dot pager, auto-advance, pause on hover.
4. **The work** ("Real sites for real businesses").
   - **Clients**, each in an alternating two-column spread: a tilted screenshot in a browser frame, then a tag, name, a short write-up, feature chips and a "Visit the site ↗" link.
     - Cut-Pro Lawncare & Construction — https://cut-pro-lawncare.bohdiai.com (Contractor)
     - Decoupage Digital Designs (Penny) — https://decodigitaldesigns.com (Maker). **No follower count.**
   - **Samples** ("A few looks to get you thinking"), three fanned, overlapping browser cards that lift on hover. A dashed note says they're sample shops made to show range, not real businesses.
     - Classic Loafs (cozy bakery). **Needs cleanup first**: it was modified during try-on testing.
     - Twilight to Darkness (dark candles)
     - Heavenly Scents (modern florist)
5. **Who it's for.** The existing scrolling trades strip, now in three rows: makers, service trades (lawn care, landscaping, cleaning, handyman…), and charities, rescues and community groups.
6. **How it works.** Three plain steps: tell me about your business → I build it and show you → you go live, and changes go through me.
7. **About.** `WhoBehind`, unchanged.
8. **Pledge.** Kept, reworded lightly for someone having a site built rather than someone signing up for software (never take a cut, never lock you in, never sell your data).
9. **Price promises + contact form.** Name, email, kind of business (Maker / Service / Charity / Other), what they need, and an optional link to their Facebook, Instagram or current site.
10. **Footer.** No Skool or YouTube. Keeps the email, © line, and Privacy / Terms.

Copy is drafted in the build. Alex reviews it on the running page before commit and plans to keep tuning it once the site is live.

## Screenshots

Static images in `public/work/`, captured with headless Chrome at 1440×900, cropped to 1440×760 (above Penny's cookie banner), and saved as compressed WebP/JPEG. Served through `next/image`. They're static on purpose: a live iframe of five sites would be slow and fragile. A small script (`scripts/capture-work-shots.mjs`) re-captures them when a site changes.

## Contact form (server)

- A new route, `app/api/inquiry/route.ts`, following the existing public-form pattern (`app/api/contact/route.ts`, `app/api/estimate/route.ts`):
  - `formLimitResponse(req, 'inquiry', …)` first. Add `'inquiry'` to `FormName`. It fails closed like the others.
  - A zod schema in `lib/validation.ts`: name, email, business kind enum, message (required, length-capped), and an optional link (URL, length-capped).
  - Sends through Resend from the existing sender to `alex@bohdiai.com`, with `replyTo` set to the sender's email. All user text is HTML-escaped.
  - Doesn't write to the database. The inbox is the record, which is enough for now.
- **No silent failures.** The form shows a success state, a validation message, the limiter's message, and a send-failure message that includes `alex@bohdiai.com` so the person can still reach Alex. Both the `{ok:false}` branch and a thrown fetch are handled.
- Before calling it done, a real test message is sent on production and confirmed in Alex's inbox.

## Removed (deleted, not hidden)

`Waitlist.tsx`, `Community.tsx`, the old `HowItWorks.tsx` content, `BrowserDemo`'s fake storefronts (`components/storefronts/*` and their CSS in `globals.css`), `Rotator.tsx`, the storefront-only fonts in `app/layout.tsx`, the founder-count query in `app/page.tsx`, `app/api/waitlist/**`, `app/confirm/**`, `app/confirmed/**`, and the waitlist email templates in `lib/emails.ts`. Also their tests and rate-limit entries, and the `FOUNDER_CAP` env use. **The `waitlist` table stays in the database.** Everything is recoverable from git.

## Also changed

- **Share image** (`app/opengraph-image.tsx`): new headline, no beta line, in the dark honey look.
- **Metadata**: title, description and Organization JSON-LD describe a web developer for makers, contractors and charities.
- **Privacy + Terms** (bohdiai.com's own pages, not the shop legal pages): rewritten from "waitlist" to "contact form", covering what's collected (what the person types), where it goes (Alex's email), and that it isn't sold. Alex reviews the wording.

## Testing

- Inquiry route: limiter first (joins `form-limits.test.ts`), validation rejects, the happy path sends with the right to/replyTo, escaping, and a send failure returns the fallback message.
- Contact form component: success, validation error, limiter error, and send failure (both branches) all render something visible.
- Validation schema unit tests.
- Homepage render test: headline present; no waitlist, Skool or beta text.
- tsc + lint clean, full suite green.
- Visual: Alex sees the running page (desktop + phone width) before commit.
- Production: one real inquiry reaches Alex's inbox, and Reply goes to the sender.

## Out of scope

Pricing, a blog, Bohdi-as-assistant, custom-domain work, and the maker backend. The Classic Loafs cleanup is its own step, done before the page goes live.
