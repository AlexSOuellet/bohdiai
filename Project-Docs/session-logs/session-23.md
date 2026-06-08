## Session 23 (2026-06-03) — Main Street (archetype #2) built off the contract, then judged TOO SAFE; new path locked: the Moment IS the hero

**The goal:** build the second maker-shop archetype so selection becomes real (two archetypes to choose between), per Session 22's "build one, prove it, then grow" plan. We picked the **bread-and-butter "everybody" shop** — the default hero-led maker storefront most tenants land in, exemplified by the **June's Sourdough** sample on bohdiai.com. Named it **Main Street** (Alex's pick; killed the working name "Everyday").

### Process followed (the good part)
Brainstorming skill + visual companion to settle the shape; wrote a design spec (`project-docs/Everyday-Archetype-Spec.md`) and a task-by-task plan (`project-docs/Everyday-Archetype-Plan.md`), both committed; then executed the plan inline.

### Decisions locked
- Main Street is the niche-neutral, hero-led "Safe / everybody" archetype. **Safe ≠ boring** (Alex, repeatedly).
- Variety via TWO dials: **arrangements** (curated complete page compositions — classic / goods-first / story-led — that change the SHAPE; the maker can switch them in the editor, the "try a format" feature) and **themes** (color + type + atmosphere — the skin). A curated fixed set, NOT combinatorial mix-and-match (assembled-but-not-art-directed = slop).
- Every archetype is built FRESH off the contract, never copied from another (carryover = the blur that makes everything look the same). The Gallery's fonts/spacing/motion/footer/product-page had all leaked into the first Main Street draft — that was the bug.
- The intro Moment is CORE to Main Street, not deferred.

### Built (committed, branch `session-12/layout-engine`)
- Contract extended (ADDITIVE) for arrangements: `ArchetypeArrangement`, optional `arrangements` + `defaultArrangement` on `Archetype`, optional `arrangement` prop on `render`. Gallery untouched. (`lib/archetypes/types.ts`)
- `lib/archetypes/main-street/`: `schemas.ts` (niche-neutral, every field capped), `arrangements-meta.ts`, `themes.ts` (4 themes, per-theme type pairings + Google-font hrefs), `shared.tsx` (root w/ fixed navbar + grain + reveal, header, footer, 5 region components + responsive breakpoints), `MainStreet.tsx` (3 arrangements), `MainStreetProduct.tsx`, `index.tsx`. Tests: schemas / themes / index. Typecheck clean, unit tests pass.
- Routes: `app/archetype-test/main-street/{page,product/page}.tsx` + hand-authored fixtures, switchable by `?theme=` & `?arrangement=`. Preview images point at the real `/storefronts/*.webp` bread assets.
- NOT done: the Bohdi harness (`scripts/test-main-street-archetype.ts`) and the two-niche runs (Task 8 / Task 10 of the plan).

### Fixes made during the eyes pass (kept, regardless of the redesign)
- **sticky→FIXED navbar** — the global `html,body{overflow-x:hidden}` in `app/globals.css` silently disables `position:sticky` for every descendant; `position:fixed` is immune. Reserved its height via stage `padding-top`.
- **Mobile breakpoints** — layout moved out of inline styles into CSS classes (`ms-wrap`, `ms-hero`, `ms-featgrid`, `ms-maker-inner`, `ms-footgrid`) with 860px / 560px breakpoints so columns collapse instead of overflowing.
- Framed/matted images; a recessed panel so the framing reads; **distinct per-theme fonts** (killed the Fraunces/DM-Mono carryover from the Gallery); **deeper palettes** (they were near-white); removed a decorative "01" and the cutesy "Bag" cart label.

### THE HONEST VERDICT (Alex, confirmed by a frontend-design self-critique, section by section)
What got built is a tasteful **TEMPLATE** — "everything I've been fighting the past two weeks." Navbar = the most common nav on the web. Hero = canonical headline-left / image-right / button-below with a plain rounded-rectangle image (the "off-axis" was really 50/50). Featured = a **3-column card grid — the exact AI-builder cliché our own D31 bans.** Maker band = decent drama but lifted from the Gallery. Find-us / newsletter / footer = generic defaults. The only two sections with any life (hero serif, dark band) are both borrowed from the Gallery. Fonts: disliked. Colors: muted naturals, "not colors, shades of boring." Motion: none beyond a load fade. Composition: a vertical stack of centered/2-col conventional sections — the stacked-bands reflex.

### ROOT CAUSE (read this before next session)
I regressed. Yesterday's Gallery worked because it started from ONE bold organizing idea — the dense **wall** — that every section served; designed with the frontend-design skill and the visual companion, concept first. Today I committed to a *vibe* ("warm storefront"), built a Gallery-clone of conventional boxes, and then reacted to complaints one at a time — bug-fixing, not designing. I also did NOT use the **frontend-design skill** until Alex called it out mid-session, by which point the work was already safe. With no organizing concept and no motion, even a confident palette dies — note the Gallery's colors were ALSO muted (bone/slate/linen) and they SANG, because composition + scale + atmosphere + density carried them. "Shades of boring" isn't really the hex codes; it's that nothing has nerve for color to ride on.

### THE NEW PATH (start here)
1. **The organizing IDEA for Main Street = the MOMENT IS THE HERO.** Not a separate intro gate (the portable/standalone moment layer comes later) — for THIS design the moment lives COMPLETELY in the hero. Design the hero-as-moment first, then design every other section OUTWARD from it. This is Main Street's equivalent of "the wall."
2. Bring real conviction on the three things that failed: **committed color** (not muted naturals), **a typeface with genuine character** (current picks — Young Serif / Hanken / Bitter / Bricolage — are rejected), and **real motion** (the hero-moment is cinematic; reveals/interactions with life), plus **atmosphere / depth**.
3. **Process:** bold-concept-FIRST — find the idea, commit, build OUT from it. NOT reactive patching. Use the brainstorming / visual-companion + frontend-design skills from the START.
4. KEEP the structural scaffolding (contract + the arrangements concept, the capped niche-neutral schema, routes, the harness pattern, the no-hardcode discipline). The visual layer (themes' fonts/colors, composition, motion) gets REDESIGNED from the hero-moment idea.
5. THEN: write/run the Bohdi harness on two niches (Task 8/10), then engine integration — selection is now real with two archetypes.

### Open thread surfaced, not resolved
Mood coverage: the lineup is 7 (DARK, COZY, RUSTIC, BOTANICAL, SUNSET, SIMPLE, MODERN) but Main Street only mapped 4 themes. **A baker who picks DARK has no home, and the renderer currently assumes a LIGHT background** (the "dark maker band" is the flip of fg, shadows are black, grain uses multiply, the recessed panel mixes light→dark). Making the renderer palette-direction-agnostic (works light OR dark) is the right robustness fix and a dark theme is the forcing function. Reconcile full mood→theme/archetype coverage during engine integration.

### Guardrail added
A hook so future sessions always invoke the frontend-design + superpowers skills for design work (today's failure was not using them).

Branch: `session-12/layout-engine`. Committed and pushed.

---

