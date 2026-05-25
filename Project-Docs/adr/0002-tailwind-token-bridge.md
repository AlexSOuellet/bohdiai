# ADR 0002 — Tailwind Token Bridge for Storefront Blocks

**Date:** 2026-05-25
**Status:** Accepted

## Context

Each tenant's storefront has unique colors, fonts, and spacing driven by AI-generated design tokens stored in `design_tokens`. These tokens are injected as CSS custom properties (`:root { --color-background: ...; }`) by the storefront layout.

Storefront blocks need to consume these tokens. Two approaches were considered:
1. Inline `style={{ color: 'var(--color-text)' }}` on every element
2. Bridge the CSS custom properties into Tailwind's utility class system

## Decision

Extend `tailwind.config.ts` to map CSS custom properties to Tailwind color, spacing, border-radius, and font-family utilities using the `s-` prefix (e.g. `bg-s-background`, `text-s-muted`, `py-s-section`, `font-s-heading`).

Composite typographic properties (font-weight, letter-spacing, line-height as CSS vars) cannot be expressed as simple Tailwind utilities. These are bundled into `.sf-heading` and `.sf-body` component classes defined in `globals.css` under `@layer components`.

The `s-` prefix and `.sf-*` classes are explicitly scoped to the storefront renderer. The marketing site does not use them.

## Consequences

- Blocks can use `hover:`, responsive breakpoints, and `focus:` modifiers on token-driven styles — not possible with inline styles.
- No hardcoded colors, font sizes, or spacing values in block components.
- Adding a new token requires updating `lib/tokens.ts`, `tailwind.config.ts`, and `globals.css` in one coordinated change.
- Inline `style={{}}` is banned in block components. The one legitimate exception: `backgroundImage: url(${dynamicUrl})` in hero-editorial, which cannot be expressed as a Tailwind class.

## Alternatives considered

Inline styles were used in the initial implementation and rejected because: (1) pseudo-classes and media queries are impossible, (2) hardcoded values crept in, (3) it violates Engineering Standards §8 (no hardcoded colors/spacing in components).
