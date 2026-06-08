## Session 28 (2026-06-05) — Reviewed the 4 live stores, shipped the archetype/skin-level fixes, brainstormed the deep skin shelf (build next session)

**The arc:** Alex walked the four Session-27 live stores one at a time; Claude kept a running fix list. The locked rule for the whole review: **fix only the underlying archetype or skin, never the individual site, never one-by-one** — the four tenants are stale stored data, so patching them proves nothing. Everything below lands on the NEXT real build. Then the conversation turned to the skin shelf and became a long, productive design brainstorm (no skins built).

### The fixes — shipped, tested, committed on `session-12/layout-engine`

Four commits, 919 tests pass, typecheck + lint clean throughout.

**Workstream 1 — hero correctness (`MomentHero.tsx`, `chrome.tsx`, `schemas.ts`, `builder.tsx`):**
- **Contrast over media.** Text painted over the hero (wordmark, nav, eyebrow, story, brand, outline CTA) now uses a fixed, skin-agnostic `--ms-on-media` near-white plus a stronger center-weighted scrim — NEVER the skin's contrast color. The bug: a skin's "contrast surface" can itself be light (tannery is a light contrast surface → dark text), so on a dark hero video the dark text vanished. That's why Iron & Ash's wordmark/nav disappeared. Now legible by construction regardless of video luminance.
- **Reveal rhythm.** Rewrote the line timeline so each story line fades fully out, the video breathes alone for a beat, then the next fades in — lines never stack (the "super-exposed" double-exposure on Mills). Extracted as a pure, tested `buildStoryTimeline(lineCount)`; humane default timings (OPEN 600 / LINE 2000 / GAP 800 / FADE 0.7s), tunable, ~17s→~12s for 4 lines.
- **Story length + punctuation.** Capped story at 4 lines (was 5). A HARD schema rule rejects punctuation in story lines (periods, commas, dashes, colons, quotes — apostrophes/hyphens OK), plus Bohdi's authoring guidance tightened. Mills' "Flour. Water. Salt. Time." is now invalid.

**Workstream 2 — goods (`GoodsBeat.tsx`, `beats.tsx`, `GoodsProcession.tsx`, `goods.ts`, `schemas.ts`, `builder.tsx`):**
- **Treatment is Bohdi's choice.** Moved goods-treatment selection off catalog size and onto Bohdi (authored `goods.treatment`, optional with a legacy size-based fallback). He picks the body that fits the shop from a described menu; the four are independently swappable so the treatment is a post-edit try-on axis. Reconciliation captured in the day: catalog size still does the ARCHETYPE gate (`fitsCatalog`), it just stops also picking the goods shape inside Main Street. (Alex's reasoning: the home only shows a ~5-item sampling, so all four treatments work at any size — nothing forces the pick — so it's an aesthetic call, which under the no-steering engine is Bohdi's, same as archetype + skin.)
- **Browse-catalog CTA.** The view-all cue WAS rendering, but only as a small top-right link in the heading — it read as missing. Added a prominent `GoodsViewAllCta` button at the END of the sampling.
- **Procession shrunk** (item: "too big"): kept the one-per-row march, narrower container (940), smaller image column (0.9fr/1.1fr), tighter gaps/padding. Sample cap 4→5.
- **Marquee fill:** `fillMarquee` repeats the ~5 recycled photos to a floor so a small catalog never reads sparse (Alex: "as in gallery, it's ok to reuse images" — recycling already gives every product a photo).

**Workstream 3 — hero media (`schemas.ts`, `scene-prompt.ts` NEW, `builder.tsx`):**
- **Structured scene prompt.** `moment.media.prompt` is now a structured object (composition/subject/environment/atmosphere/camera/lighting/style), not a prose string. The seam (`scene-prompt.ts`) serializes it: JSON for video (Kling's fal endpoint takes a text `prompt`, so "JSON input" = a JSON-formatted prompt) with a `loop: seamless` + slow-motion intent injected; prose for a still.
- **Stills as a first-class hero.** The hero job now follows the AUTHORED kind (`kind:image` → a still job; was hardcoded to video). Authoring guidance tells Bohdi a still is equally strong and to prefer it unless real ambient motion adds something, and that a VIDEO subject must be neutral/ambient (steam, flame, dust — no person-action, no lighting flash) so the loop is seamless.
- **(Tint, separate commit)** the hero photo grade now comes from the SKIN's `photoFilter` (via `.archetype-photo`), not a hardcoded sepia filter — mood-driven, and a hardcoded literal removed from the renderer.

**The morning fix list (all DONE except the skins):** hero video should be neutral/seamless-loop; video prompt as structured JSON groups; stills are OK + cinematic mood-graded; warm moods don't express (= the skins, next session); hero nav/text invisible over media; goods all-same-grid; procession too big; missing browse CTA; only-4-images (was the procession cap + Mills' pre-step productCount=4); story too long; fade ghosts; no punctuation in story lines.

### The brainstorm — the deep skin shelf (DESIGN ONLY, build next session)

Design doc: **`docs/superpowers/specs/2026-06-05-skin-shelf-design.md`** (read it first next session). Used the brainstorming + frontend-design skills (Alex called out that I wasn't wearing frontend-design — and it showed). The shape of it:

- **Organize by ~9 maker-WORLDS, not 3 characters** (homey/rugged/delicate is far too coarse for the niche range). Worlds, grounded in the launch queue: **Hearth** (warm food + fiber), **Workshop** (rugged craft), **Fine** (refined/luxe — rename off "Atelier"), **Garden** (botanical), + NEW **Studio** (art-forward), **Mystic** (occult/tarot/crystals — the spec's own "occult ≠ honey-amber"), **Playroom** (stickers/pins/toys), **Press** (screenprint/zines/streetwear), **Relic** (vintage/antique). A world is a loose selection TAG; a new niche classifies in and inherits its skins. `SkinTag.character` → `world`.
- **Go DEEP, not one-per-world.** A skin is a data entry in a structure that already exists; there's no build cost to ration. Target ≈3–4 per world spanning the world's range (light/dark, loud/quiet), ~25–30 total.
- **The differentiation rules (the heart, from a chain of Alex corrections):**
  1. **CHOICES, not statements** — the shelf gives a maker livable looks, not a gallery of art pieces. Bold only where the world earns it (Playroom, Press). **Do NOT be bold for boldness' sake; do NOT retreat to safe-identical either.** Timid-and-same was the failure; tasteful is fine.
  2. **FONT is the primary differentiator; COLOR may overlap.** Two cream skins are fine if one is a fashion didone, one a slab, one a geometric sans — the type carries the identity. (This is exactly why Atelier/Porcelain were twins: similar cream AND similar serif.)
  3. **No cousins** — no two skins read the same; the bar is mostly typographic.
  4. **Spread across type personalities** — humanist serif, didone, slab, geometric sans, characterful grotesque, condensed gothic, rounded, typewriter, hand-cut serif…
  5. **Stop converging on one characterful font** — the Fraunces tic is just a new flavour of safe; each skin gets its own face.
  6. **Plain, evocative names — no jargon** (kill Atelier/Nocturne/Risograph/Celestine; names surface in post-edit try-on).
- **Selection stays Bohdi's pick** (no steering, consistent with the goods-treatment decision). A richer shelf = better matches. The skin data model is unchanged (palette/two surfaces, three voices via `makeType`, atmosphere, tag, font href) — adding skins needs no renderer change; the bones read everything generically. Atmosphere should do more (committed grounds, gentle gradients, grain, grade).
- **Starting sketches (directions, not final):** Orchard (Hearth golden-evening, Hedvig Letters Serif), Nightshade (Mystic occult, Gloock), Gallery (Studio, Syne + Newsreader), Confetti (Playroom, Unbounded), Pressroom (Press riso, Big Shoulders), Heirloom (Relic vintage, Libre Caslon + typewriter). Then fill each world to its range and rework the existing twins.

### Process notes
- **Do NOT use the brainstorming visual companion.** It spiked memory on Alex's machine (the watcher server + Chrome rendering layered gradients/grain/font-imports across several heavy mockup pages). Visual work stays in chat; the real judge is a build. (The "Claude (59 processes / 1.4GB)" Alex saw is mostly Electron's own helpers + the connected MCP servers, not our work — the companion was the avoidable add-on.)
- **MCP bloat:** ~two dozen MCP servers connect at launch, each its own process — trim via the `/mcp` command (the video/media connector, registry, installer, sequential-thinking, preview are unused for these projects).
- Alex's through-line corrections this session, worth carrying: stop being conservative when the task is cheap (skins are data); don't be bold reflexively (choices > statements); font over color for variety; and wear the design skills BEFORE designing, not after being told.

### NEXT SESSION = BUILD THE SKINS
Design the deep shelf in batches (in chat, no companion) — palette + a characterful non-repeating font pairing + atmosphere per skin, holding the no-cousins line — then add them as data to `skins.ts` (+ font hrefs, + `world` tags), update `SKIN_DESCRIPTIONS` so Bohdi's menu reads them, plain-rename the jargon, and JUDGE them on a real onboarding run (the renderer is niche-neutral; a skin is only proven once worn live).

---

