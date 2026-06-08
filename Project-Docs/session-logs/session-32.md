## Session 32 (2026-06-07) — Bug-fix sweep from a live build, then the Director + Crew design

**The arc:** Alex ran a fresh onboarding (`coastal-candles`, candle maker / modern), walked it, and built a running list of problems. Claude fixed the mechanical ones (8 commits), then a long design conversation turned the remaining quality problems into the next-session architecture. Branch `session-12/layout-engine`; build is a fresh session.

### The 8 fixes shipped (each tested, typecheck + lint clean)
1. **Deepen pass removed** (`7329dc8`) — the second authoring round doubled build time (~6 min) without improving copy. `authorStore` returns on the first valid draft. `deepen.test.ts` → `author-store.test.ts`.
2. **Dead home navbar** (`1906aa9`) — the home hero nav used `href="#"`. Added one canonical `MAIN_STREET_NAV` in `chrome.tsx`, shared by the home `Nav` and the sub-page header; routes already existed.
3. **Logo shown** (`de4fa33`) — uploaded logo was on `tenants.logo_url` but no archetype slot read it. Injected into `content.identity` at the render boundary (`StorefrontPage.loadTenantLogo` → render args → `withLogo`), shown beside the wordmark via a shared `WordmarkLink`. Threaded through render/renderProduct/renderContentPage/renderShell.
4. **Image-directive regression** (`370b047`) — last session's `withImageDirectives` degraded every image. The "no illustration or 3D render" negation summons what it forbids; the gender phrase trailed where the model ignored it. Rewrote to one coherent prompt: positive realism (medium + camera/lens), gender LEADS as the subject.
5. **Moment pacing** (`9cb4a1e`) — line hold 2000→3400ms, open 600→1000, gap 800→1000, fade 0.7→0.9s; test derives timing from `phaseDurationMs`.
6. **Video default + storage** (`7b25944`) — flipped the moment kind preference to video (motion is the wow); migration `20260607000001` lets the `generated-images` bucket accept `video/mp4` + 100MB so clips persist instead of hotlinking expiring fal URLs. (The bug was bucket config, not code — `store()` was silently falling back.)
7. **Legal copy** (`4af30ab`) — rewrote `content/legal/{terms,privacy}.md` as professional legal documents (was casual plain-English). Loader/placeholders unchanged.
8. **Bodoni Moda retired** (`05b3b94`) — Atelier swapped to Space Grotesk (modern grotesque, unused on the shelf). Plus **content-voice redirect** (`232382a`) and **cinematic Moment image** (`02763a3`) in `builder.tsx`, and **product detail video** (`c5232b0`) — `MainStreetProduct` now renders `<video controls>` instead of a poster `<img>`.

### The design — Director + Crew (build next session)
Full doc: `docs/superpowers/specs/2026-06-07-director-and-crew-design.md`. Bohdi = Director; he sets a structured **Trajectory** (feeling / customer-why / visual-world / moment-concept / register) from niche+mood. Three specialists match it: **Copywriter** (words), **Cinematographer** (Moment video JSON — 5-6s/16:9/720p, seamless loop, no loop-breaking human motion, atmospheric grade, video default + still fallback), **Graphic Artist** (skin selection from the mood-aligned subset + image lighting/grade). A **Director's Cut** pass guarantees coherence. Deterministic sequential pipeline replaces `authorStore`; assembles the SAME envelope; the static engine/renderer/schema do not change. Per-call timeouts (closes the no-timeout gap).

### Open gaps audit (carried forward)
- **Closed by the crew design:** skin tags unwired in selection; mood not moving the look; no authoring-loop timeout.
- **Fixed this session:** hero videos not persisting (now do); deepen cost; navbar 404s; image regression; literal Moment.
- **Partial:** maker portraits trend to one FLUX "type" (the Graphic Artist's portrait direction can vary it); unknown/ambiguous maker names still default female.
- **NOT in scope / still open:** real checkout (line items + payment, unbuilt platform-wide); try-on "make live" + owner-gating of `?v=`; live route for maker-added custom pages (template exists).

### Process notes
Alex corrected Claude twice on careless confidence: over-estimating build time (claimed video = +4 min; real full video builds ran ~3.5 min because video generates in parallel with photos) and asserting the whole skin shelf was "cream cousins" when it's diverse across 9 worlds. Verify against the code before making confident claims.

---

