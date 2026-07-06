# Moments Engine — Build Detail & Reasoning (Session 19 handoff)

**Purpose:** so next-session-me can actually BUILD the bricks we designed, without re-deriving any of it. **Read this WITH the reference files it points to — those files ARE the working recipes.** Nothing here is throwaway; the probe files are the spec.

**Status at end of Session 19:** TWO bricks proven (story, spotlight), poster in progress. Pipeline (Higgsfield) proven end-to-end. Killed: kinetic-type, atmosphere-wash. Preview tool was dead all session — verified everything with `curl` + Playwright probes against the dev server on `:3000`.

---

## The core model — why moments are built this way

- The **Moment** is the ONE wow surface — the intro / front door. The **functional pages stay tidy stacked documents** (decided; Session 18's design-system renderer handles them; "still stacked" is *correct* for documents, not a bug).
- A Moment = a **fixed BRICK** (the motion + composition machinery, built once by us, taste baked in) + **content SLOTS Bohdi fills.** Every slot Bohdi fills is a **language task**: the story copy, the image/video **prompt**, the brand name, the design tokens, and the pattern selection. **Bohdi never designs pixels — he writes words and selects, and the brick renders it cinematic.**
- **Why this shape:** Bohdi is stateless (no memory, no training) and can't imagine or compose visually. So the taste/smarts must live in the **system** (bricks + prompt craft + niche map + example library), never in Bohdi. Same model as the color math: a deterministic system, fresh output every time.
- **Generative, NOT templated:** a *set* of bricks selected by niche + mood; the content (copy, prompt, asset, tokens) is fresh every store. Shared *motion grammar* is not a template — what makes sites feel templated is repeated *visuals/composition*, not shared motion.
- **Atmosphere, not inventory:** moments evoke the brand's *world*; they NEVER show the maker's specific products. We don't have their products at onboarding, and faking inventory enrages makers. Product showcase is a shop-page thing, post-upload — not a moment.

---

## The bricks (recipes)

### 1. Story-over-media — DONE ("Perfect"). Reference: `app/moment-probe/CandleStoryDemo.tsx`
- Full-screen **held media** (video OR still). Video: `autoplay loop muted playsInline`, `object-fit: cover`.
- Headlines tell a **story, each CROSS-FADING into the next** (replace, not stack): a line fades in, holds ~3.4s, dissolves (~1.8s, **linear**) into the next; lands on a **brand frame that stays** (wordmark + eyebrow + CTA).
- Opens on ~0.9s of black, then the beats. Mechanism: client component, timed step machine (`setTimeout` advances `step`), frames opacity-transition by whether `step === i`.
- Reduced-motion-safe: cross-fade kept via `data-meld-fade` + `--meld-fade-duration` var (opacity is motion-safe).
- **IMPORTANT:** this is NOT the `stage` primitive's accumulate-reveal. The loved version is **cross-fade-REPLACE** (one line at a time). The `stage` primitive stacks/accumulates. When building the real story brick, build the cross-fade-replace sequence.
- Parameterized already: `video`, `story[]`, `eyebrow`, `brand`, `cta` props — proven on candle AND bread (June's Sourdough) → it generalizes.
- **Niche fit:** ambient/process niches with motion — candles (flame), bakery (steam), coffee, or craft-action (hands at work, a potter's wheel, a plane on wood). Works with video or still.

### 2. Spotlight — DONE (liked). Reference: `app/moment-probe/spotlight/page.tsx`
- Screen starts **BLACK**. The hero object **rises out of the black** — image opacity 0→1 over ~6s (the light coming up). **THIS is the signature, not a zoom.**
- A faint slow push-in underneath (scale ~1.0→1.1) is secondary. Reduced-motion: the push is movement (correctly dropped); the rise is opacity (kept).
- **Minimal — not a story.** One line + brand + CTA, fading in AFTER the object is lit (delayed ~4s+). Content sits in the dark negative space (one side) with a darkening gradient for legibility.
- Hero image: a single evocative object, dramatic single light, dark surround, object to one side leaving negative space. (The ring: generated via Higgsfield, Nano Banana, ~8¢.)
- **Niche fit:** single-object luxe/minimal — jewelry, watches, fine ceramics, knives, leather, glass art, perfume. Moods: simple, refined modern, dark.

### 3. Poster — IN PROGRESS. References: `app/moment-probe/rustic-rhody/page.tsx` (works) + `app/_reference/functional-studies/studies.tsx`
- A **composed graphic ARTIFACT, not a hero.** The single most important rule: the image is a **framed OBJECT on a designed canvas** (a background color), with type + devices arranged around it — **NOT a full-bleed background with type laid over it** (that's a hero — the trap I fell into three times with the botanical).
- **Poster bones — these ARE what make it a poster; do NOT strip them for "refined":** tilt (a rotated framed object), layered **offset** shadows, a **stamp/badge**, a **mixed-type** headline (roman + one italic accent word), broken/asymmetric grid, scale contrast, a masthead, coverlines, a frame.
- **"Refined" = the same bones, quiet palette/type — NOT bones removed.** Rustic Rhody (warm/rustic/loud) nailed it. The botanical (cool/refined) FAILED because I removed the bones and it became a hero. The open work is a refined poster that *keeps* the bones.
- Drop product tiles/chips for a moment (that's inventory — atmosphere only).
- **Niche fit:** statement/bold brands — vintage, woodwork, prints, apparel.

### Killed
- **Kinetic type** (type-only on a color field): Alex rejected on sight — too cold/graphic, not the feeling.
- **Atmosphere wash** (still + ambient drift): the motion that made it "alive" (dust motes, breathing glow) reads as dated Flash-splash cheese; strip the motion and it's just a still indistinguishable from spotlight. No real distinct concept. Killed. (Reference kept: `app/moment-probe/wash/page.tsx` as evidence of what doesn't work.)

---

## The asset pipeline (Higgsfield)

- **Bohdi writes a PROMPT** (language = his strength) → **Higgsfield API generates** the video/image → it **drops into the brick's media slot.** The asset's quality lives in the prompt, and a prompt is a writing task — exactly what Bohdi is good at. Tested for real: a Bohdi-style prompt I wrote produced candles as good as Alex's hand-crafted ones.
- **Plugin:** the Higgsfield MCP is connected to the session (`generate_image`, `generate_video`, `models_explore`, `balance`, `job_display`, `show_generations`). Billed at the **subscriber credit rate**. I generated the spotlight ring and the botanical hero through it this session.
- **Models chosen:**
  - **Video → Kling** (~10.5 credits ≈ **$0.44** for 6s/720p). Chosen because it holds up *in the moment* (behind the scrim, under text) even though Seedance edged it raw. Seedance ~21 cr ≈ $0.87.
  - **Image → Nano Banana / Pro** (~2 credits ≈ **$0.08** for 2K). (Requesting `nano_banana_pro` routed server-side to `nano_banana_2` — quality was fine.)
  - **Omni** (Gemini's new model) is NOT in Higgsfield's catalog yet (only Veo 3/3.1 are). Revisit when it lands.
- **Prompt craft (the rules that made assets usable):**
  - **Locked-off camera** (no pan/zoom) for backdrops — camera moves fight overlay text and break loops. (Spotlight is the exception: the object IS the subject, a slow push-in is fine there.)
  - Only the **subject** moves (flame flickers, steam rises). Slow. Seamless loop. No people, no text, no cuts.
  - Be **deliberate** about the handmade/atmosphere look (hand-thrown vessel, uneven wax, etc.) — a generic prompt yields a generic mass-produced look. Keep extra detail soft/in-shadow to lower model variance.
  - **Atmosphere, never specific inventory.**
- **Cost:** ~$0.20–0.90 a clip, ~8¢ an image → roughly **$1 of assets per store, one-time** — trivial against a $35–49/mo subscription. Cost is settled and is never the blocker.
- **Provider:** Higgsfield is a **multi-model aggregator API** (Kling, Seedance, Veo, Nano Banana, Flux, GPT Image, etc. — choose the model per call). It could **replace fal** (cheaper at the subscriber rate, same model selection). There's a real Cloud API + a Business plan (~$62/1500 credits; per-credit ≈ same as now). **Don't single-source** — keep a thin provider abstraction (some models are cheaper elsewhere; e.g. Omni direct from Google later). Alex is fine upgrading the Higgsfield plan — a few subscribers cover it.
- **OPEN GATE (resolve before wiring Higgsfield as the backbone):** the **commercial/resale terms.** Paid plans let you *sell generated content* but prohibit *reselling platform access / sublicensing the generation capability.* Our use — makers receive finished assets on their store and never touch generation — is *likely* permitted, but confirm in writing (enterprise/embedded agreement) before betting the pipeline on it.
- Loop: 6s clips loop; a slight jump at the seam is expected (hide it by cross-fading two offset copies if needed).

---

## Craft rules (hard-won; apply to every brick)

- **Motion SLOW and LINEAR.** An eased opacity fade front-loads and reads as a *pop*; linear climbs steadily and reads as a real fade. (Lost hours to this — an eased curve made a working 2.4s fade look instant.)
- **Reduced-motion:** opacity fades are motion-SAFE — keep them via `[data-stage-reveal]` / `[data-meld-fade]` / `[data-spotlight-zoom]` exemptions in `app/globals.css` (a CSS var carries the duration; the exemption rule restores it under the blanket reduce rule). Movement (zoom/pan/drift) is correctly dropped.
- **NO decorative motion** — no floating particles, glows, or lens flares (= dated Flash-splash cheese). Motion must *be* the thing (the flame, the reveal, the story), never a garnish on top.
- **NO terminal punctuation in headlines** (reads as AI slop). Internal commas in body/sub are fine.
- **Atmosphere, not inventory.**
- **Tweaks are SELF-SERVE** (a regenerate button + a few bounded toggles), **never a support channel.** "Make my video look like X" must never become the founder's inbox.

---

## Engine code built this session — the `stage` primitive (REAL, in the repo)

A new `stage` layout primitive: full-viewport held media + overlaid content that reveals in, with a contrast guarantee.

- `lib/layout/primitives.ts` — `StageSchema` / `StageNode` + `StageRevealMotion`/`StageRevealStagger`.
- `lib/layout/tree.ts` — stage in the discriminated union + child-walk + "must have content" semantic rule.
- `lib/layout/content.ts` — `fill` mode on image + video (cover the parent instead of a fixed-ratio box).
- `components/storefront/layout/Node.tsx` — `stage` case.
- `components/storefront/layout/primitives/Stage.tsx` — the renderer (media layer + scrim + paired-contrast overlay + staged reveal).
- `Image.tsx` / `Video.tsx` — fill rendering.
- `app/globals.css` — `stage-fade` / `stage-rise` / `stage-rise-fade` keyframes + the reduced-motion exemptions.
- Tests: `lib/layout/stage.test.ts`, `components/storefront/layout/primitives/Stage.render.test.tsx`, updated `primitives.test.ts`. **~805 tests pass, typecheck clean.**
- **NOTE:** the `stage` does an *accumulate* reveal. The loved story moment uses *cross-fade replace* (`CandleStoryDemo`). Build the cross-fade brick separately; the `stage` is still the held-media foundation.

---

## Reference files — DO NOT DELETE (these are the recipes/proof)

- `app/moment-probe/CandleStoryDemo.tsx` — story brick (cross-fade). Routes: `/flickering-candle-story` (Seedance), `-omni`, `-claude`, `-claude-omni`, `-claude-kling`, `/june-sourdough` (bread). Parameterized.
- `app/moment-probe/spotlight/page.tsx` — spotlight brick (the ring).
- `app/moment-probe/rustic-rhody/page.tsx` — the poster that works.
- `app/moment-probe/poster-botanical/page.tsx` — the FAILED refined poster (kept as evidence of the hero-trap).
- `app/moment-probe/wash/page.tsx` — the killed atmosphere-wash (evidence).
- `app/moment-probe/MeldDemo.tsx` + `meld/page.tsx` — the intro→home "meld" dissolve experiment.
- `app/moment-probe/moments.tsx` + `[id]/page.tsx` — story fixtures + render route (incl. the original stage-based `candles-cinematic`).
- `app/moment-probe/page.tsx` — the probe index.
- `app/_reference/functional-studies/studies.tsx` — the FUNCTIONAL-page quality bar (Track 1, separate).
- `public/` — generated assets: `flickering-candle.mp4` (Seedance), `candle-omni/-claude-prompt/-claude-omni/-claude-kling.mp4`, `bread-kling.mp4`, `spotlight-ring.png`, `poster-botanical.png`.
- `scripts/verify-fade.mjs`, `verify-zoom.mjs` — Playwright probes that MEASURE animations (proved the fade/zoom actually run). Useful pattern when the preview tool is dead.

---

## Two tracks — do not conflate

- **Track 1 — functional-page composition quality:** getting Bohdi to compose the document pages to the two studies' bar. Unbuilt, separate.
- **Track 2 — the Moments engine:** this document.

## What's next

1. Finish the **poster** brick: a refined poster that KEEPS the bones (framed offset object on a canvas + a device + mixed type), not a hero.
2. Confirm the **Higgsfield resale terms** (the gate).
3. Turn the proven probe recipes into real **engine bricks** Bohdi can target — especially the story cross-fade brick — then teach Bohdi to write the story + the prompt + select the brick by niche+mood, and wire the Higgsfield generation into onboarding.
4. Keep building brick examples to prove range; eventually encode the **niche→brick map** as a lookup.
