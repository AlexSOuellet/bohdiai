# Main Street — the first real skin shelf (design)

**Status:** Design approved in brainstorming (Session 27, 2026-06-04). Not built.
**Branch:** `session-12/layout-engine`
**Scope:** Build the first multi-skin shelf for the Main Street archetype — seven skins
across three characters — so two different niches render as two different worlds
through the same bones with zero renderer change. This is the shelf half of the
Session-25 "real test." Selection and asset generation are **separate later passes**
and are explicitly out of scope here (see §6).

> Read alongside `Project-Docs/Main-Street-Archetype-Spec.md` (the shape/skin model)
> and the Session 24–26 blocks of `SESSION-BRIEF.md`. This doc is the concrete
> shelf that spec described in the abstract.

---

## 1. What we're building, in one paragraph

The Main Street renderer already reads everything visual from a single skin object
and hardcodes no color or font (the no-hardcode rule). Today the shelf holds exactly
one skin (`main-street-ember`). This work adds **six more skins** so the shelf spans
three niche *characters* — homey, rugged, delicate — and lets the same page look like
a bakery, a butcher, or a jeweler depending only on which skin it wears. To make the
new skins read like their mockups rather than generic fallbacks, each skin also
declares its own **font weights** (and, for two skins, an uppercase display). Each
skin carries a tiny **tag** — one character bucket plus a couple of moods — that a
future selection step will read. No selection logic, no generation, and no
niche-level data are built here.

---

## 2. The shelf — seven skins

Ember already exists and is unchanged. The other six are new. Every skin provides
**both surfaces** (base + contrast), so the renderer's alternating dark/light bands
work regardless of whether the skin is light-on-dark or dark-on-light.

### Character: homey

**Ember** (existing — `main-street-ember`, no change)
- Tags: character `homey`, moods `cozy`, `rustic`, `warm`
- base `#F4EAD7` / ink `#2B1A12` / muted `#7A6249` · accent `#C8431B` on `#FFFFFF` · rule `rgba(43,26,18,.16)`
- contrast `#1C120B` / `#F4EAD7` / `rgba(244,234,215,.66)`
- type: Instrument Serif (display, 400) · Inter (body, 400) · IBM Plex Mono (label, 500)
- photo grade `saturate(1.02) contrast(1.04) sepia(.06)`

### Character: rugged

**Tannery** (`main-street-tannery`) — warm leather
- Tags: character `rugged`, moods `warm`, `handmade`
- base `#1A1410` / `#E9DCC4` / `rgba(233,220,196,.62)` · accent `#C2873B` on `#1A1410` · rule `rgba(233,220,196,.16)`
- contrast `#DED0B6` / `#1A1410` / `rgba(26,20,16,.62)`
- type: **Bitter (display, 800)** · Inter (body, 400) · **Space Mono (label, 700)**
- photo grade `saturate(1.04) contrast(1.06) sepia(.08) brightness(.98)`

**Forge** (`main-street-forge`) — cold industrial
- Tags: character `rugged`, moods `cool`, `industrial`, `modern`
- base `#14171A` / `#DDE2E5` / `rgba(221,226,229,.58)` · accent `#D9A21B` on `#14171A` · rule `rgba(221,226,229,.14)`
- contrast `#E3E0D8` / `#14171A` / `rgba(20,23,26,.60)`
- type: **Oswald (display, 600, UPPERCASE)** · Archivo (body, 400) · JetBrains Mono (label, 500)
- photo grade `saturate(.9) contrast(1.06)`

**Anvil** (`main-street-anvil`) — butcher-sign monochrome
- Tags: character `rugged`, moods `bold`, `plain`, `loud`
- base `#0F0F10` / `#EDEDEA` / `rgba(237,237,234,.56)` · accent `#D63D2E` on `#FFFFFF` · rule `rgba(237,237,234,.14)`
- contrast `#EDEDEA` / `#0F0F10` / `rgba(15,15,16,.60)`
- type: **Archivo Black (display, 400, UPPERCASE)** · Inter (body, 400) · Space Mono (label, 500)
- photo grade `contrast(1.1) saturate(.96)`

### Character: delicate

**Porcelain** (`main-street-porcelain`) — romantic studio
- Tags: character `delicate`, moods `romantic`, `quiet`, `fine`
- base `#F6F2EE` / `#2C2429` / `rgba(44,36,41,.55)` · accent `#B98A86` on `#FFFFFF` · rule `rgba(44,36,41,.12)`
- contrast `#2E2230` / `#EFE6EA` / `rgba(239,230,234,.60)`
- type: **Cormorant Garamond (display, 500)** · Jost (body, 400) · Jost (label, 500, uppercase)
- photo grade `saturate(.96) brightness(1.03) contrast(.98)`

**Botanical** (`main-street-botanical`) — earthy, seasonal
- Tags: character `delicate`, moods `earthy`, `natural`, `seasonal`
- base `#F3EFE4` / `#2A2E22` / `rgba(42,46,34,.55)` · accent `#6F7B4E` on `#F3EFE4` · rule `rgba(42,46,34,.12)`
- contrast `#20342A` / `#E4ECDF` / `rgba(228,236,223,.62)`
- type: **Fraunces (display, 600, optical)** · Hanken Grotesk (body, 400) · Space Mono (label, 400)
- photo grade `saturate(1.03) contrast(1.02) sepia(.03)`

**Atelier** (`main-street-atelier`) — clean luxury
- Tags: character `delicate`, moods `sharp`, `luxury`, `modern`
- base `#FAF8F5` / `#14110E` / `rgba(20,17,14,.50)` · accent `#A8854C` on `#FAF8F5` · rule `rgba(20,17,14,.10)`
- contrast `#14110E` / `#F1ECE4` / `rgba(241,236,228,.60)`
- type: **Bodoni Moda (display, 500, optical)** · Inter (body, 400) · Inter (label, 500, uppercase)
- photo grade `contrast(1.04) saturate(.98) brightness(1.01)`

---

## 3. The one code change: per-skin font weights (and display case)

`TypeRole` already carries `weight`, `uppercase`, and `italic` — **no shared-contract
change is needed.** The limitation is local: `makeType(display, body, mono)` in
`lib/archetypes/main-street/skins.ts` hardcodes the weights it stamps onto every role
(display 400, mono 500). That was fine for one serif skin and wrong for seven faces
that range from a hairline Cormorant to a heavy Archivo Black.

**Change:** `makeType` takes each voice's weight as input, plus an optional flag to set
the display roles uppercase. Concretely, each voice becomes `{ family, weight }`, and
the display voice may carry `uppercase: true`. The 17-role scale (sizes, line-heights,
letter-spacing) is unchanged — those are bones and stay shared across all skins. Only
*which face, how heavy, and (for two skins) whether the big type is uppercased* varies.

- Forge and Anvil set the display uppercase (Oswald and Archivo Black read as
  industrial/butcher signage in caps).
- The label/third voice is not always a monospace anymore: Porcelain and Atelier use a
  letterspaced **sans** in caps as the label voice. `makeType`'s third-voice slot must
  accept any family + weight, not assume a monospace.
- Fraunces and Bodoni Moda are variable optical fonts. Load their `opsz` axis in the
  font href and rely on `font-optical-sizing: auto` (browser default) so large display
  sizes get the display cut. No per-role opsz plumbing required.

Each skin also needs its own Google Fonts `<link>` href in `MAIN_STREET_FONT_HREFS`,
keyed by skin key, requesting exactly the families/weights/axes that skin uses.

---

## 4. Skin tags — character + moods, never niches

Each skin carries a small tag: one **character** bucket (`homey` | `rugged` |
`delicate`) and a short list of **moods**. That is the entire tag. A skin never lists
niches. The niche→character mapping lives with the niches (a future, separate concern),
so adding niche number 261 means tagging that *niche* "rugged" once — every rugged skin
becomes available to it automatically, and no skin on the shelf changes. This keeps the
skin side from ever growing congested no matter how many niches accrue.

**Placement:** tags are additive metadata local to the Main Street module — a sibling
record (e.g. `MAIN_STREET_SKIN_TAGS: Record<skinKey, { character: string; moods: string[] }>`)
beside the skins, **not** a new field on the shared `ArchetypeTheme` (the shared
contract stays clean until selection is actually built and we know its real shape).
Nothing reads these tags yet; they exist so the selection pass has them ready.

---

## 5. How we prove it works

The whole point is that the renderer is untouched and still produces seven different
worlds. Verification:

1. **No-hardcode grep stays empty** — after adding the skins, the renderer still
   contains no hex, no `font-family`, no px size, no `uppercase`, no niche word. Any
   appearance is a violation to fix in the archetype, not the test page.
2. **Render every skin on the existing test route** — the Main Street test route can
   select a skin (today `?skin=` / `skinKey`); confirm all seven render with the same
   fixture content and no code change, each reading as its own world, dark and light
   surfaces correct in every one.
3. **Unit tests** — each skin validates as a well-formed `ArchetypeTheme` (both
   surfaces present, every required type role present, accent + onAccent present); the
   `makeType` change is covered (a heavy display skin and a hairline display skin
   produce the expected weights; an uppercase-display skin sets the flag). Keep within
   the project's existing coverage gate.
4. **Eyes** — screenshots of the same page across the seven skins (via `scripts/shot.mjs`),
   confirming the mockups reproduce on real bones. Eyes are for our verification; the
   automated critic loop is still a later pass.

---

## 6. Explicitly out of scope (later passes, per the session brief)

- **Selection** — niche + mood + character → skin (deterministic). Not built; the tags
  exist to feed it later.
- **Asset generation** — Bohdi's hero prompt → fal/Kling video; product/portrait images.
  The skins ship with placeholder/fixture media as today.
- **Niche → character classification data** on the ~260 niche files and the
  niche-writer skill change.
- **The eyes/critic loop** (automated).
- **Sub-page designs** (shop/about/events are still stubs).
- **Onboarding catalog-size question.**

These are real and sequenced after the shelf; folding them in here would be the
scope-creep the brief warns against.

---

## 7. Risks / things to watch during the build

- **Display sizes were tuned for Instrument Serif.** The shared scale uses `brand` at
  124px etc. A heavy face (Archivo Black) or a hairline face (Cormorant) at those exact
  sizes may want a small per-skin nudge to letter-spacing or line-height. Prefer leaving
  the scale alone (it's bones); if a face genuinely breaks geometry, note it rather than
  silently forking the scale.
- **Contrast/readability.** Every base/contrast pair must clear AA at body size — the
  `ColorPair` contract promises it. Check the muted tones especially (they're the
  easiest to push too faint), on both surfaces, for all seven.
- **Mockup vs. engine.** The mockups in `.superpowers/brainstorm/` are hand-painted
  reference, not output. The build's job is to make the engine reproduce them; "looks
  like the painting on real bones" is the bar.
```
