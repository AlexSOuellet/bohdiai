# Session 48 — 2026-06-20

Per-tenant storefront SEO + a mobile-responsive pass + the first production deploy of both; a long design/architecture conversation that reframed how looks and colors should work; and live (reversible) copy + a bright preview for the first real tenant, Soul Splatter.

## What shipped (committed + pushed on `session-12/layout-engine`, then deployed to prod)

### Per-tenant SEO (commit `8d0d1b2`)
Every storefront page now builds its own metadata instead of inheriting BohdiAI's. New `lib/storefront/`:
- `seo.ts` — pure builders: `buildTenantMetadata` (title, description, canonical, Open Graph, Twitter), `tenantBusinessJsonLd` (LocalBusiness when service areas exist, else Store, with `areaServed`), `tenantProductJsonLd`. 23 unit tests.
- `seo-data.ts` — `loadTenantSeoFacts(tenantId, subdomain)`: tenant row + home envelope → facts. Share-image priority: authored `content.seo.image` → logo → hero still.
- `metadata.ts` — `storefrontMetadata(page)` + `storefrontSeoFacts()` thin wrappers reading the proxy's `x-tenant-id`/`x-tenant-subdomain`.
- `generateMetadata` wired into every storefront route; Product JSON-LD on listing pages; LocalBusiness/Store JSON-LD injected once via the storefront layout.
- **Stopped the BohdiAI `Organization` JSON-LD from leaking onto tenant pages** — moved it out of the root layout to the marketing home only.
- New `tenants.service_areas text[]` column (migration `20260620000001`) drives `areaServed` + the local-SEO description. Types regenerated.

The known generic-title bug is fixed as a side effect. Verified the real data path end-to-end against Soul Splatter (correct title, description, areaServed RI/CT/MA, share image).

### Mobile pass on Main Street (commit `1aadf14`)
- **`fluidFontSize`** (in `chrome.tsx`): every type role is emitted inline as a `clamp()` that scales from a phone-appropriate floor up to its exact desktop size — display type shrinks most, body/labels least. One renderer change, all 29 skins, desktop unchanged. Replaces the under-declared, inline-overridden per-skin `sizeMobile` `@media` path (which couldn't win against the inline font-size anyway).
- **Full phone nav**: under 640px the link row becomes a menu button that opens a full-screen overlay (links in the display font, staggered fade-in, Esc to close, scroll lock, focus to close button). New client component `MobileNav.tsx`; wired into the home hero, sub-page, and product headers; reads each skin's own `--ms-*` vars. Fixes the wordmark/nav collision Alex caught at narrow widths. Replaced the earlier wrap-to-second-row approach (Cart on its own line, which Alex rejected).
- **Footer "Intro" replay fixed properly** (not suppressed): now a real `<Link href="/?intro=1">` (client `IntroReplayLink`) plus a `REPLAY_INTRO_EVENT` window event MomentHero listens for — replays whether you're already on home (event) or arriving from another page (mount reads the param). No full reload, no eslint-disable. Runtime-verified the replay fires.
- Tests added: `fluidFontSize`, `MobileNav`. Full suite green (1054).

### Production deploy
`vercel --prod` — SEO + mobile now live on `bohdiai.com` (aliased, READY). Verified the mobile fix is actually serving on a real production URL (`soul-splatter-bright.bohdiai.com` at 390px shows the hamburger + fluid type). This is the second prod deploy of the session-12 branch (after Session 47), still via working-tree `vercel --prod`; `main` remains frozen at Session 11.

## Soul Splatter live content (all reversible — backups in `tmp/content-backups/`)
Alex supplied Sheri's real marketing graphics (business card + flyers). From them:
- Hero eyebrow → **"Art that moves with you"** (her card's tagline); the old eyebrow line was first folded into the story, then removed when Alex flagged the story had gone 5 lines — **story is back to 4** (he wants it short so people don't lose interest).
- About / contact / close copy rewritten in her flyer voice (plain "what we do," all-ages/event positioning, "Let's create something beautiful together"; close CTA "Book Now").
- Authored `content.seo.title`/`description` for her (the hand-quality SEO line).
- **Share-card image**: screenshotted her actual rendered hero via Playwright (`scripts/shot-hero.mjs`) and set it as `content.seo.image`. (Headless capture needed a scroll nudge to fire the reveal animations; reduced-motion made it blank — the working recipe is in the script.)

New scripts: `edit-tenant-home-copy.mjs` (reversible home-copy edits with snapshot+restore), `shot-hero.mjs` / `shot-page.mjs` / `shot-hero-burst.mjs` (storefront screenshot tooling, now with viewport args).

## Bright preview — KEEP, do not delete
Built a **bright** version of Soul Splatter at `soul-splatter-bright` (`scripts/build-soul-splatter-bright.ts`, mood `cheerful`, a bright/daylight description) to test dark-vs-bright. **Alex sent it to Sheri to review — do not wipe `soul-splatter-bright`.** Key finding: the original dark/blacklight look was *instructed* by the original build description ("blacklight-reactive… against dark light"), not an engine error.

## The design + architecture conversation (the real substance)
- **Her brand is saturated maximalism, not clean-white.** My first bright attempt (white background, clean type, one photo) missed her completely — Alex: "the bright on white doesn't come close." Her AI-made graphics are deep purple/violet base with neon rainbow marbling *as the whole environment*, glowing, playful. Lesson: design discipline ≠ restraint; match the maker's real brand energy. (Ironically the dark build's "color on a dark base" instinct was closer to her actual background than white was — it just went cold/black/UV/editorial.)
- **Makers should choose their own colors, decoupled from skins** (Alex's call). This is the Master Spec's original design-token vision (colors per-tenant, the maker's brand over the niche, Vibe-Slider "can't break your site"). Current implementation bundles color into the skin — a drift. Target model: four layers — archetype (bones) / skin = structure + type + treatment / **maker color layer** / content. The maker gives brand colors; the system **derives** a balanced, accessible palette (NOT raw slot assignment — that's the Wix slop trap). We already ship `@material/material-color-utilities` and already extract `brand_colors` from logos, so the seam exists. **Top priority next session; prototype on Sheri (her purple + rainbow) first.**
- **"Try a look" must preserve content** — a full rebuild regenerates everything (copy, images, skin) and can't be the mechanism. Most look-trials are instant re-skins (swap structure, keep colors + content); only a visual-world flip (dark↔bright) needs new imagery, and even then copy is preserved. Try-On versioning (`store_versions`, `?v=` preview) is the reversible-preview mechanism.
- **SEO direction: stays auto-general for new tenants + a backend section for makers to edit/override** (title, description, service areas). Folds two of the three "SEO generalizations" into a dashboard SEO editor.

## Flag
The build pipeline's **director's-cut step has a 25s timeout that flaked once mid-build** (timed out, succeeded on retry). This is the audit's A4 (pipeline timeout budget under the 300s route ceiling) — a real "builds can randomly fail in production" risk.

## Lessons banked (memory)
- **Always do it right** (`feedback_always_do_it_right`) — fix the root cause; never suppress/workaround. Triggered by an eslint-disable I added to silence a lint error; the proper fix was the `<Link>` + replay event.
- **Design discipline ≠ restraint** (`feedback_design_discipline_not_restraint`) — match the maker's real brand energy.
- **Maker color layer** (`project_maker_color_layer`) — the decoupled-color decision + derive-don't-assign.
- Commits/deploys are non-destructive and revertible — don't hesitate to commit verified work or to deploy when told; stop re-asking.
