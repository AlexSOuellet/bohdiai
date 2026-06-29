# Session 58 — Collections section: six per-family bands, built into the engine

**Date:** 2026-06-29 · **Branch:** `session-12/layout-engine`

## What we did

**Built the Collections section — six bands, one unique SHAPE per family — designed, approved, and wired into the engine.** A collections band shows GROUPS the shopper enters, never products, so none of them rhyme with the eight goods treatments. Each is a home-page *teaser* (two or three collection covers + name) pointing at the Collections page.

The six (family default in parentheses):
- **Cupboard** (Cozy) — wide labeled shelves stacked down the band, a pinned paper slip on each.
- **Crates** (Rustic) — stacked wood crates, names stenciled on the wood; one tall crate beside two.
- **Portals** (Dark) — tall lit doorways emerging from shadow (a black scrim painted OVER each cover, so it reads on any skin), an ember floor-glow in the accent.
- **Chapters** (Luxury) — a couture lookbook contents page: gold roman numerals, gold hairlines, one refined plate per chapter, generous air.
- **Color lanes** (Cheerful) — full-width candy bands (one accent → three distinct colors via `color-mix`), a punched circular cover.
- **Cascade** (Modern) — a diagonal of overlapping covers stepping across the band; quiet, image-forward.

### How it was built
- Designed first as a static mockup (`tmp/mockups/collections-bands-v1.html`), iterated live with Alex until all six were approved.
- Then built into the engine as real components, **mirroring the goods-treatment pattern**: a pure registry (`collections.ts` — the six keys, Bohdi's menu, `CollectionView` moved to shared `content.ts`, `CollectionsSection`, `sampleCollections`), six skin-agnostic class-only components (`Collections{Cupboard,Crates,Portals,Chapters,Lanes,Cascade}.tsx`), and a `CollectionsBeat` dispatcher.
- **Skin-agnostic + class-only throughout** (CSS variables + the `Type` component; no inline styles, no literal colors — the only literal blacks are scrims OVER cover photos, like MomentHero). The treatment CSS lives in `skinVarsCss` (`chrome.tsx`).
- **Six components built by parallel subagents** (one per band), each translating its approved mockup band + returning its CSS block; integration (CSS assembly, dispatcher, schema, wiring) done by hand.
- **Wired into the home**: the band renders whenever a store HAS collections — structure derived from what the store holds, not an editorial pick (consistent with "Bohdi no longer curates structure"). Threaded through `MainStreet`, the spec `render`, and a **`?collections=` preview** (route → `StorefrontPage` → `render`), with **sample collections seeded** so every band is viewable on a real store (placeholder, not labeled — same model as sample products/dates). Real collections load from the `collections` table (count + cover derived from the catalog).
- Per-family defaults recorded in `Family-Style-Sheets.md` + `defaults-matrix.html`. **No family→default-Collections wiring in code yet** — arrives with the family layer, same as goods / About / Nav.

**1318 tests green (+36 new), tsc + lint clean.** Committed on `session-12/layout-engine`. Approved live by Alex on Soul Splatter Bright (`?collections=…`).

## Also this session
- **Traced the Session-57 "Events not on the navbar" bug → it was a stale dev view, not a bug.** Production serves Events correctly (verified the live HTML — Shop/About/Events/Contact/Cart, fresh cache MISS); the stored nav genuinely includes Events. The report was against local dev; Alex confirmed Events shows on all navbars after a look. No code/data fix — closed.
- **Direction confirmed on the nav:** the customer ultimately picks what's in the nav. Every section gets an enable/disable; nav-eligible sections can be turned on in the nav. NOT auto-derived, NOT Bohdi's pick — maker-controlled toggles in the editor (that dashboard section isn't built yet; we'll fix nav membership there). Alex also drew a hard line: **do not autonomously choose which family gets what — we decide that together.**

## Lessons banked
- **When two things are "too similar," confirm WHICH one to change before touching either — and never throw away the one the user liked.** Asked to fix a cupboard/manifest rhyme, I changed the wrong band (cupboard, the keeper), then later killed the manifest entirely when Alex wanted it *kept and re-fonted*. Repeated overcorrecting off single comments. A specific, costly instance of `feedback_hold_full_direction`.
- **In a design mockup, the SHAPE is the deliverable — fonts and images come from the generated site, so don't over-tune them in the mockup.** I burned several rounds making Modern's *fonts* "less harsh" when Alex's actual point was that the band lacked a unique *shape*; the real build inherits the family's type/imagery, so harshness was never the mockup's problem to solve. ("I have not seen you design a harsh site.")
- **Minimalist ≠ harsh, and minimalism's uniqueness can't come from a borrowed-object metaphor (the way the other families do) — it comes from a structural idea** (here, a diagonal cascade). Naming *why* Modern was hard (no object to borrow) unlocked the fix.
- **Verify WHICH environment the user is looking at (dev vs prod) before diagnosing a "bug."** The Events report didn't reproduce in prod because it was a dev/stale view. Extends "verify against live data, not memory."
