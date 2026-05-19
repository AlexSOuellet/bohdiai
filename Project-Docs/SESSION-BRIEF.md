# Session Brief — BohdiAI

**Last updated:** 2026-05-19 end of day (full atmospheric port shipped + audit complete)
**Update at the end of every session.**

---

## Where we are right now

**Full atmospheric design is live at https://bohdiai.vercel.app.** All 10 sections + the cycling BrowserDemo with all 3 full demo storefronts (June's Sourdough / Iron & Ash / Posy Lane Books) are rendering and verified. The site is feature-complete versus the approved mock.

**Not yet done:** DNS flip from the Phase 0 design at `bohdiai.com` to this Vercel project, plus the open items below. Soft blockers for launch.

## Today's daily audit result (2026-05-19)

11 PASS · 6 N/A · 1 PASS-with-note · 1 partial fail · 1 hard fail · 1 pending founder.

**Full audit:** [session-logs/2026-05-19.md](session-logs/2026-05-19.md)

The two non-clean items:
- **Q3 — design tokens partial.** Storefront palettes (`.store-sourdough`, `.store-tattoo`, `.store-kids` in globals.css) use raw hex. Per-demo intentional, but Styling-Conventions §5 forbids raw hex. Needs your call.
- **Q7 — tests hard fail.** Zero unit/integration tests on any new component. Engineering Standards require 90/85/75% coverage. Real tech debt — **should not flip DNS to bohdiai.com before at least Waitlist + BrowserDemo smoke tests exist.**

## Open questions for next session

1. **Storefront palettes (Q3):** Amend `Styling-Conventions.md` §4 to explicitly allow per-demo scoped palettes inside `@layer components`, or refactor to per-storefront token namespaces? My recommendation is the doc amendment.
2. **Privacy + Terms:** Footer links are `href="#"` placeholders. Waitlist already collects emails — we technically have a privacy obligation. Write placeholder "Coming with launch" pages, or write real GDPR-friendly policies now?
3. **DNS flip:** When to point `bohdiai.com` → this Vercel project? Needs your Cloudflare access.
4. **`.build` rebuild-effect direction:** Today the old infinite cycle was killed (it was hiding content). Replaced with one-shot fade-in. Want a subtle periodic re-trigger (e.g. fade out + back in every 30s) for the "watch your store rebuild" feeling, or keep one-shot?

## What got built today

A long session that took us from "approved mock, not started" to "fully ported, deployed, audited":

### Foundation
- **`project-docs/Styling-Conventions.md`** — new rank-2 operating doc. Resolves the Phase 0 Spec (Tailwind) vs yesterday's brief (plain CSS) contradiction. Tailwind wins; mock was prototype medium. Marketing-page scoped.
- **`tailwind.config.ts`** — atmospheric palette (bg / bg-2 / text / muted / honey trio), radius + motion + z-index scales, `md: 720px` breakpoint. Old Phase 0 cream/ink/espresso deleted.
- **`app/globals.css`** — atmospheric backdrop classes + 3 full storefront stylesheets (cream-paper sourdough, near-black tattoo with dotted-noise, sky-blue kids with cloud halos), `.portrait-mask` + `.portrait-bokeh`, `.marquee-fade`, `.build` one-shot stagger family. All shipped keyframes declared inline (lesson learned — see below).
- **`app/layout.tsx`** — 8 fonts via `next/font/google`: Inter Tight + Cormorant Garamond + JetBrains Mono preloaded; Manrope + UnifrakturCook + Bebas Neue + Fredoka + Caveat with `preload: false` so they don't block LCP.
- **Removed**: BohdiLogo, Glyph, Breadth, WhosBehindThis, StorefrontStack components; `geist` dependency.

### Sections (all 10)
Header, Hero (with Rotator + BrowserDemo slot), HowItWorks (with Typewriter + glowing orb + LIVE badge), TradesMarquee, Waitlist (wired to existing `/api/waitlist`, live counter from Supabase, resend flow), WhoBehind (portrait with radial-mask fade + honey bokeh), Pledge, Community, Footer.

### BrowserDemo
Browser chrome + URL typewriter + +1 new-order pill + 3 dot indicators + 6.5s auto-cycle + hover/tap pause + 3 full demo storefronts (each in `components/storefronts/`).

### Confirmation pages
`/confirmed` and `/confirm/error` ported to atmospheric style.

### Performance
- alex-portrait.png 8.8 MB → 889 KB + 204 KB WebP (1200px wide).
- 11 storefront images downloaded from gen-tool CDN, resized to 800px, re-encoded WebP q=82, committed to `/public/storefronts/`. **External CDN dependency eliminated.**
- 5 storefront-only fonts deferred via `preload: false`.
- Live measurement: FCP 284 ms, DOMContentLoaded 109 ms, Load 139 ms, 453 DOM nodes, 432 KB total transfer, 29 requests.

### Real bug we hit + fix (worth remembering)

**Tailwind keyframe gotcha:** keyframes declared in `theme.extend.keyframes` only get emitted in the output CSS if something uses the matching `animate-{name}` utility class in JSX. Our `.build`, `.scene-glow`, `.scene-prism`, etc. referenced keyframes via raw `animation:` inside `@layer components`, which Tailwind doesn't trace — so 6 keyframes silently dropped from the bundle, leaving storefront content stuck at opacity 0.

**Fix:** declare keyframes used by `@layer components` rules directly in `globals.css`, not in tailwind config. (Now: build-in, breathe, breathe-slow, beam-sway, beam-sway-2, ember-rise.)

### A11y fixes shipped today
- Skip-to-content link (in layout)
- Single H1 (was 2 — demo storefronts had their own h1s, now h2s)
- `<main>` landmark
- All images have alt, all buttons have labels, no positive tabindex
- `aria-live="polite"` on Waitlist status messages
- `role="tab"` + `aria-selected` on Waitlist toggle
- Decorative atmospheric layers `aria-hidden="true"`

## NEXT SESSION priorities (in order)

1. **Decide + act on the four open questions above** (storefront palettes, Privacy/Terms, DNS, `.build` direction).
2. **Write smoke tests** for Waitlist form + BrowserDemo cycle behavior (resolves audit Q7).
3. **Run axe-core a11y scan** + fix any serious issues (Q18 finish).
4. **Run real Lighthouse mobile audit** + fix anything below 90.
5. **DNS flip `bohdiai.com` → this Vercel project** once 1–4 are clean.
6. After launch lands → **begin drafting Phase 1 spec** (multi-tenant maker auth, AI storefront generation, `[shop].bohdiai.com` subdomains, Stripe/Square webhooks). Target: private beta mid-August 2026.

## Files to know

- `_design-mocks/hero-atmospheric.html` — source-of-truth mock, frozen reference
- `app/page.tsx` — wires the 10 sections into the Scene shell
- `app/layout.tsx` — fonts + skip-to-content + JSON-LD
- `app/globals.css` — atmospheric backdrop + 3 storefront stylesheets + keyframes
- `tailwind.config.ts` — design tokens
- `components/` — 16 files (10 sections + Scene + Embers + Rotator + Typewriter + SectionKicker + BrowserDemo)
- `components/storefronts/` — SourdoughStore + TattooStore + KidsStore
- `scripts/compress-portrait.mjs` + `scripts/download-storefronts.mjs` — image pipeline (reproducible)
- `project-docs/Styling-Conventions.md` — rank-2 operating doc (Tailwind + atmospheric tokens)
- `project-docs/Phase-0-Spec.md` — Phase 0, shipped (design has evolved past it — worth a sync edit)
- `project-docs/Approval-Policy.md` + `Engineering-Standards.md` — still authoritative
- `project-docs/Daily-Audit.md` — the 19-question audit, used today
- `project-docs/session-logs/2026-05-19.md` — today's full audit + commits

## Operational notes (unchanged)

- **Vercel CLI installed and linked** to `alex-ouellet-s-projects/bohdiai`
- **GitHub repo:** https://github.com/AlexSOuellet/bohdiai
- **Live preview:** https://bohdiai.vercel.app
- **Supabase:** us-east-1, `bohdi-ai`, secret-key system
- **Stack:** Next.js 14.2.15 · Tailwind · TypeScript strict · Supabase · Vercel · Resend · Cloudflare

## Don'ts (working preferences, unchanged)

- Don't use the AskUserQuestion popup tool. Ask inline.
- Don't use git worktrees. Work in main tree on a feature branch when needed.
- Don't paste secrets in chat.
- Don't ship subtle motion — Alex wants visible (but no theater — cart-ticker is the cautionary tale).
- Don't build desktop-only — mobile-first.
- `overflow: clip` (not `hidden`) for atmospheric clipping — `hidden` creates a Chrome scroll container that breaks anchor links.
- Styling decisions: Styling-Conventions.md wins.
- Keyframes used by `@layer components` rules: declare in `globals.css`, NOT `tailwind.config.ts` (Tailwind won't emit them otherwise).
