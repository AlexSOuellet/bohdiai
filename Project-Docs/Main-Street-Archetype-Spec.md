# Main Street Archetype — Design Spec (the redesign)

**Status:** Design validated by show-and-react mockup. NOT built. This is the target and the model.
**Date:** 2026-06-03 (Session 24)
**Supersedes:** the visual layer of `Everyday-Archetype-Spec.md` (the rejected first Main Street). The structural scaffolding from that work is kept (see "What we keep" below); the visual layer is redesigned from scratch here.
**Branch:** `session-12/layout-engine`

> Read this with the Session 23 + 24 blocks of `SESSION-BRIEF.md`. Last session's Main Street was killed as "tasteful template." This session reframed *why*, validated a new target with a real mockup, and worked out the system that makes it reproducible.

---

## 0. The one-paragraph version

A storefront is **bones + a skin**. The bones (the **shape** / archetype) own composition, type scale, spacing, and motion — Bohdi can never touch them. The skin (the **clothes**) owns color, the fonts, grain, and photo treatment — picked off a shared shelf, never authored. We keep **few shapes, many skins**. Main Street is the everyday, hero-led "everybody" shape — an honest *conventional* shape that beats boring not by radical composition but by being **dressed in a striking tux** (committed color, a characterful type *system*, atmosphere, real motion). Main Street's home is a **sales page** whose hero **is the Moment** (the cinematic, motion-led intro), with goods/about/where-we-are broken out into their own pages. The validated mockup proves the floor; the build's job is to make the *system* output it, not hand-draw it.

---

## THE PARAMOUNT BUILD RULE — nothing niche-specific, nothing hardcoded

**The single most important constraint of the whole build.** Violating it is how one tenant's build silently breaks every *other* niche. Claude has broken this before (hardcoded values claimed as compliant — Session 20; bakery field names leaking into a "niche-neutral" schema — Session 21). Treat it as inviolable and **checkable**.

- **The renderer (bones) owns STRUCTURE ONLY.** No literal color, font-family, size, weight, letter-spacing, text-transform, or copy in any component. Every color is the **skin** or a derivation of it (color-mix / inversion); every type value is a **named role** from the skin's type system; grain and photo grade are **skin-owned**.
- **The schema and field names are niche-neutral.** No bakery — or any-niche — vocabulary anywhere: not in field names, labels, defaults, or comments. The Session 21 contamination (`bakerNote`, `aroundTheOven`, a hardcoded "This week's bake" header) is the exact failure to avoid. Use generic slots: `hero.story[]`, `hero.brand`, `hero.cta`, `featured.eyebrow`, `founder.quote`, `findUs.rows[]`, `close.cta`, etc.
- **Everything bakery in the mockup is CONTENT, not chrome.** "June's Sourdough", the four bread lines, "This week's bake", "Find us this week", "Come say hello", the markets, the products, the bread video and photos — **all authored or supplied per tenant**, none baked into the archetype. A leatherworker fills the same slots with different words and the page must read as a leatherworker.
- **The starter skin is data, not the renderer.** Ember/espresso/cream + Instrument Serif / Inter / IBM Plex Mono are **skin #1's values**, living in a skin object on the shelf — never constants in a component. The renderer must render a dark industrial skin or a delicate pastel skin with **zero code change** (the two-surface, direction-agnostic requirement, §2).
- **Self-check before claiming done:** grep the renderer for hex codes, `font-family`, px sizes, `uppercase`, and any niche word. If any appear outside the skin/schema, it is a violation — fix it in the **archetype**, not the test page. ("Did you fix the page or the archetype?")

---

## 1. The core reframe: SHAPE vs SKIN

Last session's mistake was welding four fixed skins into each archetype and calling the bundle "the archetype." That is the genericness trap: two shops share a shape (fine) **and** the same four skins (not fine — they read as cousins).

Split the two layers:

- **Shape (the archetype / the bones):** composition, where the hero sits, the section order, type *scale* (sizes/roles), spacing, and **all motion**. Built once by us, with taste. Bohdi cannot author or break it. The shape **never names a color or a font** — it reads everything from whatever skin it's handed.
- **Skin (the clothes):** one small, complete, hand-curated package of color + fonts + atmosphere. Swap the skin, the same bones wear it.

**Few shapes, many skins.** The number of *shapes* a maker storefront needs is small (hero-led "Main Street", image-dense "Gallery", maybe a publication, maybe one or two more). The variety shortage is in *skins*, not shapes. Adding archetypes to chase niche variety multiplies the wrong axis.

This is the niche style-sheets + mood style-sheets Alex originally designed, **brought back as skins only** — never coupled to Bohdi composing (composition is the exact thing he breaks).

---

## 2. What is IN a skin

A skin is small enough to write on an index card:

1. main background color
2. text color guaranteed readable on it
3. quieter/muted text color
4. **second (contrast) background color** for the one standout band, with its own readable text color
5. one accent color (buttons, highlights, the brand pop) — also where a maker's brand color enters
6. a line/rule color
7. a **display** font (big headlines)
8. a **body** font (reading text)
9. *(fabric requirement, see §3)* usually a **third type voice** (mono / condensed / italic) for eyebrows, labels, prices
10. a paper grain (faint texture)
11. a photo treatment (tint/grade so product photos harmonize)

**Two surfaces (the light/dark-agnostic fix).** Each skin carries a *base* surface and a *contrast* surface, each with its own readable text. The bones say "the maker band uses the contrast surface" without caring whether contrast is darker or lighter than base. A light skin's contrast is near-black; a dark skin's is a lifted charcoal. **This is what lets the same Main Street render dark or light** — and fixes the Session 23 "dark baker has no home" hole. Every skin must provide both surfaces.

**NOT in a skin:** layout, type *sizes*, spacing, motion. Those are the bones and stay constant no matter the skin.

---

## 3. Fonts are fabric (a skin needs a type *system*, not one font)

A single font is no fabric to tailor with. To dress a stacked page so each section feels alive, the type must give real contrast: a display face with character set huge, a clean body to read, and usually a third voice for the small work (mono/condensed/italic). Big-vs-small, heavy-vs-light, roman-vs-italic — **that contrast is the fabric**. Guardrail: this is a *curated* set with built-in contrast, never a pile of random fonts (the slop trap from the other direction). The richness is part of what makes a skin a **tux** instead of a **t-shirt**.

---

## 4. Boring is a shape+clothes problem, not a color problem

"Shades of boring" last session was never really the hex codes — the Gallery's palette was also muted and it *sang*, because composition + scale + atmosphere carried it. Two truths held together:

- A **dead shape** can't be saved by clothes.
- The **same shape** in a tailored tux vs an off-the-rack t-shirt is night and day (Alex: "I look much better in a tux than a t-shirt and jeans").

The Gallery won on **shape** (the bold "wall" idea). **Main Street is the normal body on purpose** — an honest conventional stacked page. It therefore wins the *other* way: by being **dressed in a genuinely striking tux**. Committed color (not muted naturals), a characterful type system, atmosphere, and real motion. Last session failed because it put an everyday shape in everyday clothes.

**Shelf bar:** every skin on the shelf must be a tux. No safe/inoffensive/off-the-rack skins — those are the t-shirt and they are what made last session boring. If a skin isn't striking enough to make a plain shape look sharp, it doesn't earn a place.

---

## 5. Selection — how a store gets its shape and skin

- **Shape** is selected by **niche + mood + catalog size** (few-product niches must not get the dense Gallery, etc.).
- **Skin** is selected by **mood**, refined by **niche**. **Mood wins on conflict** (Alex's original rule) — but only *within the set the niche permits*.
- A maker's **brand color** nudges the accent (never the bg/text contrast pair).

### ⚠️ TO BUILD — onboarding must capture catalog size (locked Session 26)
Catalog size is a load-bearing selection input (it picks the archetype *and*, within Main Street, the goods-beat treatment), but **at onboarding we don't know it** — the maker hasn't entered products yet. **Decision: onboarding asks the maker, directly, for an approximate catalog size** (how many products they sell or hope to sell). A maker ready to build a storefront knows whether it's six things or sixty; approximate is enough because selection only needs the *tier*, not the exact count. The niche can pre-fill a sensible default (candles lean small, vintage resale leans big) so it's often a confirm, not a question. This is **not** the maker choosing a layout (which they never do) — it's a fact about their business that the system then acts on. The plumbing is ready: `selectGoodsTreatment(count, mood)` already takes the count; the missing piece is the onboarding question + threading the answer into selection. Build this in the **selection-wiring / engine-integration** step, not in the archetype itself.

### Goods-beat treatment (built Session 26)
Within Main Street, the **goods beat has four motion-bearing bodies**, system-selected from catalog size (mood breaks the small-catalog tie) so two Main Street shops don't share one shape — and the home page shows only a **sampling** (Main Street is a sales page, not a catalog), with a "see the full catalog" cue pointing at the Products page:

| Treatment | Catalog tier | Motion |
| --- | --- | --- |
| **Marquee** | deep (≈12+) | continuous horizontal drift |
| **Procession** | mid (≈6–11) | full-width rows settling out of a slow scroll-zoom |
| **Switcher** | small, crisp moods | one image + a list; pointing a row cross-fades it |
| **Slideshow** | small, cinematic moods | auto-advancing cross-fade + Ken Burns drift |

Sampling caps are per-treatment (marquee ~10 since it loops; procession ~4 since it's full rows); **selection still runs off the true catalog size**, so a 40-item shop gets the marquee even though home shows ten. The "see the full catalog" cue is a Bohdi-authorable label (`goods.viewAllLabel`) with a neutral fallback. The dedicated **Products / full-catalog page is still its own design** (current implementation is a placeholder stub).

### Skins fit niche *characters*, not all niches
Some skins are flat wrong for some niches (a butcher in floral pastels). A skin is tagged with two things: the **moods** it expresses and the **niches it flatters**. To not drown in per-niche tagging across ~260 niches, tag by **niche character** (rugged / delicate / homey / clean / …). Niches are sorted into a handful of characters; skins are tagged to characters; a niche inherits its character's skins.

### The character × mood grid (why a niche is never one skin)
A niche maps to its character's whole *set* of skins, spread across moods. **Mood is the lever** that picks which one a given maker gets — that's what stops two same-niche shops from being twins. Requirement on the shelf: **for every character, skins covering every mood** (so a cozy / dark / modern baker all find something), ideally more than one per cell.

- **New niche →** classify into a character; it inherits a full row of skins. **Zero design work** in the common case.
- **New character (nothing on the shelf resembles it) →** build a **whole row** of skins across the moods, **not one** (one would strand every mood but one). Rare; done once; every niche of that character then rides on it.

### Skin access is curated many-to-many (not free-for-all)
A skin lives on one shared shelf (defined once → no duplication, and **try-on** works: a maker keeps their skin across shapes). But it is **not** "any skin on any shape." Each skin is **cleared for the shapes it's been checked on**, by us, with eyes on it. Most skins will fit most shapes (the bones read color/type generically), so curation is mostly *excluding the rare bad pairing*, not blessing every combo. Free mix-and-match is banned — it gives up the one promise (never ship an ugly store).

---

## 6. Main Street IS a sales page

The home page is a **sales page** — a persuasive paced pitch, **not** a kitchen-sink stack of product grid + about band + where-we-are. Those become their **own pages**; the sales page may *tease/describe* them and link out, but the full thing lives in its own space. (Main Street is therefore a **multi-page** archetype: sales home + shop/catalog + about + find-us/contact.)

### The validated composition — four beats
Each beat is **full-width, its own space, no two beats the same shape**. Surfaces alternate using the skin's two panels (dark / light / dark / light).

1. **THE MOMENT IS THE HERO.** Full-screen **held video** + the brand story told **one line at a time, cross-fading** (slow: ~3.4s hold per line, ~1.8s linear fade), landing on the **brand + CTA** — and that landing *is* the resting hero. The moment is **not** a separate intro gate and **not** a portable standalone layer; it simply **is** Main Street's hero region. It **plays on load and is scrollable past** — no first-visit / replay plumbing to build (a returning visitor just scrolls into the shop). The moment **wears the page's skin** — its fonts and colors come from the skin, *nothing typographic or color is hardcoded in the brick* (the standing no-hardcode rule). Validated with the **june-sourdough** moment (steaming-bread video, four bread lines).
   - *Supersedes the older Session-22 "portable moment layer" idea: each archetype expresses its own hero natively instead of a moment being bolted across all of them. "Moment as hero" is a property of the **Main Street shape** — e.g. the Gallery's hero is the wall, not a moment.*
2. **GOODS IN MOTION.** Not a card grid (the banned AI-builder tell). A slow, edge-to-edge **marquee/carousel** of catalog rows, hover-to-pause. Each card: photo + price chip + name + one line.
3. **FOUNDER + CALENDAR.** The maker's voice/face beside a real **"find us this week"** schedule (markets/appointments). Story as "come meet me here," not fluff. *(Watch the reflex: this is the dark portrait-band Bohdi/the Gallery/last-session keep defaulting to — make sure its treatment is fresh, not a Gallery lift.)*
4. **CLOSE.** A big-type sales sign-off + an order/pickup CTA.

---

## 7. Motion

- Motion is an **event, not a state.** The hero **performs** (the sustained, cinematic moment). Below it, each section earns **one real entrance that arrives and resolves to stillness** — because a resolved section is a place someone is reading a price and clicking. Nothing loops forever; nothing drifts in the corner.
- **Balance:** too much is as bad as too little. Bold where it performs (the hero), present-but-out-of-the-way everywhere else. (Reference bar: godly.website-grade *entrances*, minus the perpetual ambient motion.)
- Motion lives in the **bones**, shared, taste baked in. **Timing is a global setting, not a per-build tweak.** Motion must be **slow and linear** (eased opacity reads as a pop).
- **Niche does NOT command motion.** It may select **which proven moment-pattern** the hero uses (e.g. object-rising-in-dark for a jeweler vs warm-story for a farm stand). Mood gets one small **pacing** nudge (rustic slower/heavier, modern tighter). Nobody authors new movement per shop.
- (Drop the reduced-motion hedging in conversation — it's an accessibility detail handled later, not a design constraint.)

---

## 8. Reproducibility — who produces each piece

This is the whole game. The design reproduces by construction; **content** is the variable.

| Piece | Produced by | Proven? |
|---|---|---|
| Composition, section order, type scale, spacing | **Bones** (built once, Bohdi can't touch) | n/a — fixed |
| All motion (cross-fade sequencer, marquee, reveals) | **Bones** | n/a — fixed |
| Colors + fonts + grain + photo grade | **Skin**, selected off the shelf by mood | selection, not authoring |
| Moment story lines, eyebrow, brand, CTA, founder quote | **Bohdi authors** (copy = his home turf) | ✅ live candles run (Session 20) |
| Hero **video** | **Bohdi writes a PROMPT** → fal/Kling generates | ✅ candle-flame + bread videos generated this way |
| Products / descriptions / prices | **DB rows** (`listings` + variations) poured into containers — archetype never authors catalog | ✅ decided Session 22 |
| Product / atmosphere images | stock (Unsplash) at onboarding + generated hero/atmosphere + maker swaps real photos | image strategy |

### Required guard — EYES on the result
The hero video is a dice roll Bohdi **cannot see**; a muddy/wrong generation sinks the whole hero and nothing catches it today. A **separate critic agent** (not Bohdi self-reviewing) must look at the rendered result + the generated media and catch bad media / wrong-for-surface type / unreadable text, tied to cheap knobs (scrim/copy/regenerate-asset). Decided required Session 20, **not built**. This is the difference between "usually great" and **"reliably great."**

---

## 9. What we keep vs redesign

**Keep (the scaffolding):**
- The archetype **contract** `lib/archetypes/types.ts` (eight parts) + the **arrangements** concept (curated complete compositions the maker can switch).
- The **capped, niche-neutral content schema** pattern (min *and* max lengths so content can't break geometry).
- The **harness** pattern (`scripts/test-*-archetype.ts` — brief Bohdi against the schema, validate, fixture, render route) and the `app/archetype-test/*` routes.
- The shared catalog core `lib/archetypes/content.ts` (`ProductView` etc.) — products as rows, the try-on foundation.
- The **no-hardcode discipline**: renderer owns structure only; every color is the skin or a derivation, every type value a named role.

**Redesign (the visual layer), from the moment-as-hero idea:**
- `lib/archetypes/main-street/themes.ts` → becomes **skins** (committed color, the tux type *system*). The current muted palettes + Young Serif/Hanken/Bitter/Bricolage are rejected.
- The composition in `MainStreet.tsx` / `shared.tsx` → the four-beat **sales page** with the moment as hero.
- Wire the **real Story primitive** (`components/storefront/layout/primitives/Story.tsx` + `Stage.tsx`) as the hero region — not hand-rolled JS.

---

## 10. The mockup is a PAINTING, not the system

`public/main-street-mockup.html` (served via the Next dev server at `/main-street-mockup.html`; the companion server only serves HTML and 404s on the video) is **hand-built and hardcoded**. It touches **none** of `lib/archetypes/main-street`. Only the moment's *content* (the four story lines + `public/bread-kling.mp4`) was pulled from the `app/moment-probe/june-sourdough` probe. Everything else — composition, the ember/espresso/cream palette, Instrument Serif + Inter + IBM Plex Mono, the motion JS, the placeholder products/founder/calendar — was typed by hand. **It is the target, not output.** The build's job is to make the shape + skin + Bohdi machinery produce it.

### Starter skin #1 (extract from the mockup, to become the first shelf tux)
- bg `#F4EAD7` · ink `#2B1A12` · muted `#7A6249` · **contrast** `#1C120B` / on-dark `#F4EAD7` · accent `#C8431B` (committed ember) · rule `rgba(43,26,18,.16)`
- display **Instrument Serif** · body **Inter** · label/mono **IBM Plex Mono**
- grain (fractal-noise SVG, multiply, ~5% opacity) · photo grade (slight warm/contrast)
- *Starter values pending review; character = "homey/warm", suits bakery/food/farm; mood lean = cozy/rustic.*

---

## 11. The build, next (turn the painting into the engine)

1. **Bones:** Main Street archetype renderer = the four-beat sales page reading 100% from a skin (no hardcoded color/font), motion baked in, light/dark-agnostic via the two surfaces.
2. **Hero region:** wire the real Story primitive (held media + cross-fade story + brand landing) as Beat 1, reading fonts/colors from the skin.
3. **Skin #1** on the shelf (the starter values above), expressed in the new skin shape (two surfaces + 3-voice type system + atmosphere).
4. **Capped schema** for the content slots: moment story (N lines, capped), eyebrow/brand/CTA, founder quote, find-us rows, close. Catalog comes from `ProductView` rows.
5. **Harness:** brief Bohdi against the schema for two niches; have him author the story + the hero video prompt; generate; render; **prove it reproduces.**
6. Then: engine integration (selection by niche+mood+catalog size, deterministic mood→skin), the **eyes/critic loop**, the skin shelf + character×mood grid coverage, the image picker/stock pipeline, the multi-page set folded into the contract, skin portability for try-on.

---

## 12. Open threads to reconcile (not decided here)
- Full **mood → character → skin** coverage matrix (build skin #1, prove, then grow).
- The **eyes/critic loop** (required, unbuilt).
- Multi-page set (sales/shop/about/find-us) folded into the archetype **contract** (today `render` is single).
- **Master Spec / decisions log** reconciliation: the niche schema's design role dissolving into shape+skin; "skins" formalized alongside "themes/arrangements" language.
