# Brand colors take over — design

**Date:** 2026-09-23
**Status:** Approved in conversation, awaiting spec review
**First client:** Cut-Pro Lawncare & Construction (`Direction-2026-09-23.md` → The immediate job, §1)

## Why

Hand-built clients arrive with a brand already painted on their truck, cards and
shirts. Cut-Pro is black, white and a bright grass green. Today a site's colors come
only from the mood's skin (`MAIN_STREET_SKINS`), plus an optional accent-only tint
(`accentOverride`). No mood reads as Cut-Pro, so the site would look like someone
else's business.

Alex's decision: **the client's colors take over the palette fully.** They do not tint
the mood. The mood still supplies fonts, type scale, layout, section variants, texture
and motion. Only color changes hands.

This settles the open question in `Editor-Design.md` (Door 2) about whether color
decouples from skins: **for a shop with a brand palette, it does.**

## Scope

**In:**
- A pure derivation that turns 2–3 brand colors into a complete, readable skin palette.
- A `brandPalette` field on the storefront envelope root. When it's present, the
  renderer uses the derived palette in place of the skin's.
- A safe fallback to the skin's palette when the stored value is malformed, with an
  error logged.
- A script, run by Claude, that sets a tenant's brand palette on the draft and
  published envelopes.

**Out, and why:**
- **Editor controls ("Use my own colors").** Hand-built clients never open the editor
  (Direction note: entry tier gets no editor). They get built when a tier with the
  editor needs them. Nothing in this design blocks that.
- **Onboarding changes.** Hand-built clients don't go through onboarding.
- **Retiring `accentOverride`.** It's a different feature: it tints a mood's accent,
  where this replaces the whole palette. Two test stores use it. It stays, and
  `brandPalette` wins when both are present.

## Input

```ts
interface BrandPalette {
  base: string;     // #RRGGBB — main surface (Cut-Pro: near-black)
  accent: string;   // #RRGGBB — buttons, links, eyebrows (Cut-Pro: grass green)
  second?: string;  // #RRGGBB — alternating band surface; derived if absent
}
```

Stored at `layout_tree.root.brandPalette` on the envelope, next to `lookKey` and
`accentOverride`. It lives on the envelope, not on `tenants`, so it versions with
draft and publish like every other look decision.

## Derivation — `deriveBrandPalette(input) → { palette: ColorPair, adjustments: Adjustment[] }`

All of the math is in OKLCH, a color model built around perceived lightness. The code
is a small in-house module (`lib/color/`) with no new dependency. WCAG contrast is
computed with the existing `contrastRatio` / `relativeLuminance`.

1. **Mode.** Dark if `relativeLuminance(base) < 0.18`, otherwise light.
2. **`bg`** = `base`, used exactly as given. The surface is the brand, so it never
   shifts.
3. **`fg`** = near-white or near-black (whichever side contrasts more with the surface),
   carrying a small share of the surface hue (chroma ≤ 0.008). Target **≥ 7:1**; if no
   tinted step reaches it, fall back to pure white/black. *(Plan-time correction: 7:1 is
   impossible on mid-tone surfaces — the best any color reaches on e.g. #777 is ~4.7:1.
   Pure white/black guarantees ≥ 4.58:1 on every surface, so the hard floor is 4.5:1 and
   7:1 is met wherever the surface allows. A fallback is recorded as an adjustment.)*
4. **`fgMuted`**: step `fg` toward `bg` in OKLCH lightness, and stop at the last step
   that is still **≥ 4.5:1** against `bg`.
5. **`rule`** = `fg` at 18% alpha, as `rgba()`. This matches how the skins already
   express rules.
6. **`contrast` surface (`second`).** If `second` is given, use it as-is. If not,
   derive it from `base`: lighten L by 0.08 in dark mode, darken by 0.06 in light mode,
   keeping hue and chroma. Either way it must differ visibly from `bg` (OKLCH ΔE ≥ 0.05).
   If it doesn't, push L further until it does and record an adjustment. Then compute
   `contrast.fg` and `contrast.fgMuted` against it using steps 3–4.
7. **`accent`** must reach **≥ 3:1** against both `bg` and `contrast.bg`. If it
   doesn't, adjust **only its OKLCH lightness**, keeping hue and chroma (chroma is
   clamped to gamut). Search both directions, take the smallest change that passes on
   both surfaces, and record an adjustment. If no lightness passes on both surfaces,
   satisfy `bg` alone and record a warning adjustment. `bg` carries most of the page.
8. **`onAccent`**: pure black or pure white, whichever contrasts more with `accent`.
   *(Plan-time correction: one of pure black/white always reaches ≥ 4.58:1 on any color,
   so no second accent shift is ever needed.)*

`Adjustment` is `{ role: 'accent' | 'second' | 'fg', from: string, to: string, reason: string }`.
It isn't shown to anyone yet because there's no editor. The script prints it, so Claude
can report in plain English what shifted.

The function is pure and total. Every valid input returns a palette that passes every
threshold above. Invalid hex is rejected by a `zod` schema before derivation runs.

## Render path

- `resolveEnvelope` / `renderStore` (`app/storefront/_components/StorefrontPage.tsx`)
  read `env.brandPalette` and parse it with the schema.
  - Valid → pass `brandPalette` down alongside `accentOverride`.
  - Present but invalid → `logger.error('storefront: invalid brandPalette', { tenantId })`
    and treat it as absent. The shopper sees the mood's colors, never a broken page.
- `main-street/builder.tsx`: where it currently does
  `applyAccentOverride(resolveTheme(...), accentOverride)`, it now first applies
  `applyBrandPalette(skin, brandPalette)`, which swaps `palette` for the derived one.
  The accent override is skipped when a brand palette is applied. This covers all four
  call sites (store, product, content page, shell).
- The derived colors come out through the existing `skinVarsCss` variables
  (`--ms-bg`, `--ms-accent`, `--ms-contrast-*`, …). No new CSS variables, no inline
  styles, no section changes.
- Mood behavior that keys off darkness has to follow the brand palette, not the mood
  default:
  - the logo/nav contrast already reads `skin.palette.bg`, so it follows automatically.
  - **The family wallpaper is switched off under a brand palette.** *(Plan-time finding:
    family wallpapers paint as `cover` — a colored image laid over the page at 15–30%
    — so on Cut-Pro's black it would wash the brand surface toward the mood's color.)*
    Grain stays. The URL-texture blend path keys its blend mode off the effective `bg`.

## Setting it — `scripts/set-brand-palette.ts`

`npx tsx --env-file=.env.local scripts/set-brand-palette.ts <subdomain> --base "#0B0B0B" --accent "#3DAE3F" [--second "#..."] [--dry] [--clear]`

The script:
- validates the input
- runs the same derivation, imported directly from `lib/color/brand-palette.ts` via `tsx`
- prints the derived palette and any adjustments
- writes `brandPalette` to the tenant's draft and published envelopes

It uses the service role and is Claude's tool, not a user surface.

## Testing

- **Derivation, property-based.** Run 5,000 seeded-random `{base, accent, second?}`
  combinations. Every output must meet every threshold: fg ≥ 4.5 (≥ 7 unless an fg adjustment was recorded), fgMuted ≥ 4.5,
  accent ≥ 3 on bg (and on contrast.bg unless a warning adjustment was recorded),
  onAccent ≥ 4.5, and a visible second surface.
- **Derivation, named cases.**
  - Cut-Pro black + green: no accent change expected.
  - Mid-gray base.
  - Pure white base with a pale yellow accent: must darken.
  - Navy base with navy accent: must shift.
  - Missing `second`.
  - Accent identical to `second`.
- **Schema.** Rejects 3-digit hex, missing `#`, names, and extra keys.
- **Render.** The builder with a `brandPalette` emits the derived `--ms-*` values. It
  ignores `accentOverride` when both are set. The texture blend follows the brand `bg`.
  An invalid stored palette falls back to the skin and logs.
- **Script.** Dry-run output snapshot.
- **Visual gate.** Alex sees Cut-Pro's render before anything is committed as done.

## Standards check

- No hardcoded English added to the renderer.
- No inline styles: colors flow through existing CSS variables.
- Strict TypeScript, types regenerated only if a migration changes columns. None is
  expected, because the envelope is JSON.
- Tests land with the code.
