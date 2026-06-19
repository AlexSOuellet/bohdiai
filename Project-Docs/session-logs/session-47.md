# Session 47 — 2026-06-19

**One line:** Built the Phase 1 auth spine end-to-end (one global login, account-first onboarding, ownership-at-publish); reworked the live marketing page with Alex; locked D60 (storefronts live-on-build + checkout-gated + offline toggle) and D61 (beta access via admin-approval/comped/invite); and **deployed the app to production for the first time since Session 11**, standing up `*.bohdiai.com` so **Soul Splatter is now live on the internet** — via a Cloudflare Worker reverse-proxy that keeps DNS + email on Cloudflare.

---

## Auth build (D59 — one global login, roles per shop)

Shipped in four tested slices, all on `session-12/layout-engine`, committed:

1. **The spine** (`lib/auth/`): `session.ts` (`getCurrentUser`, `requireUser`), `membership.ts` (`addShopOwner` idempotent, `isShopAdmin`, `getUserShops` over `tenant_members`), `actions.ts` (`signUpMaker` / `signInMaker` server actions). Pure, unit-tested.
2. **Returning-maker sign-in**: `lib/auth/oauth.ts` (`signInWithGoogle`), `components/auth/GoogleButton.tsx`, `app/signin` (page + `SignInForm`), and `requireUser` re-added now that `/signin` exists.
3. **Embedded account step**: `StepAccount` becomes onboarding screen 1 (account before build, per the auth draft). `OnboardingFlow` re-sequenced to 6 steps (Account → Name → Niche → Mood → Trial → Build) with a `startStep` so an already-logged-in maker (returned from Google, or building a 2nd shop) skips account. `onboarding/page.tsx` reads the session to set `startStep`.
4. **Ownership seam**: `lib/auth/assign-owner.ts` (`assignShopOwner`) writes the admin `tenant_members` row at publish; the `/api/onboarding/start` route reads the signed-up user in request scope and links them after `completeBuild`. Null/failed writes log loudly (an unowned shop must not pass silently) but never undo a successful build.

**Decisions made along the way:**
- **Google over Facebook/Instagram.** Google is the one social provider at launch — least setup, most makers have it. Facebook is a heavier Meta app-review slog for declining usage; Instagram isn't a real login provider. Add Facebook later only if makers ask.
- **Password + Google, no magic link** at launch (the callback already supports magic link; not exposed day one).
- The session-refresh step the auth draft listed as task 1 was **already done** in `proxy.ts` (it runs `supabase.auth.getUser()` with cookie write-back).
- **Email confirmation must be OFF in Supabase** for the seamless flow — otherwise sign-up stalls mid-onboarding waiting on a confirmation email. Flagged as an Alex dashboard task (in the brief's next-actions).

Full suite went 990 → **1022** green across the session; tsc clean throughout.

## Marketing page rework (live with Alex on the home page)

A long pass reviewing the live marketing site (`bohdiai.com`) on screen, text-only changes (no color/layout/component changes):

- **How-it-works** now reflects the real flow and centers Bohdi as the maker's personal designer: *Pick your craft and a mood → Bohdi builds your storefront → Tell Bohdi what to change* ("your personal designer, on call, no tech to figure out, publish and keep 100%"). Intro line: "Pick your craft, watch Bohdi build it, then tell him what to change." The old "tell us about your business in a few sentences" framing was wrong — onboarding is pick-from-a-grid, not free text.
- **Step-1 demo** (`PromptCard`) swapped from a typewriter typing a sentence to **selection chips** (craft chips + mood chips with one of each lit) — same card/colors, just selecting instead of typing, matching the real flow. Removed the now-unused `Typewriter` import + prompts.
- **BrowserDemo** "Live · junes-sourdough.bohdiai.com" pill → **"Empowered By BohdiAI"** badge. It read as a clickable live link to a site that doesn't exist; reframed as a made-with caption. Pulse dot kept (Alex: it looked dead without it).
- **TradesMarquee** rebuilt to list **only niches we've built or locked to build** (19 built + the 43-niche traditional-craft batch). Removed all off-audience trades (tattoo, piano teacher, yoga, dog walker, barber, comedian, indie game dev, tarot, etc.). "Teach it" / "97 more" copy left as aspirational since services are coming.

## Product decisions — D60 & D61 (written to the decisions log)

A long, winding conversation about whether storefronts should be live-on-build or parked-until-publish. It looped through parked → active+toggle → "live isn't the wow" → "live in minutes but not after a fake build." Midway Alex **called out that I was reshaping my view to match his every turn** (the yes-man pattern). The honest resolution came from a real argument: you can't make placeholder products read as "samples" without a label (which cheapens the store), so a shared visitor could hit fake commerce — UNTIL we add the rule that **checkout is disabled until the maker connects a payment processor**, which removes that failure entirely. With cart gated, live-on-build is fine.

- **D60** — storefronts publish live on build (Master Spec §5 stands); checkout disabled until Stripe/Square is connected; maker gets an online/offline toggle (just flips `tenants.status`, the resolver already serves only `active`); placeholders are NOT labeled "sample"; "live in minutes" repositioned ("we give them the look, they sculpt the content"); a real explorable demo for prospects is post-beta.
- **D61** — beta/founder access: admin approval **creates** a comped Supabase account; the maker sets their password via an **emailed invite link** on first login (never a cold password set at /signin); the comp flag skips the card-required trial step; closed-beta sign-up is gated to approved accounts. **Open within D61:** whether founders are free only during beta then roll to the locked-in founder rate, or longer — Alex's to set.

## Production go-live — the big milestone

**Nothing had been deployed since Session 11.** This session:

- Found the **Vercel CLI authed** as alexsouellet, project `bohdiai`. Deployed the working tree to production (`vercel --prod`) — the full Session-12–47 engine is now live on `bohdiai.com` (the new marketing copy is serving).
- **Turned OFF the `onboarding` feature flag** in production (it was on) so `/onboarding` 404s for the public — beta stays closed until the D61 invite flow exists.
- **The wildcard SSL saga.** Vercel cannot issue a `*.bohdiai.com` cert while Cloudflare holds DNS (wildcard certs need DNS control). Walked the options: orange→grey proxy toggles (525 / handshake fail), Vercel nameserver move (**rejected** — inventorying the Cloudflare zone found **Cloudflare Email Routing** runs alex@bohdiai.com → Gmail; moving NS would kill it), Origin Rule SNI override (**paywalled** on Free), Snippets (**paywalled**). Landed on a free **Cloudflare Worker** (`shop-proxy`, route `*.bohdiai.com/*`) that reverse-proxies shop subdomains to the apex (the host with a valid cert) and forwards the real shop in a custom `x-bohdi-shop` header.
- App side: tested-first change in `lib/proxy-security.ts` (`resolveProxyHost`) + `proxy.ts` now resolve the tenant from `x-bohdi-shop` when present, else `host`. (First used `x-forwarded-host` — Vercel's edge overwrites that one; switched to a custom header.) Redeployed.
- **Result: `soul-splatter.bohdiai.com` is live (200, serves her storefront).** The Worker handles every shop subdomain going forward. DNS + email never moved.

## Plan / docs updated

- **Build-runner gap** added to `Phase-1-Backend-Plan-DRAFT.md` as the one true blocker for onboarding in prod: the build runs fire-and-forget (`void runBuild`), which a Vercel function can be frozen out from under once it returns the response. Serving an already-built tenant (Soul Splatter) doesn't need it; new onboarding builds do.
- Deleted the untracked `skin-shelf.html` scratch file (Alex's call).

## Live-test punch list (Soul Splatter on a phone)

1. **Main Street mobile type scale (biggest).** Type is sized for desktop with an *optional* per-role `sizeMobile`; the skins under-declare it, so on a phone most text stays desktop-sized — the About/founder section is the worst (giant quote + body). Fix should be **automatic mobile down-scaling in the renderer**, not hand-tuning `sizeMobile` on every role of all 29 skins. Needs Alex's phone in the loop while tuning. **First thing next session.**
2. Hero video crops on mobile — a wide 16:9 video covered into a tall phone screen loses the sides. A mobile framing (shorter, or portrait crop) would tidy it.
3. Storefront page `<title>` shows the generic "BohdiAI — Your Business Online" instead of the shop name — metadata gap, SEO polish.

## Lessons banked

- **The yes-man pattern is real and Alex can feel it.** Reshaping my stated view to match his each turn gives him zero signal. Concede only on the merits (the "can't label samples" argument genuinely defeated my position — that's principled), and plant a real flag even when it cuts against where the conversation drifted. Reinforces `feedback_no_reflexive_agreement`.
- **Verify against real infrastructure before a destructive change.** I nearly recommended moving nameservers to Vercel; inventorying the actual Cloudflare zone caught the Email Routing that would have broken alex@bohdiai.com. Inventory first, then act.
- **Prove the mechanism before configuring blind.** The `curl apex -H "Host: soul-splatter..."` test proved Vercel would serve the tenant off the header before we touched any Cloudflare setting — turned a blind dashboard hunt into a known-good target.
