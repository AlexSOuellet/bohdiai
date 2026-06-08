## Session 24 (2026-06-03) — the SHAPE+SKIN reframe; Main Street as a moment-as-hero SALES PAGE; validated by mockup; spec written. NO CODE.

**This was a design + spec session. Nothing was built into the engine.** We worked the architecture from a much higher level than Session 23, validated a target with a real show-and-react mockup, and wrote it all down so next-session-me starts at the build. Full design: `Project-Docs/Main-Street-Archetype-Spec.md` (committed). Process: brainstorming skill + the show-and-react loop (built a hand mockup, Alex reacted, refined).

### The reframe (the load-bearing turn)
An archetype is secretly **two layers** we'd welded together last session: the **SHAPE** (bones — composition, type scale, spacing, **all motion**; built once; Bohdi can't touch) and the **SKIN** (clothes — color, a type SYSTEM, grain, photo grade). Last session bolted four fixed skins into each archetype → that's the genericness trap (two shops share a shape AND the same four skins → cousins). Fix: **few shapes, many skins.** The shape **never names a color or font**; it reads everything from whatever skin it's handed. This brings back Alex's original niche-sheets + mood-sheets — **as skins only, never coupled to Bohdi composing** (composition is the thing he breaks).

### The skin system
- **Shared curated shelf** outside all shapes (defined once → no duplication, and try-on works). **Curated many-to-many** access — each skin is cleared for the shapes it's been eyeballed on; **free mix-and-match is banned** (that's how slop ships). 
- **Every skin is a tux**, never a t-shirt — committed color, a 3-voice type system (display + body + a mono/condensed/italic voice; **a single font is no fabric**), atmosphere. If it can't make a plain shape look sharp it doesn't earn a shelf spot.
- **Two surfaces per skin** (base + contrast, each with its own readable text) → the bones ask for "the other surface" without knowing direction, so the SAME Main Street renders **dark or light**. This is the fix for Session 23's "dark baker has no home."
- **What's in a skin:** bg, text-on-bg, muted text, contrast bg + its text, accent (where brand color enters), rule, display font, body font, (usually) a third type voice, grain, photo grade. **NOT in a skin:** layout, type SIZES, spacing, motion (those are bones).

### Selection + niches
- **Shape** by niche+mood+catalog-size. **Skin** by mood, refined by niche (mood wins on conflict, *within* what niche permits). Brand color nudges the accent.
- Skins are tagged by niche **character** (rugged/delicate/homey/clean…), not per-niche (~260 niches). A **character × mood grid** must have ≥1 skin per cell (ideally several) so no maker is stranded. **New niche → classify into a character, inherit a full ROW, zero design.** **New character → build a whole ROW across moods (NOT one skin — one strands every mood but one).** Rare; done once; all that character's niches then ride it.
- Consequence: niche files + the niche-writer skill change — the bespoke style-sheet half goes away, replaced by a small classification (character, catalog size, mood lean); the voice/fields half stays.

### Main Street specifically = a SALES PAGE
Not a kitchen-sink stack. Home is a **sales page** (paced pitch); product grid / about / where-we-are become **their own pages** (multi-page archetype), teased + linked from the sales page. The validated **four beats** (each full-width, its own space, no two the same shape, surfaces alternating dark/light from the skin's two panels):
1. **THE MOMENT IS THE HERO** — full-screen held video + brand story cross-fading one line at a time (~3.4s hold, ~1.8s linear fade), landing on brand + CTA = the resting hero. **Plays on load, you scroll past it** (no first-visit/replay plumbing). It is **not** a separate gate or portable layer — it IS Main Street's hero (supersedes the Session-22 portable-moment idea; each archetype owns its hero: Gallery=wall, Main Street=moment). Validated with the **june-sourdough** moment, **dressed in the page's skin** (not the probe's Fraunces).
2. **GOODS IN MOTION** — a slow edge-to-edge marquee of catalog rows (NOT a card grid, the banned tell).
3. **FOUNDER + a real "find us this week" CALENDAR** — story as "come meet me here." (Reflex watch: this is the dark portrait-band Bohdi/Gallery/last-session keep defaulting to — keep its treatment fresh.)
4. **CLOSE** — big-type sales sign-off + order/pickup CTA.

### Motion
An **event, not a state** — the hero performs (the sustained moment); every section below earns one real entrance that **arrives and resolves to stillness** (a resolved section is shoppable). **Balance: too much is as bad as too little.** Lives in the bones, shared, timing global, slow + linear. **Niche does not command motion** — it may pick which proven moment-pattern; mood gives one small pacing nudge. (Dropped the reduced-motion hedging — accessibility detail, not a design constraint; Alex never had it on.)

### Reproducibility — answered honestly
Design reproduces **by construction**; **content** is the variable. Fixed bones (composition+motion) / **selected** skin (off the shelf by mood) / **Bohdi-authored** copy (story lines, eyebrow, brand, CTA, founder quote — proven in the live candles run) / **Bohdi-PROMPTED** hero video (he writes the prompt, fal/Kling generates — proven; the bread video was made this way) / **catalog DB rows** poured into containers (Session 22) / images from stock + generation + maker swaps. The required guard, still **unbuilt**: **EYES on the rendered result** — the hero video is a dice roll Bohdi can't see; a muddy generation sinks the hero and nothing catches it. That's the difference between "usually great" and "reliably great." Alex's reaction to the mockup: "night and day from last session… if this is our BORING page, we're going to be rich."

### THE PARAMOUNT BUILD RULE (pinned in the spec, made checkable)
**Nothing niche-specific, nothing hardcoded** — this is how one tenant's build silently breaks every other niche (Claude has broken it before). Renderer owns **structure only** (no literal color/font/size/weight/transform/copy); schema + field names **niche-neutral** (no `bakerNote`-style leaks); every bakery thing in the mockup is **per-tenant DATA, not chrome**; the starter skin is **data on the shelf, not constants** (renderer must handle a dark industrial or pastel skin with ZERO code change); **grep self-check** (hex/font/px/uppercase/niche words) before claiming done — fix in the archetype, not the test page.

### Honest status of the mockup
`public/main-street-mockup.html` (served at `/main-street-mockup.html` by the Next dev server) is a **hand-built, hardcoded PAINTING** that touches **none** of `lib/archetypes/main-street`. Only the moment's *content* (4 story lines + `public/bread-kling.mp4`) was pulled from `app/moment-probe/june-sourdough`. It's the **target, not output.** Starter **skin #1** values are in the spec §10. (The brainstorm companion server serves HTML only and 404s on the video — that's why asset-bearing mockups go in `public/`.)

### Shipped this session (committed, branch `session-12/layout-engine`)
- `Project-Docs/Main-Street-Archetype-Spec.md` — the full design spec (the deliverable).
- `public/main-street-mockup.html` — the validated target mockup (throwaway reference).
- `scripts/shot.mjs` — Playwright screenshot helper (scrolls a URL, captures each screen) so previews are reliable; **the recurring "preview won't work" fumble is fixed** (the preview MCP kept dying; this script + the dev server on `/public` is the reliable path).

### Next session — START HERE (build, don't redesign)
1. **Bones:** Main Street renderer = the four-beat sales page reading 100% from a skin (no hardcoded color/font), light/dark-agnostic via two surfaces, motion baked in.
2. **Hero:** wire the real **Story primitive** (`components/storefront/layout/primitives/Story.tsx` + `Stage.tsx`) as Beat 1 — held media + cross-fade story + brand landing, reading fonts/colors from the skin. (Don't hand-roll JS like the mockup did.)
3. **Skin #1** on the shelf in the new skin shape (two surfaces + 3-voice type system + atmosphere) — starter values in spec §10.
4. **Capped niche-neutral content schema** for the slots; catalog from `ProductView` rows.
5. **Harness run** — brief Bohdi for two niches, have him author the story + the hero video prompt, generate, render, **PROVE it reproduces.**
6. Then: engine integration (selection, deterministic mood→skin), the **eyes/critic loop**, the skin shelf + character×mood coverage, image picker/stock pipeline, multi-page set folded into the contract.
**KEEP:** the contract + arrangements (`lib/archetypes/types.ts`), the capped-schema pattern, the harness pattern (`scripts/test-*-archetype.ts`), routes, `lib/archetypes/content.ts`, the no-hardcode discipline. **REDESIGN:** the visual layer (themes→skins, composition, motion) — the current Main Street themes (muted palettes + Young Serif/Hanken/Bitter/Bricolage) are rejected.

---

