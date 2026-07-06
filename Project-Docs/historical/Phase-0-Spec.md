# Phase 0 Spec — bohdiai.com Marketing & Waitlist Site

**Status:** Draft, awaiting founder approval
**Owner:** Claude (Lead Developer)
**Approver:** Alex (Founder / Product Owner)
**Date drafted:** 2026-05-17
**Document authority rank:** 3 (Phase Doc) — Golden Rules and Master Spec override anything here.

---

## 1. Purpose

Ship a polished, single-page marketing site at `bohdiai.com` that:

1. Communicates what BohdiAI is, who it's for, and the core value prop ("a professional storefront in minutes, you keep 100% of sales").
2. Captures a waitlist of two segments: **Founder Beta** (capped at 25) and **Notify Me** (uncapped).
3. Lets Alex email the confirmed list with progress updates between now and Phase 1 launch.
4. Validates the production stack (Next.js + Vercel + Supabase + Resend + Cloudflare) so Phase 1 builds on proven plumbing.

## 2. Out of scope (will NOT be built in Phase 0)

Per the Golden Rule "no feature outside the current phase spec," the following are explicitly excluded:

- Pricing page
- Blog / marketing CMS
- Login functionality (the "Log in" link is visually present but inert)
- Any tenant-facing functionality (storefronts, dashboard, AI onboarding)
- Founder admin
- Custom domain / multi-tenant infrastructure
- Stripe / Square / payments of any kind
- Anthropic API integration
- RLS policies (no tenant data exists yet)

Anything in this list that's requested mid-build gets flagged and either added with founder approval (and something else cut) or deferred to a later phase.

## 3. Page sections (from the existing Claude Design output)

The page sections below are already designed in `Design files/BohdiAI/`. Phase 0 builds them as Next.js components, preserving the visual design exactly.

1. **Header** — `BohdiLogo`, nav (How it works, Community), inert "Log in" pill
2. **Hero** — tagline + rotating business type ("a candle maker / a sourdough baker / …"), teaser line, primary CTA scrolls to waitlist
3. **How it works** — three-step explainer (Tell us about you → AI builds → You go live)
4. **Trades grid** — 12 trade chips with glyphs ("Bakers / Makers / Vintage / …") establishing breadth
5. **Who's behind this** — short note (2-3 sentences) introducing Alex Scott; connects the 1990s Witsend story (helping people through the home-computer transition) to BohdiAI (helping them through the AI transition). Not a full bio — a trust signal. Copy to be drafted with Alex.
6. **Community — "Witsend Breakthroughs"** — short pitch + link to the Witsend Breakthroughs Skool community (`learn.bohdiai.com` → Skool). The community name is explicit, not generic "Community."
7. **Waitlist** — the form (see §5 of this spec for form behavior)
8. **Footer** — minimal: logo, copyright, contact email, link to Witsend Breakthroughs Skool

Typography (locked by design): Newsreader (serif), Geist (sans), Geist Mono (mono). Palette (locked): cream / honey / ink.

## 4. Stack & infrastructure

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | SSR for SEO, API routes for form submission and confirm |
| Hosting | **Vercel** | Free tier sufficient; production project |
| DB / Auth / Storage | **Supabase** | Same project that will host Phase 1 data |
| Email | **Resend** | Domain `bohdiai.com` verified (DKIM/SPF/DMARC) |
| DNS / CDN / SSL | **Cloudflare** | Nameservers pointed from GoDaddy; registration stays at GoDaddy |
| Styling | **Tailwind CSS** | Local install, not CDN (production-grade) |
| Repo | **GitHub** | New repo `bohdi-ai` (or per Alex's preference) |
| Node | **20 LTS** | Vercel default |
| Error monitoring | **Sentry** | Free tier; catches all uncaught exceptions and API failures. Required to enforce the "no silent failures" Golden Rule. |
| Product analytics | **PostHog** | Free tier; pageviews, form funnel, session replay (privacy-respecting). Tells us what visitors actually do. |

## 5. Waitlist form — UX

A single form section with:

- **Email input** (required, validated)
- **Type toggle** — two-button radio: "Founder Beta (25 spots)" and "Notify Me when you launch"
- **Submit button** — disabled until valid email + type selected
- **Founder-cap behavior** — if 25 or more total signups exist with `type = 'founder'` (confirmed + unconfirmed), the Founder Beta button shows as disabled with the label "Founder Beta — Full" and the form defaults to "Notify Me"
- **Optional name field** — TBD; default is email-only for minimum friction
- **Success state** — replaces the form in-place with a quiet message: "Check your email to confirm. We just sent you a link."
- **Error states** — graceful, never blank or cryptic (per Golden Rule)

## 6. Email flow (double opt-in)

1. **Submit** → POST `/api/waitlist` → server inserts row with `confirmed_at = null` and a generated `confirm_token` (UUID v4) → Resend sends confirmation email.
2. **Confirmation email** contains a single CTA: `https://bohdiai.com/confirm?token={uuid}`. Copy is warm and on-brand.
3. **Click confirm** → GET `/confirm?token=...` → server looks up token, sets `confirmed_at = now()`, clears the token, redirects to a success page (`/confirmed`).
4. **Edge cases**:
   - Invalid/expired token → friendly error page with a "resend confirmation" link.
   - Already-confirmed token → success page (idempotent), no error.
   - Duplicate email submitted → if already confirmed, show "You're already on the list" message; if not yet confirmed, resend the confirmation email (don't create a duplicate row).
5. **Welcome email** — sent automatically after successful confirmation. Short, warm, sets expectations ("We'll send occasional progress updates. Reply anytime.").

## 7. Founder cap logic

- Server-side count of `select count(*) from waitlist where type = 'founder'` runs:
  - On page load (SSR) to render the form with correct button state
  - On every submit (race-safe via DB constraint or transaction)
- If count ≥ 25 and a submission arrives with `type = 'founder'`, the server returns 409 with message "Founder Beta is full" and the client falls back to "Notify Me" selection.
- No automatic email blast when the cap is hit — Alex decides when to announce.

## 8. Data model

Single table in Supabase:

```sql
create table waitlist (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  type            text not null check (type in ('founder', 'notify')),
  confirm_token   uuid,
  confirmed_at    timestamptz,
  created_at      timestamptz not null default now(),
  ip              inet,
  user_agent      text
);

create unique index waitlist_email_unique on waitlist (lower(email));
create index waitlist_type_idx on waitlist (type);
```

Notes:
- No RLS yet — this table is server-side-only access (service role key from Vercel env vars). Phase 1 will introduce RLS when tenants exist.
- `ip` and `user_agent` captured for abuse detection only; never exposed publicly.
- `email` stored case-preserving but uniqueness enforced case-insensitively.

## 9. Routes

| Route | Method | Purpose |
|---|---|---|
| `/` | GET | Marketing page (SSR) |
| `/api/waitlist` | POST | Submit signup; sends confirmation email |
| `/confirm` | GET | Confirm via token; redirects to `/confirmed` |
| `/confirmed` | GET | Success page |
| `/confirm/error` | GET | Error/expired page with resend link |
| `/api/waitlist/resend` | POST | Resend confirmation email for an unconfirmed address |

No other routes ship in Phase 0.

## 10. SEO / AEO

Per Golden Rule "all storefronts SEO-ready from generation," this site sets the bar:

- Semantic HTML (one `<h1>`, proper `<header>` / `<main>` / `<footer>`)
- Meta description, Open Graph tags, Twitter card tags (already present in design)
- `og:image` — needs creation (1200×630 cream/honey card with logo + tagline)
- `canonical` link
- JSON-LD structured data: `Organization` + `WebSite`
- `robots.txt` allowing crawl
- `sitemap.xml` (single URL but present)

## 11. Accessibility (WCAG 2.1 AA — Golden Rule)

- Color contrast checked for all text on cream/honey backgrounds
- Form labels associated correctly, error messages announced
- Keyboard navigable; visible focus rings on all interactive elements
- `prefers-reduced-motion` respected (no rotating hero text when set)
- All decorative SVG glyphs `aria-hidden`; meaningful icons get labels
- Skip link to main content

## 12. Performance (Golden Rule: < 3s load)

Targets: Lighthouse mobile ≥ 90 for Performance, ≥ 95 for Accessibility, SEO, Best Practices.

- Tailwind compiled locally (no CDN), purged to per-page CSS
- Fonts: `next/font` for Newsreader, Geist, Geist Mono — self-hosted, no Google Fonts CDN call
- Images: `next/image`, AVIF/WebP, lazy-loaded
- No client JS except what's needed for the form, the rotating hero word, and respectful UI behavior

## 13. Environment variables

Vercel project env vars (production + preview):

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL          # e.g. "BohdiAI <hello@bohdiai.com>"
SITE_URL                   # https://bohdiai.com (production), preview URL otherwise
FOUNDER_CAP                # 25 (lets us adjust without redeploy)
SENTRY_DSN                 # error monitoring
SENTRY_AUTH_TOKEN          # for source-map upload at build time
NEXT_PUBLIC_POSTHOG_KEY    # client-side analytics
NEXT_PUBLIC_POSTHOG_HOST   # PostHog cloud host or self-hosted URL
```

No secrets in the repo. `.env.example` documents the variables.

## 14. Build & deploy sequence

1. **Pre-work (Alex):**
   - Create Cloudflare account; add `bohdiai.com`; copy the two nameservers.
   - In GoDaddy, replace nameservers with Cloudflare's. (Propagation: minutes to a few hours.)
   - Create Resend account; add `bohdiai.com` domain; add the three DNS records in Cloudflare.
   - Create Supabase project; share URL + service role key with Claude (via secure channel).
   - Create Vercel account (if not already); connect GitHub.
2. **Claude:**
   - Scaffold Next.js 14 App Router project with Tailwind.
   - Port design files (Coming Soon HTML + parts.jsx + app.jsx) into clean Next.js components.
   - Implement the waitlist API, confirm flow, and emails.
   - Set up Supabase migration for the `waitlist` table.
   - Wire env vars in Vercel; deploy to a preview URL.
3. **Alex reviews** the preview URL end-to-end (submit a real signup, confirm, check inbox).
4. **Claude** flips DNS to point `bohdiai.com` → Vercel production deployment.
5. **Verify** production: signup, confirm, welcome email all work; Lighthouse scores meet targets; founder cap behavior correct.

## 15. Definition of Done

Phase 0 ships when **all** of the following are true:

- [ ] `bohdiai.com` loads the marketing page over HTTPS
- [ ] Form submission inserts a row and sends a confirmation email within 5s
- [ ] Clicking the confirmation link marks the row confirmed and sends a welcome email
- [ ] Duplicate-email submission behaves correctly (resend, not duplicate)
- [ ] Founder cap behavior verified (manually seed 25 rows in a test environment, confirm UI updates)
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95
- [ ] Visual matches design files on desktop, tablet, mobile (Chrome, Safari, Firefox)
- [ ] Keyboard-only navigation works through the whole page including form submission
- [ ] All env vars documented in `.env.example`
- [ ] README documents how to run locally, deploy, and rotate keys
- [ ] No console errors or warnings in production
- [ ] Sentry receives a test error and surfaces it in the dashboard
- [ ] PostHog records a pageview and a successful form submission as separate events
- [ ] 19-question Daily Audit Checklist passes for the work delivered

## 16. Open questions to resolve before/during build

1. **Repo name.** `bohdi-ai`? `bohdi-ai-app`? Something else?
2. **GitHub org / account** — under Alex's personal GitHub or a new org?
3. **`from` address for emails** — `hello@bohdiai.com`? `noreply@bohdiai.com`? `alex@bohdiai.com`?
4. **Optional name field on the form** — collect first name, or email-only?
5. **`og:image` design** — Claude generates a draft, or Alex provides?
6. **Contact email in footer** — what address?
7. **Witsend Breakthroughs Skool URL** — actual URL needed for the Community section and footer link.
8. **"Who's behind this" copy** — Alex drafts the 2-3 sentences (or approves a Claude draft). Should reference Witsend (1990s) → BohdiAI (now) without being too on-the-nose.
8. **Should Phase 0 already start counting toward the per-tenant Supabase project, or use a temporary "marketing" project?** Recommendation: use the same project — the `waitlist` table is data we'll keep.

These don't block writing the spec, but they need answers before or during build. Claude will ask one at a time.

## 17. Forward references (NOT Phase 0 work, recorded here so we don't lose them)

- **Onboarding prototype before Phase 1 build.** Before writing any Phase 1 code, we'll build a clickable prototype (Figma or HTML) of the 5-screen onboarding + "watch it build" moment. Used to validate the emotional arc and stress-test fallback content packages.
- **Agent runtime decision via Claude Cowork.** Phase 1 parallelism depends on choosing a real agent mechanism. We'll evaluate Cowork together during the Tech Arch Spec phase.
- **Observability baseline established in Phase 0.** Sentry + PostHog set up here become the standard for every Phase 1 feature — no feature ships without instrumentation.

## 18. Estimated effort

Once env / accounts are set up: **Claude implementation ≈ 1 focused session** (port design, build form, wire email, deploy). Pre-work for Alex (accounts, DNS): ~30-60 minutes spread across waiting for DNS propagation.

---

**Approval:** Alex signs off on this doc → Claude begins build. Any change after approval is a spec amendment, not a "while I'm in here" addition.
