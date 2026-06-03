# The Everyday Archetype — Design Spec

**Status:** Draft for Alex's review · 2026-06-03 · branch `session-12/layout-engine`
**Author:** Claude (Lead Dev), brainstormed with Alex via the visual companion
**Relationship:** Second archetype after the Gallery (`lib/archetypes/gallery/`). Satisfies the archetype contract (`lib/archetypes/types.ts`), with one small additive extension (see §9).

---

## 1. What it is

The **Everyday** archetype is the default maker shop — the one most tenants land in. Where the Gallery is the special, image-rich, big-catalog shape (a dense salon wall), the Everyday is the familiar hero-led shop: a face up top, the goods, the maker behind them, the footer. It is the "Safe" archetype — recognizable enough that any maker feels at home in it, composed in ways the template builders never would so it never reads as Shopify-with-different-photos.

It is **niche-neutral by construction.** Nothing about bread, candles, or clay lives in the bones. June's Sourdough is the test tenant we'll author into it; a potter or a candle maker fills the same regions with different words.

It is **the archetype the Moment pairs with.** The generated intro moment melds down into the hero (not a separate gate). The Gallery carries its own punch and takes no moment; the Everyday is where the moment lives.

> **Open decision — name (Alex's pick).** Working name "Everyday." Alternates: "The Counter," "Shopfront," "Main Street." One word, plain, warm, maker-not-SaaS — same spirit as "Gallery."

## 2. The design problem it has to solve

A niche-neutral hero-led page is the **most slop-prone shape there is** — it is the exact Wix/Squarespace/Shopify default. So niche-neutral must not mean generic. The Everyday earns its place three ways, in priority order:

1. **A compositional signature** — distinctive moves (off-axis image-bleed heroes, hero placed *after* the product table, an inverted maker-story band) that make it unmistakably not a stock hero-stack.
2. **A family of curated arrangements** (see §4) so two makers rarely land on the same page.
3. **Distinct curated themes + the photo grade + the generative moment** varying the skin and the front door.

All variation is **designed by us and selected by rule** — never composed or recombined by Bohdi. That is the line that keeps it finished and unbreakable.

## 3. The regions

Six page regions, plus the meldable moment slot in front. Niche-neutral content slots; the maker fills them, the archetype owns how they look.

| Region | Always-on? | Notes |
|---|---|---|
| Moment (meldable) | Optional | The generated intro; melds into the hero. Portable layer, not welded to this archetype. |
| Hero | **Required** | The shop's face: brand, one-line promise, primary CTA, hero image. |
| Featured selection | **Required** | Reads real catalog rows (`ProductView`). A shop must show its goods. Not authored by Bohdi. |
| Maker story | **Required** | The authority beat — the maker in their own voice, with face/process. The non-faceless differentiator. |
| Secondary band | Optional | Niche-neutral "what's happening / where to find us / new." A baker's "this week," a potter's "markets." On or off. |
| Stay-in-touch | Optional | Email capture / list. |
| Footer | **Required** | Maker columns + platform-guaranteed Home/Privacy/Terms legal row (page-architecture policy). |

The required set mirrors the Gallery rule (wall + maker story can't be hidden): a shop needs a face, its goods, the maker, and legal footing.

## 4. The variation model — a curated set of complete arrangements

The archetype ships a small set of **complete, finished arrangements**. Each is a whole designed page — hero treatment, story treatment, region order, and spacing all chosen together to work as one composition. They are **not** a parts bin of interchangeable hero × story × order combinations; that path produces pages no one art-directed, which is the door back to slop. The engine picks a *whole* arrangement; Bohdi never assembles one.

Freshness comes from **three stacked dials**: which arrangement, which theme, which moment.

**Maker control (the editor "try formats" feature).** Because every arrangement is finished, the maker can switch between arrangements in the editor and it always looks good — control without the ability to make it ugly. **Hard requirement from this:** every arrangement reads from the same content slots and the same theme, so switching format is one click that never asks the maker to re-author. (Same portability idea as switching whole archetypes, one level finer.) The switcher *UI* is a follow-on build; the archetype is built ready for it now.

### v1 arrangements (build these three)

1. **Classic, lifted** — order: hero → featured → maker story → stay-in-touch → footer. Signature move: off-axis, image-bleed hero (not a centered banner); dark inverted story band.
2. **Goods-first** — order: featured → hero (as a mid-page wide brand band) → maker story → stay-in-touch → footer. Signature move: you see the goods on landing; the hero arrives mid-page as a brand moment. (Alex's "hero after the product table.")
3. **Story-led** — order: maker story → featured → hero (as a closer) → stay-in-touch → footer. Signature move: the maker opens, the product closes; light editorial story entry.

More arrangements can be added later the same way — by designing another complete page, never by letting pieces recombine.

## 5. Themes

Same structure as the Gallery's themes: each a complete designed package — a guaranteed-readable `ColorPair`, a curated type pairing (display + text + accent roles), a spacing scale, atmosphere (grain/wash/photo grade), and motion. **Mood picks the theme deterministically** (fixing the Gallery's stochastic theme pick — mood drives it, not Bohdi's coin flip).

> **Open decision — themes (Alex's review).** Proposal: build **three or four** curated themes covering the Everyday's natural moods — SIMPLE, COZY, RUSTIC, MODERN. Exact palettes/type pairings to be designed in build and reviewed. Each theme carries a photo grade that harmonizes mismatched maker photos into one set (the Gallery trick).

## 6. Content slots (what Bohdi authors)

A niche-neutral Zod schema, one group per region. Carries the Gallery's two hard-won lessons:

- **Max-length caps on every field** (the broadsheet lesson — long headlines broke the geometry). Caps pegged to what each arrangement's type sizes can actually carry.
- **Char-count guidance** in the harness ("you're bad at counting, stay comfortably under") with caps set a little generous (the Gallery's 480 fix that took authoring from 5 wasted turns to 1).

Bohdi authors: brand name, one-line hero promise, hero CTA label, the maker-story prose (in voice), the secondary-band copy (if on), the stay-in-touch copy, footer columns, and the moment copy + asset prompt. Bohdi does **not** author the catalog — see §7.

## 7. Catalog wiring

The featured selection and the product page read **`ProductView`** rows from the shared catalog core (`lib/archetypes/content.ts` — the same `ProductView` / `CatalogMedia` / `CatalogVariation` shapes the Gallery uses). This is the try-on foundation: the same products render in any archetype. The Everyday never authors products; it pours catalog rows into its containers. Multi-image + video supported, same as the Gallery.

## 8. The Moment meld

The Everyday exposes a moment slot in front of the hero. The moment is the portable intro layer (story-video / story-still / spotlight, generated per niche+mood). It **melds into the hero** — the moment's closing brand frame hands off into the hero rather than gating it. The moment is optional and portable across try-on; this archetype just defines how it attaches to its hero.

## 9. Fitting the contract

Satisfies `Archetype<TContentSchema, TThemeSchema>` (`lib/archetypes/types.ts`) with one **additive** extension: the archetype declares its **arrangements**, and `render` receives `content + theme + arrangement`. Proposed minimal shape:

- Add `arrangements: Record<string, { key; label }>` to the archetype (the curated set).
- `render` takes an `arrangement` key alongside `content` and `theme`; it switches composition internally and remains structurally invariant per arrangement.
- A `defaultArrangement` / selection note for the engine (engine-side selection of arrangement-by-mood-and-content is integration work, not part of this build).

This is the contract evolving as Sessions 21–22 anticipated ("where does the archetype concept slot in," "fold the multi-page set into the contract"). Keep the change additive so the Gallery is unaffected.

Product page is a **sibling renderer** for now (as in the Gallery), reading `ProductView`. Companion pages (shop/catalog, about, cart) in the Everyday's language are follow-on.

## 10. Test harness

Mirror `scripts/test-gallery-archetype.ts`: brief Bohdi against the schema, validate his submission, write a fixture, render it. **Run it against two niches to prove niche-neutrality** — June's Sourdough (bakery) *and* a non-bakery maker (e.g. the potter), the way the Gallery was proven on jewelry, not bread. Render routes under `app/archetype-test/everyday/`. Preview-only stand-in images injected by the route, not the archetype.

## 11. Scope — this build vs. next

**This build:**
- The Everyday module: `schemas.ts`, `themes.ts`, `shared.tsx` (factored chrome — root, header, footer), the three arrangements + home renderer, `EverydayProduct.tsx`, `index.ts`.
- The additive contract extension for arrangements (§9).
- The Bohdi harness + render routes + fixtures, proven on two niches.
- Three arrangements, three–four themes.

**Explicitly NOT this build (next sessions):**
- Engine integration — archetype selection (now real, with two archetypes), deterministic mood→theme, onboarding picks an archetype, resolver renders it, wall/featured reads live catalog.
- The editor arrangement-switcher UI (archetype is built ready for it).
- Companion pages (shop/catalog, about, cart) in Everyday language.
- The portable moment layer + video/image library.

## 12. Open decisions for Alex

1. **Name** — "Everyday" vs. "The Counter" / "Shopfront" / "Main Street."
2. **Themes** — confirm the three–four moods to cover (proposed: SIMPLE, COZY, RUSTIC, MODERN) and review palettes/type during build.
3. **Arrangements** — confirm the three (Classic-lifted, Goods-first, Story-led) as the v1 family.
4. **Char caps** — set during build against real type sizes; flagged here so they don't get forgotten.
