# Intro Pattern 01 — Story Over Video (the gold standard)

**Date:** 2026-06-01 (Session 19). The first intro Moment Alex called **"Perfect."**
**Status:** Hand-built reference. NOT yet produced by Bohdi. This is the bar and the blueprint.
**Live reference (throwaway, do not delete until this is a real brick):**
`app/moment-probe/CandleStoryDemo.tsx` → `/moment-probe/flickering-candle-story`.

---

## What it is

A full-screen **flickering-candle video** holds the whole viewport. The candle plays alone for a breath (~0.9s). Then a **story is told one headline at a time, each line cross-fading into the next** — slow, ~3.4s per line, ~1.8s linear cross-fade — and it settles on the **brand landing** (wordmark + eyebrow + a "Step inside" CTA) which stays. Light cream type, dark radial scrim for legibility, reduced-motion-safe (opacity fades survive).

The story used:
1. "It starts with the wax"
2. "Poured by hand, one at a time"
3. "Then forty-five hours of patience"
4. "Until it throws a light that holds the room"
→ **Ember & Oak** · Hand-poured in Providence · Step inside

## Why it landed (the ingredients)

- **Motion is the wow** — a living video, not a static hero. (Static came out dead, every time.)
- **A story, not a caption** — headlines hand off to each other and build an arc: process → patience → payoff → brand.
- **Slow and deliberate** — it breathes. Fast/eased motion reads as a pop; slow + **linear** reads as a real fade.
- **Lands on the brand** — the sequence pays off on the wordmark, so the wow introduces the brand instead of just being pretty.
- No terminal punctuation in the headlines.

## The decomposition — THIS is how Bohdi builds it

The intro is two layers, and only one is hard. Splitting them is the answer to "how does a stateless, can't-imagine, one-shot AI produce this."

**Layer 1 — fixed motion machinery (a brick we build ONCE, by hand, taste baked in):**
full-screen held media · scrim/contrast guarantee · the cross-fade story sequence · slow linear timing · the brand-landing frame · reduced-motion safety. Bohdi never authors any of this. It is code.

**Layer 2 — content slots Bohdi fills (the things an LLM is actually good at):**
- **The story** — a 3–5 line narrative arc. This is *copy*, an LLM's home turf, not visual composition.
- **The brand landing** — wordmark + tagline + CTA.
- **Design tokens** — fonts/colors from the design-system engine (already built).
- **The media asset** — the one genuinely open sub-problem (see below).
- **Pattern selection** — pick this pattern (vs others) from mood + niche (appropriateness, not taste).

Bohdi does **not** design the intro. He writes a story and supplies assets; the brick renders it cinematically every time.

## Why this is not a template

Shared *motion* grammar is not what makes sites feel templated — repeated *visuals/composition* is (our own conclusion this session). Two brands both get story-over-video, but different video, story, palette, brand. And this is **Pattern 01** of a small, growing set (story-over-video · poster-reveal · quiet-hero · kinetic-marquee), selected by mood. The saved examples ARE the patterns Bohdi picks from and fills.

## The honest open sub-problem

**The media asset.** For candles we had a flickering-candle video. For a woodworker or a baker, where does the fitting motion asset come from — generated (fal/Gemini video), curated stock, or an ambient-motion still? This is narrower than "teach AI taste," but it's unsolved and it gates the pattern.

## Next (when we build it for real)

1. Turn the hand-built `CandleStoryDemo` into a real engine brick — a `stage`-family pattern that takes media + an ordered story + a brand landing, with the timing/scrim/reduced-motion baked in (extends the `stage` work from this session).
2. Teach Bohdi to author the story (copy) and select the pattern by mood/niche.
3. Solve the media-asset pipeline.
4. Grow the pattern set so it's never just one look.
