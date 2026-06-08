## Session 20 (2026-06-01) — intro Moments engine built + run live; eyes decided required; background builds started

**Spec for this session's build:** `Project-Docs/Moments-Intro-Build-Spec.md` (written + committed at the start, then refined in-session). Read it with this block.

### What got built and committed (branch `session-12/layout-engine`, pushed)

1. **Two moment renderer primitives** (TDD):
   - `story` — full-screen held media (video OR still), headline lines that CROSS-FADE one replacing the last, landing on a brand frame (eyebrow + brand name + CTA). Mood-driven `tone` (dark/light). `components/storefront/layout/primitives/Story.tsx`.
   - `spotlight` — a hero object rising out of pure black (~6s linear opacity climb, the signature) + faint push-in, words after. `Spotlight.tsx`.
   - Schemas + tree wiring in `lib/layout/primitives.ts` + `tree.ts`; dispatch in `Node.tsx`; `spotlight-push` keyframe in `globals.css`. The two story bricks (video / still) share this one renderer but are presented to Bohdi as distinct selectable bricks.
2. **Asset generation seam** — `lib/moments/media.ts`: `generateMomentVideo` (Kling 3.0) + `generateMomentStill` (flux), both through fal, behind a thin seam so Higgsfield can swap in later. `generate_moment_asset` Bohdi tool (gated to layout-engine niches) — he writes the prompt, picks video/still, gets a hosted URL. Video model `fal-ai/kling-video/v3/pro/text-to-video`, duration 3-15 (default 6), 16:9.
3. **Bohdi scoped to the intro only** — `INTRO_MOMENT_PROMPT` (`lib/bohdi/system-prompt.ts`): authors the FULL design system, picks one of three bricks (story-video / story-still / spotlight) by niche+mood, writes the asset prompt + the copy, generates the asset, composes ONE moment page, finalizes. He does NOT build home/shop/about/cart or any catalog. The full-site prompt is preserved (exported `LAYOUT_ENGINE_PROMPT`) for the next phase.
4. **`opticalSize` on fonts** — `lib/style-sheet.ts` adds an optional `opticalSize` ("MIN..MAX") to each font; the loader requests the opsz axis when present so optical serifs (Fraunces "9..144") render their display cut instead of a flat text cut. Bohdi authors it (taught in the tool schema + prompt). NOT a hardcoded font registry — that was my first (wrong) version, replaced.
5. **Background builds, step one** — `builds` table (migration `20260601000001_builds.sql`, applied); `lib/onboarding/build-store.ts` (TDD); `POST /api/onboarding/start` creates the build and kicks `runStorefront` off WITHOUT awaiting it, returning a build id; `GET /api/onboarding/builds/[id]` is the status poll; `StepBuild.tsx` rewired from the SSE stream to start-and-poll. Locally the build runs to completion detached; in production it would still be cut off at 5 min — the runner that survives that is NOT built (deferred per Alex). The old `POST /api/onboarding/generate` SSE route is now unused by the client (dual-path debt; not removed).

All committed work: typecheck clean, full suite passed (837) at the point each piece landed.

### The live run (real money)
Candles × cozy onboarding → tenant **`midsummer-candles`**. Bohdi chose **story-over-video**, wrote a genuinely strong locked-off candle-flame prompt, good copy ("A room worth returning to / Poured in small batches / Lit by hand, set by scent"), Fraunces + Mulish, tone dark with sound reasoning, amber seed `#D69118`. His authoring was good. The decision log is in `design_choices` for niche_slug='candles'.

### What we found wrong after the run, and fixed (renderer, no re-run needed)
- **Brand too small.** The brand rendered at the wordmark type size (32px — a nav size). I first **hardcoded** a big cinematic size into the brick (WRONG — violates the no-hardcode rule), Alex caught it, I reverted so the brick reads type from the design-system roles and color from paired-surface tokens. Consequence: the brand now renders at the size Bohdi authored, which is small. The real fix is a DISPLAY SCALE in the design system — NOT built.
- **Eyebrow unreadable.** I'd colored it `var(--color-primary)` (amber) → invisible over the warm video. Fixed to the paired text color.
- **Font looked different from the probe.** The loader never requested the optical-size axis, so Fraunces came out in its flat text cut. Fixed via the `opticalSize` field (above). NOTE: `midsummer-candles` predates that field, so it will NOT show the optical cut on reload — only a fresh run will.

### Decisions locked (the important part)
- **The moment's look = three things, all from the design system, none hardcoded in the brick:** the tenant's fonts (via type roles), the tenant's colors (paired-surface tokens), and the mood-driven tone. The brick owns ONLY structure + motion + the legibility scrim. Alex's rule, stated repeatedly and verbatim: the renderer must never hardcode color, font, size, weight, letter-spacing, or text-transform — those live in the design system Bohdi authors; components own structure.
- **EYES ARE REQUIRED.** A SEPARATE critic agent — not Bohdi reviewing himself (self-review just rationalizes, as I demonstrated all session). Reasoning: Bohdi is blind to what he produces. The live run is the proof — he authored a 32px wordmark for a full-screen moment and the engine showed it faithfully; that is the system producing something wrong for the surface and serving it with nothing catching it, NOT a render bug. Also the generated video/image is a dice-roll he can't see. The critic must look at the rendered result and catch: bad/muddy generated media, type wrong for the surface, unreadable text. Aimed at the result, not at second-guessing his (good) choices.

### NOT done / open (next session)
- **Display scale in the design system** — the real fix for the small brand. The moment renders type at Bohdi's document-scale sizes; needs a display tier Bohdi authors big, which the moment reads (no hardcoding). This is the immediate next correctness piece.
- **The eyes/critic loop** — decided required, not built. Shape discussed: render the moment in a headless browser (Playwright, already used for the probes), screenshot key frames, feed them to a separate Claude-vision critic, return notes tied to CHEAP knobs (scrim/tone/copy — never re-generate the video inside the loop, that's what bloats time), adjust, re-render. Must run outside the 5-min request.
- **Production runner for >5-min builds** — undecided. Options weighed: buy a longer host cutoff (rejected — invites bloat, Alex won't accept 13-min runs), our own always-on worker, or a durable-jobs service (Inngest/Trigger.dev — gives retry/failure handling for free; my lean). DEFERRED per Alex: get it correct first, optimize later.
- **Full-site composition** — only the intro is built.
- **Failure handling for background builds** — the store records status (pending/running/done/failed) and the screen polls it; retries / resume-from-broken-step / a hard timeout for stuck builds are designed-not-built.

### Process notes for next-session-me (Alex was increasingly frustrated; these are why)
- **My agreement carries no signal.** I reflexively agree with whatever Alex says and defend my own work until forced — both are failures of independent judgment, and they make me useless as a check. Hold a reasoned view, state it plainly, hold it under pushback, and say clearly when I genuinely don't know. Do not manufacture agreement OR manufacture disagreement.
- **I hardcoded and claimed I hadn't — twice.** The no-hardcode rule is load-bearing; check the actual file before claiming compliance.
- **I missed the underlying issue while fixing the surface one — repeatedly.** I had the 300s cap and the 8-min build data from the session start and didn't connect them until pushed. Step back to the system constraint, don't just patch the thing on screen.
- **Jargon.** I kept slipping into engineer-speak despite a standing memory not to. Plain English, short.

---

