# Session 76 — 2026-07-27

**Headline:** Reprioritised the editor ahead of the founder admin, designed the whole first-run editor experience (the "Make It Yours" walkthrough + a real staging engine), wrote the implementation plan, and built the first four tasks of the staging engine. Also settled image-editor pricing (D65) and deferred the "use my own colors" editor to post-launch.

Branch: `beta/founder-admin` (name is now stale — the work is the editor). Nothing merged to main.

---

## What was decided

**D65 — the image editor splits by cost.** Basic touch-ups on a maker's own real photos (background removal, crop/straighten, brightness, warmth, colour and sharpness cleanup, simple lighting adjustments) are cheap to run, so they're **included in the base subscription and ship at launch (Beta)** — this moved basic image editing out of Growth. Generative image work (lifestyle staging, generative relighting, generative mockups) costs real money, so it's a **post-launch $5/month add-on with a capped monthly allowance** (not unlimited — a flat unlimited price just rebuilds the unbounded-cost problem). The boundary is a principle: cheap-to-us = basic = included; needs-real-generation = premium. Makers won't use AI-generated images for their real products anyway (a generated stand-in is exactly the AI-slop the brand rejects), so the editor's image work is *enhancing* real photos, not generating. The image editor rides with Listings, not the store editor. Entry in the decisions log; Full Plan updated (Beta/Listings + Growth).

**"Use my own colors" editor deferred to post-launch.** It was in the editor design docs as Door 2 but never in the operative Full Plan's Beta editor list, and it isn't needed to prove a founding member can run a real store. Moved to Growth. Editor-Design.md Door 2 marked deferred.

**Reprioritised: editor before founder admin.** Alex's call early in the session.

**The editor design (full brainstorm → spec).** The first trip into the editor is a special case — everything is placeholder (invented About, seeded reviews, made-up dates, stand-in products). So the first-run editor is a **structured "Make It Yours" walkthrough** that steps the maker through making each piece theirs, Bohdi leading each step (he asks, then writes in their voice). Free-form "tell Bohdi what to change" is the come-back-later face, on the same engine. Key calls:

- **Content-only.** Bohdi in the editor edits the store's *words*, never structure/nav/look. The visual feel is Door 1 (the feeling picker). "Make it sound cozier" is a tone request on the copy; "make it *look* cozy" is the feeling picker.
- **Everything stages; nothing goes live except on Publish** — one rule for every editing function. Unpublished work **persists across sessions** until the maker **Publishes** or **Resets**. This refines D64 (which staged the look client-side and discarded on leave — fine for a 5-second feeling try-on, but can't carry rewritten words).
- **Apply-then-see** (chosen interaction): Bohdi rewrites straight into the draft, the preview updates, the maker watches; "try again" / Undo as safety; he asks when a request is genuinely ambiguous.
- **The preview must reliably show the draft** on the edit page (the thing that misbehaved when Alex tested — he had to hit "view site"). Root cause: today's preview loads the *live* store and only the look rides in URL params; the words never reach it. The draft fixes it.
- **Products pulled into the walkthrough.** It replaces the five placeholder products and asks about collections. Product editing is shared with the future Listing Manager (built once, two faces), so it's phased: build the engine + content steps first, prove on a real store, then add product/collection steps.
- **Section on/off.** Optional sections (reviews, collections, marquee, find-us) can be switched off, so a maker with no testimonials isn't stuck with fakes — the honest answer to "no content for this section." Stored as a `hidden` flag inside the envelope (no DB change); content is kept when off. Structural sections (hero, goods, founder, close) can't be turned off. First slice of the mix-and-match direction; reorder + deep per-section editing stay later.
- **Re-enterable first-run mode.** The walkthrough is a mode of the *one* editor, auto-launched on first run (chasing placeholder-completeness) and re-triggerable any time as a keep-or-change tour.

Design spec: `Project-Docs/Editor-Make-It-Yours-Design.md`. Plan: `Project-Docs/plans/2026-07-27-editor-staging-engine.md`.

---

## What was built (staging engine, plan Tasks 1–4 of 9)

All test-first, all committed, all green.

1. **`store_drafts` table** (migration `20260727000001`) — one staged home envelope per tenant, owner-only RLS (no anon policy — drafts are never publicly readable). Types regenerated.
2. **`lib/editor/draft.ts`** — `readDraftTree` / `stageDraftTree` / `publishDraft` (promote onto content_pages + sync `mood_key` + delete draft) / `resetDraft`. Also added a Vitest alias so `server-only` modules are unit-testable (`vitest.server-only-stub.ts`) — this repo previously just didn't test them.
3. **`lib/storefront/load-envelope.ts` → `loadDraftEnvelope`** — reads the draft for rendering, same archetype-root guards as `loadHomeEnvelope`.
4. **`lib/editor/preview-token.ts`** — short-lived HMAC-signed token (`mint`/`verify`, 15-min TTL) so the cross-subdomain preview renders the owner's draft without a shared cookie and the public can't forge it. `PREVIEW_TOKEN_SECRET` set in `.env.local` (still needs setting in the deploy env before this ships).

Commits this session: docs (D65, colors deferral, design spec ×3, plan), then `8dd2933`, `b280e73`, `6d8e5ea`, `21cf81f` for tasks 1–4.

---

## Where it stops / next session

**Task 5 next.** The remaining plan tasks:
- **Task 5** — storefront renders the draft when a valid preview token matches the tenant (`app/storefront/page.tsx`, `StorefrontPage.tsx`). Fleshing out one test against the existing StorefrontPage test scaffold is part of this.
- **Task 6** — rework editor actions onto the draft: `stageLook` (was `commitLook`), `publishStore`, `resetStore`.
- **Tasks 7–8** — page loads the draft + mints a token; Editor.tsx stages on change, previews the draft, Publish/Reset/Undo.
- **Task 9** — full suite + typecheck + lint, then the **manual check on a real store that Alex gates** (the payoff: preview reliably shows staged changes; public store untouched until Publish; draft persists; Reset/Undo work).

After this whole plan (the engine) proves out: separate plans for Bohdi content editing, section on/off, and the walkthrough UI — in that order, each on this engine.

**Credit note:** Alex reduced credits mid-session; we're running the plan in small staged commits, pausing between.
