# Layout Language

**Status:** Draft — primitives list only. This document grows section by section as each piece is approved.

**Purpose.** Replace the frozen block catalog with a small composition language Bohdi uses to author layouts directly. Functional art, not brochures. Bohdi composes the page; he doesn't pick the page.

---

## 1. Primitives

These are the building blocks. Every layout Bohdi composes is a tree of these. They nest — a `split` can hold two `stack`s, a `stack` can hold a `band` that holds a `grid`. Each primitive carries geometry (proportions, alignment, spacing), style intent (which named palette color anchors this region, which type role plays here, which texture flavors it), and a default mobile behavior. Mobile is a first-class concern — every primitive declares how it collapses on small screens, and Bohdi can override the default per node when the composition needs it.

**band** — A full-width horizontal section of the page. The "rows" of a site read top-to-bottom. A hero is a band. An about section is a band. A footer is a band. Every page is a stack of bands. *Mobile:* bands stay bands; vertical padding scales down.

**stack** — A vertical sequence of children inside a container. Children flow top-to-bottom. Used inside a band when content needs to read as a column (headline above sub above CTA). *Mobile:* unchanged — vertical was always going to read fine.

**row** — A horizontal sequence of children. Children flow left-to-right with control over alignment and wrap. Used for nav items, product rows, icon strips. *Mobile:* wraps to multiple lines, or collapses to a stack, depending on a `mobile` knob Bohdi sets per row.

**split** — Two panes side-by-side or top-and-bottom with a ratio (e.g. 60/40, 50/50, 70/30). The bread-and-butter of editorial layout — image left and text right, or text left and image right, or headline above products. *Mobile:* default is to stack vertically with explicit child order (image-first or text-first, Bohdi picks).

**grid** — A regular N-column structure with M rows. Used for product grids, collection galleries, image walls. *Mobile:* column count collapses on a stated ladder (e.g. 4 → 2, 3 → 1 or 2, 2 → 1) — Bohdi sets the mobile column count explicitly.

**overlap** — Children layered on top of each other on the z-axis. Used when an image needs a headline on top of it, when a card breaks out of the section below, when a wordmark sits over a hero photo. *Mobile:* z-stacking is preserved where there's room, otherwise collapses to a vertical stack — Bohdi tags which child is the anchor when it has to collapse.

**bleed** — A child that breaks its container and extends to the viewport edge. Used to push images off the page edge, to create asymmetry, to make a section feel boundless instead of boxed. *Mobile:* still bleeds — bleed is even stronger on small screens because the viewport is narrow.

**pane** — A contained box with optional padding, background fill, border treatment, and radius. The "card" shape. Used inside grids, splits, or stacks when content needs to feel held. *Mobile:* padding scales down on a stated ratio; otherwise unchanged.

**marquee** — A horizontal scrolling sequence. Used when a series of items wants motion — a band of customer logos, a row of recent makes, a strip of testimonials. *Mobile:* still scrolls horizontally — touch-scroll is native on mobile and marquees often read better there than on desktop.

**gutter** — Explicit empty space with a size value. Not invisible. Used deliberately to create asymmetry, breathing room, or a deliberate pause between sections. *Mobile:* size scales down proportionally.

---

*Bohdi composes layout trees from these. The renderer walks the tree. Style intent attached to each node deploys the named palette and font roster regionally.*

---

## 2. Style intent

The primitives define geometry. Style intent defines how each region of the page gets painted, typed, and textured. The two layers are separate on purpose — the same tree can look like four different sites depending on the style intent attached to its nodes.

**Palette is vocabulary, not pre-assigned roles.** The tenant carries a palette of ~15 named colors drawn from the niche × mood intersection (e.g. for leatherworker × DARK: Saddle Tan, Bone, Hematite, Smoke, Ember, etc.). Each color is described by its character — what it *is* (Saddle Tan: warm worked-leather brown from the tradition of vegetable-tanned hide; Bone: pale uncolored canvas; Hematite: cold blue-black mineral). The style sheet does not tag colors with roles like "anchor" or "surface" — that would be us directing the look. Bohdi reads the palette character and assigns roles per composition. Different sites can deploy Saddle Tan as the anchor color, as the surface color, or as a single punctuation accent depending on what Bohdi decides this site wants to be.

**Type roster as vocabulary.** The tenant carries a roster of ~6–14 fonts drawn from the style sheet, each described by its character (e.g. Cormorant Unicase: tall capitals with subtle geometric edges, reads as quietly authoritative; IBM Plex Mono: machined typewriter feel, holds technical content without coldness). The style sheet does not tag fonts as "the heading font" or "the body font." Bohdi reads the roster and assigns type roles per composition — which font carries the display work on this site, which runs the body, which punctuates.

**Texture set.** The tenant carries a set of named textures from the style sheet — linen, vellum, leather grain, photo grain, paper, kraft, etc. Each described by character. Any node can flavor its surface with a texture. Used sparingly — over-textured pages get noisy. Bohdi decides where texture lives per composition.

**Per-node intent.** Each node in the tree can carry up to four intent tags — a palette intent (a named color from the palette), a type intent (a named font from the roster) for any text content it holds, a texture intent for its surface, and a density intent (compact / normal / generous) that scales padding and gutter. Children inherit intent from their parent unless they override. So Bohdi can paint a whole band with one intent and let it flow, or override a single pane inside to invert.

**Roles are inferred from usage, not declared.** When the renderer compiles a tree to CSS, it walks the intent assignments and figures out what role each color is playing on this site (the color used as backgrounds across the most surface area is the dominant; the color used in headlines is the display ink; etc.). Roles emerge from Bohdi's composition. They are not pre-assigned by the style sheet.

**Contrast is enforced.** Text intent is checked against the background or surface it sits on. If Bohdi assigns a text color that fails contrast against its backdrop, the renderer auto-adjusts to the nearest palette color that passes WCAG AA. This is the floor — Bohdi can paint dramatically, but the result is always readable.
