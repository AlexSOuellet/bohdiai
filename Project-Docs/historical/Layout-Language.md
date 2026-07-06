# Layout Language

**Status:** Draft — primitives list only. This document grows section by section as each piece is approved.

**Purpose.** Replace the frozen block catalog with a composition language Bohdi uses to author layouts directly. He composes the page; he doesn't pick the page.

---

## 1. Primitives

These are the building blocks. A layout is a tree of these. They nest freely — any primitive can hold any other primitive. Each primitive carries geometry (proportions, alignment, spacing) and style intent attached per node.

Mobile is a first-class concern. Every primitive declares how it behaves on small screens, and Bohdi can override that behavior per node when the composition calls for it. A layout is not finished until its mobile expression is composed as deliberately as its desktop expression.

**band** — A horizontal section that spans the full width of its parent. *Mobile:* unchanged; vertical padding scales down.

**stack** — A vertical sequence of children. Children flow top-to-bottom. *Mobile:* unchanged.

**row** — A horizontal sequence of children with alignment and wrap controls. Children flow left-to-right. *Mobile:* wraps or collapses to a stack per a `mobile` knob set on the row.

**split** — N panes side-by-side or top-and-bottom with explicit ratios that sum to 100 (e.g. 60/40, 50/50, 50/25/25, 25/25/25/25). *Mobile:* default is to stack vertically; child order is set on the split.

**grid** — A regular N-column structure with M rows. *Mobile:* column count collapses on a ladder set on the grid.

**overlap** — Children layered on the z-axis. *Mobile:* preserved where there's room, otherwise collapses to a vertical stack; the anchor child is tagged on the overlap.

**bleed** — A child that breaks its container and extends to the viewport edge. *Mobile:* still bleeds.

**pane** — A contained box with optional padding, background fill, border treatment, and radius. *Mobile:* padding scales down per a stated ratio; otherwise unchanged.

**marquee** — A horizontal scrolling sequence of children. *Mobile:* still scrolls horizontally.

**gutter** — Explicit empty space with a size value. *Mobile:* size scales down proportionally.

---

*Bohdi composes layout trees from these. The renderer walks the tree. Style intent attached to each node deploys the named palette and font roster regionally.*

---

## 2. Style intent

The primitives define geometry. Style intent defines how each region of the page gets painted, typed, and textured. The two layers are separate on purpose — the same tree can look like four different sites depending on the style intent attached to its nodes.

**Palette is vocabulary, not pre-assigned roles.** The tenant carries a palette of ~15 named colors drawn from the niche × mood intersection (e.g. for leatherworker × DARK: Saddle Tan, Bone, Hematite, Smoke, Ember, etc.). Each color is described by its character — what it *is* (Saddle Tan: warm worked-leather brown from the tradition of vegetable-tanned hide; Bone: pale uncolored canvas; Hematite: cold blue-black mineral). The style sheet does not tag colors with roles like "anchor" or "surface" — that would be us directing the look. Bohdi reads the palette character and assigns roles per composition. Different sites can deploy Saddle Tan as the anchor color, as the surface color, or as a single punctuation accent depending on what Bohdi decides this site wants to be.

**Type roster as vocabulary.** The tenant carries a roster of ~6–14 fonts drawn from the style sheet, each described by its character (e.g. Cormorant Unicase: tall capitals with subtle geometric edges, reads as quietly authoritative; IBM Plex Mono: machined typewriter feel, holds technical content without coldness). The style sheet does not tag fonts as "the heading font" or "the body font." Bohdi reads the roster and assigns type roles per composition — which font carries the display work on this site, which runs the body, which punctuates.

**Texture set.** The tenant carries a set of named textures from the style sheet — linen, vellum, leather grain, photo grain, paper, kraft, etc. Each described by character. Any node can flavor its surface with a texture. Bohdi decides where and how much texture lives per composition.

**Per-node intent.** Each node in the tree can carry up to four intent tags — a palette intent (a named color from the palette), a type intent (a named font from the roster) for any text content it holds, a texture intent for its surface, and a density intent (compact / normal / generous) that scales padding and gutter. Children inherit intent from their parent unless they override. So Bohdi can paint a whole band with one intent and let it flow, or override a single pane inside to invert.

**Roles are inferred from usage, not declared.** When the renderer compiles a tree to CSS, it walks the intent assignments and figures out what role each color is playing on this site (the color used as backgrounds across the most surface area is the dominant; the color used in headlines is the display ink; etc.). Roles emerge from Bohdi's composition. They are not pre-assigned by the style sheet.

**Contrast is enforced.** Text intent is checked against the background or surface it sits on. If Bohdi assigns a text color that fails contrast against its backdrop, the renderer auto-adjusts to the nearest palette color that passes WCAG AA. This is the floor — Bohdi can paint dramatically, but the result is always readable.

---

## 3. Content layer

Layout primitives are geometry. Style intent is paint. The content layer is what fills the geometry — text, images, products, collections, callouts. Two flavors.

**Authored content.** Text Bohdi writes himself plus image briefs he hands to fal. Headlines, sub-headlines, body paragraphs, eyebrows, button labels, image prompts. Authored content is frozen into the layout tree at compose time — the maker can edit it later, but it doesn't update on its own. This is where Bohdi's voice work lands and where the maker's grounding answers become real copy.

**Bound content.** Data from the maker's catalog — products, collections, subscriptions, events, social links. A node tagged "products grid, show six, order by featured" gets filled with whatever real products the maker has at render time. If the maker adds a product tomorrow, the grid shows it without Bohdi touching anything. Bohdi composed the geometry once; the data flows through it forever. Bound content also covers featured-specific binding ("this exact product," "this exact collection") for spotlight cases.

**Widgets collapse into node types.** The original block-and-widget split (D13) was right about separating function from form, but in the layout language the separation falls out naturally — a CTA button is just a content-node type with a label and an href. A contact form is a content-node type. An add-to-cart on a product detail page is a content-node type. The separate widget catalog goes away. Content nodes have their own schemas the same way layout primitives do.

---

## 4. What still has to be designed

The two sections above cover the structural skeleton. These pieces are agreed in principle but not specified in the doc yet — flagged here so the next round of doc work knows where to focus.

**Patterns library.** Catalog comes back, but smaller and at a different level. Not blocks-as-frozen-layouts. Partial trees Bohdi can borrow as starting points — "hero with overlapping image and headline," "products in an asymmetric grid with one feature card." Patterns are training material, not a cage. They live alongside niche files as AI input, not as the only option. Schema and authoring shape pending.

**The Bohdi compose tool.** Today Bohdi calls `set_tokens` and `set_home_page` with block keys. The layout language replaces these with a `set_layout` (or similar) tool that accepts a layout tree per page plus a style sheet (palette + roster + textures). Tool schema pending.

**Renderer.** A recursive React component that walks a layout tree and emits the rendered page. Has to handle every primitive's geometry, every style intent, mobile collapse behavior per primitive, and content nodes. Will replace most or all of the current `blocks/` directory. Architecture pending.

**Tenant DesignTokens replacement.** The current seven-color, two-font tokens schema goes away. Replaced by a named palette + font roster + texture set persisted as JSONB per tenant, written by Bohdi's compose tool. Migration shape pending.

**Reference exemplars.** A `study_references` tool that returns curated layouts and palettes per niche × mood for Bohdi to absorb before composing. Material curation and tool shape pending.

**The art director.** A second-pass review model that critiques Bohdi's composition against the brand promise (functional art, not brochures), checks for AI-tells in copy, and forces a redo if the result is mediocre. Pending.

**Iterative process.** Bohdi generates three candidate compositions per page before developing one. Mechanics pending.

**Bohdi reading his own past work.** A `recent_sites` tool returns his last N attempts in this niche × mood so he can see if he's about to repeat himself. Pending.

---

*Bohdi composes layout trees from primitives, paints them with the named palette and roster he reads from the style sheets, fills them with authored copy and bound data. The renderer walks the tree. Patterns inform him. The art director catches what telling him can't.*
