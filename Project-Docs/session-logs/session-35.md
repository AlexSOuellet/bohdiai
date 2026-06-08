## Session 35 (2026-06-08) — De-bloated the brief, shipped the two Session-34 plans, built the D44 Moment, then a live-build fix loop

**The arc:** cleaned up the session brief (it had grown unreadable), executed both Session-34 plans (8 fixes), corrected the logging shortcut inside them, locked + built the D44 Moment, then ran a series of live builds and chased the bugs they surfaced. Branch `session-12/layout-engine`; everything committed + pushed.

### Brief de-bloat (first task)
The SESSION-BRIEF had grown to 1,188 lines / 256KB with a full recap per session inline (one line was 70K chars) — the read tool could no longer load it. Split it: the brief is now a lean current-state + next-actions + standing-lessons doc (~60 lines), and every dated session recap lives in `session-logs/session-NN.md`. Going-forward rule documented at the top of the brief. 21 old session recaps archived.

### The 8 ready fixes (both Session-34 plans, A–D + Tasks 1–4)
Run as parallel subagent waves, each integrated through a full typecheck + suite gate, then committed:
- **D42 gender-neutral maker image** — deleted `lib/name-gender.ts`; the table also fed gendered hero/about prompts in `lib/fal.ts` and `lib/bohdi/tools.ts` (bigger than the plan knew), all neutralized.
- **Type scale** — recalibrated the Main Street `makeType` ramp down.
- **Contact form** — built `MainStreetContactForm`, wired it to `/api/contact` (threads the required tenantId), pointed the close CTA at `/contact`.
- **Mobile** — responsive product grid + nav padding.
- **Seedance 2.0** — Moment video swapped off Kling.
- **Dead path deleted** — the whole `lib/bohdi/` layout-engine path was unrouted; deleted the two files + their niche bias. (Chip spawned: the rest of `lib/bohdi/` is also dead.)
- **No text-in-image** — cinematographer forbids lettering in the shot, with a post-validation guard.
- **Log crew choices** — to `design_choices`.

### Corrected the logging shortcut (Part D)
The subagent logged from inside the crew, which runs BEFORE the tenant exists, so it wrote `tenant_id: null` and `niche_slug: null` — useless for the per-niche pattern analysis that was the whole point. Reworked: the crew surfaces its picks, the build orchestrator logs them AFTER persistence with the real tenant id + niche + mood; the helper now *requires* the ids (a null can't compile). Added a wiring test (mutation-verified) covering the build→logger seam. Rewrote the commit so history shows it done right, not done-then-patched.

### D44 — the Moment, locked then built
Long design conversation corrected the written plan. D44 lifecycle: the Moment plays ONLY on a cold front-door arrival (this visit *landed* on home, no cookie); it autoplays, plays through, RESTS, then shows an "Enter site" invite; the customer's click melts it (a fade) into the hero and writes the do-not-replay cookie. Side-door (deep link / QR) arrivals get no Moment for the whole visit, even navigating to home. Built it: the hero now rests by default (SSR), `MomentIntro` overlays only for cold visitors, pure gate logic in `moment-gate.ts` (fully tested), footer "Intro" replay via `?intro=1`. Only built the Main Street "fade into hero" case; the heroless-archetype variant waits until a heroless archetype exists.

### Live builds + the fix loop
Builds (production Supabase): `evening-shadow-canles` (candles/cozy, 7:03) → after fixes `night-shade-candles` (candles/cozy, ~4:06), `bountiful-breads` (baker/rustic), `my-site` (ceramicist/simple, cheapest/fastest). Seedance fast cut time + cost markedly. Alex's verdict: aesthetics good, cozy genuinely feels cozy (the crew picked the warm Hearthstone skin for it — the selection was RIGHT; an earlier "mismatch" read was wrong), gender image improved.

The "single test" batch shipped this session (all committed):
- **Shop name passthrough** (D45) — crew no longer renames the shop.
- **Seedance fast** — `bytedance/seedance-2.0/fast/text-to-video`.
- **Clickable products** — all four goods treatments link to `/listings/<slug>`.
- **Secondary hero CTA + founder beat** — bigger portrait, calmer quote (the intimate area), gender-neutral founder *prompt* (the graphic artist was still describing a man).

### PUNCH LIST — next session (with the mood changes)
1. **Links the crew's way (D46)** — the crew authors each CTA/nav DESTINATION alongside the label; stop hardcoding destinations and stop discarding the authored nav.
2. **Cinematographer prefers video (D47)** — always reach for video; still only when there's genuinely no simple motion to capture.
3. **The mood overhaul (Part E)** — still design-gated; needs the five decisions locked (mood feeling-definitions, the color layer, skin re-tagging, mood→treatment mapping, Templated). The **Studio skin's Syne font** Alex hates folds into this skin work.

### Process notes (carry forward)
- **Neutrality ≠ intent.** Over-removing "bias" stripped the prefer-video product decision. Some defaults are load-bearing product intent, not taste to be neutralized.
- **Don't hardcode a destination behind a free label.** A button's words and its link must be authored together.
- **The integration gate earns its keep.** The full typecheck+suite after each subagent wave caught a stale gendered test, an index-signature tsc error, and a latent lint error the scoped runs missed.
- **Verify against the live data + real code, not memory.** The skin pick (Hearthstone for cozy), the rename schema, and the still-vs-video cause were all confirmed by querying the DB and reading the actual files — and one of them reversed a too-quick verbal claim.

---
