## Session 30 (2026-06-06) — Reworked the archetype catalog, made the Moment BohdiAI's signature front door, and settled storefront-shape selection (design + mockups + docs; no engine code)

**The arc:** opened on the Session-29 question (does Gallery survive as an archetype?) and ended with a reworked catalog, a fully-specced Moment layer, and a settled selection model. Pure design — five static HTML mockups (frontend-design skill on throughout) and three docs updated/committed. Nothing built into the engine. Branch `session-12/layout-engine`.

### The catalog reframe
- **Gallery is dead as a standalone archetype.** It lost head-to-head to Main Street for Abigail (S29), and research confirmed the dense salon-wall is a physical-gallery technique successful online stores deliberately avoid (they lead with a curated teaser + clean collection pages). Its dense wall survives only as a **catalog/portfolio PAGE treatment** inside other archetypes.
- **Four storefront SHAPES** (an archetype is now a business shape, not a skin — that is the change from Sessions 22–29 where Main Street and Gallery were two looks for the same maker): **The Shop** (Main Street, built — the deep-catalog workhorse), **The Counter** (fresh/seasonal/batch; "what's available now"; preorder/pickup/sold-out; June's Sourdough), **The Find** (curated one-of-a-kind; vintage/antique; the tag/provenance/SOLD device; Etsy's #2 category), **The Body of Work** (image-first art; beheld-and-acquired; quiet commerce; distinct from Find = objects-with-stories/commerce-forward vs images-to-behold/quiet-commerce — boundary is posture, not niche).
- **The One is NOT a storefront — it's a launch-page feature.** True one-product shops barely exist (authors write more books; the hot-sauce maker adds a hot honey). It's a single-hero poster page deployed on top of any store for a drop, three delivery modes (as-the-Moment front-door takeover [temporary by default, maker owns the dial; paid custom-video attaches] / clickable in-store link / total standalone URL [a deep link]). Natural Skool / Witsend training-module hook (Christmas collectible, once-in-a-lifetime, scarcity).

### The Moment — BohdiAI's signature front door
ONE portable engine on every storefront (reverses Session-24 "each archetype owns its hero"). Plays on a front-door visit only. **Always a slow CINEMATIC TRANSITION, never a hard cut** — rests into the hero on Main Street (where the moment IS the hero) and dissolves into the shape's own opening (board/cabinet/statement) on the others. Per-shop cookie marks it seen; deep links + QR **bypass and leave the cookie unset** (so they still get it next front-door visit); footer **"Intro"** link replays on demand; tenant can turn it off (default on); a **custom cinematic video Moment is a paid upsell**.

### The selection model (the session's big resolution)
- **Onboarding ALWAYS builds Main Street.** We can't reliably tell a weekly baker from a catalog baker (etc.) at onboarding without interrogation, and a wrong auto-build ships a wrong store. Main Street renders everyone acceptably.
- **Bohdi never picks the archetype** — ends the steering debate for shape (his freedom stays in skin/treatments/copy/Moment).
- **The catalog is a post-build, content-loaded SUGGESTION engine** (the Session-29 try-on tool is the vehicle). Sequence is load-bearing: the maker loads real products/content FIRST, then we *actively* suggest a business-specific look shown with their own content already inside it ("this is how a shop like yours sells"). The maker recognizes their fit and chooses — can't be wrong, and the personalized try-on is the subscription-justifying moment. Active suggestion beats default-gravity.
- The niche carries a **loose suggestion hint**, not a deterministic selector. An archetype earns a best-fit **default** (built at onboarding in place of Main Street) only by **proving it beats Main Street** for a niche — functional fit (the Counter's preorder transaction model is the first candidate, because a rotating-stock business runs on mechanics Main Street can't express) or live conversion evidence. "Different/thematically apt" doesn't earn it.

### Mockups (static HTML in `public/`, judged via `file://` links)
`counter-mockup.html` (Stall Board, June's Sourdough), `find-mockup.html` (Curated Cabinet, Marrow & Moth), `one-mockup.html` (quiet literary book) + `one-hotsauce.html` (loud SVG-drawn poster), `bodyofwork-mockup.html` (Della Quist, painter). **Honest gap:** the Counter mockup is tasteful-not-yet-WOW (the conventional hero + a 3-card teaser grid are the AI-slop tells; the WOW is meant to be the Moment, not the board) — revisit when building.

### Docs
Design spec `docs/superpowers/specs/2026-06-06-archetype-catalog-and-the-moment-design.md`; decisions **D32–D35** in `Project-Docs/Phase-1-Decisions-Log.md`. All committed.

### Process notes
- Alex caught Claude three times and each correction stuck: (a) overreached to "Main Street is the only archetype" (it isn't — 4–5 were always planned); (b) leaned on "Main Street is already built" as a *design* reason (build-state is sequencing, not a design driver — taken out, the recommendation flipped); (c) asserted the new archetypes are "best for" a niche without proving it ("different" ≠ "best"; only the Counter has a real functional best-for case so far, via its transaction model).
- **Preview tooling, again:** writing an `.html` fires a PostToolUse:Write hook that auto-opens the Launch preview panel, which spikes Alex's machine. Workaround used all session: write the mockup to `.txt` with the Write tool, then `mv` it to `.html` over the shell (the rename doesn't trip the hook). Always hand Alex a `file://` link; never trigger the preview. (There's an unresolved ask to disable that hook in settings — interrupted, not done.)

### Next session
**Finish Main Street** — the Session-29 asks: a fuller About beat + find-us (to the fullness Gallery gave them), and selectable About variants. Building the new shapes and the Moment is a separate implementation pass; the first brick when we reach the engine is the Moment, since everything sits behind it.

---

