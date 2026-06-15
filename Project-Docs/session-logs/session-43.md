# Session 43 — 2026-06-15

A long testing day. Five live tests surfaced different problems; each became its own structural fix. Plus a meta-correction to D54 (yesterday's portable-Moment retirement overreached on what Alex actually agreed to). Suite went 936 → **949 passing**, tsc clean.

## What landed

### D54 corrected — Moment play-through restored, in the hero surface

Yesterday's D54 said "the Main Street hero IS the front door, no separate layer, no Enter Site click, no play-once-then-rest lifecycle, no cookie, no footer Intro link." Alex pushed back: "All I agreed to was the moment playing in the hero, not before." The portable LAYER was supposed to retire; the play-through itself was supposed to stay, just in the hero surface instead of on an overlay above it.

D54 was edited in place with a correction note explaining the overreach, then the substance was rewritten to keep the play-through, the cold-front-door cookie gate (D44 refined, not killed), the deep-link bypass, and the footer Intro replay. What's actually gone: the separate portable layer, the Enter Site click, the SpotlightStage.

Code: `lib/archetypes/main-street/moment-gate.ts` restored from the parent of Session-42's commit. `MomentHero.tsx` rewritten — held media + scrim + story lines (each cross-fading in their phase only) + brand block (visible only on the brand phase). On mount, a `useLayoutEffect` reads the cold-front-door + cookie decision; if play is on, the phase flips to 'open' before paint to avoid a flash of brand. The timeline auto-progresses; landing on 'brand' writes the per-shop seen cookie. `MainStreet.tsx` threads `momentKey={tenantId}` through, builder.tsx passes it. Footer Intro replay link restored in chrome.tsx.

A LOOP BUG turned up on Karen's Knits — the story repeated on one line forever. Diagnosis: my first cut tracked the current timeline position by content shape and used `findIndex(samePhase)` to advance. The timeline has two indistinguishable 'gap' phases, so findIndex always returned the first one, which advanced to line 1 again — line 1 → gap → line 1 → gap → … forever. Replaced phase-by-shape with a plain integer `step` state; the bug is structurally impossible now.

### D55 — Video vs still is an honest judgment with no default (supersedes D47)

Alex flagged Bohdi sticking a candle next to yarn on Nancy's Knits to "satisfy" the video bias I'd restored at the end of Session 42. The bias was producing tangential inventory — putting an unrelated subject in frame just to fill the motion budget on a niche whose world is at rest. AI slop, not cinema. Plus it bloats build time on niches that don't earn the video.

The fix is the framing: no default in either direction. The director picks honestly whether THIS maker's own world has real ambient motion that belongs to the subject (steam off bread, a flame, water, hands at work, light moving). The prompt names the refused failure mode explicitly: a video that has to bring in something tangential to fill the motion is AI slop. Still hero is first-class (D54's cinematic scene composition carries it). Director prompt rewritten; D55 logged.

Standing lesson: trying to encode a default by language ("DEFAULT TO X. Only Y when…") still produces bias-induced invention when the niche doesn't fit. The cleaner discipline is to NAME AND REFUSE the failure mode — biases the model against AI slop without biasing it for any particular pick.

### D56 — Dark skins carry the dark tag only, no padding non-dark subsets

Celestial Candles (elegant) landed on Gild (black + gold). Nancy's Knits (cozy) landed on Hearthstone (candlelit dark with ember). Both genuinely dark skins, both cross-tagged with non-dark moods, both showing up where they shouldn't. The D41 gate was wiring the subset correctly; the bug was upstream — the tag data itself was wrong.

Fix: untag Hearthstone, Gild, Curiosity, and Darkroom from any non-dark moods. They keep the `dark` tag only. A skin's mood tag should reflect what it IS, not the world it lives in. Counts after: Dark 6, Rustic 7, Cozy 6, Modern 8, Elegant 4, Playful 6, Industrial 6. Elegant shrinks to 4 (porcelain/atelier/conservatory/celestine) — small but coherent, every entry genuinely refined-and-light. The `>=5` floor in the test contract dropped to `>=4`.

Alex caught a follow-on: Peter's Pipes (industrial) landed on Forge (cold blue-charcoal) and Bill's Buns (modern) on Anvil (near-black). Different pattern from Cozy/Elegant — Forge IS a legitimately industrial skin (forge / workshop / iron) and Anvil IS a legitimately bold-modern skin (butcher-sign-bold / Bauhaus poster). Alex's call: leave them in. The dark-stands-out-because-I'm-testing is selection bias; an average maker sees one build and the skin-swap in the editor (asked + confirmed during this session) is the safety valve.

### Knitter niche file synced to DB

The Session 42 rewrite ("Knitter" no longer conflated with "Yarn Maker / Indie Dyer") was sitting at `status: draft` in the file — Bohdi was still grounding off the old conflated row. Synced the new prose + new aliases + new related_niches into the niches table, changed display_name from "Knitter / Yarn Maker" to "Knitter", flipped status to approved. Markdown frontmatter updated to match.

### Director's trajectory logged on every build

Alex asked whether the crew was actually executing what Bohdi the Director said. Audit confirmed the plumbing is faithful — the trajectory is pasted into every specialist's system prompt verbatim, the cinematographer is forced to match heroKind, the graphic artist picks within the mood subset, the Director's Cut re-validates everything. But the trajectory itself was never persisted; it only lived in memory during one build. So if a build came out dark when we didn't expect it, we couldn't go back and see whether the Director said dark or one of his crew drifted on him.

Fixed: added a `'trajectory'` row to `design_choices` on every build, carrying the full {feeling, customerWhy, visualWorld, heroConcept, register, heroKind} payload. Now any divergence between what Bohdi said and what we got is visible in the data.

### D57 — Schema validates shape only; build NEVER fails on copy, ANY field

A live build died at 4 retries because shortDescription was 92 chars over a 90 cap. The Session-42 byte-for-byte resubmit instruction wasn't converging — the model kept landing at 90-92. Alex: "stop this error from happening on ANY field. Not an acceptable outcome in production."

D53 already said "the build never fails on copy" but kept hard caps on structural fields including shortDescription. That contradiction surfaced under the model's failure-to-converge. The resolution: the schema layer validates SHAPE only — right fields, right types, right enums. No `.max()` on any string. Punctuation rules (the headline-no-sentence-punctuation, the story-line-no-punctuation, the slug format) become server-side normalize transforms that strip the bad characters and slugify, not reject. `.min(1)` floors stay so a required string can't be empty.

A new `lib/onboarding/crew/normalize-copy.ts` runs after every successful Copywriter parse (and after every revised-copy parse in Director's Cut). Accepting transforms only — never throws.

Then Alex caught the shortcut. I declared "the renderer absorbs whatever the model writes" while only having added line-clamp to one surface (product card shortDescription, the failure that started it). A long ctaLabel would still stretch a button; a long nav label would still break the bar; a long story line would paragraph-wrap and stop reading as one breath. Did the proper render-layer audit: one block of CSS in `skinVarsCss()` scoped by `data-type` role, so every type role in every component gets the right strategy. Single-line with ellipsis at a sane max-width for buttons, nav labels, wordmark, attribution, calendar location. Line-clamp for story lines (3), card titles (2), card captions (3). Max-width in ch units for display headlines so they wrap rather than stretch. Comfortable measure (60-70ch) for body prose. `nowrap` on price, day, legal links.

Combined: the build can no longer fail on copy on any field, AND the page can't break visually no matter what length lands.

## Standing lessons banked from this session

- **Don't carry a decision past what the user agreed to.** D54 as I wrote it yesterday went beyond Alex's actual agreement (retire the portable layer + Enter Site click) by also killing the play-through, the cookie, and the footer Intro link. He hadn't agreed to any of those. Decision-log entries that quietly expand scope are themselves a drift problem; if a substantive piece wasn't talked through, it doesn't go in.
- **A constraint that can cause non-recoverable production failure on a non-physical property (length, formatting) is itself the bug.** Session 42 said "remove the constraint, don't trim the content." D57 generalizes that across every authored field: the schema's job is shape, not quality. The renderer carries visual discipline.
- **Name the failure mode, don't encode a default.** D55's "always reach for video" produced tangential video; the corrected D55 says "video when the world honestly has motion, still when it doesn't — tangential invention is the refused failure mode." Naming the slop pattern biases the model against it without forcing a direction. Sharpens the Session-42 lesson about "DEFAULT TO X" still leaking bias.
- **A tag's value is what the thing IS, not what world it lives in.** D56: Hearthstone is dark even though its world is warm-Hearth; Gild is dark even though its world is luxe-Fine. A skin's mood tag should reflect its rendered register, not its semantic category. Generalizes to any metadata-driven gate: tag from the artifact's behavior, not its lineage.
- **A "structural fix" that only fixes the failure surface is a shortcut.** Caught me on D57: I removed all schema caps but only added overflow handling to the one card surface that had blown up. Alex asked "is this a shortcut?" — yes. The proper fix did the full render-layer audit. When the framing changes (schema-checks-shape, renderer-handles-visual), every render site that lived under the old framing needs auditing, not just the loud one.
- **Track timeline progress by index, not by content shape.** The MomentHero loop bug. Two phases that look the same to a shape comparator (the two 'gap' frames) are indistinguishable — findIndex always returns the first, advancement breaks. A monotonic step index can't have this bug.

## What's open

1. **Live-test the Moment play-through** — cold first visit, returning visit (cookie present), footer Intro replay, deep-link arrival.
2. **Live-test a few moods that weren't tested today** — Playful and Rustic in particular; we hit Cozy, Elegant, Modern, Industrial.
3. **Skin picker in the maker dashboard** — confirmed as the architectural answer for "I picked Industrial but want a different skin in the subset." Phase 1 build when the editor lands.
4. **Wipe test tenants when ready.** The old layout_tree rows from before today's changes carry legacy skin picks and the old D54 still-hero rendering. Same SQL as before.
5. **Mood picker cards all-dark UX bug** — still open from Session 42. Every card sits on near-black; would re-do each card to show its actual feel.
6. **Niche audit beyond knitter** — crocheter + soap_and_bath spot-checked. Rest of launch set not.
7. **Woodworker niche-file rewrite** (cutting-board fixation, Session 41).
8. **Pick-most-prominent-readable** brand-color refinement.
9. **Wordmark-logo doubling toggle** when the logo includes the shop name.
10. **Audit backlog still: A2 (transactional storefront write), A3 (silent build-status errors), A4 (pipeline timeout budget), B1 (proxy x-tenant-id strip), Phase C (security launch-gate, blocked on auth), Phase D code cleanup.**
