# Moment Probe — Findings & Derived Brick List

**Date:** 2026-06-01 (Session 19)
**Authority:** Feeds `Moments-Engine-Spec.md` build-sequence step 2. The spec, the Master Spec, and the Golden Rules override anything here.
**Read with:** `Moments-Engine-Spec.md`, `Functional-Pages-and-Moments-Direction.md`.

---

## What this is

Build-sequence step 1 of the Moments engine: hand-build the intro Moment in the **current** layout language, push until it breaks, and derive the exact list of missing expressive "bricks" — from range, not from any one example (Posy is a point in the range, never a target).

This is the honest record of that probe and the brick list it produced. It is **not** a green light to build the bricks yet, and it changes nothing about the functional pages.

## The scope reframe (locked with Alex this session)

The wow now lives in **one** surface: the intro Moment. Alex stated it directly — he has come from wanting a wow *site* to wanting a wow *intro*. This is deliberate and it is the right shape:

- **The Moment** = a cinematic, motion-led, art-directed **wow intro**. One generated surface, different every time per niche + mood, never templated.
- **The functional pages** = tidy stacked documents (home, shop, about, product, cart). Stacked is **correct** for them, especially now that they paint the design system. This is decided and not a problem. The two hand-built studies are their quality bar (Track 1, separate, unbuilt — Bohdi can't yet compose to it).

Concentrating the wow in the intro is what *lets* the documents stay calm. The expressive risk and the magic both live in one place.

## What we actually did

- Hand-built one moment — **candles · cinematic** (cozy/dark): a real candle photo, brand + line + "Enter" over it, on a full-height section. Viewable in dev at `/moment-probe/candles-cinematic`. (Throwaway — `app/moment-probe/`, delete when done.)
- Looked at two reference points in the range:
  - **Posy Lane Books** — the *static poster* end: tilt, broken grid, layered cover, staged reveal.
  - **augen.pro** — the *motion* end: minimalist monochrome that unfolds as a numbered scroll-driven narrative; smooth cinematic transitions and reveals. Frozen to stills it would look ordinary — the aliveness IS the design.

## The core finding

**The engine arranges space, not time. A wow Moment is mostly time.**

The hand-built candle moment came out as a dead static hero — a photo with a caption — which is exactly the ordinary thing the Moment exists to escape. It looked dead because the entire dimension that makes a Moment feel like a Moment (motion, sequence, the sense of something unfolding and alive) does not exist in the engine. The only moving thing the language owns today is the `marquee` ticker. No reveals, no transitions, no flicker, no scroll-driven anything, no video that actually plays.

A hand-built Moment in today's engine will **always** collapse to a static hero, because motion is the missing axis. That is the headline result of the probe.

## Derived brick list (priority order)

This validates and sharpens the list the prior session wrote on paper, now with evidence and a priority. Motion is no longer "the biggest gap" in the abstract — it is the gap.

1. **Motion / staged reveal / time — THE brick.** The engine has no concept of time. Needs: entrance/staged reveals (elements arriving in sequence), atmospheric loop motion (the flickering-candle feel), scroll-driven reveal/transition, and real playing video as a first-class held surface (a `video` node exists but is not used as a cinematic backdrop). Everything else is secondary to this.
   - *Evidence:* the candle moment is static and therefore dead; augen's entire wow is motion; the only motion primitive today is `marquee`.

2. **Full-screen held media.** A section that holds the full viewport behind the words — image or playing video.
   - *Evidence:* an `image` node is always a fixed-ratio box (`aspect` enum); authored at `aspect:'auto'` it collapses to zero height, and at a fixed ratio it's a strip with empty space below inside a `min-h-screen` band. There is no "fill the frame" surface.
   - *Note:* text-over-media also has no guaranteed contrast — the scrim is a gradient, not a paired surface, so overlay text inherits whatever color and can collide. A "media surface" brick should carry the contrast guarantee the design system gives flat surfaces.

3. **Tilt / off-axis.** Rotating an element off-grid (Posy tilts the cover and a word). No rotation exists anywhere in the language.

4. **Art-directed layered media.** Overlap with **scale and offset** — a large object overlapping copy, a badge floating on art. Today `overlap` has nine fixed anchor positions and no scale/free-offset; it's coarse.

5. **Mixed-type headlines.** Two type treatments in one line ("Light that *holds* the room" with the last word in the display italic). A `text` node is one role, one font — can't mix within a line.

6. **Decorative touches.** Stamps, chips, badges, atmospheric backgrounds (partially reachable via the texture system, not as composable objects).

## What stays true (the non-negotiable)

Generative, **not** templated. The bricks are general capabilities (a tilt, a reveal, a fillable media surface), never canned looks. Posy and the flickering candle are two of thousands of things that fall out — building "Posy mode" or "candle mode" would be building the exact templates BohdiAI exists to kill. Each brick must express inside the safe layout DSL that compiles to React (no eval'd freeform code), and the Moment needs its own competence floor — legibility, contrast, compositional sanity on the *generated* moment — without prescribing shapes.

## Still open (carried from the spec, sharpened here)

- **How far motion goes**, and how it expresses cleanly in the safe DSL (CSS entrance/reveal vs scroll-driven vs interactive). Start with staged CSS reveals; decide the rest with evidence.
- The Moment's **competence floor** — what it checks and how Bohdi recovers (same structured-issues pattern as the design-system validator).
- Whether the Moment is a separate route, an overlay on `/`, or the top of the home tree (SEO + first-visit/replay plumbing).
- **Mobile** as a first-class composition, not an afterthought.

## Throwaway to clean up

`app/moment-probe/` (fixtures + routes) — delete when the build moves on. Uses an existing Supabase candle photo; no config changes were made.
