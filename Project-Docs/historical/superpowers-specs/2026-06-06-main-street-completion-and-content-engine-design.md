# Main Street — Completion + Content Engine — Design Spec

**Status:** Design, awaiting Alex review. NOT built.
**Date:** 2026-06-06 (Session 31)
**Branch:** `session-12/layout-engine`
**Supersedes/extends:** `Main-Street-Archetype-Spec.md` (the four-beat home is built; this finishes the archetype into a complete multi-page storefront and overhauls Bohdi's content authoring). Folds in the Session-30 reframe (`2026-06-06-archetype-catalog-and-the-moment-design.md`): every site builds as Main Street.

> Read with the Session 29–30 blocks of `SESSION-BRIEF.md`. This is the "finish Main Street" session: build out every page so a real onboarding produces a complete site, make Bohdi's content rich and niche-specific, fix image generation, separate About from the calendar, and delete Gallery.

---

## 0. One-paragraph version

Main Street is the only archetype now — Gallery is deleted, and every onboarding builds Main Street. To make a full onboarding honest, Main Street stops being a home page bolted onto legacy sub-pages and becomes a complete multi-page storefront painted entirely by the archetype from one stored content envelope: Home, Shop, Product, About, Events, Cart/checkout, Contact, Privacy, Terms, plus a generic template for any page the maker adds later. The bigger prize is content: today Bohdi authors from a 1,600-character slice of a 15–28KB niche file, into 280-character slots, and never revises — so the copy is thin and generic. We feed him the **full niche body**, widen the slots so real writing fits, demand concrete this-maker specifics, and add a **deepen pass** where he critiques and rewrites his own draft against the niche file before anything renders. Generated images get two enforced rules: photo-realistic always, and people match the maker's name. The About beat becomes a Bohdi-picked menu of maker-only looks (the calendar pulled out); find-us becomes its own thing Bohdi seeds with sample dates pointing at a real Events page.

---

## 1. Decisions locked with Alex (this session)

1. **Every site builds as Main Street. Gallery is deleted outright** — code, registry entry, onboarding menu. Existing Gallery references (try-on `handOff`/conversion, the one live Gallery tenant) are converted or retired, not left dangling.
2. **Build the full page set** so a real onboarding yields a coherent site: Home, Shop, Product, About, Events, Cart/checkout, Contact, Privacy, Terms, and a **generic content-page template** for maker-added pages (FAQ, shipping/returns, custom URLs).
3. **One content envelope, archetype paints every page** (Approach A). A single tenant-level Main Street envelope holds the content for the fixed pages; the catalog comes from product rows; maker-added pages are light content rows rendered by the generic template. The legacy `LayoutPage` system stops being used for Main Street stores.
4. **About becomes a Bohdi-pick menu of maker-only looks** (like goods). The "Meet June" card from the Counter mockup is one of them. The calendar is pulled out of the founder beat.
5. **Find-us is its own piece.** Bohdi seeds sample dates at onboarding (placeholder content, like placeholder products); the maker turns it off or enters real dates later. The home find-us teaser shows only when dates exist and points to a real **Events page**, which has a friendly "check back for future dates" empty state. **Treatment selection never reads market-date count** — we don't know it at onboarding.
6. **Rich, niche-specific content is the priority.** Feed the full niche body, widen slots, stricter voice, and a deepen pass. The deepen pass is approved — affordable because Bohdi no longer spends tokens composing/designing (the archetype owns design); that budget shifts to copy.
7. **Image rules:** every generated image is **photo-realistic** (never illustrated); generated **people match the maker's name** (female name → maker reads female, male → male).
8. **Copy rules:** no platitudes / AI-tells; **no terminal punctuation in headlines or the brand**; **the moment story carries no punctuation at all** and, in ≤4 lines, tells a real story.

---

## 2. The content engine overhaul (the centerpiece)

### 2.1 Root cause (verified in code)
- `lib/onboarding/build-archetype-store.ts` builds the menu prompt with `brief.nicheBody.trim().slice(0, 1600)` — Bohdi sees ~6% of the niche file.
- `lib/archetypes/main-street/builder.tsx` `authoringSpec(brief)` references **no niche material at all** — at the moment Bohdi actually writes the store, the niche knowledge is only whatever survived in context from the menu step.
- The schema caps are tiny: `founder.quote` ≤280, product `description` ≤300, `shortDescription` ≤90, story line ≤48. Even a willing writer can't be rich.

### 2.2 Fixes
**Feed the full niche body.** Stop slicing. The authoring step (where the real writing happens) gets the **full niche body** as source material, with explicit instruction to use its specifics — the products these makers actually sell, the words they actually use, the customer this niche actually serves. The menu/choose step can keep a short slice (it only needs enough to pick); the depth belongs in authoring. (Niche bodies are 15–28KB; this is well within context and is the single highest-leverage change.)

**Widen the slots, and add the ones that have nothing to render today.** Raise caps so real writing fits and add fields the new pages need:
- Founder/About: a short teaser quote (home) **and** a full multi-paragraph **story** (About page) — the latter is new and is what makes the About page a real page.
- Products: longer `description` (room for materials, use, what makes it specific), keep `shortDescription` for cards.
- New per-page content: About (story + values/process beats), Contact (how to reach the maker + a line of voice), Shop intro, Events intro, generic-page fields.
- Exact caps land in the plan; principle = enough room for genuine writing, still bounded so geometry can't break.

**Stricter voice, in the prompt and checkable.** Concrete over generic; ban the AI-tells ("crafted with care", "every piece tells a story"); enforce the punctuation rules (none terminal in headlines/brand; none at all in story lines). The moment story is explicitly a **4-line arc**, not four disconnected fragments.

**The deepen pass.** After Bohdi submits a valid draft, a second pass re-reads the draft **against the full niche file and a written quality bar** and rewrites the weak parts:
- Is this specific to *this* maker, or could it be any shop in the niche?
- Does the founder story have a real arc (who, why, what changed)?
- Do product descriptions say something concrete (material, use, occasion), not adjectives?
- Any platitude/AI-tell? Any banned punctuation? Does the moment story tell one story across its lines?
- Output is the same schema, so it drops straight into render. This is the eyes/critic loop the spec has wanted, applied to copy. Cost: one extra Claude pass per build; accepted.

### 2.3 What stays out
- Niche files themselves are not rewritten here — the 19 launch files already exist and are rich. (Writing more niche files is the niche-writer skill's separate job.)
- Testing uses a fully-written niche (**candles**, or any of the 19) as the real bed.

---

## 3. Image generation rules

The media-job assembly (`mediaJobs` / `sceneToPrompt` in the builder) is the seam — it already injects intent (seamless-loop for video). Add two enforced directives there so they can't be forgotten or contradicted by Bohdi's free-text prompt:

- **Photo-realistic always.** Every generated image (hero still/video, founder portrait, product photos) gets a photorealism directive appended; illustration/3D/render styles are excluded.
- **People match the maker's name.** When a generated image depicts the maker (the founder portrait, and any people in lifestyle/hero shots that represent the maker), the subject's apparent gender is derived from the maker's name (female-leaning name → female, male-leaning → male) and injected into the prompt. This is a **heuristic with a known failure mode** (ambiguous/unisex names, the maker isn't the face, non-binary makers) — so it is a **default**, and the maker can override the portrait later in the editor. We do not block the build on an ambiguous name; we pick the more likely reading and move on. *(Open: a tiny name→gender helper with an "unknown" fallback that simply omits the directive.)*

---

## 4. Multi-page architecture (Approach A)

### 4.1 The model
A tenant has **one Main Street envelope** (the archetype key, the chosen look, mood, true catalog size, and the authored content for the fixed pages: identity/nav, the four home beats, the About story, Contact, the find-us/Events content). The catalog is the tenant's product rows. The archetype renders **any page** from that envelope.

- `ArchetypeBuildSpec.render` grows a `page` argument (which route to paint: `home | shop | product | about | events | contact | cart`). The default is `home` (back-compat).
- Every storefront route (`/`, `/shop`, `/about`, `/events`, `/contact`, `/cart`, `/<product>`) resolves the tenant's envelope and calls the archetype with the right `page`. Main Street stores **no longer touch** the legacy `LayoutPage`/`content_pages` layout-tree path.
- **Maker-added pages** are the exception: stored as light content rows (title + body in the maker's voice) and rendered by a **generic Main Street content-page template** that wears the same chrome and skin.
- **Legal pages** (Privacy, Terms) are platform-guaranteed (page-architecture policy) — standard templated text in Main Street chrome, not niche content.

### 4.2 The pages
- **Home** — the four-beat sales page (built; adjusted for the About/find-us split).
- **Shop** — the full catalog (all product rows), Main Street chrome, the goods treatment's full form, an authored intro line.
- **Product** — `MainStreetProduct.tsx` exists; gets a pass for the richer descriptions and the new chrome.
- **About** — the full maker story (the "real section" behind the home teaser): the chosen About look's full form + the multi-paragraph story Bohdi authors.
- **Events** — the full find-us calendar; "check back for future dates" empty state; the home teaser links here.
- **Cart/checkout** — functional; reskinned into Main Street chrome (reuse existing cart logic).
- **Contact** — reach-the-maker page (form + the maker's contact line/voice).
- **Privacy / Terms** — platform legal templates in Main Street chrome.
- **Generic content page** — template for maker-added pages.

### 4.3 Shared chrome
Nav and footer already live in `chrome.tsx` and read from the skin. Sub-pages reuse the same `MainStreetRoot` + nav + footer so the whole site is one coherent skin. Nav links resolve to the real routes (no more 404s / legacy look).

---

## 5. Founder / About + find-us restructure

- **About is a Bohdi-pick menu** (mirrors `goods.treatment`): Bohdi chooses the About look that fits the shop, from a set of **maker-only** treatments (quote, portrait, letter, and the "Meet June" card). No calendar inside any of them.
- **Selection inputs are only what we know at onboarding** — niche, mood, voice. **Delete** the `findUsRows`-based selection (`FINDUS_FORWARD_ROWS`, the `findus` treatment that leads with the calendar) — it selected on data that doesn't exist at build.
- **Find-us is its own piece.** On the home it's a distinct section (its own card/band, the way the Counter mockup separates "Meet June" from "Where to find us"), shown only when dates exist; it links to the Events page. Bohdi seeds sample dates at onboarding; the maker edits or turns it off.
- The home About beat stays a **teaser** with a "read the full story" cue → the full **About page**. (Alex's complaint that Gallery's About was fuller is answered by the real About page now existing, plus a richer authored story behind the teaser.)

---

## 6. Gallery deletion

- Remove `lib/archetypes/gallery/` and its registry import; `ARCHETYPE_SPECS` holds only Main Street.
- Remove Gallery from the onboarding menu and any archetype-test routes / fixtures specific to it.
- **Try-on:** Gallery was a try-on *source* (`handOff`) and *target*. With one archetype there is no archetype-to-archetype try-on; the try-on tool's archetype-conversion path is retired or reduced to skin/treatment try-on within Main Street. Resolve the `abigails-custom-creations` Gallery tenant (convert to Main Street or retire the record) so nothing renders a deleted archetype.
- Grep for `gallery` across `lib`, `app`, `scripts` and clean references; tests for Gallery removed.

---

## 7. How we prove it

A real onboarding on a written niche (e.g. candles) must produce: a complete site (every page renders in Main Street chrome, no legacy look, no 404), with **rich, niche-specific** copy on every page (read it cold — does it sound like *this* candlemaker?), a real multi-paragraph About story, product descriptions with substance, a 4-line moment story that tells a story, photo-realistic images whose people match the maker's name, find-us seeded and linking to an Events page, and Gallery gone. Eyes on the rendered result (Alex runs the onboarding; Claude builds) — the standing rule.

---

## 8. Phasing (for the implementation plan)

Large; stage it so each phase is testable on its own:

1. **Gallery deletion** — clears the deck; smallest; makes "everything is Main Street" literally true.
2. **Content engine** — full niche body into authoring, widened slots/schema, stricter voice + story arc, image rules, the deepen pass. Testable on the **home page alone** via a fresh onboarding before the sub-pages exist.
3. **Multi-page build** — the envelope + `page`-aware render + routing for all fixed pages + the generic template + the founder/about/find-us restructure + Events empty state. Testable as a full onboarding.

Each phase: tests alongside the code (tests are part of done), typecheck + lint clean, no-hardcode grep clean.

---

## 9. Open threads / risks

- **Caps:** exact new max-lengths per field (room for richness without breaking geometry) — settle in the plan.
- **Gender heuristic:** the name→gender helper and its "unknown" fallback; editor override is later editor work.
- **Try-on after one archetype:** confirm whether the try-on tool survives as skin/treatment try-on or is parked; resolve the Abigail record.
- **Collections / subscriptions** routes exist in the legacy storefront but weren't in Alex's page list — treat as out of scope for this session unless added.
- **Deepen-pass build time:** adds a Claude pass; the >5-min host cutoff still applies (get it right first, optimize later — Alex's standing call).
- **Persistence shape:** widening one envelope to hold all fixed-page content vs. the current home-only envelope — the migration/storage detail lands in the plan.
