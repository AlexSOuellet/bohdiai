# Family Swap — the data map

**What happens to a maker's content when they change their feeling (family) after the walk, and how every look handles data the previous look never collected.**

Written Session 84 (2026-08-04), after wiring the testimonials/events rows editors and killing the fabricated review rating. This is the reference the editor's door-one (feeling swap) + the "you switched feelings" heads-up get built from.

---

## The principle (why swaps are safe by design)

Every family renders from **one shared content envelope**. A treatment is a *shape*, not a separate content model — the goods heading, the collection blurbs, the real quotes, the real dates, the founder story all live in the same fields no matter which family is on. Swapping a feeling re-paints that content in a different shape; it does not need new content.

Two things keep this honest:

1. **The crew over-authors.** At build the copywriter writes *every* supporting field for *all* families — the founder eyebrow and heading, the about page, the marquee voice — even when the current family doesn't display them, "so every family renders cleanly no matter which body it picks" (copywriter prompt). So switching to a family that *does* show a field finds it already there.
2. **Treatments degrade honestly.** An optional field a treatment doesn't have simply isn't rendered — the bit is omitted, never invented. (The one place this was violated — the review rating — is fixed; see below.)

So the swap-gap surface is small: only genuinely **look-specific extras** — data one look needs that another look's walk never collected.

---

## The look-specific extras (the real gaps)

### 1. The overall review rating — Modern only

Only Modern's reviews layout (`rating`) shows an aggregate number ("4.9 out of 5 · 200 customers"). The other five families use guestbook / pull-quote / text-bubble layouts with **no number**.

- **Was a fabrication:** the crew authored a fake summary and the rating treatment fell back to a fabricated "5 out of 5" when it was absent. **Both removed (S84).** The crew no longer writes a rating; the treatment shows stars over the real quotes with no number when there's none.
- **Maker entry:** the walk's reviews step offers optional "your real rating / how many reviews" boxes **only when the store uses the rating layout** (family-aware, like the Moment step). A blank or partial entry saves as none, which also **strips** any leftover fabricated summary so it can never publish.
- **On swap → Modern:** a maker who built under Cozy never entered a rating → the rating layout shows stars + their real quotes, no number. Honest, not broken. They can add a real figure in the editor.
- **Second surface:** the `/testimonials` page also has a summary bar (`pages.tsx`), gated on `reviews.summary` being present — so it only ever shows a real, maker-entered rating, on any family.
- **Open decision (Alex):** the rating-entry field currently shows only on the rating-home-layout (Modern). Because the testimonials page can display a rating for *any* family, we could instead offer the rating box to everyone. Deferred — v1 keys it to the home layout.

### 2. The opening Moment — Cozy (story hero) only

Only the `story` hero (Cozy today) plays the fading-in opening lines. The lines themselves (`moment.story`) are **always authored** for every family, so no content is missing. What's look-specific is the **play frequency** (`moment.playMode` — once / always / off), which the walk collects only on the Cozy Moment step.

- **On swap → Cozy:** `playMode` defaults to `once` — sane, not broken. The plan already calls for a **"you just switched to Cozy — here's the Moment control"** heads-up in the editor (still to build).
- **On swap away from Cozy:** the static hero simply doesn't fade the lines in. No loss.

---

## Fabrication audit — every count/fallback, checked

The risk is a treatment *inventing a maker fact* when a field is absent (what the rating did). Result of the sweep across all Main Street treatments:

| Fallback | Where | Verdict |
|---|---|---|
| `DEFAULT_COUNTS.outOfFive` | (removed) rating summary | **Was the only fabricated metric. Gone.** |
| `DEFAULT_COUNTS.testimonials(n)` | (removed) rating count | **Was fabricated proof-of-volume. Gone.** |
| `DEFAULT_COUNTS.pieces(c.count)` | Chapters, Portals, collection page | Honest — real count of products in the collection |
| `DEFAULT_COUNTS.items(c.count)` | Cupboard, Lanes, testimonials page collections | Honest — real count of visible items |
| `DEFAULT_COUNTS.numberOf(i+1)` | Goods lookbook eyebrow ("No. 3") | Honest — an index label, not a claim |
| `DEFAULT_COUNTS.showTestimonial(i+1)` | Pull-quote | Honest — an aria label |
| `DEFAULT_STRINGS.*` | nav / footer / cues / empty-states / aria | Structural chrome, not maker facts |

**Conclusion:** after the rating fix, no treatment fabricates an unseen fact. Collection piece-counts count actually-shown items (seeded pre-walk, real after) — a visible count, not an assertion about hidden data, so it is not in the same class as an invented rating.

---

## The section-by-section shape (what each look reads)

All treatments within a section read the **same** content fields; the family only picks which treatment. Optional fields are authored anyway (crew over-authors) except the two extras above.

- **Hero** (story / stacked / floating-card / typographic / collage / split) → `moment.*` (media, story, brand, eyebrow, sub, ctaLabel, secondaryCtaLabel). Optional CTAs/eyebrow absent → not rendered. Only `story` plays the Moment.
- **Goods** (procession / marquee / switcher / slideshow / table / module) → `goods.*` + product rows. Shared.
- **Collections** (cupboard / crates / portals / chapters / lanes / cascade) → `collections.*` + collection rows (`count` is a real product count). Shared.
- **Reviews** (rating / pull-quote / guestbook / texts) → `reviews.items` (+ title/label/viewAll). Only `rating` uses `reviews.summary` (the extra).
- **Founder** (quote / portrait / letter / card / workbench / editorial / signature) → `founder.*` (quote, attribution, eyebrow, heading, photo, aboutLabel) + `about.*`. All authored every build.
- **Find-us** (board / calendar / passes / next-stop / itinerary / poster) → `founder.findUs.rows` (each row: day, where, time, and `date`; date-shaped treatments read `date`, which the walk's dates editor always sets). Shared.
- **Marquee** → `marquee.voice` (authored) + a derived logistics line drawn ONLY from made-real find-us dates + collections (S84 fix), so it never scrolls seeded data.
- **Nav** (standard + registers) → identity/wordmark + `DEFAULT_STRINGS` labels. Shared.

---

## The policy (enforce going forward)

1. **The crew authors every shared supporting field for all families.** A missing supporting field is a copywriter bug, not a render fallback.
2. **Any look-specific extra degrades honestly when absent — never fabricate.** The rating was the one violation; it's fixed. New treatments that want an extra must render nothing (or a non-asserting visual) when it's absent, and collect the real value where the maker can give it.
3. **The editor gives a heads-up when a swap surfaces a new configurable thing** (the Moment today; any future look-specific control).
4. **New family/treatment work updates this map** — it's the checklist for "does this look need data the walk didn't collect, and does it degrade honestly?"
