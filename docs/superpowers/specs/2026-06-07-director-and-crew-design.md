# The Director and Crew — Generation Architecture

**Date:** 2026-06-07
**Status:** BUILT (Session 33). The five-stage pipeline (`lib/onboarding/crew/`) is live and replaces `authorStore`; two live builds succeeded. Departures from this spec, decided during the build: no "prefer video" default (the cinematographer chooses freely — video-default was judged bias); no length caps on non-rendering fields (scene groups, image prompts, trajectory) — caps only protect rendered layout. Open follow-ups from the live walk are tracked in the Session 33 brief (Moment must become a portable play-first layer per D43; type scale too large; gender-neutral portrait per D42; contact form; mobile).
**Supersedes:** the single-pass `authorStore` authoring model for Main Street.

---

## Why we're doing this

Today one overloaded Bohdi call authors the entire storefront — the style/skin pick, every word, the Moment scene, the product copy, the image prompts — in a single pass against one ~130-line instruction block. Every quality failure we hit this session traces back to that one fact: a single model doing everything thinly, with no unifying creative direction holding the pieces together.

- The Moment came out a dull, literal still (a fridge; a candle on a windowsill) instead of a cinematic, emotional video.
- The copy drifted to maker-process jargon ("20-mil stock, hand-trimmed on a guillotine") instead of selling the customer's desire.
- The big display type shouted *over* the cinematic footage instead of serving it.
- A "modern" mood produced a cream-and-didone skin, because nothing routed the look toward the modern end of the shelf.

These are not separate bugs. They are symptoms of missing direction. The fix is to make Bohdi a **director** who sets one creative trajectory from niche + mood, and to give the actual craft to specialists who each match it.

## The model

**Bohdi is the Director.** He hires a crew of three specialists. The maker only ever meets Bohdi.

- **Copywriter** — every word.
- **Cinematographer** — the Moment video.
- **Graphic Artist** — the visual look (skin selection + image lighting/grade direction).

Bohdi reads niche + mood and sets a **trajectory** — one creative North Star. The crew each execute their craft *to that trajectory*. A short **Director's Cut** at the end checks the pieces land as one feeling.

**The static engine does not change.** The renderer, the Main Street archetype composition, the content schema shape, persistence (`write-archetype-storefront`), and the media-generation seam all stay exactly as they are. The crew produces the *same* content envelope (`MainStreetAuthored` = content + products) the engine already consumes — just authored far better. We are replacing the authoring brain, not the rendering body. This is what keeps every build professionally composed and slop-free: nobody, not even a specialist, can touch structure, layout, or type discipline.

## The Trajectory (the Director's output)

Bohdi's only job is to turn niche + mood into a small, structured, validated brief. Fields:

- **feeling** — one line. The emotional North Star (e.g. "the hush of an empty, light-filled coastal morning: calm, modern, quietly upscale").
- **customerWhy** — why a customer chooses this maker's category over store-bought; the desire the store answers.
- **visualWorld** — the look direction in plain terms: warm-craft vs clean-modern vs bold, the light key (high-key bright / low-key moody), contrast level.
- **momentConcept** — the cinematic idea for the hero: subject, the motion worth filming, the grade.
- **register** — loud vs restrained type, so the Graphic Artist's typography is briefed to serve or lead.

The trajectory is data: inspectable and tunable on its own. When a build comes out wrong, you read the trajectory first and can tell instantly whether Bohdi set the wrong vision or a specialist failed to execute a right one.

## The crew

### Copywriter
- **In:** trajectory + niche body (for vocabulary/context) + the content schema (which fields to fill).
- **Out:** all words — moment story, eyebrow, brand, CTAs, goods title/label, founder quote, about story, contact, product names + descriptions.
- **Rules (carried from Session 32's voice work):** sell the store emotionally; write to the customer's desire, not the maker's process; stay at the category level (a "candle maker," not a "soy candle maker"); no process/materials jargon; no AI-tell; the maker adds their own specifics post-build.

### Cinematographer
- **In:** trajectory (esp. `momentConcept`) + the Copywriter's story (so the video carries the same feeling as the words).
- **Out:** the Moment hero spec as JSON (composition, environment, subject, motion, lighting, grade/visual-effects) + the video/still decision.
- **Hard constraints:** 5–6 seconds, 16:9, 720p, seamless loop, **no human motion that breaks the loop** (a *still* human — hands resting on clay while the wheel spins — is fine), atmospheric/cinematic grade (low light or a mood filter; the grade is the cinematographer's job).
- **Video/still:** video is the default — motion is the Moment's signature. A still only when the concept is genuinely motionless. Automatic fallback to a cinematic still if Kling generation fails or times out, so a store never ships heroless.
- **Reference:** the retired `INTRO_MOMENT_PROMPT` (in `lib/bohdi/system-prompt.ts`) is the proven craft for cinematic moments — mine it for the Cinematographer's prompt.

### Graphic Artist
- **In:** trajectory (`visualWorld`, `register`) + the Copywriter's story + the Cinematographer's video spec + the **mood-aligned skin subset**.
- **Out:** (a) the skin selection, chosen from the mood-aligned subset so a "modern" trajectory lands a modern skin; (b) image direction — lighting/grade phrases written into the product and founder image prompts so the stills match the mood; the type serves the video per `register`.
- **The skin-selection wiring (the guardrail that was built but never connected):** `MAIN_STREET_SKIN_TAGS` already tags every one of the 29 skins with a world and a mood set, but **nothing in selection reads it** — Bohdi free-picks from text descriptions with mood as a loose hint (confirmed: the tags are read only by a dev script and tests). The Graphic Artist must choose only from the skins whose mood tags align with the trajectory's mood, and the pick is validated against that subset. The shelf is genuinely diverse (dark, bold, modern, playful, rugged all exist); the gap was always selection, not the shelf.

### Director's Cut (Bohdi again)
- **In:** the assembled pieces (copy + skin + video spec + image directions) + the trajectory.
- **Out:** a coherence pass — does it land as one feeling? Catch type fighting the video, a flat line, an off-trajectory image, and adjust. This is the coherence guarantee, and it is in scope, not optional.

## Orchestration

A deterministic pipeline (`directAndProduce`, replacing `authorStore`) runs the stages in code — director → copywriter → cinematographer → graphic artist → director's cut — sequentially, and assembles the result into the existing `MainStreetAuthored` envelope. The model never decides control flow; Bohdi "directs" through the *content* of the trajectory, while code is the stage manager. This is what makes each specialist independently re-runnable and tunable.

- **Sequential, not parallel** — for coherence: the Cinematographer sees the story; the Graphic Artist sees both the story and the video. (Parallel + a reconcile pass is the fallback lever if build time becomes a problem.)
- **Per-call timeouts** on every stage (this also closes the long-standing "no timeout on Bohdi's authoring loop" gap).
- Archetype is always Main Street (only one archetype exists); there is no `choose_format` step anymore — the skin moves to the Graphic Artist.

## What explicitly does NOT change

The renderer, the archetype composition, the `MainStreetContent` schema shape, `write-archetype-storefront`, `mediaJobs`/`applyMedia`/`toPayload`, and the skin shelf itself. The video-storage fix and video-default flip from Session 32 stay.

## Build order (all shipped before "done" — nothing deferred)

1. Trajectory schema + Director call.
2. Copywriter.
3. Cinematographer (+ video/still decision + still fallback + 5-6s/16:9/720p).
4. Graphic Artist (+ wire `MAIN_STREET_SKIN_TAGS` into mood-aligned skin selection).
5. Director's Cut.
6. Replace `authorStore` with the crew pipeline; per-call timeouts; assemble into the existing envelope.
7. Run a real onboarding and walk the whole site.

Each step lands with tests; the whole crew is the finish line.

## Cost and time

Measured baseline: a full Main Street build *with a Kling video* ran ~3.5 minutes (iron-ash 3:29, creative-clay 3:28) — the video generates in parallel with the photos, so it does not serially add four minutes. The crew adds ~30–60 seconds of sequential orchestration (four to five focused calls replacing one pass), landing a video build around 4–4.5 minutes. Dollar cost barely moves: the extra Claude calls are pennies; the fal media generation (the real cost) is unchanged because the asset count is the same. Levers if time matters: run the three specialists in parallel; use a cheaper/faster model for the mechanical roles (skin pick) and reserve the strong model for the creative ones.

## Open gaps — status

**Closed by this design:**
- Skin tags unwired in selection → the Graphic Artist's mood-aligned selection wires them.
- Mood barely moves the look → same wiring.
- No timeout on the authoring loop → per-call timeouts in the pipeline.

**Already fixed in Session 32 (independent of the crew):** deepen pass removed; home navbar; uploaded logo shown; image-directive regression (positive realism cues, front-anchored gender); Moment pacing; video-default + video persists to storage; professional legal copy; Bodoni Moda retired (Atelier → Space Grotesk); product detail plays video.

**Partially addressed:** maker portraits trending to the same FLUX "type" — the Graphic Artist's portrait direction can vary it, but this is not the focus.

**NOT in scope (remain separate work):** try-on "make live" + owner-gating of `?v=`; the live route for maker-added custom pages (template exists); real checkout / commerce (line items + payment, unbuilt platform-wide); on truly ambiguous/unknown maker names the gender still defaults female.
