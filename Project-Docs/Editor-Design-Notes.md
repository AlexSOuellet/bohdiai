# Editor Design Notes

A holding place for design constraints on the maker website editor (chat, highlight-and-transform, click-to-edit, vibe slider — Master Spec §6.5 / §10). The editor is **not built yet**; these are rules to honor when it is. Surfaced as they come up; add to this file rather than scattering them.

---

## One source of truth; every control is a view (surfaced 2026-06-21, session 49)

**The rule.** There is exactly one place that holds a maker's storefront state — the stored content envelope on the tenant row (the same one the renderer paints from). Every editing surface (AI chat, UI toggles, the vibe slider, click-to-edit) **reads from and writes to that envelope and never keeps its own copy of the state.** A control is a live picture of the current envelope, not an independent setting that has to be kept in step.

**Why.** If two surfaces each hold their own copy and both write to the store, they drift, and the UI starts lying — a maker clicks a toggle, then tells chat "make it cozy," chat mutates the envelope, and the toggle still shows the old value because it was never told. Built as views over one envelope, this can't happen: when chat changes the envelope, the toggles re-render from it automatically, because all they ever did was display it. This is the standard unidirectional-data-flow shape; the broken editors are the ones that duplicate state.

**We're already set up for this.** Main Street paints every page from one stored envelope per tenant (D37). That envelope is the single source of truth. The discipline is simply: when we build the editor, keep its controls derived from that envelope, never caching their own version.

**The subtle part — discrete controls vs. open-ended chat.** Toggles and sliders are discrete (a handful of presets); chat is open-ended and can land the envelope in a state no preset represents ("cozy, but keep that exact purple"). When that happens the control must **honestly show an off-preset / custom state** rather than snapping to the nearest wrong preset or freezing on a stale one. A single source of truth alone doesn't solve this — the control's vocabulary has to be able to admit "the state is something I don't have a button for." Design every editor control with that "custom/off-preset" representation from the start.

---

## The editor IS the second half of the core promise (surfaced 2026-06-21, session 49)

**The promise, in Alex's words:** "We build you a workable, nicely designed, unique site, then YOU can edit it to fit YOU better." Two halves. The **generator** (archetype + skin + crew + the coming color layer) delivers the first half — a good, unique starting site. The **editor** delivers the second half — and the second half is where "fit YOU better" actually happens. We have poured most of our effort into the generator and **under-built the editor**; it is not a later add-on, it is the half of the promise we haven't built.

**The test of delivery:** could the *maker themselves* get from our generated build to their own look using the tools — without us hand-tuning it? Soul Splatter (session 48) only got close because Alex and Claude hand-edited it. The promise is that *she* does that, easily. Today she couldn't, because the levers don't exist. That gap is the editor.

**The levers a strong-brand maker (e.g. Sheri / Soul Splatter) needs — what "make it look like this" decomposes into:**

- **Their colors** — maker supplies brand colors → system derives a balanced, accessible palette → repaints the site. (The maker color layer — top priority, in progress. NEVER raw slot assignment — honor "can't break your site.")
- **Their structure** — swap to a different skin that matches their energy, with their own content already sitting in it (the try-on, D35), so they see the new look as *their* shop, not an abstract template. Not built.
- **Their imagery** — today we take logo + product photos. The strong-brand unlock is letting the maker's own **brand artwork become part of the site itself** (backgrounds, hero, section textures), engine-controlled for readability (scrims/contrast) so it can't break layout. Soul Splatter's swirls ARE her brand; a skin + color can't carry them. Not built.
- **Fine edits** — chat / highlight-and-transform / click-to-edit for "move this, change that." Not built.

**The honest boundary (do NOT let this become a deflection):** for makers with no strong existing brand (most), generator + light edits delivers the promise fully. For strong-brand makers, delivery depends on those levers existing. "Match my brand's energy and world, fast" is the job. We do NOT promise a pixel-perfect clone of a finished brand system — but note (caught as a self-deflection 2026-06-21): defining the hard case as "out of scope cloning" is how Claude papered over the real gap. The bar Soul Splatter set is matching the *energy* (saturated maximalism, her swirls), and that bar is in scope.

**Carry-forward principle for the whole build:** the earlier concerns in this file are the lens for the editor — single source of truth (no liar toggles), subjective intent resolving to curated levers (never freehand design that breaks layout), and these delivery levers. Consider all of it together when the editor is specced.

---

## Subjective intent resolves to curated levers, never freehand design (surfaced 2026-06-21, session 49)

**The rule.** When a maker says something subjective — "make it feel more expensive," "give it a witchy vibe" — the editor translates that into a **pick off the curated shelf** (a skin, a feeling, a derived palette, a treatment), never into freehand hex codes or layout/structure CSS the page obeys directly. The page is drawn by a fixed engine the AI cannot touch; the AI only hands it *data* (which skin, which content, which derived palette). That separation is the entire reason the archetype model exists and is what guarantees the maker cannot break their own site (Master Spec §6.5).

**Why it matters / the real work.** The engine already prevents the AI from breaking layouts — that worry is handled. The actual hard part is the *translation*: reading fuzzy language ("witchy" → shift to the Dark feeling + a dark skin; "more expensive" → refined skin + serif type + more air) and pulling the right lever so it feels smart. That mapping is the design work, not layout safety. Same guardrail extends to the color layer: maker color is matched by *deriving* a balanced palette, never raw assignment.

---

## Sync the derived; never silently rewrite the authored (surfaced 2026-06-21, session 49)

**The rule.** Two kinds of content on a storefront. **Derived/computed** content — live product data, the derived palette, toggle/slider states reflecting the envelope — updates itself automatically when its source changes (rename a product → it updates everywhere it renders, because the page reads it from the product record; no AI involved). **Authored** content — the brand story, hero copy, About, taglines the AI or maker wrote — is the **maker's** the moment they're in the editor, and is **never silently rewritten** by a background process when the maker edits something else.

**Why.** Gemini (review, 2026-06-21) flagged "content desynchronization" — edit a product name/color and the AI copy falls out of sync — and prescribed a reactive background prompt that auto-realigns the copy. For us that's a worse bug than the one it solves: silently rewriting the maker's words when they rename a product changes things they didn't ask to change, which is the exact loss of control/predictability the product promises against. Most of the "desync" also doesn't exist — the catalog is live data (auto-updates) and colors don't touch copy.

**The right behavior for the genuine narrow case** (authored copy baked in an assumption the maker later contradicts — shop renamed, a story names a deleted product): **surface it as a suggestion, never auto-apply.** "You renamed your shop — want me to refresh the lines that still mention the old name?" Maker approves → then rewrite. This is the same line as the source-of-truth/toggle rule, on the other side: derived state syncs itself; authored content only changes when the maker says so.
