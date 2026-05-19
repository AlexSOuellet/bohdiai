# Session Brief — BohdiAI

**Last updated:** 2026-05-19 (atmospheric port + full storefronts session)
**Update at the end of every session.**

---

## Where we are right now

**Full atmospheric port shipped to `main` and deployed.** The new bohdiai.com design from the mock at `_design-mocks/hero-atmospheric.html` is now live on https://bohdiai.vercel.app — including all 3 cycling storefronts inside the BrowserDemo (June's Sourdough / Iron & Ash / Posy Lane Books).

**bohdiai.com DNS flip** is still pending (separate task — Cloudflare/Vercel config).

## What got built today (2026-05-19)

A long session that began with planning and ended with the whole site deployed:

### Foundation
- **`project-docs/Styling-Conventions.md`** — new rank-2 operating doc. Resolves Phase 0 Spec (Tailwind) vs yesterday's brief (plain CSS) contradiction. Tailwind wins; mock was prototyping medium. Marketing-page scoped.
- **`tailwind.config.ts`** — atmospheric palette (bg / bg-2 / text / muted / honey trio), radius + motion + z-index scales, `md: 720px` breakpoint, ~15 keyframes (breathe, prism beams, pulse-glow, rot-swap, blink, build-loop, scroll-left/right, ring-spin, etc.). Old Phase 0 palette deleted.
- **`app/globals.css`** — atmospheric backdrop classes (`.scene`, `.scene-glow`, `.scene-vignette`, `.scene-prism`, `.scene-grain`, `.scene-embers`), plus the full storefront stylesheets (`.store-sourdough`, `.store-tattoo`, `.store-kids`) with their mobile breakpoints, plus `.marquee-fade` and `.portrait-mask` + `.portrait-bokeh`.
- **`app/layout.tsx`** — loads 8 fonts via next/font/google: Inter Tight, Cormorant Garamond, Manrope, JetBrains Mono (marketing page) + UnifrakturCook, Bebas Neue, Fredoka, Caveat (storefronts).
- **Removed**: Phase 0 components (BohdiLogo, Glyph, Breadth, WhosBehindThis, StorefrontStack) and the `geist` dep.

### Sections (all 10)
- `Header` · pill nav with brand B chip + How/Community + Reserve CTA
- `Hero` · kicker pill, three-span H1 (pulse-glow on "Live in minutes"), Rotator subhead, 2 CTAs, BrowserDemo
- `BrowserDemo` · client component, frame + URL typewriter + 3 dots + cycling 6.5s + hover-pause + +1 new-order pill
- `HowItWorks` · 3-step process with connecting line, Typewriter prompt card, glowing AI orb, LIVE badge
- `TradesMarquee` · two scrolling rows (140s/160s), tap-to-pause, featured chips honey-styled
- `Waitlist` · atmospheric form wired to the existing `/api/waitlist`, live counter from Supabase, resend flow
- `WhoBehind` · portrait with radial-mask fade + bokeh, Inter-Tight quote with honey accents
- `Pledge` · 3 italic Cormorant items on vertical honey rule with glowing dots, Alex Scott signature
- `Community` · honey-bordered card, On-Skool platform pill, gradient "Join the room" CTA to real Skool URL
- `Footer` · brand + 3 columns (Product / Community / Contact) + Privacy/Terms placeholders + © Rhode Island

### Storefronts (all 3 inside BrowserDemo)
- **`components/storefronts/SourdoughStore.tsx`** · cream paper theme, J-mark brand, 3-item product grid (country/seeded/cinnamon), farmers-market footer with email subscribe
- **`components/storefronts/TattooStore.tsx`** · near-black with dotted-noise pattern, UnifrakturCook gothic brand, Bebas Neue all-caps hero, 6-grid portfolio with mono labels, "Booking Aug 3 onwards / Deposit 2 of 6 today"
- **`components/storefronts/KidsStore.tsx`** · sky-blue with painterly cloud halos, Caveat-handwritten brand, Fredoka chunky h1 with Caveat "Lantern" accent, rotated massive book cover with 3-layer drop shadow, round "New! Aug 4" stamp, dashed-border thumbs strip
- All 3 share the `.build` stagger family (.build-1 through .build-7) for the rebuild-on-cycle effect

## Known issues / things to come back to

1. **Storefront images still hotlinked to gen-tool CDN.** ~20 images on `d8j0ntlcm91z4.cloudfront.net`. Should migrate to `/public/storefronts/` (or Supabase Storage) before launch. If the CDN ever takes them down, BrowserDemo breaks. Easy to fix when Alex is back at the local machine — write a script that downloads all 20 in one shot, then change the URLs in SourdoughStore/TattooStore/KidsStore.

2. **`.build` animation = rebuild effect.** The mock's design intent is that each storefront *visibly rebuilds* every 6.5s — elements fade in staggered, hold, fade out, repeat. This means there's a ~1s window per cycle where the storefront content (not chrome) is invisible. **Not a bug — that's the design.** If Alex finds it jarring, two options:
   - Make `.build` opacity 1 by default and only fade out near the end of the cycle (so initial appearance is instant)
   - Lengthen the visible plateau (currently 10-88% of cycle) to 5-95%

3. **`eslint-plugin-tailwindcss` deferred.** Tried to wire it in but it fails to resolve tailwindcss with our TS config. Not blocking; can revisit when v3.18+ improves TS support or when we migrate to Tailwind v4.

4. **`/confirmed` and `/confirm/error` pages** ported to atmospheric, but they're rarely seen (only after email confirm). Worth a closer pass when Alex can review.

5. **`Privacy` and `Terms` footer links** are `href="#"` placeholders. Need real pages before launch.

6. **Lighthouse mobile audit** not yet run. Should be ≥ 90 per audit gap list. Likely candidates for points loss: 8 Google fonts may hurt LCP; large `alex-portrait.png` (9MB — should be optimized).

7. **`public/alex-portrait.png` is 9MB.** Should be compressed / converted to WebP. Will materially help Lighthouse mobile score.

## Next session — recommended priorities

In order of impact:

1. **Compress alex-portrait.png** (9MB → < 200KB). Convert to WebP. Use Next.js Image component (already is — but the source is huge).
2. **Migrate storefront images to `/public/storefronts/`.** Eliminates CDN dependency.
3. **Lighthouse audit pass** at https://bohdiai.vercel.app/ on mobile. Fix flagged issues.
4. **Real Privacy + Terms pages** (or remove the footer links if not launching with them).
5. **DNS flip `bohdiai.com` → this Vercel project.** Cloudflare DNS + Vercel domain config.
6. **Decide on `.build` rebuild-effect feel.** Watch the cycling live on production; if jarring, tune.

After all of that lands → **Phase 1 spec drafting begins** (multi-tenant maker auth, AI storefront generation, [shop].bohdiai.com subdomains, Stripe/Square webhooks). Alex's target: private beta by mid-August 2026.

## Files to know

- `_design-mocks/hero-atmospheric.html` — the source-of-truth mock, frozen as reference
- `_design-mocks/assets/alex-portrait.png` — original portrait (also copied to `public/`)
- `app/page.tsx` — wires the 10 sections into the Scene shell
- `app/layout.tsx` — fonts + skip-to-content + JSON-LD
- `app/globals.css` — atmospheric backdrop classes + all 3 storefront stylesheets
- `tailwind.config.ts` — design tokens + keyframes
- `components/` — 16 files (10 sections + Scene + Embers + Rotator + Typewriter + SectionKicker)
- `components/storefronts/` — SourdoughStore + TattooStore + KidsStore
- `project-docs/Styling-Conventions.md` — rank-2 operating doc (Tailwind + atmospheric tokens)
- `project-docs/Phase-0-Spec.md` — Phase 0, shipped (but design has evolved well past it)
- `project-docs/Approval-Policy.md` and `Engineering-Standards.md` — still authoritative

## Operational notes (unchanged)

- **Vercel CLI installed and linked** to `alex-ouellet-s-projects/bohdiai`
- **GitHub repo:** https://github.com/AlexSOuellet/bohdiai
- **Live preview:** https://bohdiai.vercel.app
- **Supabase:** us-east-1, `bohdi-ai`, secret-key system in use
- **Stack:** Next.js 14.2.15 · Tailwind · TypeScript strict · Supabase · Vercel · Resend · Cloudflare

## Don'ts (working preferences, unchanged)

- Don't use the AskUserQuestion popup tool. Ask inline.
- Don't use git worktrees. Work in main tree on a feature branch.
- Don't paste secrets in chat.
- Don't ship "subtle" motion — Alex wants visible (but no theater — the cart-counter ticker is the cautionary tale).
- Don't build desktop-only — mobile-first from now on.
- When clipping atmospheric/decorative effects in production: use `overflow: clip`, NOT `overflow: hidden`. Hidden creates a Chrome scroll container that breaks anchor links.
- When making structural styling decisions on the marketing page, the spec is `Styling-Conventions.md`. If a contradiction shows up, follow the doc.
