# Bohdi Build Quality — Design Notes

**Date:** 2026-05-30 (Session 14)
**Status:** Working design notes from a long conversation. NOT locked decisions. Product calls flagged below need Alex's confirmation before they enter the Decisions Log (capture protocol: Claude drafts, Alex corrects drift, then it lands).
**Read this at session start** alongside the Session Brief — it's the current thinking on the top goal.

---

## The mission, sharpened

Top goal: **get the build right.** Everything else — copy, positioning, brand voice — is downstream and becomes a lie the moment the site is ordinary.

The bar is not "designer-grade" as an abstract quality. It's a storefront with **feeling** — one the maker would sit and hit refresh on, just to re-experience what their visitors feel. A place, not a document. The framing that captured it: **we are creating for creators; it cannot be ordinary.** Ordinary tells a creator their work is ordinary, and that's the one thing this audience can't be handed.

Userbase reality check (ego removed): makers cannot name "designer-grade" or tell award-tier composition from a clean Shopify theme. What they feel sharply is the difference between "generic" and "this looks like ME and I'm proud of it." So the artistry is not what they value — it's what *produces* the thing they value: pride, legitimacy, a little disbelief. The bar that matters to them: **unmistakably theirs, and still a comfortable store to buy from.** Don't overshoot into experimental art that scares them or hurts conversion. The mood system lets the maker self-select how far to push.

## The diagnosis — why Bohdi makes slop

- **Concrete evidence:** cathys-candles home page is nine full-width, single-child bands stacked top to bottom. The palette alternates nicely; the geometry is a monotonic vertical stack. That's the AI tell, in one picture.
- **Root cause:** Bohdi one-shots. He composes the layout as JSON and **never sees the rendered page**, never judges "is this ordinary," never revises. The feeling in the three sample sites came from iterative **work** — build, look, react, redo — between Alex and Claude. Bohdi skips exactly that work. The feeling lives in the part of the process he doesn't do.
- **Instruction does not fix it.** His prompt already says "vary structurally, don't just stack bands." He stacks anyway. Same pattern as a Standard-American-Diet-trained doctor told to "consider keto" — reverts to training. The model's default is the internet average, and the internet average is slop. Telling it harder doesn't move the output.

## What "intended" actually means

The three sample mockups (`components/storefronts/SourdoughStore.tsx`, `TattooStore.tsx`, `KidsStore.tsx`) are hand-built React/CSS marketing mockups. They are **examples of the bar — NOT templates, NOT mood definitions, NOT a system to reverse-engineer.** Do not let Bohdi clone them. Do not let them define moods. (Guardrail Alex set explicitly: he does not want every site looking like June's Sourdough.)

"Intended" = every choice looks **decided**, not defaulted. It comes from three things:

1. **Copy that's specific and real** — a number, a place, a time, an ingredient. Never platitudes. (June's: "baked Friday night," "Hope Street Farmers Market," "Sunflower + flax." Posy's: "Posy's foxes look like the ones in our backyard," blurbed by School Library Journal.)
2. **Fine craft** — negative letter-spacing on display type, mixed weight/style/color within a single headline, a palette accent held in reserve (used once), hairline borders, varied/considered spacing and radii, a whisper of texture or gradient over flat color.
3. **Total commitment to the maker's specific world.** Posy Lane (children's books) is the strongest of the three because form became content: handwritten + chunky rounded type, the book cover as a tilted hero object with stacked shadows, a sticker stamp, crayon-colored chips, bedtime-story copy. You could not swap a different business into that layout without it shattering.

**Key insight:** a large part of "intended" is NOT exotic geometry. Even at a near-identical structure to Bohdi's, June's feels intended through copy + fine detail. So a real lift is achievable on the structures Bohdi already builds.

**The brutal test for uniqueness:** "Could this be any business, or is it unmistakably *this* one?" If you could swap a different maker in without the design breaking, it hasn't committed, and it isn't done.

## Why instruction and self-awareness won't fix it

- Telling any agent (Bohdi, an AI critic, or Claude itself) to behave differently does not hold. Instruction is the weak lever. **Self-awareness is just instruction pointed inward** — also doesn't hold (demonstrated live in this session: Claude was fully aware it fawns, discussed it at length, then fawned again the next turn).
- AI critics **fawn** (default to praise) and **rationalize** (defend anything). Stacking an AI critic on an AI maker is two rationalizers shaking hands. A critic-of-the-critic is turtles all the way down. **You cannot fix AI rationalization with more AI.**
- The only reliable corrector is something **outside** the agent that cannot be talked to: deterministic **code**, or a **human**.
- Code can't fawn or rationalize — it counts. It can measure most of the **slop floor**. It cannot measure "soul."
- The human (Alex) has taste and doesn't rationalize — but does **not** scale, and **will not be the per-site production gate.** (Hard constraint.)

## Capability note

Our stack (Next.js / React) can express nearly anything — including the bold moves (rotation/transform, illustrated backgrounds, badges, full-bleed video heroes, fine type control). Whatever the layout engine doesn't expose today is a **build list, not a wall.** Capability is not the constraint; effort and fit are. Surface effort and fit as information for Alex — never kill an idea by deciding for him that it's "too hard."

## The NOW build (Claude via API; no model training)

Three parts. Bar: clears the slop floor, shows real intention, does not embarrass us.

1. **Materials** — feed Bohdi a *range* of strong examples so he pattern-matches against good work instead of the internet average. A range, never one, so he abstracts the principle rather than cloning a template.
2. **Work loop** — Bohdi builds → the page is rendered → he **sees the rendered result** (vision) → judges against the concrete bar → revises. Replace the single blind pass with make → see → judge → fix.
3. **Code floor** — deterministic checks that mechanically **reject** slop tells before anything ships: e.g. N identical full-width bands, no accent color held in reserve, default/untuned type, platitude copy with no specifics. Code is the non-rationalizing gate. **Bohdi's words are not an input to the verdict** — only a changed rendered artifact moves the gate.

Note on a critic: an AI critic, if used at all, is a **helper that suggests** — it never gets passing authority. Passing authority lives with code (for the measurable) and, eventually, a human or a learned taste model (for the fuzzy). Current lean: code floor + work loop as the core; AI critic optional.

## Product directions discussed — NEED ALEX'S CONFIRMATION (not locked)

- **Drop the "5-minute / live in minutes" promise.** Sell the work-of-art / craft instead; let the build take the time it needs. A real designer doesn't deliver in five minutes, and the speed brag actively undercuts the craft promise. (Aligns with the existing open item to drop "live in minutes" from marketing.)
- **Fill the build wait with productive onboarding** — set up email, upload product photos — and/or a "what's next" video, so the wait is real work rather than a fake progress ticker. Protect a deliberate **reveal** moment (don't let the maker stumble into a finished site). Uploaded photos become the real catalog, layered in after; the build never blocks on them; keep it optional.
- **Copy should respect the maker's artistry / build up their "makerness"** — but *shown* specifically, never claimed in platitudes (platitudes are themselves the AI-tell). The copy is only as true as the site is good.

These touch onboarding philosophy and marketing — arguably Master Spec / scope level. Flag for Alex before acting.

## Open questions / Alex's calls

- **Missing mood?** Posy Lane (children's books) didn't map to any of the seven moods (DARK / RUSTIC / COZY / BOTANICAL / SUNSET / SIMPLE / MODERN). Is there a missing PLAYFUL / JOYFUL mood, or is "fun" just niche commitment? Alex's call — the mood lineup is his.
- **Build image/video source** — generate per-maker (fal video, pricier and slower), stock loops, or maker upload. Open.
- **Work-loop judge** — code floor only vs. code floor + AI critic-as-helper vs. self-review. Leaning code floor + loop.

## Parked — explicitly NOT now

- **Training our own model.** Off the table for now per Alex; do not spend time on it. (Noted in passing: the labs may deliver persistent memory and on-the-fly adaptation as a platform feature, which could make an own-model unnecessary. Parked regardless.)
