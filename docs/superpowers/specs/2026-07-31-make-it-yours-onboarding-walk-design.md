# Make It Yours — the onboarding walk that gates the editor

**Written 2026-07-31 (Session 80). Design spec.** Governed by D69 + D70 (the maker-facing model) and D67 + D68 (what's editable, and personal-vs-brand-voice). This spec turns those decisions into a buildable design for the **Words** increment.

Session 79 built the *content* of the walk — the per-section steps, Bohdi writing, write-it-myself, the draft plumbing, the editable-field registry, the "made-yours" tracking — but hosted it as a dismissable panel *inside* the editor. This spec restructures that into the shape D69 describes: a mandatory, full-screen, second-half-of-onboarding walk that gates the editor, and a matching section-by-section content area *in* the editor for edits afterward.

---

## 1. The model (two rooms + one shared piece)

**Room 1 — the walk.** A full-screen surface, no dashboard chrome, that the maker cannot dismiss. It opens automatically the first time they reach their website area, because the editor door is closed until the walk is done. It steps through every store section, one at a time, and each section must be resolved. When the last section is resolved and the maker publishes, the walk is finished **forever** — there is no "do it again." (This removes the Session-79 "Walk me through my store again" re-entry.)

**Room 2 — the editor.** After the walk, the editor is where all future changes happen. It has separate areas: the existing **look** area (try on a feeling / skin / texture — untouched by this build) and a new **content** area that lets the maker jump to any section and change its words (and later its photos). The content area is free-navigation — no gating, no forced sequence.

**The shared piece — the SectionEditor.** The per-section editing UI (the section intro, the current-content edit boxes, "Ask Bohdi to write it" vs "I'll write it myself", keep/change/turn-off, and the single-section live preview) is built **once** as a reusable unit. The walk wraps it in a mandatory gated sequence; the editor's content area wraps it in free navigation. Build once, host twice.

---

## 2. Scope of this build

**In:** the Words increment. The SectionEditor (words), both hosts (the gating walk + the editor content area), the full-screen gating route, the "kept as built" third state, the publish honesty gate for About and reviews, removal of the walk re-entry, the opening welcome screen, and the About-story bug fix (the required story step must reliably rewrite the About page).

**Out (later increments, unchanged sequencing):** photo replacement (Photos phase — a photo slot rides into the same SectionEditor), real products (the listings build — Goods' hard "real products" gate switches on then), and the editor's deeper faces (free-form chat, click-to-edit, highlight-and-rewrite, reorder, use-my-colors).

**Sequencing consequence (from D69):** Goods is a must-change section, but "real products" is the listings build. In this Words build, Goods' requirement covers its heading/labels; the hard real-products gate activates when listings lands. The editor gate this build enforces is over the sections that exist today.

---

## 3. The sections and how each resolves

Every section is shown **on** and populated — nothing hidden by default (D69). The maker resolves each one. There are three resolution states a section can end in: **made-yours** (edited), **kept** (accepted as built), or **hidden** (turned off). Which states a section is *allowed* to end in depends on its class:

| Section (maker-facing) | SectionKey | Class | Allowed resolutions |
|---|---|---|---|
| Your welcome | `hero` | keep-or-change | made-yours, kept |
| Your story / About | `founder` (+ about.*) | **must-change** | made-yours only |
| Your goods | `goods` | **must-change** | made-yours only *(real-products gate later)* |
| Collections | `collections` | optional | made-yours, kept, hidden |
| Kind words | `reviews` | optional | made-yours, kept, hidden |
| Where to find you | `findUs` | optional | made-yours, kept, hidden |
| The scrolling line | `marquee` | optional | made-yours, kept, hidden |
| Getting in touch | `contact` | keep-or-change | made-yours, kept |
| Your sign-off | `close` | keep-or-change | made-yours, kept |

`findUs` is added to the walk as an optional section (it isn't a step today). Its content is market dates, not words — its "change" path is "add your real dates" and its off path hides the section; this is closer to the data model than the words model, so its step is lighter and mostly keep/turn-off in the Words build.

**Kept** is a new tracked state. Today the store tracks only made-yours and hidden; without a "kept" marker the gate can't tell "looked at the hero and kept it on purpose" from "hasn't dealt with the hero." Clicking "Keep as built" records the section as kept.

**The gate:** the walk is complete — and the editor door opens — when every section is in an allowed resolved state (must-change ones are made-yours; the rest are made-yours, kept, or hidden).

**The publish honesty gate (D68/D70):** independent of walk completion, Publish is blocked while the About is still ours, while any review is still an AI placeholder (reviews must be real, or the section hidden), and — when listings exists — while products are still placeholders. A section being "resolved" for the gate and "honest enough to publish" are the same thing for must-change/reviews here, but the honesty check lives on Publish so it also protects later editor edits.

---

## 4. The walk (Room 1)

**Opening welcome screen.** Before section 1, a full-screen welcome explains what this is: a short, step-by-step guide to make the site their own — they'll go through each part of the store, keep what they like, change what they don't, and once it's done they can refine anything in the editor. One button: "Let's go." (Per Alex, Session 80: the first page must explain the purpose.)

**Per-section screen** (the SectionEditor in gated mode). Layout is the approved mockup (`tmp/mockups/make-it-yours-walk.html`):

- **Top bar:** "Make it yours", a progress bar + "Step N of M", and "Finish to reach your editor." No exit control.
- **Left column:** section eyebrow + title; a pill stating required ("you'll make this one yours — it can't be skipped") or optional; a plain-English description; the current placeholder shown ("what's there now"); for a personal section, the targeted questions (D68); a text box; **"Ask Bohdi to write it"** as the loud primary and **"I'll write it myself"** as the quiet secondary (fixes the Session-79 button-hierarchy problem). For an optional section, the control row is **Keep as built · Change it · Turn it off** instead of a required pill.
- **Left column footer:** Back, and a Next that is **disabled with a hint** until the section is resolved, then lights up. ("Keep" or "off" both resolve an optional section, so Next lights immediately for those.)
- **Right column:** the single-section live preview — spotlit, showing only the section being edited, updating as pieces change, and **never scrolling off** that section (Alex's Option B).

**Finish.** After the last section resolves, a closing screen confirms everything's theirs and Publish takes it live. Publish is gated by the honesty check (§3). On publish, the walk is done; the maker lands in the editor.

---

## 5. The editor content area (Room 2)

The editor gains a **content** area beside the existing **look** area. It lists the store's sections; picking one opens the same SectionEditor (ungated) so the maker can change that section's words, keep, or (for optional sections) turn off — with the same single-section live preview. Everything still writes to the draft and goes live on Publish, exactly as the look area already does. This is what makes "future changes happen in the editor" real, now that the walk is one-time.

This build adds the content area at the **words** level. Photo swapping slots into the same SectionEditor in the Photos phase.

---

## 6. Architecture

- **Route + gate.** A new full-screen route hosts the walk with its own chrome-less layout (no dashboard sidebar). The editor route (`/dashboard/website`) gains a gate: if the walk isn't complete, it redirects to the walk route. Walk-complete is computed from the resolution state of all sections (extends `walkthroughProgress` / `placeholderSections` in `lib/editor/walkthrough.ts` to account for the `kept` state and the must-change rule). Post-completion, the walk route itself redirects to the editor (the door is open; no re-entry).
- **Resolution state.** `root.content.madeYours` (exists), `root.content.hiddenSections` (exists, off-switch to be wired), and a new `root.content.kept` list. A `toggleSection` action writes `hiddenSections`; a `keepSection` action writes `kept`. Both mirror the existing `markSectionMade` helper in `app/dashboard/website/actions.ts`.
- **SectionEditor component.** Extracted from today's `Walkthrough.tsx` inner step UI into a reusable client component taking a section + its fields + values + a mode (gated | free). The walk host and the editor content host both render it. It calls the existing `editContent` / `setFieldValues` actions (unchanged) plus `keepSection` / `toggleSection`.
- **Single-section preview.** The storefront preview gains a "focus one section" mode (a preview param, e.g. `previewSection=founder`) so the iframe shows only/primarily that section and doesn't scroll off it. Reuses the existing draft render + HMAC preview token + `previewStill` plumbing (Sessions 77–78). Exact scoping (render-one-section vs scroll-and-lock) is a plan-level decision; the intent is fixed here.
- **About-story bug fix.** Root-cause first (leading hypothesis: Bohdi omits the large optional `about.story` field on many edits because it's `required:[]`; alternate: /about preview falls back to published). The required story step must reliably rewrite the About body — it can't be left to Bohdi's discretion. Confirm the /about preview resolves the draft, not published.
- **Reuse, unchanged:** the editable-field registry (`lib/editor/editable-fields.ts`), the content agent (`lib/editor/content-agent.ts`), the niche voice loader, the draft/stage/publish plumbing (`lib/editor/draft.ts`), and the look area (`Editor.tsx`'s feeling/skin/texture controls).

---

## 7. Testing

Tests are part of done (every unit). Coverage to add/extend:

- **Walkthrough state** (`walkthrough.test.ts`): the `kept` state; must-change sections not resolvable by keep/hide; optional sections resolvable by keep or hide; walk-complete only when every section is in an allowed resolved state.
- **Actions:** `keepSection` and `toggleSection` write the right lists and never touch live; the publish honesty gate blocks on unresolved About / AI-placeholder reviews / (later) placeholder products.
- **Gate:** editor route redirects to the walk when incomplete; walk route redirects to the editor when complete.
- **SectionEditor:** renders required vs optional control sets; Next disabled until resolved; verbatim vs Bohdi paths call the right action.
- **About bug:** a single story edit reliably changes `about.story` (regression test for the Session-79 bug).

---

## 8. Settled decisions & open items

**Settled this session:** only optional sections (Collections, Kind words, Find-us, Scrolling line) can be turned off — the spine can't (D69 open item resolved to Option A); Goods and Story must be changed; preview shows one section and doesn't scroll off it; the walk is one-time; the editor carries ongoing section editing as a separate area from the look try-on; an opening welcome screen explains the purpose.

**Open / deferred:** the products (Goods real-products) gate activates with the listings build; photo replacement is the Photos phase; the single-section preview's exact scoping mechanism is a plan-level call.
