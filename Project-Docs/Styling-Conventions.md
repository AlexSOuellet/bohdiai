# Styling Conventions — Marketing Page

**Status:** Draft, awaiting founder approval
**Document authority rank:** 2 (operates under Golden Rules and Master Spec, alongside Engineering Standards)
**Scope:** The marketing page at `bohdiai.com` only. When we design the maker dashboard, real tenant storefronts, or admin, each gets its own conventions doc.
**Purpose:** Resolve the ambiguity between the Phase 0 spec (which mandates Tailwind) and the atmospheric mock (which was prototyped in plain CSS).
**Date:** 2026-05-19

---

## 1. The system

**Tailwind CSS, locally compiled, with design tokens defined in `tailwind.config.ts`.**

- Per Phase 0 Spec line 60: *"Styling: Tailwind CSS — Local install, not CDN."*
- The atmospheric mock at `_design-mocks/hero-atmospheric.html` is a **prototyping medium**, not a styling spec. The production marketing page converts it to Tailwind during the port.

## 2. Where styles live

| Where | What goes there |
|---|---|
| `tailwind.config.ts` | All design tokens — colors, spacing, radii, fonts, breakpoints, motion durations/easings, z-index scale, keyframes. |
| `app/globals.css` | `@tailwind` directives, `@layer base` for resets, `@layer components` for the complex-effect classes (`.glow`, `.prism`, `.vignette`, etc.). **No raw hex/rgba values** — reference tokens. |
| `*.tsx` files | Tailwind utility classes. **No `style={{ ... }}` inline styles** except for values that must be dynamic at runtime (e.g. a progress bar width from React state). |
| `*.module.css` | **Not used.** |

## 3. Tokens (live in `tailwind.config.ts`)

### Colors — the atmospheric palette

```
bg:        #0a0805   (page background)
bg-2:      #15110a   (raised surfaces)
text:      #f3ede0   (primary text)
text-soft: #d8d2c4   (secondary text)
muted:     #7e7464   (tertiary / disabled)
honey:     #e9a13d   (primary accent)
honey-warm:#f3c97a   (highlights, glows)
honey-deep:#c9831e   (pressed / shadow)
```

These are the only marketing-page colors. The old Phase 0 palette (cream / ink / espresso) is **removed** from `tailwind.config.ts` during the port — it is dead code.

### Spacing

Tailwind's default scale. **No arbitrary spacing values** like `p-[13px]`. If a value isn't in the scale, round to the nearest, or add a named token if used 3+ times.

### Radii

```
sm: 4px · md: 8px · lg: 14px · xl: 20px · pill: 9999px
```

### Motion

```
duration:  fast (180ms) · base (260ms) · slow (520ms) · breathe (7s)
easing:    out (cubic-bezier(.2,.7,.2,1)) · inout (cubic-bezier(.4,0,.2,1))
```

Keyframes used in more than one place (`breathe`, `rise`, `fadeSwap`, etc.) live in `tailwind.config.ts`.

### Breakpoint

**One mobile breakpoint: `md: 720px`** (matches the mock). Mobile-first.

### Z-index scale

```
behind: -1 · base: 0 · raised: 1 · content: 10 · sticky: 20 · toast: 50
```

No magic z-index numbers in components.

## 4. When plain CSS is allowed

Tailwind utilities cover ~95% of styling. Exceptions, allowed in `@layer components` inside `globals.css`:

1. **Complex keyframes** (typewriter caret, breathing glows).
2. **Multi-layer gradients** (prism beams, the glow stack).
3. **CSS mask compositions** (Alex's portrait radial-gradient mask).
4. **Pseudo-element decorations** where utilities would balloon the markup.

Anything else → utilities.

## 5. Forbidden

- `style={{ ... }}` inline styles, except for **runtime-dynamic** values.
- Raw hex / rgba in components or `globals.css`. Always reference tokens.
- `!important`.
- `<style>` tags in components.
- Tailwind arbitrary-value syntax (`p-[13px]`, `text-[#abc]`) outside true one-offs.
- CSS-in-JS libraries (styled-components, Emotion, etc.).

## 6. Required tooling

- **`prettier-plugin-tailwindcss`** — auto-sorts utility classes. CI fails if out of order.
- **`eslint-plugin-tailwindcss`** — catches invalid class names and contradictions. CI fails on violations.
- **No CDN Tailwind.** Compiled into per-page CSS by Next.js.

## 7. Dark mode

The marketing page is **single-theme dark only**. No `dark:` prefix usage, no toggle. The atmospheric palette IS the theme.

## 8. The mock → Tailwind conversion (one-time)

1. **Tokens first.** Update `tailwind.config.ts` with the atmospheric palette, radii, motion, z-index, keyframes. Remove the Phase 0 literary-boutique palette.
2. **Component classes for atmospheric effects.** `.scene`, `.glow`, `.vignette`, `.prism`, `.portrait-mask`, etc. become `@layer components` classes.
3. **Section markup → utilities.** Hero, How It Works, Trades, Waitlist, Who Behind, Pledge, Community, Footer convert class-by-class.
4. **One section at a time.** Visual parity verified against the mock after each.

## 9. Out of scope (deliberate)

- Styling for `app.bohdiai.com`, `admin.bohdiai.com`, or real tenant storefronts at `[shop].bohdiai.com`. Each gets its own conventions doc when designed.
- Component-level patterns (props, state, accessibility) — see Engineering Standards.
- Brand voice / copy — see Master Spec.

## 10. Amendment

Same approval path as Engineering Standards: Claude proposes, Alex approves, change goes in a dated session log.
