# Family / Layout / Section Model

**Date:** 2026-06-24 (Session 51) · **Status:** direction from a long working session. Some parts settled, several still open — marked inline. Nothing here is locked code yet.

**Relationship to the earlier `Mood-and-Look-Model.md` (2026-06-22):** today's session changed two things from that doc — color and fonts are back as part of a family's identity (it had said feeling is *not* color), and Cozy and Rustic are **separate** families (it had merged them). How we reconcile the two docs is still open.

This doc is for review. Alex corrects drift before any of it is treated as final.

---

## The core model

**Stacked is the format. Settled, no more fighting it.** Almost every site on the web is a vertical stack of sections, top to bottom. Makers expect it, it's bulletproof on mobile, and it's the thing we can actually build reliably. We do *not* break the stack (sidebars, overlaps, split-screen page structures). We may play with one or two stack-breakers far down the line, tightly guardrailed and never mixed with other layouts — parked.

**A family IS a layout.** The difference between families is not paint on the same stack — it's that **each family stacks differently**: different sections, in a different order, with different section designs. No two families stack the same. Layout is the first thing the eye catches, so layout leads — but it's never the *only* difference; type, color, texture, and imagery all swing too. The lesson from the session: nothing single defines a feeling, so we use everything, hard.

**"Archetype" is retired as a word.** It's **layouts** (families) and **skins** now. Main Street is the **Cozy layout** — its cozy *look* is already built; the modular swapping plumbing still has to be added (today's assembly is hard-coded, see below).

**Content vs presentation — the split that makes everything else work.**
- **Content** is what the site says and shows: words, photos, products. **Presentation** is how it looks: family, section variant per slot, colors, type. They live in separate stores.
- At onboarding there are **no maker specifics yet** — Bohdi authors the content (copy, library images, stand-in products) and picks the family's presentation defaults.
- Over time the maker edits the content (rewrites copy, uploads real photos, adds real products). Those edits overwrite their piece of the content store and **persist through any look change**, because look-swapping only ever touches presentation.
- Their presentation tweaks (a custom color, a chosen font) persist too — **except a full family switch**, which deliberately takes on the new family's whole look. A single-section try-on keeps their colors.
- Every change is reversible.

---

## What makes it modular (the architecture)

A **section** (hero, showcase, maker, etc.) is a React component that takes a slice of the maker's content + the skin and renders its composition.

Today (`MainStreet.tsx`) the assembly is **hard-coded** — it literally lists `<MomentHero/>`, `<GoodsBeat/>`, `<FounderBeat/>`… in a fixed order, one hero only, no swap. The modular upgrade is to replace the hard-coded JSX with a **recipe**: an ordered list of `(sectionType, variantKey)`. The renderer walks the recipe, resolves each key to a component from a catalog, and renders it with that section's content slot.

Three things make it modular:

1. **Shared content contract per section type.** Every hero reads the same ingredients — label, headline, sub, media slot, CTA. Interchangeable: swap one hero for another and the same content flows in. A few variants want an extra ingredient (Story's fading lines, Collage's three photos) or skip one (Typographic has no image); the contract carries optional fields and each variant uses what it needs.
2. **Reference by key, not hard-wiring.** The recipe names variants by key from a catalog. Adding a variant = drop in a self-registering component; available everywhere, nothing else changes. (Same family as the existing block-registry pattern, ADR-0001.)
3. **A generic renderer.** It never names a specific section — it resolves keys. This is the skin system's trick ("the renderer names no color and no font") extended to "names no section."

What exists today: the section components + a fixed assembly + a small within-beat "treatment" dispatch. What we add: the recipe + catalog indirection so sections swap.

---

## Sections & the hero catalog

Heroes are the topmost section. All 17 patterns from the mockup, and where each one lands:

| # | Pattern | Where it belongs |
|---|---|---|
| 1 | Story | **Hero** — full-bleed still or video, lines fade in and settle. **Cozy's default.** |
| 2 | Split, image right | **Hero** |
| 3 | Split, image left | **Hero** — the mirror; media slot can be photo / video / animation |
| 4 | Typographic | **Hero** — no image, the words carry it |
| 5 | Stacked | **Hero** — text block, then a full-width image band |
| 6 | Collage | **Hero** — headline beside a row of shots (wants ~3 images) |
| 7 | Product-forward | **Cut** — Alex doesn't like it |
| 8 | Carousel | **Hero** — niche-dependent (earns its place only with several things to feature) |
| 9 | Background video | **Folds into Story** — it's Story with the media slot set to video |
| 10 | Asymmetric editorial | **Folds into Split** — a Split variation unless we push the overlap much harder |
| 11 | Two-up split | **Collections section** (new section type) |
| 12 | Floating card | **Hero** — not a single product |
| 13 | Editorial cover | **Hero** — giant masthead, brand-as-hero (distinct from Story) |
| 14 | Mosaic | **Collections section** |
| 15 | Action hero | **CTA section** — open: could be a hero for pickup/booking niches if that feature exists |
| 16 | Map / find-us | **Find-us / events section** |
| 17 | Marquee | **Band between sections** — not a hero |

So the **heroes** are: Story, Split (L/R), Typographic, Stacked, Collage, Carousel, Floating card, Editorial cover. **New section type to add: Collections** (from two-up and mosaic). Background video and asymmetric editorial fold into existing heroes. Map is the find-us section; marquee is a between-sections band; action hero is a CTA section for now; product-forward is cut.

Every section variant reads the same **content contract** for its type — a hero reads label / headline / sub / media / CTA — with optional fields for the few that need extras (Story's fade lines, Collage's three images).

---

## Onboarding vs editor

**Default per family.** Each family gets one default for every section, picked as the variant that most embodies the feeling (Story is Cozy's default hero). Onboarding hands the maker that family's full set of defaults — one layout, populated with their content, nothing for them to decide.

**Build all sections at onboarding.** We build/populate every section variant with the maker's content at onboarding, so the editor has everything ready instantly. Because every variant of a section reads the same content contract, this is cheap — there's really one thing built (the content); each variant is just a different way to display it. (Media-heavy variants that need extra assets are handled by the image library, below.)

**The editor does two distinct things:**
1. **Switch the whole family** — the maker sees their site exactly as if they'd picked that family at onboarding: that family's colors, fonts, and layout, with their same content poured in.
2. **Try on a single section** — swap one section but keep their own family's colors and fonts ("borrow that one piece into my look").

**Show all heroes in the editor** (Alex's call) — not just the ones that "fit" the family. Consistent with trusting the maker's eye: if one looks wrong, they'll see it and switch, and they can't break anything by trying. (The functional floor — no overflow, readable, mobile-safe — is always guaranteed; taste is theirs.)

---

## The image / video library

A curated, growing collection of **our own** stock images and video, tagged, that **Bohdi pulls from at onboarding**. Anything Bohdi generates feeds back in (after review). Reuse across makers is fine — that's just stock media, not "slop"; slop is the whole templated look, not a shared asset. (Makers browsing the library themselves later is a possible future option.)

Four rules keep it honest:

1. **Hard filter for correctness — not Bohdi's judgment.** Bohdi has a documented failure of picking by vibe over subject (the candle on a knitting shop — tangential invention, D55). So the library query is **mechanically locked** to the niche/subject; only correct-subject assets ever come back. Bohdi never sees the candle for a knitter. He decides *taste* (which correct asset's mood/light/shape fits best); the catalog decides *correctness*.
2. **Rotate by least-used** when there's depth, so one popular asset doesn't dominate. Bohdi requests a spec (subject/mood/light/shape); the system serves a qualifying asset by least-recently-used. His favorite-picking bias (cf. the choice-log, D25) never enters.
3. **Generate when the pool is thin.** If the qualifying matches are below a threshold, generate fresh instead of reusing one of the few. The library then **self-deepens** where real demand is. The threshold is the cost-vs-variety dial, tuned on real numbers.
4. **Review gate.** Fresh build-time generations go to a holding pool the maker uses immediately, but only join the **shared** library after Alex's review — so quality doesn't drift. The periodic library-building agents do two jobs: seed brand-new niches (so the first maker isn't the only generator) and quality-check what flowed in.

Tagging accuracy + granularity is the real work (too loose → wrong assets leak; too tight → nothing matches and it always generates). That calibration lives in the periodic pass + review.

---

## Open items (not decided)

- **Which families, and how many.** Cozy is first (= the current Main Street). The full family list and count are open. Each family is a real build, so fewer-but-complete beats many-half-built.
- **Action hero** — stays a CTA section, or becomes a hero once a pickup/booking feature exists.
- **Cozy's actual section designs** — the specific heroes, showcase, meet-the-maker, testimonial, events, and the new Collections section for Cozy, including which "meet the maker" we use (not necessarily the current one).
- **Library threshold** and tagging granularity — set on real data.

---

## Next steps (parked for Alex's call)

1. Pin the **Cozy** family's sections concretely (it's the first family and mostly exists as Main Street).
2. Decide the family list / count for beta.
3. Turn the modular recipe + catalog into an implementation plan (the recipe/registry indirection over the existing fixed Main Street assembly).
