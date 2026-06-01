# Moments Engine — Feature Spec

**Status:** Concept agreed with Alex (2026-06-01). Architecture on paper; not yet built.
**Authority:** Rank 4 (Feature Spec). Golden Rules, Master Spec, and the Phase docs override anything here.
**Read with:** `Design-System-Engine-Spec.md` (the design-system floor this builds on), `Page-Architecture-Policy-2026-05-31.md` (per-tenant/functional-surface rules), `Bohdi-Build-Quality-Design.md` (the "it cannot be ordinary" bar), and the mood schema in `lib/moods.ts`.

---

## The one-line goal

Give each storefront a **generated brand introduction — a "moment"** — that meets the customer at the front door, while the functional pages behind it stay the clean, usable documents the layout engine already builds.

The moment is for *feeling* (this brand is real, this maker is serious). The pages behind it are for *doing* (browse, read, buy). They are different jobs and should be built by different machinery.

---

## The core idea: a moment in front, documents behind

A storefront has two layers:

1. **The moment** — an expressive, art-directed, often full-screen introduction to the brand. Cinematic where the mood calls for it: a held image or looping video, a poster composition, headlines that arrive in sequence, type and color used boldly. This is the wow.
2. **The functional pages** — home, shop, about, product detail, cart, contact. Tidy, legible, usable documents. This is what the current layout engine already does well, and it should stay tidy — a product page is a good document, not a chaotic poster.

The moment introduces; then the customer enters the functional site behind it.

## Why this split

- **It scopes the hard, risky expressive power to one surface.** Tilt, motion, layering, full-screen, mixed type — the tools that make something look designed but can also make a mess — live only in the moment, where a bold swing is the entire point. The shop and checkout never inherit that risk.
- **Functional pages stay usable.** Commerce surfaces want clarity, not art-direction. Keeping them as documents is correct, not a limitation.
- **It matches the actual goal.** The first thing a customer should feel is the brand, before they get down to browsing. That is a distinct job worth its own engine.

---

## Generative, not templated (the non-negotiable)

The moment is **generated per niche and mood**, never chosen from a set of canned intros. This mirrors what the design system already does for color: we don't hand Bohdi preset themes, we give him a seed and the math builds a coherent palette fresh every time. The moments engine works the same way — a box of expressive capabilities plus a competence floor, and Bohdi composes the specific moment from the niche and the mood.

Posy Lane Books (a poster, broken grid, tilted cover, staged reveal) and the "candle burning in golden-hour light with headlines fading in" are **two examples of the range, not two targets to reproduce.** If we ever build "Posy mode" and "candle mode," we have built two more templates — the exact thing BohdiAI exists to kill (D31). The job is the generative range, with Posy and the candle moment as two of the thousands of things that can fall out.

---

## The three patterns (selected by mood)

Mood chooses *how* the moment relates to the site. Niche-and-mood then generate the actual look. The pattern is a small structural axis (like light vs dark scheme), not a visual template.

1. **Entry screen** — a distinct full-screen introduction the customer passes through to reach the site. The strongest, most deliberate reveal. Best for bold / magazine moods.
2. **Moment-as-home** — the moment is the full-screen opening of the home page; the customer scrolls down past it into the content. One page. Friendliest to SEO and returning visitors. A good default.
3. **Minimal / none** — a very plain mood may skip a separate moment entirely and simply have a strong hero on an otherwise functional home.

Mood picks the pattern; the maker can later change it (editor, future). The visual content of the moment is always generated, never canned.

---

## First visit, return visits, and replay

- **First arrival at the front door:** the customer gets the moment.
- **Return visits:** we remember they've seen it (a cookie, or browser local storage) and they land straight on the functional home.
- **Replay:** an **"Intro" link in the nav** replays the moment any time. This also gives the moment a permanent home and lets a proud maker show it off.

### The "show once" nuance

"Show once" means slightly different things in the two main patterns, and we should keep them straight:

- **Entry screen:** literal — gate on the first visit, skip it on return, replay from the link.
- **Moment-as-home:** the home page always exists; what we remember is whether the **cinematic reveal plays**. First visit gets the full fade-in / sequence; on return the customer lands on the same page, calm and static. Same "have they seen it" flag, two behaviors.

---

## The front-door guardrail (SEO + deep links)

The moment fires **only on first arrival at the front door (`/`).** Anyone landing deep — a shared product link, `/shop`, a collection — and **every search-engine crawler** always gets the real, server-rendered content, never the gate. This protects shared links and SEO. The functional pages must be fully crawlable and directly reachable regardless of the moment.

---

## What the engine is actually missing (the real build)

The current layout engine can only build **tidy rectangles** — neat sections, everything square to the page, nothing tilted, overlapping, or moving. That is why every store so far comes out a tidy-rectangle document regardless of niche or mood. The moment needs expressive "bricks" the engine does not have. The build is adding them — with a floor so they can't be assembled into a mess:

- **Full-screen hold** — a section that occupies the whole screen as a single moment (the engine has full-height bands; needs to be a first-class "held" surface).
- **Motion / staged reveal** — elements arriving in sequence (the "headlines fade in one after another"). The engine today arranges space, not time; it has no reveal/animation concept beyond a basic ticker. This is the single biggest gap.
- **Tilt** — rotating elements off-axis (Posy tilts the brand, a word in the headline, the cover). No rotation exists today.
- **Real layering / overlap as art** — a large object overlapping copy, a badge/sticker on top, floating chrome over the art. Some layering exists (`overlap`); art-directed layering with scale and offset does not.
- **Richer headlines** — mixing fonts/styles within a single line ("The Fox and the *Lantern*"). Today a text node is one role, one font.
- **Decorative touches** — atmospheric backgrounds (Posy's painterly halos — partially reachable via the texture system), stamps, chips.

**The floor question returns here.** These tools can produce garbage as easily as beauty. The moments engine needs its own competence floor (the equivalent of the design-system validator) — enforcing legibility, contrast, and basic compositional sanity on the *generated moment* — without prescribing shapes, or we are back to templates.

---

## How it relates to what exists

- **Design-system engine** (semantic colors, type scale, surfaces): the moment is painted from the same generated design system. It does not get its own color/type system; it uses the tenant's.
- **Layout engine** (bands/stacks/splits/overlap, the renderer): the functional pages behind the moment are exactly this, unchanged. The moment may reuse primitives plus the new expressive bricks.
- **Page-architecture policy:** the moment is per-tenant and themed. Whether it is "editable" later is a dashboard question; the data model must not preclude it.
- **Mood schema** (`designDirection`): mood already carries temperature/brightness/type-character/scheme and now reaches Bohdi via `read_mood`. The pattern selection (entry / home / minimal) and the moment's intensity should be driven from `designDirection`. Enriching `designDirection` with a moment-direction may be part of this build.
- **Onboarding (Master Spec §5):** the moment is generated at onboarding alongside the rest of the store. It is part of the "watch it build / wow" outcome.

---

## Open decisions (to settle in the build)

- **Is the moment a separate route, an overlay on `/`, or the top section of the home tree?** Drives the SEO/first-paint implementation. Likely: server-render functional home always; the moment is a cookie-gated overlay/section on `/` so crawlers and deep links bypass it.
- **Motion: how far?** Pure CSS entrance/reveal (cheap, safe, no JS) vs scroll-driven vs interactive. Start with staged CSS reveals; decide the rest with evidence.
- **The expressive DSL vs the safe medium.** Adding tilt/motion/layering must stay inside the safe layout language that compiles to React — not eval'd freeform code (the security line we hold). Confirm each new brick expresses cleanly in the DSL.
- **The moment's competence floor** — what it checks, and how Bohdi recovers when it fails (same structured-issues pattern as the design-system validator).
- **How mood selects the pattern** — explicit rule vs Bohdi's judgment from `designDirection`. Keep it "how to think," not "what to choose" (D28).
- **Does the moment reuse the home hero content or is it distinct copy/art?** Relationship between the moment and the home page's own top.
- **Mobile.** A full-screen cinematic moment behaves differently on a phone; mobile is a first-class composition, not an afterthought.

---

## Explicitly not yet / out of scope

- This spec is the concept and the build's shape. It is **not** a green light to generate (no paid onboarding until the engine is real — held with Alex).
- The render-see-revise "eyes loop" (Bohdi judging a picture of his own moment) remains a likely later phase, decided with evidence after the floor exists.
- Editing the moment in the dashboard is a later feature; only the data model needs to allow it now.

---

## Suggested build sequence (for the build session)

1. **Probe the gap with evidence.** Hand-build a moment across a few different niche-and-mood points (e.g. candles-cinematic, kids-books-playful, vintage-editorial, a plain one) in the current engine, pushing until it breaks — to derive the *exact* list of missing bricks from range, not from any one example (Posy).
2. **Add the expressive bricks** to the layout language + renderer, one at a time, TDD: full-screen hold, staged reveal, tilt, art-layering, richer headlines, decorative touches. Keep them in the safe DSL.
3. **Build the moment's competence floor** (validator) on the generated moment — legibility/contrast/sanity, structured issues, no shape prescription.
4. **First-visit + replay plumbing** — cookie/local-storage gate scoped to `/`, the "Intro" nav link, crawler/deep-link bypass.
5. **Mood-driven pattern selection** wired from `designDirection`.
6. **Teach Bohdi** the moment in `set_layout`/system prompt — how to think about a moment per niche+mood, never a template.
7. **Evidence checkpoint** before any paid generation: prove the moment looks designed across several points, then decide the eyes loop.

Tests are part of done. End with `npm run test:coverage` and typecheck.
