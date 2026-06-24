# Session 51 — 2026-06-24

**Design conversation, no code.** A long working session that reframed how the look system works, end to end. Output: `Project-Docs/Family-Layout-Model.md` (the full model) + this recap. **Next session: start building the hero sections.**

## The reframe

Started from the Session-50 reckoning (moods barely change the look). Tried to prove a feeling can change without color via cozy-vs-rustic mockups — failed, everything converged. Walked through it and landed somewhere cleaner:

- **Stacked is the format, settled.** Every site is sections stacked top to bottom. We don't break it (no sidebars / overlap / split-screen page structures) — maybe one or two guardrailed stack-breakers far down the line, no mixing.
- **Each family IS a layout** — it stacks *differently* (different sections, order, designs). No two families stack the same. Layout leads, but type / color / texture / imagery all swing too. Nothing single defines a feeling.
- **"Archetype" retired** — it's layouts (families) + skins now. Main Street = the Cozy layout (cozy *look* built; modular plumbing not).
- **Cozy and Rustic split into separate families** — reverses the 2026-06-22 Mood-and-Look doc, which merged them and said "feeling is not color." Color and fonts are back as part of a family's identity.

## Modular sections

A section = a React component taking a content slot + skin. Today Main Street **hard-codes** one fixed assembly (`MainStreet.tsx` lists the beats, one hero, no swap). The upgrade: replace hard-coded JSX with a **recipe** (ordered list of section-variant keys), resolved from a **catalog**. Modular because (1) every variant of a section reads the same **content contract** (a hero reads label / headline / sub / media / CTA, with optional extras), (2) variants are referenced by key not hard-wired, (3) the renderer resolves keys generically — the same trick the skin system already uses for color/font.

## Content vs presentation

Two separate stores. Content = words/photos/products; presentation = family + section picks + colors/fonts. At onboarding there are no maker specifics — Bohdi authors content + picks family defaults. The maker edits content over time; those edits persist through any look swap (look-swapping only touches presentation). Presentation tweaks persist too — except a full family switch, which adopts the new family's whole look. Section try-on keeps their colors.

## Hero catalog — all 17 sorted

Mocked 17 hero patterns (`tmp/specimens/hero-designs.html`). Result: **8 real heroes** — Story (Cozy default), Split L/R, Typographic, Stacked, Collage, Carousel (niche-dependent), Floating-card (not single product), Editorial-cover. Background-video folds into Story (media = video); asymmetric-editorial folds into Split. Re-filed: two-up + mosaic → a new **Collections** section; map → find-us/events section; marquee → between-sections band; action-hero → CTA section (could be a hero if a real pickup/booking feature exists). **Product-forward cut.** Full table in `Family-Layout-Model.md`.

## Editor

Two actions: (1) switch the whole family — see the site as if that family had been chosen at onboarding; (2) try on a single section keeping your own colors/fonts. Show **all** heroes (trust the maker's eye; the functional floor — no overflow, readable, mobile-safe — is always guaranteed). Build all sections at onboarding so the editor is instant — cheap because all variants share the content contract (one thing built: the content).

## Image/video library

Our own tagged stock pool Bohdi pulls from at onboarding; generations feed back after review. Four rules: **hard subject-filter** (correctness gated mechanically, NOT Bohdi's judgment — fixes the candle-on-knitting failure, D55), **rotate by least-used** (variety), **generate-when-thin** (self-deepens by demand; threshold = cost/variety dial), **review gate** (no quality drift). Reuse across makers is fine — that's stock media, not slop. Builds on the existing reusable-image-library direction.

## Claude's design limitation (named honestly)

Live evidence all session: Claude converges to generic when free-generating — defaults to full-width bands, cream grounds, timid texture; even attempts at "different layouts" came out as the same stacked skeleton. The fix is not better Claude imagination — structure can't come from free-generation. It comes from the **fixed, hand-built family layouts + curated catalog**, populated with content. Claude is reliable at executing a concrete target and picking ingredients (fonts/textures), weak at inventing distinct structure from a feeling-word.

## Lessons banked

- **No flattery / no ass-kissing** — Alex called it out directly. Reshaping into praise gives zero signal. Saved as `feedback_no_flattery`.
- **Plain English, one idea per line** — dense run-on sentences genuinely lose Alex (he asked "HUH?" at a four-idea run-on). Reinforces the existing plain-English lesson.
- **Examples ≠ direction** — don't turn Alex's illustrations ("Cozy is like Main Street") into spec.
- **Don't carry my opinion as his decision** — mark contested items open (editorial cover stayed open until he accepted the push).
- **Don't unilaterally declare docs superseded** — I over-claimed "supersedes"; how to reconcile docs is his call.
- **Texture must be real material, not a tiling pattern; torn must be actually torn** — show, don't describe; push the levers hard and visibly.

## Open / next

Open: which families + how many; Cozy's actual section designs (incl. which meet-the-maker); library threshold + tag granularity; how to reconcile the old Mood-and-Look doc (Claude leans: merge the good bits into the new doc, delete the old — Alex's call). **Next session: build the hero sections** — the recipe/catalog plumbing over Main Street's fixed assembly, plus the confirmed Cozy heroes.
