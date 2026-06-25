# Session 54 — 2026-06-25

**The inline-styles type refactor: Main Street's type moves from inline `typeRoleCss` to a `Type` component + CSS variables. Done right, committed, deployed.**

## What this session was

The one flagged item from Session 53: every piece of text in the Main Street archetype set its font with an inline `typeRoleCss(...)` style object spread per element. Alex had taught that inline styles are bad practice, and the Session-53 editorial-masthead dead-CSS bug was a direct symptom (an inline `font-size` beating a `<style>` rule, no media queries possible). This session fixed the type layer at the root across the whole archetype.

## The key exchange — "is your fix the RIGHT one or another shortcut?"

The first proposal was: emit type as CSS variables + base rules keyed off the existing `data-type` hook, drop the inline spreads, keep `data-type` hand-applied per element. Alex challenged whether that was right or a shortcut. The honest answer: the CSS-variable move was the genuine root-cause fix (kills the dead-CSS bug class), but reusing `data-type` hand-applied per element left the *role hand-wired* on every element — a person building hero #9 could still typo or forget it. The fully-right version centralizes type into a single `Type` component (`<Type role="brand" as="h1">`) so the role is declared once, can't drift, and you physically can't render typed text without naming its role. Same touch count (all 130 call sites either way), strictly better endpoint. Alex: "fix it right." Built the `Type`-component version.

## What was built (all TDD, all on `session-12/layout-engine`)

- **`Type.tsx`** — the single typed-text component. Polymorphic (`as` defaults to `span`), stamps `data-type={role}`, sets no inline font. `role` is `keyof MainStreetRoles` (the 17 roles). Tested first (RED → GREEN).
- **`skinVarsCss` extended** (`chrome.tsx`) — now emits, per role: `--ms-t-<role>-*` CSS variables on the root (family/size/weight/line/tracking/style/transform/vsettings) **and** a base rule `.arch-main-street [data-type="<role>"]{…}` that consumes them. Sizes are the same fluid `clamp()` (`fluidFontSize`), just sourced from the stylesheet now. Tested first.
- **All 18 components converted** off inline `typeRoleCss` → `<Type>`: the 8 heroes (Story/MomentHero, Split, Stacked, Typographic, FloatingCard, Carousel, Collage, EditorialCover), beats, the three Goods treatments, FounderBeats, MainStreetProduct, pages, the contact form, and chrome's Nav/Footer/WordmarkLink. (Mechanical files done by parallel subagents to a precise spec; the special cases done by hand.)
- **Amplification is now scoped CSS, never inline.** The editorial masthead (giant brand) and oversized coverline, and the italic founder letter/card quotes, became more-specific scoped rules against `[data-type]` (in the hero's own `<style>` for the cover, in `skinVarsCss` for the founder treatments). More specific than the base rule + later in the cascade → they win without inline, and they can use media queries. **The masthead dead-CSS bug is now structurally impossible.**
- **Dead-prop cleanup (no suppressions).** `skin` is now consumed once at the root (where `skinVarsCss` emits the CSS); leaves don't need it for type. `Nav`, `MainStreetFooter`, `WordmarkLink`, `MainStreetContactForm`, `FindUsList`, `AboutCue` dropped their now-dead `skin`/`role` props cleanly. The 8 heroes keep `skin` in their shared contract *type* (MomentHero genuinely uses it for luminance, and the catalog dispatches all heroes uniformly) but stop *destructuring* it where unused — no `void skin` suppressions anywhere (one pre-existing `void skin` in pages was removed in favor of undestructure).
- **`typeRoleCss` deprecated**, not deleted — the only remaining callers are the three `app/archetype-test/*` dev-preview pages, which are already in the delete-or-gate audit bucket. A `@deprecated` JSDoc points new code at `Type` so the inline pattern can't get copied back into real archetype code.

## Result

1172 tests green (was 1163; +9 new Type/skinVarsCss tests), `tsc` clean project-wide, lint clean (only the pre-existing `<img>` next/image advisories). Committed (`67a9d11`), pushed, and **deployed to production** (`vercel --prod`, READY, aliased to bohdiai.com). Alex spot-checked and approved ("It looks good").

## Why this matters for next session

The skin now emits type as `--ms-t-*` variables — that is exactly the seam the six families' type packages plug into. Wiring the families is now unblocked and is the next work, Cozy first (= Main Street).

## Carryover / open

- **Three `app/archetype-test/*` dev-preview pages still call `typeRoleCss`** — Alex's delete-or-gate call (already in the audit backlog). When they go, `typeRoleCss` goes with them.
- Editorial-cover still leans close to Story (deferred to when families bring real type/color divergence — unchanged from Session 53).
