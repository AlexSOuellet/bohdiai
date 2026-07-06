# Spotlight Moment treatment — design

**Date:** 2026-06-11
**Status:** Approved direction, pre-plan
**Owner:** Claude (Lead Dev)
**Approver:** Alex

## The problem

D33 makes the Moment BohdiAI's signature, and D47 told the cinematographer to prefer video so a too-cautious model wouldn't default to safe stills. That worked for niches where the product carries natural motion — a candle flame, bread steam, hands at work, water moving. But for niches whose product is genuinely static — jewelry, stickers, finished wood, apparel, printables — "prefer video" pushes Bohdi to *invent* motion (a beam sweeping the frame for no reason, fabric in imagined wind, a finished piece turning on its own). The synthetic motion reads as the AI-builder slop the platform is specifically supposed to never produce.

The fix isn't to roll back to image-first — that swings back to the failure mode D47 was correcting. The fix is to give Bohdi a third option that's genuinely cinematic for static products: **spotlight**.

## The treatment

Spotlight already exists as a legacy layout brick: a hero object rises out of pure black over ~6 seconds, a slow push-in pulls the viewer toward it, and the wordmark and a single line fade in over the top after the object has settled. The *rise itself is the motion*. The reveal is the story. It is its own kind of wow — silent, cinematic, no fake atmospherics — and it fits any static-product niche without needing the product to do something it doesn't naturally do.

The legacy file lives in the old layout path (`components/storefront/layout/primitives/Spotlight.tsx`); we rewrite the behavior as a Main Street Moment treatment that consumes the skin's tokens and the same authored content the video Moment uses. The legacy file is not load-bearing; the behavior is what matters.

## The core split

Two treatments only. No plain still.

- **Video** wins when the scene contains REAL ambient motion that belongs to the subject — steam off bread, a flame, water moving, hands at work, dust in light, a kiln's glow. The motion is the soul of the craft and the Moment lets the customer feel it.
- **Spotlight** wins when the product is at rest and inventing motion would be the wrong move. The rise out of black, the slow push, and the words landing on top are the cinematic frame.

The criterion Bohdi judges against: *would I have to invent the motion to fill the time?* If yes, spotlight. If the motion is already there, video. There is no "plain still" branch in normal flow — the legacy `image` kind stays in the schema only so already-built stores keep rendering correctly.

## The story question (spotlight has none)

A video Moment carries a multi-line story (3–5 lines) that cross-fades over the ambient footage — the video is the ambient texture, the words are the narrative arc. Spotlight inverts that: the reveal IS the arc. The object emerging from black is the narrative. Layering 3–5 cross-fading story lines on top would compete with the visual reveal and dilute both.

So spotlight uses one line, not a story. The legacy version had it right: eyebrow, brand (wordmark), one line, CTA. The line is a tagline-strength sentence, not a story arc; the rise carries the meaning, the line punctuates.

This means the copywriter authors different content depending on the kind: a multi-line story for video, a single tagline for spotlight. Either we have the trajectory decide the kind upfront so the copywriter knows when writing, or the copywriter writes both forms and the renderer picks. Implementation detail to settle in the plan; the design constraint is just that spotlight gets one line, video gets the story.

## Cinematographer's scene

For both kinds Bohdi authors the same structured scene (composition, subject, environment, atmosphere, lighting, style) — the prompt feeds the image/video model. The only differences:

- **Video**: in-frame motion that belongs to the subject, camera locked (D52 still holds). The seven prompt groups plus the camera-locked physics rule.
- **Spotlight**: a hero object framed centrally on pure black, lit as if a single beam fell on it. The object description matters more than the environment because the environment IS black. The "camera" group describes the lens/framing of the static shot — the rise and push happen in CSS at render time, not in the generated still image. So spotlight generates a single high-quality still of the object; the cinematic motion is added by the renderer.

The text-in-image guard (no titles, logos, lettering in the frame — image models can't render legible type, and the engine owns the wordmark) applies to both kinds, unchanged.

## Renderer

`MomentHero.tsx` already paints the video and (legacy) image kinds. A spotlight branch is added: pure black background, the generated still positioned and faded in via the rise animation, a slow CSS push-in, then eyebrow / wordmark / line / CTA fading in over the top once the object has settled. The reveal timing reuses the legacy component's rhythm (6s rise, 20s push, words after ~4-5s). The cold-arrival intro overlay (D44) keeps working the same way: it plays first, lands, waits for the "Enter site" click, then melts into the rested spotlight scene underneath. The melt is a fade; nothing about it changes per-treatment.

The skin's tokens still own typography and color — the spotlight branch reads from the same skin vars the video Moment uses, so spotlight changes character with the mood like every other beat.

## Schema

The MediaSlot's `kind` enum widens from `'video' | 'image'` to `'video' | 'image' | 'spotlight'`. The `image` kind stays as a legacy form so any tenant whose stored envelope predates this change keeps rendering. The cinematographer never produces a new `'image'` Moment — only video or spotlight. No data migration needed; existing rows are valid.

## What this is NOT

- Not a rewrite of the Moment system. The intro overlay, the cookie gate, the Enter button, the skin bridge, the brand/CTA landing — all unchanged.
- Not a rollback of D47. We still prefer cinematic motion over a static frame; spotlight is *cinematic motion* (the rise), not a still.
- Not a niche-by-niche rule. The criterion is a judgment Bohdi makes per shop from the trajectory and the story, not a niche lookup.

## Open detail (plan-stage, not design-stage)

Where in the crew pipeline does the video-vs-spotlight decision land? Three candidates: the director picks it as part of the trajectory (so the copywriter knows when writing the story-or-tagline); the cinematographer picks it after the copy is written (matches today's pipeline but means the copywriter must hedge); a small pre-step decides it. Settled in the implementation plan, not here.

## Testing

- The cinematographer can pick `'spotlight'` when the trajectory + story describe a static hero object.
- The cinematographer's criterion test ("would I have to invent motion to fill the time?") is exercised by a prompt review against a couple of representative trajectories (a candle maker → video; a sticker maker → spotlight).
- The renderer paints the rise, push, and word reveal in the right order, with reduced-motion respected.
- An existing tenant whose stored envelope has `kind: 'image'` still renders (legacy compatibility).
- The intro overlay still plays cold and dismisses on Enter, with spotlight underneath.
