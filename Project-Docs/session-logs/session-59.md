# Session 59 — the Marquee section, built onboarding-complete

**Date:** 2026-07-01 · **Branch:** `session-12/layout-engine`

## What happened

A section-building day. We picked up the "what's left for sections" thread, found the last home-band nobody had built (the Marquee), designed how it should work, and built it into the engine the right way — authored by Bohdi at onboarding, not a preview shell — with a formatting fix at the end.

### The sections discussion

Walked the seven blank columns in the defaults matrix and separated them honestly: five already render as one shared shape (Find-us, Footer, CTA/Close, Contact, FAQ) and only two didn't exist at all (Reviews/Testimonials, Marquee). The read that landed: the **look-defining** sections (hero, products, collections, about, nav) earn bespoke per-family shapes; the **utility** sections stay one shared shape wearing the family's paint — six hand-built footers is the "add a sixth product grid" slop trap. So the real open work isn't "design seven sections," it's Reviews + Marquee.

### The Marquee

Alex remembered a marquee from an earlier mockup — found it: pattern **17** in `tmp/specimens/hero-designs.html`, "a big bold band of scrolling type," a **two-row** band (bright brand line over a dim logistics line). It was one of the 17 hero patterns; when those sorted into 8 heroes (Session 51) it got re-filed as a between-sections band, which is why it's its own Marquee column in the matrix.

Decisions that shaped the build:
- **One shape for every family** (not six shapes like Collections). It won't look identical anyway — it wears each skin's accent + fonts, so it's rust-on-barnwood for Rustic, red-candy for Cheerful, with no per-family code.
- **What it displays is niche/family-specific; how it looks is fixed.** Two content registers, mapped onto the two rows: a **voice** line (brand phrases) and an **info** line (live logistics). Both, not one — a great attention grabber.
- **Per-family stack POSITION + on/off is what varies**, not the shape — loud-and-high for Cheerful/Rustic, a mid-stack divider for Modern, off-by-default for Cozy/Dark/Luxury.

### Per-family stack order (proposed, NOT locked)

Alex surfaced that each family will have a **different stack order** — which is the settled Family-Layout-Model direction ("each family stacks differently"). I designed the six stacks (`tmp/mockups/family-stacks-v1.html`), Alex said "not much difference between families" — a fair hit; I'd anchored all six to Main Street's backbone and shuffled lightly. Rebuilt as **v2** on two strong levers: **what each family opens with** (Cozy → the maker; Modern → the grid; Luxury → the collection; etc.) and **how long the stack runs** (Dark four sections, Cheerful eight). These stacks are a **proposal, not ratified** — they get decided with Alex and wired with the family layer.

### Building the Marquee (three passes, corrected twice)

1. Built `MarqueeBeat` (one shape), CSS in `skinVarsCss`, an optional authored schema field, `?marquee=` preview seeded with hand-typed sample phrases.
2. **Alex: "NOTHING should be hardcoded."** The seed phrases were the offense. Rebuilt: content **assembled from the store's own copy + live data** (`buildMarqueeLines`), two lines, `?marquee=` became a pure on/off toggle. Only literals left are punctuation separators.
3. **Alex: sections should be complete and ready to plug into onboarding — am I wrong?** He's right, and the marquee fell short: it *derived* its voice from other sections and only showed via the preview flag — a shell, not onboarding-complete like the other sections. Fixed it correctly: the **copywriter authors `marquee.voice`** every build (build all sections at onboarding), it normalizes + persists in the envelope, and `buildMarqueeLines` prefers the authored voice (legacy stores fall back to deriving). The info line keeps assembling from live data. Maker-edits-own-marquee stays a later editor feature on top.

### Formatting fix

The two rows collided — both big display type 2px apart, so descenders/caps crashed and read as garbled overlap. Fix: info line a step down (`cardTitle` vs `goodsHead`), a real 14px gap, `line-height:1` so glyphs can't bleed into the neighbour row. Alex confirmed clean.

## State at end

- Marquee is a build-complete section: Bohdi authors it, it persists, it renders when on. The auto-on/off-per-family rides with the family layer (not yet wired).
- **1333 tests green** (from 1318), tsc + lint clean. Three commits on `session-12/layout-engine`, pushed.
- Docs updated: `Family-Style-Sheets.md` (Marquee built + notes), `Family-Layout-Model.md` (row 17), the matrix subtitle, this recap, the brief.

## Lessons banked

- **A section isn't done until it's onboarding-complete.** "Renders in a preview with derived/placeholder content" is a shell. Complete = Bohdi authors it during the build, it persists in the envelope, and it comes out of onboarding like every other section. (New memory; pairs with ship-complete-not-partial and partial-systems-not-testable.)
- **"Nothing hardcoded" includes preview seeds.** A hand-typed sample list in code is still hardcoded content — derive it from the store's real content + data instead.
- **In a stack-order diagram, reordering the same sections is a weak lever.** Real perceptible difference comes from two strong levers — what a family opens with, and how long it runs — plus the section designs + paint (which a grey skeleton always under-sells).
- **The marquee attention-grab is two registers, not one** — brand voice + live info — mapped to the two rows.
