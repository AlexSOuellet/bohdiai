# Editor — "Make It Yours" walkthrough + draft-and-publish (design)

> **Naming note (2026-07-29):** what this doc originally called "the staging engine" is renamed **draft-and-publish** — the editor's private draft, its draft-backed preview, and Publish/Reset/Undo. The word *staging* is reserved for the separate test **environment** (Full Plan → Beta → Staging), so the two never get confused again. "Stage a change" survives as the verb for saving an edit into the draft.

**Written 2026-07-27, Session 76. Design spec for the next editor build.**

This is the design that came out of the Session-76 brainstorm. It supersedes the "chat with Bohdi" framing as the *first* thing we build: the first trip into the editor is a guided walkthrough, and free-form chat becomes the come-back-later face on the same engine.

Authority: this is a feature spec (rank 4). It sits under the Full Plan's Beta editor scope and the editor design docs (`Editor-Design.md`, `Editor-Design-Notes.md`). Where it refines a shipped decision (D64's session-only staging), that refinement is called out.

---

## Why this exists

The core promise is two halves: we build a maker a polished, unique store, then *they* edit it to fit them. The generator delivers the first half. The editor is the second half, and it has been under-built.

The insight this spec turns on: **the first time a maker opens the editor, almost everything is placeholder.** The About is about an invented person, the reviews are seeded, the find-us dates are made up, the products are stand-ins. A maker at that moment doesn't want to *change* things one at a time through an open chat box — they want to replace their whole imaginary self with their real self. So the first-run editor is a **structured walkthrough that steps them through making each piece theirs**, and it finishes with a store whose *content* is all theirs, sitting in the *look* we generated. Only after that does free-form "tell Bohdi what to change" earn its place, as the ongoing tweak tool.

Everything the maker does in the editor stays **staged** and reaches the public store only when they **Publish**. This is one rule for every editing function — look, words, later products — and it is the thing that was flaky in testing (changes not showing on the edit page). Fixing staging properly is load-bearing for all of it.

---

## Scope of this spec

> **Scope-of-record has moved (2026-07-29):** the build is now phased and the scope lives in `Editor-Make-It-Yours-Phases.md`. Two things changed since this section was written: the walk also replaces **photos** (not words only — Alex, 2026-07-29), and the whole thing is built in phases (Words → Photos → Sections on/off → Products). This section is kept for the design reasoning; read the phases doc for what's in which phase.

**In (across the phases):**

1. **Draft-and-publish** — a persistent draft of the store, a reliable draft-backed preview, Publish, Reset, and reworking the already-shipped feeling-swap to ride the same draft.
2. **Bohdi content editing** — the agent that rewrites the store's *words* (never its structure or look) into the draft.
3. **Bohdi rewrites anything we generated** — the editable set is *all* the generated text in the home envelope, not a hand-picked subset. Off-limits only because they aren't ours to rewrite: the maker's own inputs (the shop name), images (handled by upload, below), and structure/treatments (the family's).
4. **Photo replacement** — the maker uploads their own photo for the hero image and the founder photo; we set its URL in the draft slot. (Product photos ride with the products build; the touch-up editor, D65, is later.)
5. **The "Make It Yours" walkthrough** — the structured first-run flow that turns every placeholder — words *and* photos — into the maker's own, section by section, Bohdi-led.
6. **Section on/off** — the maker can switch the optional sections (reviews, collections, marquee, find-us) on or off, so a maker with no testimonials or collections isn't stuck with fakes or placeholders. On/off only; a section's content is kept when it's off.

**Explicitly out of this spec (later phases, same engine):**

- **Product and collection steps of the walkthrough.** Replacing the five placeholder products and asking about collections. This needs basic product/collection editing (shared with the future Listing Manager) and is the next phase after this one proves out. The walkthrough is built as a stepped frame so these slot in additively.
- **Free-form chat.** The maker-led "change this, reword that" tool. Same engine (draft + Bohdi content editing); a different face, built after the walkthrough.
- **Reordering sections, and deep per-section editing.** Rearranging the section order, and a real editor for what lives *inside* a section (the kind products get). Section on/off is *in* this phase (below); rearranging and deep-editing are later.
- **"Use my own colors."** Deferred to post-launch (Growth) per Session 76.
- **The photo touch-up editor** (D65 — background removal, crop, brightness). This is photo *editing*; photo *replacement* (upload your own) is now in scope (Phase 2). Touch-ups stay a later build.

**Build order:** now phased — Words → Photos → Sections on/off → (next big build) Products. See `Editor-Make-It-Yours-Phases.md`. Draft-and-publish (the engine) is already built.

---

## Part 1 — Draft-and-publish

### The draft

Each store gets one **draft**: a saved-but-not-live copy of its home envelope (the single `layout_tree` on the `/` content-pages row that paints every page, per D37). Every editing function writes to the draft and only the draft. The public store is never touched until Publish.

**Storage.** The `content_pages` table has a unique index on `(tenant_id, lower(slug))` for non-deleted rows, so the draft cannot be a second `/` row. The public RLS policy also lets anyone select any published row's columns, so the draft cannot be a plain column on the live row without becoming publicly fetchable. Therefore the draft gets its **own owner-only table**:

```
store_drafts (
  tenant_id   uuid primary key references tenants(id) on delete cascade,
  layout_tree jsonb not null,       -- the staged home envelope
  updated_at  timestamptz not null default now()
)
```

RLS: tenant-admin only (same `is_tenant_admin(tenant_id)` gate as `content_pages_admin_all`). No anon/public policy — a draft is never publicly readable. One row per tenant; the home envelope is the whole staged store.

**Lifecycle:**

- **Stage a change** → upsert `store_drafts.layout_tree` for the tenant (create the draft from the live envelope on first edit if none exists).
- **Publish** → copy `store_drafts.layout_tree` onto the live `content_pages.layout_tree` for the `/` row (the existing published path), keep `tenants.mood_key` in step as `commitLook` already does, then delete the draft row. One move, everything staged goes live together.
- **Reset** → delete the draft row. The maker is back to exactly what's live.
- **Persistence** → the draft simply sits in the table across sessions until Publish or Reset. No session-only discard (this refines D64, which staged the look client-side and discarded on leave; that was fine for a five-second feeling try-on but cannot carry rewritten words).

### The preview reads the draft

The edit-page preview must show the draft, reliably, without the maker opening the live site — the exact failure seen in testing. The preview iframe loads the tenant's storefront in an **owner-gated preview mode**: when the request is authenticated as the store's owner and carries the preview flag, the storefront renders from `store_drafts.layout_tree` (falling back to the live envelope when no draft exists) instead of the published `content_pages` row. Public visitors, lacking owner auth, always get the published store. After each staged change the editor refreshes the preview so what sits beside the controls is always exactly the draft.

This replaces the current mechanism where the look rides to the preview in URL params and the words never make it into the preview at all.

### Reworking the feeling-swap onto the draft

The shipped feeling-swap (`commitLook` / the Preview + Publish buttons, D64) currently stages the look client-side and writes straight to the live store on Publish. It moves onto the shared draft: choosing a feeling/skin/texture stages into `store_drafts` like everything else, and the single Publish promotes the whole draft (look + words together). Reset discards both. This honors the one-rule-for-everything model and makes "unpublished work persists until publish or reset" true for the look as well as the words.

### Undo

Within an editing session the maker can step back through staged changes (Undo). Implementation: the editor holds a stack of envelope snapshots taken before each applied change; Undo restores the previous snapshot to the draft and refreshes the preview. Reset is the coarse "throw the whole draft away" that returns to live; Undo is the fine "take back the last change." Redo is a nice-to-have, not required for this spec.

---

## Part 2 — Bohdi content editing

Bohdi is the writer the walkthrough (and later, free-form chat) drives. He is a tool-using agent, stateless per D23/D27, that reads the store's current words and rewrites named text fields into the draft.

**What he can touch — an allowlist of editable text fields** drawn from the home envelope: the hero eyebrow/story/brand/tagline and CTA labels, the goods heading, the collection blurbs (name + description text), the seeded review lines, the marquee voice lines, the founder quote/attribution/heading, the close label/headline, the About story, the contact intro. He gets a `set_content(field, value)` tool bound to that allowlist and a view of the current values. Product names/descriptions are **not** in the allowlist — they belong to the Listing Manager phase.

**What he cannot touch:** structure, nav, section order, section on/off, the family/look, the skin, the layout. These are not tools he has, so no phrasing reaches past the words. This is the curated-lever discipline from `Editor-Design-Notes.md` — Bohdi hands the engine *data* (which field, what text); the engine renders.

**Voice grounding.** He writes knowing the shop's niche (its content file) and the store's current copy, so a rewrite sounds like this store, not generic AI copy. Reuses the same niche/voice material the onboarding copywriter already loads.

**Apply-then-see (approach 1, chosen).** Bohdi rewrites straight into the draft; the preview updates; the maker watches. "Try again" gives a fresh take; Undo steps back. Nothing is live, so a wrong guess is cheap. When a request is genuinely ambiguous (which of six headings?), he asks one short question rather than guessing.

**The look boundary.** If the maker asks Bohdi for something that is not words — "make it cozier," meaning the look — he points them at the feeling picker instead of fumbling. His job is the language.

---

## Section on/off (switchable sections)

Some sections only make sense when the maker has the content for them. A brand-new store has no real testimonials, may group nothing into collections, may do no markets. Rather than seed fakes or leave placeholders, the maker can **switch these sections off**.

**Which sections.** The genuinely optional ones the store is already built to render-or-skip: reviews, collections, marquee, and find-us (About and Contact too, if we make them optional). The structural sections that make a store a store — the hero, the goods/products, the founder beat, the close — cannot be turned off.

**How it's stored.** A per-section visibility flag lives inside the home envelope (the same staged `layout_tree` in the draft) — a `hidden` marker on the section. No database change. Turning a section off sets the flag but **keeps the content**, so turning it back on later restores the maker's seeded starting point instead of a blank. The renderer already skips absent optional sections; it gains one rule — also skip a section explicitly flagged hidden, even when it has content.

**Where it surfaces.** In the walkthrough, each optional-section step offers "make it yours, or switch it off." Outside the walkthrough it's a normal editor control. This is the first slice of the curated mix-and-match sections direction (reorder and per-section swapping come later).

## Part 3 — The "Make It Yours" walkthrough (content)

A **structured, stepped** flow — not an open conversation — because the goal is *complete coverage*: when the maker comes out, no placeholder words are left. Visible progress, one section at a time, a sense of "you've made N of M yours."

**Per step:** Bohdi *leads*. He asks the maker for the real information in plain language ("tell me how you got started," "what should the welcome line say — or tell me the feeling and I'll write it"), then writes that section in their voice into the draft. The maker sees it land in the preview and can keep it, ask for another take, or tweak the wording. Then the next step. Every step is apply-then-see on the same draft-and-publish.

**Proposed content steps (order and grouping open for review):**

1. **Your welcome** — the hero: eyebrow, story lines, tagline, brand line.
2. **Your story** — the founder quote + the full About page.
3. **Kind words** — the reviews section: enter real testimonials, or switch the section off (no customers yet is the common first-run case).
4. **Where to find you** — the find-us section: enter real markets and dates, or switch the section off.
5. **Your sign-off** — the close line + CTA wording.
6. **Getting in touch** — the contact intro.
7. **The small stuff** — section headings and the marquee voice lines (goods heading, collections heading, etc.), quick confirms.

**Completion.** The walkthrough tracks which content sections are still placeholder and does not call itself done until each is the maker's. Products are out of this phase, so this phase's "done" is *content* done; the flow will later gain the product/collection steps before it's the whole first run.

**Publish.** Everything the walkthrough writes is staged. The maker publishes at the end (or whenever they like — Publish is always available), and Reset always returns them to live.

### Where it lives, and re-triggering it

The walkthrough is a **re-enterable mode of the one editor**, not a separate onboarding route. It **auto-launches on first run** — when the store is still all placeholder — and the same editor URL is the normal editor afterward. The maker can **re-trigger it any time** from a "walk me through my store again" button.

First run vs. re-run differ only in framing, not machinery:

- **First run** chases completeness: it tracks which content sections are still placeholder and won't call itself done until each is the maker's (or switched off).
- **A re-run** has no placeholders to chase — it's the maker's real store. It walks the same steps as a *keep-or-change tour* ("here's your welcome as it stands — change it or leave it?"), every step skippable, no completeness meter. Useful for a maker who rushed the first pass, or who now has testimonials and wants to turn that section on and fill it.

Both run on the same draft-and-publish — stage into the draft, Publish or Reset as normal.

---

## Data flow (summary)

1. Maker enters the editor → if no draft exists, the live envelope is the starting point; the first staged change creates the draft row.
2. A step (or a look change, or later a free-form chat request) → Bohdi/`commitLook`/etc. writes the new value into `store_drafts.layout_tree`.
3. The editor snapshots-for-undo, then refreshes the owner-gated preview, which renders the draft.
4. Publish → draft promoted to the live `content_pages` row, `tenants.mood_key` synced, draft row deleted.
5. Reset → draft row deleted; back to live.

Single source of truth holds throughout: there is one staged envelope (the draft), every control is a view over it, and the preview renders it. No surface keeps its own copy of the state (`Editor-Design-Notes.md`).

---

## Error handling

- **Bohdi fails / times out** (no valid tool call within the attempt budget, or the API errors): the step surfaces an honest "couldn't write that just now — try again" and leaves the draft untouched. Never a partial write, never a thrown build.
- **Draft read/write failure** (DB error): the action returns a plain error message; nothing is half-applied. The live store is never at risk because Publish is the only path that touches it.
- **Ownership:** every draft read/write and Publish/Reset is gated on store ownership before any DB call, exactly as `commitLook` already gates.
- **Copy length / shape:** the content schema validates shape only, no length caps (D57). The renderer absorbs any length. Bohdi's output runs through the same normalize step the copywriter uses.
- **A maker with two tabs open:** last write wins on the single draft row; the preview refresh reflects the current draft. A real draft-conflict UI is out of scope.

---

## Testing

- **Draft lifecycle** — unit tests for create-on-first-edit, upsert, publish-promotes-and-deletes, reset-deletes; ownership enforced on each.
- **Publish correctness** — the promoted live envelope equals the draft; `mood_key` synced; draft gone afterward.
- **Preview resolution** — owner + preview flag renders the draft; public/anon renders published; no-draft falls back to live.
- **Bohdi allowlist** — `set_content` accepts allowlisted fields and rejects anything else (structure/look/product paths); the agent cannot mutate outside the allowlist.
- **Apply-then-see** — a rewrite lands in the draft and shows in a draft render; Undo restores the prior snapshot.
- **Walkthrough completeness** — the flow reports the correct remaining placeholder sections and only completes when content sections are the maker's.
- **Feeling-swap on the draft** — a staged look change writes to the draft (not live), and Publish takes it live alongside staged words.
- **Section on/off** — a hidden flag stored in the draft; the renderer skips a hidden section even when it has content; content survives a toggle-off-then-on round trip; the structural sections cannot be hidden.

Tests are part of done (no feature ships without them). Visible-output pieces (the walkthrough UI, the preview) are gated on Alex's eyes before commit — tests-green proves it runs, not that it looks right.

---

## Open questions for review

1. **Step order and grouping** — the seven content steps above are a proposal. Right grouping? Right order? (Default: welcome first, mirroring the store's own top-to-bottom order so the preview fills in from the top as the maker goes.)

*(Resolved during review: reviews and find-us each offer "make it yours, or switch it off"; the walkthrough is a re-enterable first-run mode of the one editor, not a separate route.)*

---

## What this refines / relates to

- **Refines D64** — staging moves from session-only/client-side to a persistent owner-only draft, because content editing can't ride URL params and a maker mustn't lose an evening's rewording. Preview/Publish stay; Reset joins them; the feeling-swap migrates onto the draft.
- **Honors `Editor-Design-Notes.md`** — single source of truth (one draft, controls are views), subjective intent resolves to curated levers (Bohdi hands data, never freehand CSS/layout), sync-the-derived / never-silently-rewrite-the-authored (Bohdi only writes when the maker asks).
- **Sits under Full Plan Beta / editor** — delivers "chat with Bohdi" (as the walkthrough first, then free-form) and "undo"; sections on/off + reorder and the product side remain their own later work.
