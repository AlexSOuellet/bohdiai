# Skill: Block Variant Builder — Godly-Level Artisan Storefronts

## The goal

BohdiAI generates storefronts for artisan makers — bakers, candle makers, herbalists, jewelers, woodworkers, vintage sellers. The generated sites currently look like basic templates. The goal of this skill is to build block variants that produce sites that look like they were designed by a world-class studio. The bar is godly.website. Wix and Shopify templates are not acceptable comparisons.

You have creative freedom on layout, motion, typography scale, atmosphere, and composition. The constraints are technical (listed below), not creative.

---

## What "godly level" means for artisan storefronts

- Typography that is a design statement, not just set text. Oversized headlines. Mixed weights. Tight leading. Letters that feel chosen, not defaulted.
- Motion that makes the page feel alive. Scroll-triggered reveals. Entrance animations on load. Hover states with physical weight.
- Layouts that break the centered-column grid. Images that bleed to edges. Text that overlaps imagery. Sections that have visual tension.
- Atmosphere. Grain overlays. Gradient depth. Sections that feel like they have a surface, not a flat fill.
- Photography used dramatically. Full bleed. Edge to edge. Not thumbnailed in a card.
- Every mood feels like a completely different brand identity — not the same layout in different colors.

---

## The seven moods

Each storefront is generated for one of these moods. Block variants should declare which moods they suit. The AI picks the right variant at generation time.

- **Dark and Stormy** — dramatic, deep darks, rich contrast, edge. Occult candles, dark art, gothic jewelry, leather.
- **Rustic** — natural materials, honest craft, earthy. Woodworkers, soap makers, farm stands, herbalists.
- **Warm and Cozy** — hygge, soft warmth, layered comfort. Candle makers, textile artists, bakers.
- **Summer Afternoon** — bright, airy, fresh, seasonal. Pressed flowers, citrus candles, beachy accessories.
- **Wild Meadow** — lush botanical, foraged, alive. Always a LIGHT background. Botanical skincare, dried flowers, herbal goods.
- **Bright Bazaar** — bold, joyful, maximalist. Colorful ceramics, pattern textiles, folk art.
- **Sunday Morning** — calm, minimal, considered. Lots of white space. Minimal jewelry, modern ceramics, architectural prints.

---

## Design token system — the technical constraint

Every storefront gets CSS custom properties injected by the layout. You must use these — never hardcode colors, fonts, or spacing values.

**Tailwind utility classes that map to tokens:**

| Class | Token |
|---|---|
| `bg-s-background` | page background |
| `bg-s-surface` | card / panel background |
| `text-s-text` | primary text |
| `text-s-muted` | secondary / muted text |
| `bg-s-primary` / `text-s-primary` | brand primary color |
| `bg-s-accent` / `text-s-accent` | accent color |
| `border-s-border` | border color |
| `font-s-heading` | heading font family |
| `font-s-body` | body font family |
| `py-s-section` | section vertical padding |
| `gap-s-card-gap` | card gap |
| `rounded-s-card` | card border radius |

**Composite CSS classes (already defined in globals.css):**

| Class | What it does |
|---|---|
| `sf-heading` | heading font + weight + letter-spacing + line-height + color |
| `sf-body` | body font + line-height |
| `sf-text-hero` | fluid type scale for hero headlines |
| `sf-text-heading` | fluid type scale for section headings |
| `sf-text-body` | body text size |
| `sf-card` | surface bg + border-radius + border |
| `sf-divide-b` | bottom divider using border token |

The only permitted `style={{}}` prop is for dynamic image URLs: `style={{ backgroundImage: \`url(${url})\` }}`.

---

## Block file structure

Every block lives at `blocks/{block-key}/`:

```
blocks/hero-cinematic/
  meta.ts      ← BlockMeta definition
  index.tsx    ← React component (exports default + re-exports meta)
```

**`meta.ts` must conform to this interface:**

```ts
import type { BlockMeta } from '@/lib/blocks';

const meta: BlockMeta = {
  key: 'hero-cinematic',
  label: 'Cinematic Hero',
  sectionType: 'hero', // 'hero' | 'about' | 'products' | 'collections' | 'cta' | 'testimonials' | 'events' | 'custom'
  description: '...', // What the AI reads to decide whether to pick this block
  moodFit: ['dark-and-stormy', 'rustic'],
  tenantTypeFit: ['seller', 'doer'],
  tier: 'free',
  status: 'active',
  slots: [],
  contentSchema: [
    { key: 'headline', type: 'text', label: 'Main Headline', required: true, aiGenerated: true, maxLength: 80 },
  ],
};
export default meta;
```

**`index.tsx` must:**
- Be a server component (no `'use client'`) unless browser APIs are required
- Export `{ meta }` and a default function component
- Use typed content interface — not `Record<string, unknown>` directly
- Never use `any`, `@ts-ignore`, or `@ts-expect-error`
- Use optional chaining for array access: `items[0]?.name ?? ''`

---

## After creating blocks — two required steps

**Step 1:** Register in `lib/block-registry.tsx`:
```tsx
import HeroCinematic from '@/blocks/hero-cinematic';
// add to BLOCK_REGISTRY:
'hero-cinematic': asBlock(HeroCinematic),
```

**Step 2:** Run `npm run build:manifests` to regenerate `lib/blocks-manifest.generated.ts`.

---

## Blocks that fetch data

Blocks that need product listings (any `sectionType: 'products'`) are server components that fetch their own data. Pattern from the existing `products-grid` block:

```ts
import { supabaseAdmin } from '@/lib/supabase';
// component receives tenantId: string as a prop
const { data: listings } = await supabaseAdmin()
  .from('listings')
  .select('id, slug, name, short_description, base_price_cents, metadata')
  .eq('tenant_id', tenantId)
  .eq('status', 'active')
  .is('deleted_at', null)
  .order('published_at', { ascending: false })
  .limit(6);
```

Image URL lives at `listing.metadata?.image_url`. Use `next/image` with `fill` and `sizes`. Price formatting: `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)`.

---

## Motion

Use Framer Motion. Install it if not present: `npm install framer-motion`.

Blocks that benefit from motion should have a client-side wrapper component for scroll-triggered reveals. The block itself stays a server component — the motion wrapper is a small `'use client'` component that the block imports and wraps its sections with.

Motion should feel physical and intentional, not decorative. Scroll reveals, entrance animations on load, hover states with transform and shadow. Reduced motion must be respected: check `useReducedMotion()` from Framer Motion and skip animations when true.

---

## Atmosphere

Add a global grain texture overlay. This is a CSS pseudo-element on the storefront layout wrapper — a subtle noise texture at low opacity that makes flat color fields feel tactile and expensive. Implement it in `app/globals.css` or as a dedicated CSS class applied in `app/storefront/layout.tsx`.

Gradient depth: sections should not be flat fills. Use subtle radial or linear gradients built from the token colors where it adds depth without fighting the brand colors.

---

## Navbar

Create `components/storefront/NavStorefront.tsx`. This is a layout component, not a block — it renders in `app/storefront/layout.tsx` above the page blocks.

Build at least two distinct navbar layouts. Wire them both and pick one for now — the second becomes available when dashboard customization ships.

Fetch the shop name in the layout:
```ts
const { data: tenant } = await db.from('tenants').select('shop_name').eq('id', tenantId).single();
```

Render `<NavStorefront shopName={tenant?.shop_name ?? ''} />` above `{children}`. Add `pt-16` (or however tall the nav is) to the children wrapper to offset the fixed nav.

---

## What to deliver

Design and build as many block variants as you believe are needed to make generated storefronts look genuinely impressive across all seven moods. At minimum:

- 3 hero variants (must be visually distinct — not the same layout in different colors)
- 2 product display variants
- 2 navbar variants (build both, wire one)
- Global grain/atmosphere treatment
- Scroll-reveal motion wrapper used by at least the hero and product blocks

Every variant must have a `description` in its meta that clearly tells the AI when to choose it over the alternatives. The AI is the creative director at generation time — give it enough signal to make the right call.

The existing blocks (`hero-editorial`, `about-maker`, `cta-banner`, `testimonials-grid`, `collections-row`, `events-list`, `custom-content`) are flat and boring. Improve them too if you have time, or at minimum make sure new pages built entirely with new variants look cohesive.

---

## Files to touch

- `blocks/*/meta.ts` and `blocks/*/index.tsx` — one directory per new block
- `components/storefront/NavStorefront.tsx` — new navbar component
- `lib/block-registry.tsx` — register every new block
- `app/storefront/layout.tsx` — add navbar render + tenant shop_name fetch
- `app/globals.css` — grain texture, any new sf-* classes needed
- `lib/blocks-manifest.generated.ts` — regenerate via `npm run build:manifests`

Do not touch the marketing site, onboarding flow, or any files outside the storefront rendering path.
