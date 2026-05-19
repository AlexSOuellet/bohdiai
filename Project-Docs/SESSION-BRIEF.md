# Session Brief — BohdiAI

**Last updated:** 2026-05-19 late session (book-cutoff fix + token refactor + orientation rules tightened)
**Update at the end of every session.**

---

## Where we are right now

Marketing site at https://bohdiai.vercel.app is feature-complete. Today's late session was a short patch + a much bigger course correction on how I orient at the start of every session.

**Not yet done:** DNS flip from the Phase 0 design at `bohdiai.com` to this Vercel project. Smoke tests for Waitlist + BrowserDemo. Privacy + Terms pages. Real axe-core + Lighthouse passes. All soft blockers for launch.

## What happened in this late session

1. **Posy Lane Books cutoff fix.** The KidsStore demo was overflowing the BrowserDemo container on mobile + desktop (poster padding + h2 + chip strip too tall). Tightened in `globals.css`: poster padding 55→44 desktop / 48→36 mobile, h2 64→54 desktop / 38→32 mobile, cover image width 62→50% mobile, thumbs strip padding/gap/font reduced, `min-height: 0` on `.poster` so flex shrinks. Verified locally.

2. **Storefront token refactor.** Replaced raw hex inside `.store-sourdough` / `.store-tattoo` / `.store-kids` with scoped CSS custom properties at the top of each block (`--paper`, `--ink`, `--blood`, `--sky`, etc). Hit a real bug mid-flight: `replace_all` swept through the token *definitions themselves*, turning them into self-references (`--paper: var(--paper)`) and breaking the storefronts. Fixed by redefining all three palette blocks with literal hex values. Lesson: when using `replace_all` for hex → `var(--name)`, define the tokens *after* the replacement, not before. **NOTE:** this refactor turned out to be architecturally unnecessary (see point 4 below) but causes no harm and stays in place per Alex's call.

3. **Stray hex audit.** Searched the rest of the codebase. Found ~15 hex literals in `app/opengraph-image.tsx`, `components/BrowserDemo.tsx`, `components/Community.tsx`, `components/HowItWorks.tsx`. These were NOT cleaned up because of point 4.

4. **Course correction — I was opining on architecture without reading the Master Spec.** Alex caught me framing the 3 demo storefronts as "seed templates" and inventing Phase 1 architecture by guessing. The actual Phase 1 architecture (Master Spec §6) is:
   - Per-tenant design tokens in Supabase JSON, injected as CSS variables at render time
   - AI-generated token values bounded by per-niche schemas (candle makers = warm tones, jewelry = cool tones)
   - ~15–18 modular React component variants (3–4 hero variants, 3 grid variants, etc), composed per-tenant via tenant data
   - Lead developer (me) builds the token schema + 5 foundational components; agents build remaining variants + niche schemas + design boundaries in parallel
   - The 3 demo storefronts I built earlier are NOT seed templates — they're monolithic single-file marketing art with no Phase 1 architectural role

5. **Spec docs ported from .docx to .md.** Created [BohdiAI-Master-Spec.md](BohdiAI-Master-Spec.md) and [BohdiAI-Roles-Workflow.md](BohdiAI-Roles-Workflow.md) so I can load them at session start without docx extraction. The .docx files remain canonical.

6. **CLAUDE.md tightened.** Added a "Required reading at session start" list (CLAUDE.md → SESSION-BRIEF.md → Master Spec → Roles & Workflow → current Phase Spec) AND a hard rule: before opining on architecture, I must cite the relevant Master Spec section. If I can't cite it, I haven't earned the right to opine. Guessing already cost a session.

## Open questions for next session

1. **Privacy + Terms:** Footer links are still `href="#"` placeholders. Waitlist already collects emails. Real GDPR-friendly pages or placeholder "Coming with launch"?
2. **DNS flip:** When to point `bohdiai.com` → this Vercel project? Needs your Cloudflare access.
3. **`.build` rebuild-effect direction:** Today the old infinite cycle was killed. Want a subtle 30s periodic re-trigger for the "watch your store rebuild" feeling, or keep the current one-shot fade-in? Earlier this session you said "refade sounds nice" but we didn't build it.
4. **Daily Audit Q3 reframe:** Q3 ("design tokens, no hardcoded values") was the trigger for today's whole token detour. With the actual architecture in hand: Q3 should apply to Phase 1 *component variants* (which are token-driven by design), NOT to Phase 0 marketing artwork like the 3 demo storefronts. Worth a quick edit to Daily-Audit.md so future audits don't re-trigger the same misunderstanding.

## NEXT SESSION priorities (in order)

1. **Next.js major upgrade: 14.2.15 → 15.x → 16.x BEFORE DNS flip.** `npm audit` currently flags 24 advisories against `next@14.2.15` (1 critical, 3 high, 1 moderate; most are config-gated and we don't expose the vulnerable surface, but the count is real). Doing the upgrade now is *safer* than deferring: codebase is at its smallest, no live users, smoke tests now exist, and we want to be on current Next *before* Phase 1 adds tenant middleware + tenant-aware caching (where Next 15's flipped fetch caching default is a silent footgun). Order: 14 → 15 first (the bigger jump — async `cookies()`/`headers()`/`params`, fetch no longer cached by default, React 19), all tests green + manual smoke, then 15 → 16. Re-run `npm audit` after.
2. **DNS flip `bohdiai.com` → this Vercel project** once the upgrade ships clean to preview.
3. **After launch lands → begin drafting Phase 1 spec.** Target: private beta mid-August 2026.

## Lessons banked from today (do not repeat)

- **Read the Master Spec at session start, every session.** CLAUDE.md now enforces this.
- **Cite the spec before opining on architecture.** If I can't cite it, I'm guessing. Stop and re-read instead. CLAUDE.md now enforces this.
- **`replace_all` for color migration is dangerous when the search target also exists in the migration scaffold.** Define new tokens *after* sweeping the file, not before. (Or use targeted edits instead of `replace_all`.)
- **Don't conflate "built it as a React component" with "built it as a reusable template."** Three single-file storefront components are marketing art, not a template library. The Phase 1 template library is independent modular variants assembled per tenant via data.

## Files to know

- `_design-mocks/hero-atmospheric.html` — source-of-truth mock, frozen reference
- `app/page.tsx` — wires the 10 sections into the Scene shell
- `app/layout.tsx` — fonts + skip-to-content + JSON-LD
- `app/globals.css` — atmospheric backdrop + 3 storefront stylesheets (now with scoped CSS custom-property palettes) + keyframes
- `tailwind.config.ts` — design tokens
- `components/` — 16 files (10 sections + Scene + Embers + Rotator + Typewriter + SectionKicker + BrowserDemo)
- `components/storefronts/` — SourdoughStore + TattooStore + KidsStore (marketing art, NOT seed templates)
- `scripts/compress-portrait.mjs` + `scripts/download-storefronts.mjs` — image pipeline (reproducible)
- `project-docs/Styling-Conventions.md` — rank-2 operating doc (Tailwind + atmospheric tokens)
- `project-docs/BohdiAI-Master-Spec.md` — **rank-2 product spec** (NEW today; .docx is canonical)
- `project-docs/BohdiAI-Roles-Workflow.md` — **rank-2 process doc** (NEW today; .docx is canonical)
- `project-docs/Phase-0-Spec.md` — Phase 0, shipped (design has evolved past it — worth a sync edit)
- `project-docs/Approval-Policy.md` + `Engineering-Standards.md` — still authoritative
- `project-docs/Daily-Audit.md` — the 19-question audit; Q3 reframe pending
- `project-docs/session-logs/2026-05-19.md` — today's earlier full audit + commits

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
- Don't invent architecture. Cite the Master Spec or stop and ask.
