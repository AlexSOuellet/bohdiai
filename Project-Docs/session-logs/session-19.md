## Session 19 (2026-06-01) — Moments engine designed; asset pipeline (Higgsfield) proven

**Read `Project-Docs/Moments-Engine-Build-Detail.md` first — it is the full build spec, recipes, and reasoning. This block is the summary.**

**The model.** A Moment is the ONE wow surface (the intro/front door); functional pages stay tidy stacked documents (Session 18's renderer handles them — that's correct, not a bug). A Moment = a **fixed brick** (motion + composition, built once by us, taste baked in) + **content slots Bohdi fills**, and every slot is a **language task** (story copy, the image/video prompt, brand, tokens, pattern pick). Bohdi never designs pixels — he writes words and the brick renders them. The smarts live in the system because Bohdi is stateless and can't imagine. Generative, never templated (a set of bricks chosen by niche+mood; shared motion grammar ≠ template). Atmosphere, never inventory.

**Bricks — TWO proven, poster in progress, two killed:**
- **Story-over-media** — DONE, Alex said "Perfect." `app/moment-probe/CandleStoryDemo.tsx`. Held media (video/still) + headlines cross-fading one into the next (REPLACE, slow ~3.4s hold / ~1.8s linear), lands on the brand. Parameterized; proven on candle + bread. Niches: ambient/process (candles, bakery, coffee, craft-action).
- **Spotlight** — DONE, liked. `app/moment-probe/spotlight/page.tsx`. Screen starts black, object rises out of the dark over ~6s (the signature, not a zoom), then a few words. Niches: single-object luxe (jewelry, watches, ceramics, leather, glass, perfume).
- **Poster** — IN PROGRESS. `app/moment-probe/rustic-rhody/page.tsx` works. **Rule:** a poster is a framed image-OBJECT on a designed canvas with tilt/offset/stamp/mixed-type/coverlines — NOT a full-bleed photo with type over it (= a hero). "Refined" = quiet palette, NOT bones removed. The botanical attempts failed by removing the bones. Niches: statement brands (vintage, woodwork, prints, apparel).
- **Killed:** kinetic-type (cold/graphic), atmosphere-wash (Flash-splash cheese; no distinct concept).

**Asset pipeline — Higgsfield, proven end-to-end.** Bohdi writes a prompt → Higgsfield generates → drops into the brick. The Higgsfield MCP plugin is connected (generated the ring + botanical hero this session), billed at the subscriber rate. Video → Kling (~$0.44/6s, holds up in the moment); images → Nano Banana (~$0.08/2K); Omni not in Higgsfield yet. ~$1 of assets/store, trivial. Higgsfield is a multi-model aggregator that could replace fal — keep a thin provider abstraction, don't single-source. **OPEN GATE: confirm Higgsfield's commercial/resale terms** (generating paid assets embedded in third-party maker stores) before wiring it as the backbone. Prompt craft: locked camera (backdrops), only the subject moves, slow, seamless loop, no people/text/cuts, deliberate handmade specifics, atmosphere not inventory.

**Engine code shipped (real).** A `stage` primitive (held media + revealed content + contrast guarantee) + `fill` mode on image/video. Files in `lib/layout/` (primitives, tree, content), `components/storefront/layout/` (Node, primitives/Stage, content/Image+Video), `app/globals.css` (keyframes + reduced-motion exemptions). Tests: `stage.test.ts`, `Stage.render.test.tsx`, updated `primitives.test.ts`. ~805 tests pass, typecheck clean. NOTE: the `stage` does an accumulate-reveal; the loved story uses cross-fade-replace — build that brick separately, the stage is the held-media foundation.

**Craft rules (in the detail doc):** slow+linear motion, reduced-motion keeps opacity fades / drops movement, no decorative motion, no terminal punctuation in headlines, atmosphere-not-inventory, self-serve tweaks never support tickets.

**Process note:** preview tool dead all session — verified via `curl` + Playwright probes (`scripts/verify-*.mjs`) against dev on `:3000`. Drifted late iterating the poster; Alex pulled it back. Nothing thrown away — the probe files in `app/moment-probe/` ARE the recipes.

**Next:** finish the poster brick (keep the bones, refined); confirm Higgsfield resale terms; turn proven probes into real engine bricks Bohdi targets + teach him to write story/prompt + select by niche+mood + wire generation into onboarding.

**Branch `session-12/layout-engine`.** Committed and pushed at end of session.

---

