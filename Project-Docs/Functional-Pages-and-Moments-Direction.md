# Functional Pages & the Moments Engine — Direction and Honest Status

**Written:** 2026-06-01 (end of Session 18), as a handoff so the new session and all future sessions know what was done, what Alex liked, and — most importantly — the **honest status** of each piece, so nobody mistakes a hand-built demo for a solved feature.

**Not committed by the authoring session** (a parallel session was live in the same tree). Whoever reads this: commit it.

---

## The one thing not to get wrong

Two pretty example pages ("the studies") were **hand-built by Claude**, not produced by Bohdi. They prove the *engine can render* to a high bar. They do **not** mean the product *produces* that bar. Bohdi still composes monotonous stacks. A real maker's store today would not look like the studies. Do not look at the saved samples and conclude functional pages are handled — they are not.

---

## What got built and is committed + pushed (real, in the repo)

- **Renderer pass** — commit `f9aa00a`. The whole storefront renderer now reads color/font/size/weight/etc. from the generated design system instead of hardcoded Tailwind. Bands and panes paint M3 semantic **surfaces** that carry a guaranteed-readable paired text color (readable on light and dark bands by construction). Nav links inherit a readable color (the browser-blue bug is fixed). The wordmark is its own type-scale role with an optional gradient. This is the rendering **ability**, and it is solid and pushed.
- **Mood design direction → Bohdi** — commit `c07b973`. `read_mood` now returns the mood's structured rails (palette temperature, brightness, type character, texture affinity, default scheme); Bohdi's prompt already told him to use them but the data wasn't reaching him.
- **Moments Engine spec** — commit `c07b973`, `Project-Docs/Moments-Engine-Spec.md`.

## The two studies (the functional-page quality bar)

- **What they are:** two example functional-page layouts — Study A "bold editorial" and Study B "quiet, composed" — that Claude **hand-authored** using the existing engine. Code preserved at `app/_reference/functional-studies/studies.tsx` (viewable in dev at `/_reference/functional-studies`). *Currently uncommitted — commit it so it survives.*
- **What Alex liked about them:** they are the **quality bar for the functional pages** — the documents: home, shop, about, product, cart. Arranged, varied, designed documents — uneven (asymmetric) splits, images that bleed to the screen edge, a hero with text layered over the image, real surfaces, deliberate type — **not** the monotonous centered stacked-bands look that made earlier stores feel auto-generated.
- **The caveat again:** hand-built. The bar, not the achievement.

## Two separate tracks — do not conflate them

**Track 1 — Functional-page composition quality.** Getting **Bohdi** to compose the document pages to the Study A/B bar on his own. **UNBUILT.** The renderer can already do it; Bohdi can't yet. The work: teach Bohdi composition rules-of-thumb (how to think, not what to choose), add a **referee in code** that rejects a monotonous stack and makes him redo it *without prescribing the replacement* (so variety stays open), and eventually a render-see-revise "eyes" loop so he can judge his own page. The bar is the two studies.

**Track 2 — The Moments engine.** A **separate** layer: a generated brand-introduction "moment" at the front door — full-screen, poster-like, motion where the mood calls for it — with the functional pages as the tidy documents behind it. **UNBUILT.** Spec: `Moments-Engine-Spec.md`. Generated per niche+mood, never templated. Mood selects the pattern (entry screen / moment-as-home / minimal). First visit shows it; a cookie skips it on return; an "Intro" nav link replays it.

## What Alex liked / wants (captured in his intent)

- The **look of the two studies** as the functional-page target.
- The **moments idea**: some sites open on "the moment," then the functional pages sit behind it. A cookie so it doesn't replay every visit, plus an "Intro" nav link to replay it. Both patterns possible **depending on mood**. Design driven by **niche AND mood** — generated range, not one or two templates.
- **Posy Lane Books** (a bohdiai.com sample storefront, `components/storefronts/KidsStore.tsx`) as **one example** of the magazine/poster feel — explicitly **one point in the range, NOT a target to clone**. The candle-in-golden-hour-with-fading-headlines is another example. The goal is the generative range, not any single shape.

## Honest correction to the Moments spec

The spec says functional pages "stay the documents the engine already builds well." Read that as: the engine **can** build them well (the studies prove it), but Bohdi does **not** yet **compose** them well — that's Track 1, unbuilt. The word "well" describes the ceiling, not current output.

## What the engine is missing for moments (the real Track-2 build)

The engine today builds **tidy rectangles** only. Moments need expressive "bricks" it lacks, each to be added inside the safe layout language with a competence floor: full-screen **held** opening, **motion / staged reveal** (the biggest gap — the engine has no sense of time), **tilt** (rotation), art-directed **layering/overlap** with scale and offset, **richer headlines** (mixing fonts within a line), and **decorative touches** (badges, atmospheric backgrounds).

## Where everything lives

- Renderer: `components/storefront/layout/` — committed, pushed.
- Studies (functional bar, hand-built): `app/_reference/functional-studies/studies.tsx` — **uncommitted, commit it**.
- Moments spec: `Project-Docs/Moments-Engine-Spec.md` — committed.
- Session record: `Project-Docs/SESSION-BRIEF.md`, Session 18 block — committed.
