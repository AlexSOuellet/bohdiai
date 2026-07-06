# Block Variants Roadmap

A running record of planned block variants — what to build next, what already exists, and why. Updated as new designs are identified.

---

## Hero blocks

### What exists today

| Block key | Format | Notes |
|---|---|---|
| `hero-cinematic` | Full-screen cinematic (image + overlay) | Gradient overlay tuned to preserve image |
| `hero-split-screen` | 50/50 split — text left, image right | Solid nav required (spans both panels) |
| `hero-split-gallery` | 50/50 split — text left, multi-image gallery right | Flex-col headline layout |
| `hero-editorial` | Big typography, editorial feel | Opened to all moods; needs more testing |

### Planned variants

**hero-bento** — A grid of 3–4 rounded cards arranged in a bento-box pattern (unequal sizes, grouped to fill the viewport). Each card shows a different product or maker moment. Best for niches with visual variety — candle collections, jewelry assortments, mixed-craft shops. Makers who want to lead with what they make rather than a single hero image.

**hero-super-type** — Full-width ultra-bold typography as the hero. Kicker line in Newsreader heavy italic, main line in Geist Black, image either masked behind the text or pushed below the fold. Strong for makers with brand personality — occult candles, bold ceramics, vintage resellers. Minimal, confident, typographic.

**hero-lava** — Organic contour layout: cells shaped by fluid, curving white space rather than rigid grid squares. Modern, indie, creative. More design-intensive than other variants but the most visually differentiated. Best for art-forward makers — textile artists, glassblowers, surface designers.

### Formats reviewed and ruled out for makers

The following hero formats were evaluated and ruled out because they assume a different product type (SaaS, AI tools, tech platforms):

- Isolated Component Layering (floating UI elements — SaaS only)
- AI Prompt Bar Hero (product demo in hero — AI tools only)
- 3D & Spatial Layouts (requires 3D renders — fintech/tech only)
- Interactive / Live Feature Preview (sandbox in hero — dev tools only)
- Search-First Hero (prominent search bar — marketplaces/directories only)

---

## About blocks

### What exists today

| Block key | Format | Notes |
|---|---|---|
| `about-maker` | Headline + prose + optional CTA | Text-forward, no image or personal element |

### Planned variants

**about-founders-note** — Personal photo of the maker alongside a short direct quote and a stylized signature. The most on-brand about format for BohdiAI's positioning — the maker is the brand, and this makes that literal. Face, words, signature.

**about-manifest** — Bold typographic mission statement, high contrast, no photos. For makers with a strong point of view: occult candle brands, feminist jewelry, political printmakers, any indie maker who wants to lead with philosophy over biography.

**about-video-card** — Clean minimal layout dominated by a video thumbnail with a play button. Links to the maker's YouTube channel or a workshop video. Not generated at onboarding (most makers won't have video yet), but available in the dashboard once they do.

### Formats reviewed and ruled out for makers

- Metric-First Layout (SaaS authority-signaling — no maker equivalent at kitchen-table scale)
- Interactive Timeline (requires rich brand history most new makers don't have)
- Bento Box Team Grid (for multi-person companies)
- Before & After Split (startup-pitch framing, not artisan-authentic)

---

## Products blocks

### What exists today

| Block key | Format | Notes |
|---|---|---|
| `products-grid` | Standard equal-card grid | Clean, versatile |
| `products-bloom-grid` | Grid with price badge overlay | Price readable on all moods (opaque black pill) |
| `products-editorial-grid` | Editorial-styled grid | Larger cards, more whitespace |
| `products-split-carousel` | Split layout — text panel + scrollable carousel | Alex's favorite; price badge on opaque black pill |

### Planned variants

**products-bento-grid** — Asymmetrical varying-sized product cards. One hero product card occupies double or triple the space, flanked by smaller supporting cards. Best for makers who have a signature item and a supporting line — a candle shop with their best-seller front and center. Mirrors the hero-bento aesthetic for visual consistency across the page.

**products-in-the-wild** — Products shown exclusively in lifestyle/staged photography with no white-background card frames. A "Shop This" or "Add to Cart" button overlays directly on the image. Candles on a cozy shelf, jewelry on a marble tray, ceramics on a kitchen counter. Shows the product living in the world rather than floating on a card.

### Formats reviewed and ruled out or deferred

- Cinematic Video Grid (requires product videos most makers won't have at launch — Phase 2)
- Mobile Thumb Zone (sticky add-to-cart interaction pattern — applies to all blocks, not a distinct variant)
- AI Sandbox / Semantic Preview (custom AI generation in the product display — Phase 2+)
- Long Page + Sticky TOC (this is a **listing detail page** pattern, not a products section — bank for listing detail page work)

---

## Testimonials blocks

### What exists today

| Block key | Format | Notes |
|---|---|---|
| `testimonials-grid` | Three quotes in a grid | AI generates placeholder quotes at onboarding; maker replaces with real reviews |

### Planned variants

**testimonials-featured** — A single large, prominent testimonial front and center with optional customer photo or product photo alongside. Better for a maker who has one strong quote they want to lead with rather than three smaller ones.

**testimonials-carousel** — A scrollable horizontal row of review cards. Designed for makers who have accumulated 5–10 real reviews and want to surface them all. Matches the carousel pattern from products-split-carousel.

### Formats reviewed and ruled out or deferred

The following formats from a 2025 design trend survey were evaluated and do not fit artisan maker storefronts at Phase 1 launch — most assume either enterprise-scale social proof or existing customer video content that makers won't have on day one:

- Social Wall / Wall of Love (requires existing social media reviews — strong Phase 2 feature once makers have real customers)
- TikTok/Reels Video Slider (requires customer-generated unboxing videos — Phase 2)
- Before & After Narrative Split (B2B/weight-loss-ad format, doesn't map to buying a candle or piece of jewelry)
- Bento Box Metric + Quote (requires ROI-style numbers — enterprise B2B)
- Logo Track + Contextual Popup (famous client logos — enterprise agency)
- Star-Rating Distribution Hero (meaningful only at Amazon-scale review volume)

### Note on placeholder content

`testimonials-grid` ships with AI-generated placeholder quotes at onboarding. The principle: generate the most visually complete, best-looking version possible so the wow moment lands at build time — then walk the maker through personalizing it afterward. Many makers already have real reviews from Etsy, Instagram, or word-of-mouth. "Add your real reviews" belongs in the post-onboarding dashboard as a guided step, not in onboarding itself. Keep onboarding fast; save the personalization walkthrough for after the store is live and they've seen what it can look like.

---

## Other section blocks

*(Add as variants are identified)*
